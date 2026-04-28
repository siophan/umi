# 竞猜参与对接真实支付 — 设计文档

> 用 admin 已配的 `payment_settings`（微信 H5、支付宝 WAP），把 `/guess/[id]` 的"参与竞猜"从 stub 切到真实支付。

## 背景与目标

当前 `participateInGuess` 立即向 `guess_bet` 写入 `BET_PENDING` 一行，没扣钱、没接任何支付通道。本期把它改成真实支付链路：

1. 用户在弹层选支付渠道，后端先开预下单，前端跳网关页
2. 用户付完跳回详情页，前端轮询 → 后端 query API 兜底（解决 dev 环境无公网回调的痛点）
3. 同时实现回调端点（生产环境主信道）+ 验签 + 幂等
4. 复用 admin `payment_settings` 表的解密配置（`loadWechatPaySettings` / `loadAlipaySettings`），不引入第二份配置源

不在本期范围：
- 商城支付（CLAUDE.md #15，留作下次）
- 弃赛退款 API 调用（schema 留位，pay_status=50 等后续接退款 API）
- WeChat native 扫码、JSAPI、小程序支付
- admin 后台 guess 订单流水增加 channel 显示

## 关键决策

| 决策点 | 选择 | 理由 |
|---|---|---|
| 支付场景 | 仅手机 H5（微信 h5 + 支付宝 wap） | 详情页是手机优先；admin 已配的就是这两个场景 |
| 资金主体 | 不走 `order` 表，在 `guess_bet` 加支付字段 | 改动局部，不污染商城 order 模型 |
| 唯一索引 | DROP `(user_id, guess_id)` unique，代码判重 | 用户切选项不会撞 unique；判重逻辑在应用层更灵活 |
| SDK | `wechatpay-node-v3` + `alipay-sdk` | 官方 SDK，跟 admin 配置字段（mchid/cert_serial_no/三本证书等）严格对得上 |
| 状态确认 | 回调 + 主动查询双保险 | 回调是生产主信道；主动查询让 dev 没公网域名也能跑通 |
| 前端流程 | 弹层选渠道 → 跳网关 → 回跳轮询 | 跟主流电商一致；不在弹层嵌 iframe（Alipay/WeChat 限制） |

## 架构

```
[详情页弹层]                                       [Wechat/Alipay 网关]
  选项+渠道                                              ▲
   "立即支付"                                            │ HTTPS
       │                                                │
       ▼                                                │
   POST /guesses/:id/participate                        │
       │  guess-pay.ts: createGuessBetPayment           │
       │   1. 判重 (paid bet 存在?)                      │
       │   2. INSERT guess_bet (waiting)                 │
       │   3. payment-service.createPayOrder ────────►─┘
       │   4. 返回 payUrl
       ▼
   window.location.href = payUrl  ──────► 用户付款 ──────┐
                                                         │
   同步 redirect_url / return_url                         │
   ◄──────────────────────────────  /guess/[id]?betId=X  │
                                                         │
   异步 notify_url ◄────────────────────────────────────┘
       │  POST /pay/notify/{wechat|alipay}
       │  payment-service.verifyXxxNotify (验签)
       │  guess-pay.ts: markBetPaid (FOR UPDATE 幂等)
       ▼
   guess_bet: status=PENDING, pay_status=PAID, paid_at

[详情页 useEffect 检测 ?betId]
   显示 "支付确认中" overlay
   轮询 GET /guesses/bets/:betId/pay-status (2s × 30 次)
       后端: 已 paid 直接返回; 仍 waiting → query 网关 API 兜底
   命中 paid: 关 overlay + setUserBet + 清 query param
   超时:    "支付确认中, 请稍后查看"
```

## 数据模型

### `guess_bet` 表新增字段（已执行）

文件：`packages/db/sql/guess_bet_payment.sql`

