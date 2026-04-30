# CLAUDE.md — 用户端已知问题清单

本文件记录 `apps/web` 用户端当前存在的不合理点，供后续开发参考。

> **老系统代码路径**：`~/projects/umi-origin`（即 `/root/projects/umi-origin`），文中引用如 `umi-origin/frontend/payment.html` 都以此为根。
>
> **DB 全量表结构**：`docs/full-schema.md` 是当前数据库 90+ 张表的字段/类型/注释快照（含 `virtual_warehouse / physical_warehouse / warehouse_item_log / fulfillment_order / order / order_status_log / consign_trade` 等所有仓库与订单相关表）。状态码与 type 编码对照表在 `docs/status-codes.md`。需要查 schema 优先看这两个文件，不要直连 mysql。
>
> **不跑 typecheck / 不本地起服务 / 不查日志**：改完代码不要主动跑 `pnpm typecheck` / `tsc`（无论单包还是 turbo 全跑）；也不要 `pnpm dev` 起 api/web/admin 进程；也不要 tail/cat `/tmp/*.log` 或类似日志文件去定位运行时错误。编译、运行、日志排查全由用户在本地 IDE / CI 处理；调试运行时报错只能纯靠读代码。

---

## 1. Server Component 硬编码 API 地址（P0）

**文件**：`apps/web/src/app/page.tsx:11`、`apps/web/src/app/lives/page.tsx:5`、`apps/web/src/app/ranking/page.tsx:12`

三个 Server Component 自己写死了 `const apiBaseUrl = 'http://127.0.0.1:4000'`，没有走 `src/lib/env.ts` 的 `NEXT_PUBLIC_API_BASE_URL`。生产环境会直接请求失败。

**修法**：统一改为 import `apiBaseUrl` from `../../lib/env`，或用 `process.env.NEXT_PUBLIC_API_BASE_URL`。

---

## 2. 注册时选择的头像不生效（P1）

**文件**：`apps/web/src/app/register/page.tsx:33` / `130`

`selectedAvatar` state 由用户在第 3 步选中，但 `handleRegister()` 调用 `register()` 时从未传入。`RegisterPayload`（`packages/shared/src/api.ts:88`）也没有头像字段。用户选了头像完全无效。

**修法**：在 `RegisterPayload` 加 `avatar?: string`，注册时把 `avatars[selectedAvatar].src` 传进去，后端写入 `user_profile.avatar`。

---

## 3. 忘记密码仅 toast（P1）

**文件**：`apps/web/src/app/login/page.tsx:325`

点击"忘记密码？"只显示 toast "密码重置功能开发中"，没有任何密码重置流程。

**修法**：补 `/reset-password` 页面，复用已有 `sendCode` + `changePassword` 接口完成验证码重置流程。

---

## 4. 第三方登录（微信/QQ/Apple）仅 toast（P2）

**文件**：`apps/web/src/app/login/page.tsx:176`

`handleSocialLogin()` 只显示 "正在使用 X 登录..." toast，无实际 OAuth 集成。按钮渲染在登录页但完全不可用，给用户造成误导。

**修法**：短期内隐藏社交登录区，等 OAuth 对接完成后再展示；或显示"暂不支持"而非伪进度。

---

## 5. 用户协议 / 隐私政策仅 toast（P2）

**文件**：`apps/web/src/app/login/page.tsx:357-364`、`apps/web/src/app/register/page.tsx:729-736`

点击《用户协议》《隐私政策》只显示对应名字的 toast，无实际内容页面。

**修法**：补 `/terms` 和 `/privacy` 静态页，或打开外链。

---

## 6. 个人中心设置项均为"开发中"（P2）

**文件**：`apps/web/src/app/me/page.tsx:634 / 644 / 649`

语言切换、帮助中心、意见反馈三个入口点击后只 toast "xxx 开发中"。

**修法**：短期可隐藏这三项，避免用户重复点到空入口；或补最小 landing 页。

---

## 7. 购物车满减阈值 ¥200 硬编码前端（P1）

**文件**：`apps/web/src/app/cart/page.tsx:1318`

```ts
const promoGap = Math.max(0, 200 - total);
```

¥200 满减门槛直接写死在前端，无法通过后台配置调整，也无法与实际促销活动联动。

**修法**：从 `/api/cart` 或专属促销接口返回当前有效满减规则，前端按接口数据渲染。

