# 商城下单对接真实支付 — 设计文档

> 复用竞猜支付那套基础设施（`apps/api/src/modules/payment/`），把 `/payment` 页的"立即支付"从直接写 `ORDER_PAID` 切到真实支付链路。

## 背景与目标

老的 `createOrder` 一次性事务里：写订单（status=`ORDER_PAID`）+ 扣库存 + 核销券 + 删购物车 + 建履约单。前端键入 6 位假支付密码就当付完了。这次切到真实支付：

1. 用户在支付页选 wechat/alipay → 后端创建 PENDING 订单 + 调网关，返回 payUrl
2. 前端 `window.location.href = payUrl` 跳走，用户付完回到 `/payment/return?orderId=...`
3. 回跳页轮询 `/api/orders/:id/pay-status`；后端 query 网关兜底（dev 环境无公网仍可跑通）
4. 网关回调 → `markOrderPaid`：转 PAID + 建履约单 + 核销券 + 删购物车 + 状态日志，幂等

不在本期范围：
- **支付超时库存归还**（P1）：本期只做立即扣库存做"占用"，没有定时 job 回收 `pay_status=closed` 订单的库存。短期手 SQL 修；长期补 scheduler。
- **退款 API**：`pay_status=50 (refunded)` 字段已留位，但还没接 refund API。

## 关键决策

| 决策点 | 选择 | 理由 |
|---|---|---|
| 资金主体 | 沿用 `order` 表，加 6 个支付字段 | 跟竞猜的 `guess_bet` 字段对齐，notify 路由按 pay_no 前缀派发 |
| 库存占用时机 | `createPendingOrder` 立即扣 | 防止同时段超卖；代价是未付订单需要后续清理 job 回滚 |
| 券核销 / 购物车清空 | 延后到 `markOrderPaid` | 未付订单不应该消耗券和清购物车，否则用户体验差 |
| 履约单创建 | 延后到 `markOrderPaid` | PENDING 订单还不应该进入履约队列 |
| pay_no 前缀 | `OR` 商城 / `GB` 竞猜 | 同一 `payment/router.ts` 回调入口，按前缀派发 |
| 前端流程 | 支付页提交 → 跳网关 → 回跳页轮询 | 跟竞猜那套回跳页同型，可后续合并 |

## 架构

```
[支付页]                                          [Wechat/Alipay 网关]
  选地址/券/渠道                                       ▲
   "立即支付"                                          │ HTTPS
       │                                              │
       ▼                                              │
   POST /api/orders                                   │
       │  order-write.createPendingOrder              │
       │   - 校验地址/券/库存                         │
       │   - INSERT order(PENDING) + order_item       │
       │   - UPDATE product.stock -= qty              │
       │  order-pay.createOrderPayment(channel)       │
       │   - generatePayNo('OR') + UPDATE order       │
       │   - createPayOrder(channel) → payUrl ────────┘
       │
       ▼
   { orderId, orderSn, payNo, payChannel, payUrl, expiresAt }
       │
       ▼
   window.location.href = payUrl
       │
       ▼ (用户付款)
       │
       ▼ (返回到 returnUrl)
   /payment/return?orderId=...
       │
       │  setInterval(2000ms) × 60 次
       ▼
   GET /api/orders/:id/pay-status
       │  order-pay.queryOrderPayStatus
       │   - pay_status != waiting → 直接返回 mapped 状态
       │   - 过期 → mark closed + ORDER_CLOSED
       │   - 主动查 queryPayOrder(channel, payNo)
       │       - paid → markOrderPaid 全套
       │       - closed/failed → 更新状态
       ▼
   { orderId, payStatus, paidAt }

[微信/支付宝 异步回调]                            [payment/router.ts]
   POST /api/pay/notify/wechat → verifyWechatNotify ──┐
   POST /api/pay/notify/alipay → verifyAlipayNotify ──┤
                                                       ▼
                                  dispatchPaid(payNo, tradeNo, paidAt)
                                       │
                                       ├ payNo.startsWith('OR') → markOrderPaid
                                       └ payNo.startsWith('GB') → markBetPaid
```

## 数据模型

### `order` 表新增字段（已执行 2026-04-29）