| 字段 | 类型 | 说明 |
|---|---|---|
| `pay_status` | tinyint unsigned NOT NULL DEFAULT 10 | 10=waiting, 20=paid, 30=failed, 40=closed, 50=refunded |
| `pay_channel` | tinyint unsigned NULL | 10=wechat, 20=alipay |
| `pay_no` | varchar(64) NULL | 我方 out_trade_no |
| `pay_trade_no` | varchar(64) NULL | 第三方 transaction_id / trade_no |
| `paid_at` | datetime(3) NULL | 支付完成时间 |
| `pay_expires_at` | datetime(3) NULL | 支付链接过期时间 |

索引调整：
- DROP `guess_bet_user_id_guess_id_key`
- ADD `uk_pay_no(pay_no)`
- ADD `idx_user_guess_paystatus(user_id, guess_id, pay_status)`

### `guess_bet.status` 应用层值（无 DDL 改动）

| 值 | 名称 | 说明 |
|---|---|---|
| 5 | `BET_WAITING_PAY` | 新增：bet 已建，等待支付完成 |
| 10 | `BET_PENDING` | 已支付，等待开奖 |
| 30 | `BET_WON` | 中奖（结算流程切入） |
| 40 | `BET_LOST` | 未中（结算流程切入） |
| 90 | `BET_CANCELED` | 用户取消或弃赛 |

### `pay_no` 生成规则

`GB{yyyyMMddHHmmss}{6位随机}{betId 后 6 位}`，例：`GB202604280931235X9F2A123456`。`uk_pay_no` 索引保唯一。

## 状态机

```
                 [user 选 option + 渠道]
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────┐
  │  status=5 (WAITING_PAY)  pay_status=10 (waiting)          │
  │  pay_no 生成, payUrl 返回前端                              │
  └──────────────────────────────────────────────────────────┘
           │                  │                    │
   ┌───────┘          ┌───────┴────────┐    ┌──────┴───────┐
   │ wechat/alipay    │ 用户主动取消    │    │ 5 分钟超时   │
   │ 通知/查询命中    │ /bets/:id/cancel │    │ 惰性触发     │
   ▼                  ▼                ▼    ▼              │
 status=10 (PENDING)  status=90        pay_status=40        │
 pay_status=20 (paid)  pay_status=40   (closed)             │
 paid_at = now         (closed)                              │
                                                              │
  status=10 (PENDING) 进入待开奖, 由结算流程切到 30/40/90      │
```

判重规则（`participateInGuess` 头一步）：

```sql
SELECT 1 FROM guess_bet
WHERE user_id = ? AND guess_id = ? AND pay_status = 20
LIMIT 1
```

命中 → `409 GUESS_ALREADY_PARTICIPATED`。waiting 不算"已参与"，用户可反复试支付/换选项。

## 接口契约

### 1. `POST /api/guesses/:id/participate` （改）

请求体：`{ choiceIdx, quantity, payChannel }`，`payChannel` ∈ `'wechat' | 'alipay'`。

成功 200：`{ betId, payNo, payChannel, payUrl, expiresAt }`。

错误：
- `409 GUESS_ALREADY_PARTICIPATED`
- `400 GUESS_CHOICE_INVALID` / `GUESS_NOT_ACTIVE` / `GUESS_ENDED`
- `400 PAY_CHANNEL_INVALID`
- `503 PAY_WECHAT_NOT_CONFIGURED` / `PAY_ALIPAY_NOT_CONFIGURED`
- `503 PAY_GATEWAY_UNAVAILABLE`

### 2. `GET /api/guesses/bets/:betId/pay-status` （新）

鉴权：bet.user_id 必须等于 currentUserId。

后端逻辑：
1. 查 bet，校验归属
2. pay_status ≠ waiting → 直接返回当前状态
3. waiting 且 expires_at 已过 → mark closed → 返回 closed
4. waiting → 调对应渠道 queryOrder API：
   - SUCCESS → 走 markBetPaid（事务幂等）
   - NOTPAY / WAIT_BUYER_PAY → 返回 waiting
   - CLOSED → mark closed
   - PAYERROR / 其他 → mark failed

返回：`{ betId, payStatus: 'waiting' | 'paid' | 'failed' | 'closed', paidAt }`。