---

## 8. 购物车店铺 logo 使用外部 dicebear API（P2）

**文件**：`apps/web/src/app/cart/page.tsx:1527`

```ts
src={`https://api.dicebear.com/7.x/initials/svg?seed=...`}
```

依赖第三方公共 API 生成店铺头像，生产/离线环境可能加载失败，且图片内容不可控。

**修法**：改用本地 SVG 占位图，或从 `shop.logo` 字段取真实图片，缺省时降级到纯文字首字母方案。

---

## 9. 购物车 `SHOP_NAME_MAP` 硬编码（P2）

**文件**：`apps/web/src/app/cart/page.tsx:1216`

8 个品牌→店铺名映射写死在前端。后台新增或修改店铺名，前端必须同步改代码。

**修法**：`CartItem` 返回结构中已有 `shop` 字段，直接使用 `item.shop` 而不走本地映射；`SHOP_NAME_MAP` 可删除。

---

## 10. 仓库寄售提交只更新本地 state，不调写接口（P0）

**文件**：`apps/web/src/app/warehouse/page.tsx:151`

`submitSell()` 只做 `setItems(...)` 的 optimistic update，显示"已寄售"toast，但从未调用任何 API。刷新页面后寄售状态消失，数据不持久。

**修法**：补 `POST /api/warehouse/physical/:id/consign` 接口，`submitSell` 先调接口成功后再更新 UI；失败时回滚本地 state。

---

## 11. 仓库批量操作未实现（P2）

**文件**：`apps/web/src/app/warehouse/page.tsx:186`

右上角批量操作按钮点击只 toast "批量操作"，无实际功能。

**修法**：明确批量操作语义（批量提货 / 批量取消寄售）后补实现，或短期隐藏按钮。

---

## 12. 订单"联系卖家"/"催发货"仅 toast（P2）

**文件**：`apps/web/src/app/orders/page.tsx:1023 / 1027`

两个行为只触发提示文案，没有接入客服系统或后端写接口。

**修法**：联系卖家可跳转到与该店铺的聊天页（`/chat/:shopUserId`）；催发货可调 `POST /api/orders/:id/urge`。

---

## 13. 订单"评价"跳商品页，无评价流程（P2）

**文件**：`apps/web/src/app/orders/page.tsx:1031`

点击"评价"只 push 到 `/product/:id`，没有评价表单或评价结果展示。

**修法**：补 `/review?orderId=&productId=` 页面或弹层，支持星级 + 文字评价。

---

## 14. 购物车→支付数据通过 sessionStorage 传递（已修 2026-04-29）

购物车现已走 `/payment?from=cart&cartItemIds=<id1,id2,...>` URL 传参，支付页用 `searchParams.get('cartItemIds')` + `fetchCart()` 重新拉真实快照。`sessionStorage('payCartItems')` 已下线。

---

## 15. 支付链路整体（P0 → 主链路已完成 2026-04-29）

**进度**：竞猜参与 + 商城下单 都已对接真实支付（微信 H5 + 支付宝 WAP）。

### 竞猜（2026-04-28 完成）
- 设计：`docs/superpowers/specs/2026-04-28-guess-payment-design.md`
- 实现：`apps/api/src/modules/payment/`（wechatpay-node-v3 + alipay-sdk）+ `apps/api/src/modules/guess/guess-pay.ts` + 前端 bet 弹层渠道选择 + 回跳轮询。
- 数据：`packages/db/sql/guess_bet_payment.sql` 已执行。

### 商城（2026-04-29 完成）
- 下单流程改成两段：
  - `createPendingOrder`：写 `order(status=PENDING)` + `order_item` + 扣库存（占用），不动券/履约/购物车
  - `markOrderPaid`：支付回调或主动查询命中 paid 时，事务里转 `ORDER_PAID` + 建履约单 + 核销券 + 删购物车 + 写状态日志，幂等只在 `pay_status=waiting && status=PENDING` 推进
- 实现：`apps/api/src/modules/order/order-pay.ts` + 前端 `/payment/return` 回跳轮询页
- pay_no 前缀：`OR` 商城 / `GB` 竞猜，`payment/router.ts` 按前缀派发到 `markOrderPaid` / `markBetPaid`
- 数据：`packages/db/sql/order_payment.sql` 已执行（order 表加 pay_status / pay_channel / pay_no / pay_trade_no / paid_at / pay_expires_at + uk_order_pay_no）
- 兜底：notify_url 回调 + 回跳页主动 query API 双保险

### 仍待办
- **超时未付订单库存归还**（P1）：当前 `createPendingOrder` 即时扣库存做"占用"，但没有定时 job 把 `pay_status=closed` 的订单库存归还。短期手动 SQL 修，长期补 scheduler。
- **退款 API**（P1）：`pay_status=50 (refunded)` 字段已留位，竞猜双付 + 商城退款都没调 wechat/alipay refund API。
- **admin returnUrl 配置**：竞猜支付与商城支付共用同一个 `returnUrl`（admin 后台配），需指向 `/payment/return`，用 `?orderId=` / `?betId=` 区分。

---

## 16. 好友 PK 多人模式结算空选项校验缺失（admin 兜底已完成 2026-04-30）

**进度**：admin 后台「好友竞猜」+「竞猜列表」均已加「作废」按钮——运营在结算前自助作废+全员原路退款（本金+手续费），覆盖了"某选项 0 投注"等异常场景。

- 后端：`apps/api/src/modules/admin/guess-management.ts:abandonAdminGuess`（POST `/api/admin/guesses/:id/abandon`）+ 抽出的 `apps/api/src/modules/guess/guess-abandon.ts:refundAbandonedGuessBets`（与 `guess-scheduler` 流标退款共用同一退款循环）
- 前端：`friend-guesses-page.tsx` / `guesses-page.tsx` 操作列加「作废」+ 弹层填理由 → 调 `abandonAdminGuess`
- 状态：`guess_review_log.action=40 (abandon)` 新编码记一笔运营操作日志
- 兼容：scheduler 中 retry 链路同时改为直接调 `refundAbandonedGuessBets`（修了一个原 retry 永远 short-circuit 的 bug——`refundAndAbandon` 第一步只在 `status=ACTIVE` 时切，retry 时 status 已是 ABANDONED，永远跳过）

**仍未做（二期）**：
- 自动检测"某选项 0 投注 → 自动作废"。当前需要 admin 手动盯，自动化留待二期。
- 流标退款重试入口（pay_status=50 单笔重试）。当前只能等 scheduler 下个 tick 自动续跑，admin 没有"立即重试"按钮。
- **paid-after-abandon race**：admin 作废瞬间若有支付回调同时落地（极小概率），`markBetPaid` 不感知 guess 已 ABANDONED，会把 bet 推到 `PAID/PENDING`。scheduler retry 在 60s 内会兜底退款，user 短时间内可能看到"已支付"。彻底修法是 `markBetPaid` 的 FOR UPDATE 同事务里 SELECT `guess.status`，命中 ABANDONED 直接回写 `pay_status=REFUNDED` 并退款，留二期。

---

## 17. 商城联名穿插卡先隐藏（二期）

**文件**：`apps/web/src/components/mall-home.tsx:29-58 / 561-598`

商城首页 recommend tab 每 4 张商品后穿插的"联名活动卡"已通过 `SHOW_COLLAB_CARDS=false` 整体隐藏。

**遗留问题**：
- 视觉模板（4 套渐变 + badge + CTA 文案）与商品真实联名信息脱钩，老系统 LISA×CELINE / JENNIE×CHANEL / YANG MI×VERSACE / 年少有为×乐事 等具体代言文案在新版已不存在。
- 当前 `collabPool` 来自筛选 `mallItems` 中含 `collab/联名/限定/活动` tag 的商品，库内无对应数据时整列穿插为空，首屏比老版少 4~6 张品牌大卡，且无静态保底。

**二期方案**：后台新增"商城联名活动"配置位（独立于 `banner` 表），字段包含 `brand1/brand2/subtitle/badge/cta_label/bg_gradient/link_type/link_id/sort`；前端按 4 张 + 节奏穿插，无配置时不渲染。开工时把 `SHOW_COLLAB_CARDS` 删掉并接新接口。

---

## 18. 商城首页 mall_hero 运营 banner 未接（二期）

**文件**：`apps/web/src/components/mall-home.tsx`（无对应代码）

后端 banner 表早已支持 `position='mall_hero'` 槽位，admin "商城推荐"配置入口 `apps/admin/src/lib/admin-banners.tsx:35` 也齐全；老系统 `frontend/index.html:2498-2505 / 3155-3170` 优先用 `Api.banners.list('mall_hero')` 拉首张 banner 替代商品 hero，没有 banner 才落回商品 hero。新版 `MallHome` 完全没读这个接口，导致后台投放在商城首页失效。

**二期方案**：
- 在 `MallHome` 加 `fetchBanners('mall_hero')`，并发于商品/分类/购物车一起 settle。
- recommend tab 第一屏：banner 存在则渲染 banner-hero（图 + title + subtitle + CTA），不存在落回当前商品 hero。
- click 跳转支持 banner 的 4 种 `linkType`：`product`→`/product/:id`、`guess`→`/guess/:id`、`url`→新窗口外链、`page`→站内 push。
- banner 自带 `endTime` 字段，hero 右下角可附倒计时（老系统没做，但接口字段在；如果运营要做限时活动 hero 就有位置）。
- 老系统只取 `banners[0]`，本期建议照搬"只用第一张"的简单语义，避免轮播组件再写一套。

---

## 19. 支付页发票信息整段先隐藏（二期）

**文件**：`apps/web/src/app/payment/payment-order-sections.tsx`（已删除整段 section，2026-04-29）

老系统 `umi-origin/frontend/payment.html:269-281` 的"发票信息"section 是纯 UI 占位：

- 抬头硬编码"个人"，邮箱硬编码 `user@example.com`
- toggle 状态只是前端 `useState`，没传给 `createPendingOrder`，DB `order` 表也没 invoice 列
- 用户切到"电子发票（个人）"完全不会真开发票

短期已删除整段 section，避免误导。

**二期方案**：补开票真实流程：
- DB：`order` 表加 `invoice_type`（none/personal/company）`invoice_title`（公司名）`invoice_tax_no`（税号）`invoice_email` 四列
- API：`createPendingOrder` payload 接收 invoice 字段，订单详情/导出带出来
- 前端：发票 sheet 支持"不开 / 个人 / 公司+税号"三态，邮箱默认填 `user.email` 可改
- 后台：admin 订单页能看到发票字段，可导出报表

---

## 20. 金币概念全量下线（已完成 2026-04-29）

**决策**：平台不保留任何"用户余额 / 站内代币"语义。所有支付一律走真实通道（微信/支付宝），卖家收款挂在业务表（如 `consign_trade.seller_amount + settlement_status`），提现走 admin 审核 + 真实打款。

**已完成的清理：**
- `apps/api/src/modules/wallet/` 整模块删除；`app.ts` 卸载 `/api/wallet` 挂载；OpenAPI 移除 `/api/wallet/ledger` + `Wallet` tag
- `users/query-store.ts` / `admin-store.ts` 移除 `coins` 聚合 SQL；`users/model.ts` 移除 `coins` 字段；`routes/openapi/schemas/common.ts` UserSummary 移除 `coins`
- `packages/shared/src/domain.ts` 删 `User.coins` + `CoinLedgerEntry`；`api-user-commerce.ts` 删 `WalletLedgerResult`；`status.ts` 删 `ledgerTypes` / `LedgerType`
- 前端：`apps/web/src/lib/api/wallet.ts` 整文件删；`features/page.tsx` 删"零食币充值"入口；`create-settings-section.tsx` 文案改"已投注金额按原支付通道退回"
- Admin：`admin-user-detail-drawer.tsx` 删余额展示；`admin-users.tsx` 删"零钱"列
- 文档：`docs/full-schema.md` 移除 `coin_ledger` 段；`docs/status-codes.md` 移除 `coin_ledger.source_type` / `coin_ledger.operator_role` 两组编码

**竞猜流标退款改造：**
- `apps/api/src/modules/payment/` 新增 `refundWechatOrder` / `refundAlipayOrder` / `refundPayOrder` 三件套（同时关闭 #15 P1 待办的"退款 API"中的竞猜部分）
- `guess-scheduler.ts` 重写：从"写 coin_ledger 余额退款"改为"按 pay_no/pay_channel 调原通道 refund + 标记 `guess_bet.pay_status=50(refunded)`"，逐单退款 + 单笔幂等，失败由下个 tick 自动续跑

**待执行**：`packages/db/sql/drop_coin_ledger.sql` 由运维手工执行（之前 `guess_bet_payment.sql` / `order_payment.sql` 也走同样流程）。执行前已确认历史数据可丢弃。

**仍未做**：商城退款 API（`order` 主动调 wechat/alipay refund）—— 留在 #15 P1 待办，思路同竞猜流标，复用 `refundPayOrder`。

---

## 22. 商品共享属性归 brand_product（已完成 2026-04-29）

**决策**：`product` 表只是店铺铺货层，所有"商品本身的属性"（名称、价格锚、主图、相册、描述、tag、联名）都归 `brand_product`，product 不再独立存。

**字段映射**：
| product 旧字段 | 新读取来源 | 处理 |
|---|---|---|
| `name` | `bp.name AS name` | 列保留 NOT NULL（INSERT 仍按 `brand_product.name` 同步写），但 SELECT 全部走 bp |
| `original_price` | `bp.guide_price AS original_price` | 列 DROP |
| `image_url` | `bp.default_img AS image_url` | 列 DROP |
| `images` | `bp.images AS images` | 列 DROP |
| `description` | `bp.description` | 列 DROP（之前没读路径） |
| `tags` | `bp.tags AS tags` | 列 DROP；brand_product 新增 `tags` 列 |
| `collab` | `bp.collab AS collab` | 列 DROP；brand_product 新增 `collab` 列 |

**为什么用 `guide_price`（吊牌价）而不是 `supply_price`**：`original_price` 在前端是划线展示的"原价"，语义=厂商建议零售价 (MSRP) = `brand_product.guide_price`。`supply_price` 是商家进货成本，对消费者不展示。

**SQL 改造范围**（每处都 JOIN brand_product bp 后用 bp.* 别名）：
- 商品流：`product/product-feed.ts`、`product/product-shared.ts (getProductById)`、`product/product-detail.ts`
- 搜索：`search/search-products.ts`、`search/search-discovery.ts`、`search/search-guesses.ts`
- 购物车：`cart/store.ts`
- 订单：`order/order-write.ts`、`order/order-pay.ts`、`order/order-shared.ts`
- 店铺：`shop/shop-public.ts`、`shop/shop-my.ts`、`shop/shop-brand-auth.ts (INSERT 收口)`
- 仓库：`warehouse/warehouse-user.ts`、`warehouse/warehouse-admin.ts`
- 竞猜：`guess/guess-shared.ts`、`guess/guess-read.ts`、`guess/guess-create.ts`、`guess/guess-pay.ts`
- Admin：`admin/merchant-shops.ts`、`admin/products-inventory.ts`、`admin/products-shared.ts`、`admin/guesses-shared.ts`、`admin/guess-management.ts`、`admin/order-consign.ts`、`admin/order-logistics.ts`、`admin/orders-shared.ts`、`admin/users.ts`、`admin/dashboard.ts`、`admin/banners.ts`、`admin/pk-matches.ts`、`admin/friend-guesses.ts`
- Banner：`banner/router.ts`

**简化的 COALESCE**：之前有 ~15 处 `COALESCE(p.image_url, bp.default_img)` / `COALESCE(p.name, bp.name)`，现在 p.* 列要么 DROP 要么不再读，统一收成 `bp.default_img` / `bp.name`。

**写入点**：`shop/shop-brand-auth.ts addShopProducts` 创建铺货 INSERT 仅剩 `shop_id, brand_product_id, status` 三列（详见 #24 / #25）。

**2026-04-30 收尾**：admin 「品牌商品库」编辑/新增弹层补 tags（`Select mode="tags"` 自由输入 + 逗号分隔）和 collab（单行 Input）输入控件；shared payload + products-shared 的 Row/Item/sanitize/normalize + products-brand-library 的 SELECT/GROUP BY/INSERT/UPDATE 全链路打通；OpenAPI schema 同步加字段。

**2026-04-30 二期收尾**：`product` 表 `name / price / stock / frozen_stock / guess_price / source_url` 全列 DROP，product 退化为纯店铺铺货关联表（id / shop_id / brand_product_id / sales / rating / status + ts），库存/价格语义彻底外迁——详见 #25 关于其余模块未跟进的列举。

---

## 23. 竞猜后台 2026-04-30 改造

**背景**：审计「竞猜管理」三个子菜单后整改，关闭 #16 P1 + 拆解了若干历史残留菜单。

**已完成：**

- **「PK 对战」菜单+后端+表全套下线**：
  - admin 菜单 `/pk` 删；`apps/admin/src/pages/pk-matches-page.tsx` 删；后端 `apps/api/src/modules/admin/pk-matches.ts` 删 + `content-routes.ts` 中 2 个 GET 删 + `auth.ts` 中 `/pk` 权限分支删
  - OpenAPI `/api/admin/pk` / `/api/admin/pk/stats` 段删；`packages/shared/src/admin-permissions.ts(.js)` 中 `guess.pk` 行删
  - `pk_record` 表迁移 SQL：`packages/db/sql/drop_pk_record.sql`（与 `drop_coin_ledger.sql` 走同样流程，运维手工执行）
  - 原因：产品定义"好友 PK 是竞猜的一种"，`pk_record` 是冗余建模——整个仓库 grep 没有任何 INSERT 路径，admin 页面查的永远是空表，是历史残留菜单

- **好友竞猜状态枚举补齐 + tab 拆分**：`AdminFriendGuessStatus` 加 `settled` / `abandoned`，移除原 `ended`（无法区分流标 vs 正常结算），tabs 由「已结束」拆为「已结算」+「已作废」两列

- **好友竞猜参与人数公式修正**：`Math.max(2, acceptedInvitations + 1, betParticipantCount)` → `betParticipantCount`（早期双人 PK 时代的硬编码下限，多人 PK 上线后会虚高）

- **竞猜列表补「编辑」按钮**：`PUT /api/admin/guesses/:id`，仅可改 `title / description / image_url / end_time(只能延长)`。选项/赔率/分类/商品本期不动（已有投注的竞猜改这些会破坏下注语义）。仅 status=`active|pending_settle` 显示

**仍未做（二期）**：
- 流标退款重试入口（admin 列表层显示 `pay_status=50` 状态 + 一键重试某竞猜下所有未退款 bet，复用 `refundAbandonedGuessBets`）
- 列表加创建人 / 奖池字段、关联商品/店铺/创建人跳转链接
- 后端真分页（当前两个列表都拉全量后前端过滤，量大会卡）
- 自动检测"0 投注选项 → 自动作废"
- `guess.is_visible` 上下架字段（让运营隐藏但不影响已下注的竞猜）；本期判定运营要藏可走「作废+全退」语义更干净

---

## 24. 店铺侧 product 操作语义 + product 表彻底退化（2026-04-30）

**决策**：店铺侧（`apps/web` my-shop / add-product）对 `product` 表只有「上架」和「下架」两种操作，**不允许卖家编辑**任何商品属性。同时 `product` 表本身彻底退化成"店铺铺货关联表"——只剩 `id / shop_id / brand_product_id / sales / rating / status + 时间戳` 共 8 列。所有商品维度信息（名称、价格、图、描述、tags 等）走 `brand_product`，由 admin 维护（与 #22 一致）。

**当前 product 表结构**：
```sql
id, shop_id, brand_product_id, sales, rating, status, created_at, updated_at
```
DROP 列（已离场，不再可读/可写）：`name / price / stock / frozen_stock / guess_price / source_url / original_price / image_url / images / description / tags / collab`

**字段语义**：
- `shop_id + brand_product_id`：唯一一组业务键，`(shop_id, brand_product_id)` 应该建 UNIQUE 但 schema 没建（dedup 在应用层 `addShopProducts` 兜底）
- `sales`：销量计数器，订单履约时累加（暂未对接）
- `rating`：店铺铺货层评分（暂未对接，my-shop hero 评分实际取 `AVG(product_review.rating)`）
- `status`：10=active 由 add 写；20=off_shelf 由 remove 写；90=disabled 留位 admin 强制下架（未实现）
- 价格 / 库存 / 竞猜价 / 名称 / 图 全部走 `brand_product` JOIN

**上架链路**（`apps/api/src/modules/shop/shop-brand-auth.ts addShopProducts`）：
- 入口：`POST /api/shops/products`，payload `{ brandId, brandProductIds }`
- INSERT 仅写 `(shop_id, brand_product_id, status)`，其他列由 DEFAULT/null
- dedup 按 `(shop_id, brand_product_id)` 查已有行：
  - 命中且 `status=10` → 跳过（已上架）
  - 命中且 `status=20` → `UPDATE status=10` reactivate（重新上架不留孤儿）
  - 未命中 → INSERT
- `getBrandProducts` 的 `listed: boolean` 只看 `status=10` 行，下架后的商品在 picker 里仍可重新选

**下架链路**（`removeShopProduct`）：
- 入口：`DELETE /api/shops/products/:id`
- 软删：`UPDATE product SET status=20 WHERE id=? AND shop_id=?`，幂等
- **不物理删除**：`order_item / fulfillment_order / product_review / consign_trade` 等都引用 `product.id`，硬删破坏历史订单/评价

**my-shop 视角统一过滤 active**（`shop-my.ts`）：
- 商品列表 SELECT：`WHERE p.shop_id=? AND p.status=10`，price 列 `bp.guide_price AS price`
- hero「在售商品」count：`COUNT(*) WHERE shop_id=? AND status=10`
- 每个 `MyShopBrandAuthItem.productCount`：子查询加 `AND p2.status=10`

**MyShopBrandAuthItem 双计数语义**：
- `productCount` — 该品牌已上架到本店的 active 商品数（my-shop hero / 品牌卡 meta）
- `catalogProductCount` — 该品牌库总数（add-product step1 品牌卡 badge）

**库存概念整体外迁**：DROP `stock / frozen_stock` 后系统目前**没有任何库存约束**——所有 active 商品永远视为"可售"。下游 cart/order 任何 `WHERE stock > 0` / `stock - frozen_stock > 0` 检查都已失效，全员当无限库存处理。要重新引入库存得新建独立表（如 `shop_product_stock`）或者把库存挪到 `brand_product` 维度。

**已完成**：
- 后端：addShopProducts INSERT/dedup 适配新 schema；shop-my 列表 SELECT 把 price 切到 `bp.guide_price`；下架软删接口
- 前端：my-shop 编辑按钮删除；下架确认 bottom-sheet（替 `window.confirm`）；下架真实调接口
- 文档：`docs/full-schema.md` product 表已更新

---

## 25. product schema 减字段后，下游模块未跟进列举（P0）

**背景**：`product` 表 `name / price / stock / frozen_stock / guess_price / source_url` 列已 DROP（详见 #24）。除了 `apps/api/src/modules/shop/*` 已修，其他模块仍按旧 schema 读这些列，**当前都会 SQL 报错或返回脏数据**。需要逐个 sweep。

**待 sweep 模块（grep 自 `apps/api/src` 截至 2026-04-30）**：

| 模块 | 文件 | 引用的旧列 | 修法 |
| --- | --- | --- | --- |
| 商品流 | `product/product-feed.ts:18,73,75,81` | p.price/p.guess_price/p.stock | bp.guide_price / bp.guess_price / bp.stock |
| 商品流 | `product/product-shared.ts:297,299,305` | p.price/p.guess_price/p.stock | 同上 |
| 商品详情 | `product/product-detail.ts:97,100,101,256-257,285-286,351,354-355,365-366,370` | p.name/p.price/p.guess_price/p.stock/p.original_price | name→bp.name / price/original_price→bp.guide_price / guessPrice→bp.guess_price / stock→bp.stock |
| 搜索 | `search/search-products.ts:50,52,75,77,83` | p.price/p.guess_price/p.stock | bp.guide_price / bp.guess_price / bp.stock |
| 搜索 | `search/search-guesses.ts:106-107,131-132` | p.price/p.guess_price | bp.guide_price / bp.guess_price |
| 购物车 | `cart/store.ts:99,170,174,220,232` | p.price/p.stock | bp.guide_price / bp.stock |
| Banner | `banner/router.ts:210-211` | p.price/p.guess_price | bp.guide_price / bp.guess_price |
| Admin 库存监控 | `admin/products-inventory.ts:61,72,104-106` | p.price/p.stock/p.frozen_stock | 改成基于 brand_product 维度的库存监控（跨店共享池）；frozen_stock 看决策 |
| Admin 竞猜 | `admin/guesses-shared.ts:295-296,331` | p.stock/p.frozen_stock | bp.stock；frozen_stock 看决策 |

**已决策（2026-04-30）**：
- **`guess_price` 移到 `brand_product.guess_price`**：admin 在品牌商品库维护，所有读 `p.guess_price` 的地方改 `bp.guess_price`
- **`stock` 移到 `brand_product.stock`**：admin 在品牌商品库维护"平台总库存"，所有读 `p.stock` 的地方改 `bp.stock`
- **`frozen_stock` 命运待定**：原本 `product.frozen_stock` 是订单占用库存（下单 +N，支付/取消 ±N），如果 `brand_product.stock` 是跨店共享的平台总库存，那 `frozen_stock` 也得挂在 `brand_product` 维度（多店并发占用同一池子）。开新线程时一并拍板，候选两种：
  - 加 `brand_product.frozen_stock`（保留占用模式，多店共享）
  - 不加 frozen，下单直接 stock-=N，支付失败 stock+=N（接受瞬时不一致，回滚成本低）

**待新线程 sweep（开线程时按这套规则做）**：

DDL（先跑）：
```sql
ALTER TABLE brand_product
  ADD COLUMN guess_price BIGINT NULL COMMENT '竞猜价格，单位分' AFTER supply_price,
  ADD COLUMN stock INT NOT NULL DEFAULT 0 COMMENT '平台总库存（跨店共享）' AFTER guess_price;
-- frozen_stock 看决策再加
```

代码 sweep（按上面的表逐个处理）：
- `p.price` → `bp.guide_price`
- `p.guess_price` → `bp.guess_price`
- `p.stock` → `bp.stock`
- `p.frozen_stock` → 待决（先用常量 0，或者去掉相关检查）
- `p.name` → `bp.name`
- `p.original_price` → `bp.guide_price`（同 #22 的语义）

Admin 端 brand_product 编辑界面要补：
- `apps/admin/src/lib/admin-products-shared.ts` Row/Item/sanitize/normalize 加 guessPrice / stock
- `apps/admin/src/pages/products-brand-library-page.tsx` 编辑/新增弹层加两个 input
- `apps/api/src/modules/admin/products-brand-library.ts` SELECT/INSERT/UPDATE 加字段
- `packages/shared/src/admin-...` Payload/Result 加字段
- OpenAPI schema

`docs/full-schema.md` brand_product 表加两行（guess_price + stock）。

**部署影响**：
- 老版后端 + 新 schema → 任何读上述列的接口直接 SQL 报错（unknown column）
- 已 push 的 `apps/api/src/modules/shop/*`（commit 6463716 + 后续 hotfix）已适配
- 未 sweep 的模块（cart/search/product-feed/product-detail/banner/admin）当前**不可用**，需要紧急 sweep

---

## 21. 用户端商品详情未消费 brand_product 的图（P2）

**文件**：`apps/api/src/modules/product/product-shared.ts:294`（getProductById SELECT）+ `apps/api/src/modules/product/product-detail.ts:337`（images 数组拼装）

admin 端 `brand_product` 已能维护封面（`default_img`）+ 相册（`images` 多图，2026-04-29 接通），但用户端 `getProductDetail` 拼接商品图区时只用 `p.image_url` + `p.images`，店铺铺货没自定义图就直接空相册，**不会回退到品牌商品的图**。

**修法**：
- `getProductById` SELECT 增加 `bp.default_img AS bp_default_img, bp.images AS bp_images`
- `ProductRow` 类型加 `bp_default_img?: string | null; bp_images?: unknown`
- `getProductDetail` 拼 images 数组时：`p.image_url` / `safeJsonArray(p.images)` 都空 → 落回 `bp_default_img` + `safeJsonArray(bp_images)`
- 商品列表/搜索/推荐场景同理（`product-shared.ts:232`、`product-feed.ts` 已部分回退到 `bp.default_img`，但相册没回退；按需补）

---

## 小结

| 优先级 | 数量 | 描述 |
|--------|------|------|
| P0     | 3    | Server Component 硬编码 URL / 仓库寄售无写接口 / product schema 减字段后 cart-search-product-detail-banner-admin 模块仍读旧列（见 #25）|
| P1     | 4    | 注册头像不生效 / 忘记密码无流程 / 购物车满减硬编码 / 支付超时库存归还 + 商城退款 API（竞猜流标退款已完成 2026-04-29，好友 PK 空选项 admin 兜底作废已完成 2026-04-30）|
| P2     | 13   | 第三方登录/协议/设置入口假按钮 / dicebear 外部依赖 / SHOP_NAME_MAP / 仓库批量操作 / 订单联系-催单-评价 stub / 商城联名穿插卡二期 / 商城 mall_hero banner 二期 / 支付页发票二期 / 用户端商品详情未消费品牌图 |