```sql
ALTER TABLE `order`
  ADD COLUMN `pay_status`     TINYINT UNSIGNED NOT NULL DEFAULT 10  AFTER `status`,
  ADD COLUMN `pay_channel`    TINYINT UNSIGNED NULL                 AFTER `pay_status`,
  ADD COLUMN `pay_no`         VARCHAR(64) NULL                      AFTER `pay_channel`,
  ADD COLUMN `pay_trade_no`   VARCHAR(64) NULL                      AFTER `pay_no`,
  ADD COLUMN `paid_at`        DATETIME(3) NULL                      AFTER `pay_trade_no`,
  ADD COLUMN `pay_expires_at` DATETIME(3) NULL                      AFTER `paid_at`;

ALTER TABLE `order` ADD UNIQUE KEY `uk_order_pay_no` (`pay_no`);

UPDATE `order` SET `pay_status` = 20 WHERE `status` = 20 AND `pay_status` = 10;
```

### 状态码（应用层）

```
order.status:        10=PENDING, 20=PAID, 30=FULFILLED, 40=CLOSED, 90=REFUNDED
order.pay_status:    10=waiting, 20=paid, 30=failed, 40=closed, 50=refunded
order.pay_channel:   10=wechat, 20=alipay
```

### `pay_no` 生成规则

`{prefix}{yyyyMMddHHmmss}{6 random}{orderId last 6}`，prefix 为 `OR`（商城）或 `GB`（竞猜）。`payment-shared.ts:generatePayNo`。

## 状态机

```
PENDING + waiting   ───createOrderPayment───►   PENDING + waiting (新 pay_no)
       │
       │ 网关回调 / 主动查询命中 paid
       ▼
       markOrderPaid (事务)
       │
       ▼
PAID + paid + 建履约单 + 核销券 + 删购物车 + 状态日志

PENDING + waiting
       │ 过期 (queryOrderPayStatus 内自动判定)
       ▼
CLOSED + closed
```

## 接口契约

### 1. `POST /api/orders` （改）

入参：`CreateOrderPayload`
```ts
{
  source: 'product' | 'cart',
  addressId: EntityId,
  couponId?: EntityId | null,
  payChannel: 'wechat' | 'alipay',  // 改成必填
  note?: string | null,
  productId?: ProductId,
  quantity?: number,
  cartItemIds?: EntityId[],
}
```

返回：`CreateOrderResult`
```ts
{
  orderId: EntityId,
  orderSn: string,
  payNo: string,
  payChannel: 'wechat' | 'alipay',
  payUrl: string,
  expiresAt: string,
}
```

### 2. `GET /api/orders/:id/pay-status` （新）

返回：`FetchOrderPayStatusResult`
```ts
{
  orderId: EntityId,
  payStatus: 'waiting' | 'paid' | 'failed' | 'closed',
  paidAt: string | null,
}
```

### 3. `POST /api/pay/notify/wechat` / `POST /api/pay/notify/alipay` （改）

之前只调 `markBetPaid`，改成 `dispatchPaid` 按 `pay_no` 前缀派发。

## `markOrderPaid` 内部事务（核心幂等点）

1. `SELECT FOR UPDATE` 锁 order
2. `pay_status === paid` → 直接 return（回调重发安全）
3. `pay_status !== waiting` → warn + skip
4. `status !== ORDER_PENDING` → warn + skip
5. UPDATE order 转 PAID + pay_trade_no + paid_at
6. INSERT order_status_log
7. UPDATE coupon → USED（如有）
8. INSERT fulfillment_order（取首个 order_item 的 shop_id + 用户地址）
9. DELETE cart_item（按 product_id + user_id 匹配）
10. commit

## 后端模块结构

### 改动 `apps/api/src/modules/order/`
- `order-write.ts createOrder` 拆成 `createPendingOrder`：只写 PENDING + 扣库存
- 新增 `order-pay.ts`：`createOrderPayment` / `markOrderPaid` / `queryOrderPayStatus`
- `router.ts`：`POST /api/orders` 改为创建 PENDING + 立刻调网关；新增 `GET /api/orders/:id/pay-status`

### 改动 `apps/api/src/modules/payment/`
- `payment-shared.ts:generatePayNo` 加 prefix 参数（`PAY_NO_PREFIX_BET` / `PAY_NO_PREFIX_ORDER`）
- `router.ts`：notify 派发函数 `dispatchPaid`，按前缀路由