### 3. `POST /api/guesses/bets/:betId/cancel` （新）

用户主动放弃。校验归属 + pay_status=waiting，否则 `409 BET_NOT_CANCELLABLE`。调 closeOrder（best-effort），UPDATE 到 status=90, pay_status=40。

### 4. `POST /api/pay/notify/wechat` （新）

WeChat v3 异步回调。无业务鉴权，靠 `wechatpay-node-v3` 的签名验证 + AES-256-GCM 解密。验签通过 → 取 out_trade_no（=pay_no）→ markBetPaid。返回 `{code:"SUCCESS"}` 200，否则 401（wechat 会重试 5 次）。

### 5. `POST /api/pay/notify/alipay` （新）

支付宝异步回调。验签靠 `alipay-sdk` 的 `verifySignature`，去掉 sign / sign_type 后做。trade_status === TRADE_SUCCESS 才算 paid。成功返回明文 `success` 200，失败返回 `failure` 200（让支付宝停止重试）。

## `markBetPaid` 内部事务（核心幂等点）

伪流程：

1. `SELECT * FROM guess_bet WHERE pay_no = ? FOR UPDATE`
2. 已 paid → 直接 return（幂等：回调重发 / query 同时进入都安全）
3. ≠ waiting（异常状态如 closed/failed）→ 跳过，记 warn log
4. 检查"该 user/guess 是否已有其他 paid bet"：有 → 当前这笔 mark `pay_status=refunded`，写 TODO log，本期不调退款 API（schema 已留位）
5. UPDATE bet：status=10 (PENDING), pay_status=20 (paid), pay_trade_no, paid_at
6. COMMIT

## 后端模块结构

### 新增 `apps/api/src/modules/payment/`

- `payment-shared.ts` — 类型 / 常量 / `PayChannelKey`、`CreatePayOrderInput`、`QueryPayOrderResult`
- `payment-wechat.ts` — `wechatpay-node-v3` 包装：`createWechatH5Order` / `queryWechatOrder` / `closeWechatOrder` / `verifyWechatNotify`
- `payment-alipay.ts` — `alipay-sdk` 包装：`createAlipayWapOrder` / `queryAlipayOrder` / `closeAlipayOrder` / `verifyAlipayNotify`
- `payment-service.ts` — 渠道分派（`createPayOrder` / `queryPayOrder` / `closePayOrder` 按 `'wechat' | 'alipay'` 分发）
- `router.ts` — 注册 `/api/pay/notify/wechat` + `/api/pay/notify/alipay`

### 改动 `apps/api/src/modules/guess/`

- 新文件 `guess-pay.ts`：`createGuessBetPayment` / `queryGuessBetPayStatus` / `cancelGuessBet` / `markBetPaid`
- `router.ts`：新增 GET `/bets/:betId/pay-status`、POST `/bets/:betId/cancel`，participate 内部切换到新实现
- `guess-shared.ts`：`getGuessVoteRows` 加 `pay_status=20` 过滤
- `guess-read.ts`：`totalOrders` 查询、`getGuessDetail` 中的 userBet 查询都加 `pay_status=20` 过滤

### `loadWechatPaySettings` / `loadAlipaySettings` 行为

- 每次发起支付都现拉（不强缓存），admin 改完即生效
- 配置缺失 / KEK 缺失 → 返回 null，调用方抛 503

## 前端

### 弹层 `guess-detail-overlays.tsx`

加一段"支付方式"：单选微信 / 支付宝；按钮文案 `立即竞猜` → `立即支付 ¥{amount}`。新增 props：`payChannel` / `onPayChannelChange`。

### 详情页 `page.tsx` 主流程

`handleConfirmParticipate`：调 participate 拿 `payUrl` → 关弹层 → `window.location.href = payUrl`；遇 `409 GUESS_ALREADY_PARTICIPATED` → toast + 刷新 detail 拉 userBet。