### 改动 `apps/api/src/modules/admin/order-actions.ts`
- `operator_role` 串字符串 'admin' 改成 `OPERATOR_ROLE_ADMIN` 常量（schema 是 tinyint，strict mode 下 INSERT 报错）

## 前端

### 支付页 `apps/web/src/app/payment/page.tsx`
- 去掉 6 位密码键盘 + 成功弹层（`successOpen` / `pwdOpen` 等 state）
- "立即支付"直接 `submitOrder`：`createOrder` 拿 `payUrl` → `window.location.href = payUrl`
- 失败时 toast，留在当前页

### 回跳页 `apps/web/src/app/payment/return/page.tsx` （新）
- 读 `?orderId=`（也兼容 `?order_id=` / `?out_trade_no=`，应付不同网关习惯）
- `setInterval(2000)` 调 `fetchOrderPayStatus`，最多 60 次（2 分钟）
- `paid` → 显示成功 + "查看订单" / "返回继续购物"
- `closed` / `failed` → 错误 + "前往我的订单" / "返回继续购物"
- `waiting` 超时 → 提示去订单页查看最终结果

### shared 类型 `packages/shared/src/api-user-commerce.ts`
- `CreateOrderPayload.payChannel` 必填
- `CreateOrderResult` 改成 `{orderId, orderSn, payNo, payChannel, payUrl, expiresAt}`
- 新增 `OrderPayStatus` 与 `FetchOrderPayStatusResult`

## 边界与失败模式

- **同一订单多次"立即支付"**：每次重生成 pay_no + 重置 `pay_expires_at`。前一笔通过 `closePayOrder` best-effort 关闭网关单（前端用户也不会再看到旧 payUrl）。
- **网关 createPayOrder 抛错**：`pay_status` 标记 failed，订单仍是 PENDING，库存已扣，用户可以从我的订单重新发起支付（`createOrderPayment` 在 PENDING 状态下幂等可调）。
- **支付完成但回调未收到**：回跳页轮询 + 主动 query API 兜底；query 命中 paid 时直接调 `markOrderPaid`，跟 notify 走同一函数。
- **订单超时未付**：`queryOrderPayStatus` 自动检测 `pay_expires_at` 过期 → 标记 closed + ORDER_CLOSED。**库存目前不归还**（P1 待办）。
- **wechat / alipay returnUrl 配置**：admin 后台 `payment_settings` 里只有一个全局 returnUrl 字段，目前竞猜和商城共用。一种做法是 returnUrl 配 `https://<domain>/payment/return`，回跳页根据 `?orderId=` / `?betId=` 哪个有判断走哪个域。本期前端只处理 `?orderId=`，竞猜回跳走自己的 `/guess/:id` 路径（已经在线），不会撞。

## 实施顺序（已完成）

1. ✅ SQL migration `packages/db/sql/order_payment.sql`
2. ✅ shared 类型扩展
3. ✅ payment-shared.generatePayNo 加 prefix
4. ✅ payment/router.ts 派发改造
5. ✅ 新建 order/order-pay.ts
6. ✅ order/order-write.ts 拆 createPendingOrder
7. ✅ order/router.ts 路由改造 + 新增 pay-status
8. ✅ web 支付页改造 + 新建 /payment/return
9. ✅ web shared API 扩展（fetchOrderPayStatus）

## 已知后续工作

- **库存归还 scheduler**：扫描 `pay_status=closed && status=CLOSED` 的订单，把 order_item.quantity 加回 product.stock + sales 减回。建议跟竞猜过期 closer 一起做。
- **退款 API**：wechat refund + alipay refund，统一到 payment-service 暴露 `refundPayOrder`。
- **operator_role 枚举常量**：本次顺手补的，但 schema 没明确定义编码，需要一份正式约定文档。当前用 `OPERATOR_ROLE_USER=10 / ADMIN=20 / SYSTEM=30`。
- **coupon.amount 单位约定**：本次顺手修了 sanitize 把 percent 类型也 /100 的 bug，新约定 cash/shipping=元、percent=0-100。如果以后接其它币种或非整数百分比要重新校准。