回跳后：`useEffect` 检测 `?betId=`，显示 "支付确认中" overlay，每 2s 轮询 `fetchBetPayStatus`，最多 30 次（60 秒）。
- paid → 关 overlay + toast "参与成功" + 清 query + refresh detail
- failed / closed → 关 overlay + 错误提示 + 清 query
- 30 次还 waiting → "支付确认中，请稍后查看订单"

样式：复用现有 sheet system（430px 宽度居中、白底圆角、深色 mask）。

### 客户端 API `apps/web/src/lib/api/guesses.ts`

新增 / 改写：
- `participateInGuess(guessId, payload)` 返回 `{ betId, payNo, payChannel, payUrl, expiresAt }`
- `fetchBetPayStatus(betId)` 返回 `{ betId, payStatus, paidAt }`
- `cancelBetPayment(betId)`

### shared 类型 `packages/shared/src/api-user-commerce.ts`

`ParticipateGuessPayload` 加 `payChannel: 'wechat' | 'alipay'`；`ParticipateGuessResult` 改为支付凭据形态。新增 `GuessBetPayStatus` 联合类型 + `FetchBetPayStatusResult`。

## 边界与失败模式

| 场景 | 处理 |
|---|---|
| 用户没点支付直接关弹层 | 无副作用 |
| 用户跳网关后关浏览器 | bet 留 waiting，5 分钟惰性过期；vote/totalOrders/userBet 按 pay_status=20 过滤所以不影响展示 |
| 用户犹豫切选项，多笔都付完 | `markBetPaid` FOR UPDATE 检查"已存在 paid bet"，第二笔标 refunded + log（本期不调退款 API） |
| 回调重发（同一笔重复回调） | `markBetPaid` 已 paid 即 return，幂等；返回 200 让网关停止重试 |
| 验签失败 | wechat 401 让其重试；alipay 200 `failure` 让其停止 |
| payment_settings 缺失 | 抛 503，前端 toast |
| admin 改 settings 期间已发的链接 | 不主动失效；下次回调用最新配置验签，可能验签失败但概率极低（admin 不会高频改 mchid） |
| 价格变更期间用户在弹层 | 后端按下单时 `product.guess_price` 计算 amount；弹层若与最终金额不一致由前端按返回 amount 提示一次（本期不实现，价格改动不频繁） |

## 实施顺序

按依赖推进，每段独立可测：

1. `pnpm add wechatpay-node-v3 alipay-sdk` 到 apps/api；建 `payment/` 五个文件（shared / wechat / alipay / service / router，空壳 + 类型 + 渠道分派）
2. payment-wechat / payment-alipay 实现：createXxxOrder / queryXxxOrder / closeXxxOrder / verifyXxxNotify
3. 回调路由：POST `/api/pay/notify/wechat` + `/api/pay/notify/alipay`，wechat 路径需 rawBody middleware
4. shared 类型：扩展 `ParticipateGuessPayload` / `ParticipateGuessResult`、新增 `FetchBetPayStatusResult`
5. `guess-pay.ts`：createGuessBetPayment / queryGuessBetPayStatus / cancelGuessBet / markBetPaid（核心幂等事务）
6. guess router 改：participate 切到新实现；新增 GET pay-status / POST cancel
7. guess-shared / guess-read：vote / totalOrders / userBet 都加 `pay_status=20` 过滤
8. 前端 client api：lib/api/guesses.ts 加 fetchBetPayStatus / cancelBetPayment，改 participateInGuess 返回类型
9. bet 弹层：渠道选择 radio + 按钮文案
10. 详情页：handleConfirmParticipate 改成 `window.location = payUrl`；`?betId=` 回跳轮询逻辑；confirming overlay
11. e2e：dev 环境 sandbox 验证全链路

## 已知后续工作

- 弃赛退款：本期 schema 留 pay_status=50 + pay_trade_no，后续接 wechat / alipay refund API
- 商城支付（CLAUDE.md #15）：下次复用 payment 模块
- payment_settings 修改后已发链接的失效处理（低优先级）
- admin 后台 guess 订单流水按 channel 分类显示（低优先级）
