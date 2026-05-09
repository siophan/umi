# CLAUDE.md — 用户端已知问题清单

本文件记录 `apps/web` 用户端当前存在的不合理点，供后续开发参考。

> **老系统代码路径**：`~/projects/umi-origin`（即 `/root/projects/umi-origin`），文中引用如 `umi-origin/frontend/payment.html` 都以此为根。
>
> **DB 全量表结构**：`docs/full-schema.md` 是当前数据库 90+ 张表的字段/类型/注释快照（含 `virtual_warehouse / physical_warehouse / warehouse_item_log / fulfillment_order / order / order_status_log / consign_trade` 等所有仓库与订单相关表）。状态码与 type 编码对照表在 `docs/status-codes.md`。需要查 schema 优先看这两个文件，不要直连 mysql。
>
> **不本地起服务 / 不查日志**：不要 `pnpm dev` 起 api/web/admin 进程；也不要 tail/cat `/tmp/*.log` 或类似日志文件去定位运行时错误。运行、日志排查全由用户在本地 IDE / CI 处理；调试运行时报错只能纯靠读代码。typecheck 可以主动跑（`pnpm --filter @umi/api typecheck` / `@umi/web` / `@umi/admin`）来验证类型修复，避免类型错误攒到 release 构建才一次性爆。
>
> **mysql2 `LIMIT ?` 必须走 `db.query`，不能用 `db.execute`**：`db.execute` 是 prepared statement 二进制协议，LIMIT 占位符会被发成错误整数类型，MySQL 抛 `ER_WRONG_ARGUMENTS` 接口直接 500。代码库统一约定：LIMIT/OFFSET 是 `?` 占位符就用 `db.query<...>(...)`；只有 LIMIT 是字面量（如 `LIMIT 1`）才能用 `db.execute`。`apps/api/src/modules/search/*`、`admin/users.ts`、`admin/products-inventory.ts` 等都是这个写法。曾因 6071a99 把 `getMeActivity` 的 `LIMIT 20` 改成 `LIMIT ?` 但仍用 `db.execute`，导致 `/api/users/me/activity` 500、登录后立刻被踢回 `/login`（4dc8e53 修复）。

> **编号不连续是有意为之**：已 100% 完成且无遗留的章节已从本文件移除（#1/#2/#3/#5/#6/#7/#8/#9/#10/#12/#13/#14/#21），但编号保留缺位以避免破坏历史 commit 消息 / memory 笔记 / 跨章节引用。

---

## 11. 仓库批量操作未实现（已隐藏）

右上角"批量操作"按钮已删除，header 仅留一个 `<div class={styles.action} />` 占位保布局（见 page.tsx）。批量提货/取消寄售语义未定，等仓库重构批次再做。

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
- **admin returnUrl 配置**：竞猜支付与商城支付共用同一个 `returnUrl`（admin 后台配），需指向 `/payment/return`，用 `?orderId=` / `?betId=` 区分。

### 已完成
- **退款 API**（2026-05-06 完成商城部分）：`completeAdminOrderRefund` 在事务内调 `refundPayOrder(channelKey, { payNo, refundNo, totalCents, refundCents })`，refund_no 用 `order_refund.refund_no` 兜底 `OR{orderId}R{refundId}` 做幂等；网关失败抛 `ADMIN_ORDER_REFUND_GATEWAY_FAILED` + 事务回滚；网关成功才推 `order.pay_status=50` + `order_refund.status=90` + 全单退货入库（按 SKU 维度 `bps.stock += oi.quantity`）+ 状态日志。竞猜流标部分 4-29 已完成。

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

## 18. 商城首页 mall_hero 运营 banner（已完成 2026-05-09）

**进度**：`MallHome` recommend tab 第一屏已接 `fetchBanners('mall_hero', 1)`，banner 存在替代商品 hero，否则继续渲染原商品 hero。

**已完成**：
- 前端：`apps/web/src/components/mall-home.tsx` 加 `mallHeroBanner` state + `Promise.allSettled` 并发拉 `fetchBanners('mall_hero', 1)`，与商品/分类/购物车一起 settle，banner 失败不影响其他链路；recommend tab 渲染分支：`mallHeroBanner` 存在 → `<m-hero-banner>`（image + title + subtitle + CTA），否则落回原 `<m-hero>`
- 跳转：复用后端 `targetPath`，`targetType='external'` 或 `targetPath` 是 `https?://` 开头 → `window.open(_blank, noopener)`，否则 `router.push(targetPath)`，覆盖 guess/post/product/shop/page/external 6 种类型
- 样式：`apps/web/src/app/globals.css` 加 `.m-hero-banner*`（16:9 image cover + 标题 16/700 + 副标题 13/#999 + 右侧金色 CTA chip），与 `.m-hero` 同 margin/border-radius/shadow 维持视觉一致；`imageUrl` 为空时 placeholder 渐变兜底
- 仅取 `banners[0]`：照搬老系统简单语义，避免轮播组件

**遗留 P2**：banner `endAt` 字段未利用——如运营要做限时活动 hero，可在 CTA 旁加倒计时（接口字段已有，组件未实现）。本期不做。

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

**已完成（2026-05-06）**：商城退款 API 落在 `completeAdminOrderRefund`，思路同竞猜流标 + 复用 `refundPayOrder`。详见 #15 已完成段。

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

## 25. product schema 减字段 + brand_product 库存占用模式（已完成 2026-05-01）

**背景**：`product` 表 `name / price / stock / frozen_stock / guess_price / source_url / image_url / images / tags / collab / original_price` 列已 DROP（详见 #24）。商品共享属性 + 库存 + 竞猜价都搬到 `brand_product`。

**最终决策（最后一稿）**：
- `brand_product` 已加三列：`guess_price`（竞猜价，单位分，NULL=用 guide_price 兜底）、`stock`（平台总库存，admin 维护）、`frozen_stock`（系统占用，自动维护）
- **库存占用模式（freeze-on-pending）**：可用库存 = `stock - frozen_stock`
  - createPendingOrder：`UPDATE brand_product SET frozen_stock = frozen_stock + n WHERE id=? AND (stock - frozen_stock) >= n`，affectedRows=0 抛 PRODUCT_STOCK_NOT_ENOUGH（条件 UPDATE 防超卖，不需要 FOR UPDATE）
  - markOrderPaid：`UPDATE brand_product bp INNER JOIN product p ... INNER JOIN order_item oi ... SET bp.stock = stock - oi.quantity, bp.frozen_stock = frozen_stock - oi.quantity WHERE oi.order_id = ?`
  - 超时关单 / gateway closed：`releaseOrderFrozenStock` helper 调 `UPDATE brand_product ... SET frozen_stock = frozen_stock - oi.quantity`，仅在 PENDING→CLOSED 切换 affectedRows>0 时调用，幂等
- guess_price：所有 SELECT 走 `bp.guess_price`，sanitize 层 `Number(row.guess_price ?? row.price ?? 0)` 兜底；guess-pay 用 `COALESCE(bp.guess_price, bp.guide_price) AS product_price`

**Sweep 规则**：
- `p.price` / `p.original_price` → `bp.guide_price`
- `p.name` → `bp.name`
- `p.image_url` → `bp.default_img`，`p.images` → `bp.images`，`p.tags` → `bp.tags`，`p.collab` → `bp.collab`
- `p.guess_price` → `bp.guess_price`
- `p.stock` → `bp.stock`，`p.frozen_stock` → `bp.frozen_stock`，可用库存现场算 `stock - frozen_stock`

**已改文件（22 个 + admin frontend 4 个 + shared 1 个 + OpenAPI 1 个）**：
- 商品流：`product/{product-feed, product-shared, product-detail}.ts`
- 搜索：`search/{search-products, search-shared, search-guesses}.ts`
- 购物车：`cart/store.ts`（addCartItem/updateCartItem 库存 cap 用 `bp.stock - bp.frozen_stock`）
- Banner：`banner/router.ts`
- 订单写入：`order/order-write.ts`（getProductPurchaseRows / getCartPurchaseRows 库存校验 + 条件 UPDATE bp 冻结）+ `order/order-shared.ts`（ProductPurchaseRow 加 brand_product_id/stock/frozen_stock）
- 订单支付：`order/order-pay.ts`（markOrderPaid 加扣减+解冻 UPDATE；queryOrderPayStatus 超时/closed 路径调 `releaseOrderFrozenStock`）
- 竞猜：`guess/{guess-shared, guess-pay, guess-create}.ts`、`admin/{guesses-shared, guess-management}.ts`
- Admin 商品：`admin/products-inventory.ts`、`admin/products-shared.ts`（resolveProductStatus / buildProductTags / sanitizeAdminProduct / buildAdminProductFilters 全部恢复 low_stock 语义；AdminBrandLibraryRow + sanitizeAdminBrandLibrary + AdminBrandLibraryItem 加 guessPrice/stock/frozenStock/availableStock；normalizeAdminBrandProductPayload 加 guessPrice/stock 校验）
- Admin 品牌库：`admin/products-brand-library.ts`（SELECT/GROUP BY/INSERT/UPDATE 加 guess_price/stock/frozen_stock）
- Admin 商家：`admin/merchant-shops.ts` + `admin/merchant-shared.ts`（ShopProductListRow / ShopDetailProductRow 加字段；items map 用真实 bp 值）
- Admin 用户/dashboard：`admin/users.ts`、`admin/dashboard.ts`
- 店铺：`shop/shop-public.ts`
- Shared：`packages/shared/src/api-admin-merchant.ts`（CreateAdminBrandProductPayload + UpdateAdminBrandProductPayload 加 guessPrice/stock）
- OpenAPI：`apps/api/src/routes/openapi/schemas/admin.ts`
- Admin 前端：`apps/admin/src/lib/admin-brand-library.tsx`（FormValues + buildEdit/Create + columns）、`apps/admin/src/components/admin-brand-library-form-modal.tsx`（加竞猜价/库存输入）、`apps/admin/src/components/admin-brand-library-detail-drawer.tsx`（详情加竞猜价/库存）、`apps/admin/src/lib/api/catalog-shared.ts`（AdminBrandLibraryItem 加字段）、`apps/admin/src/pages/brand-library-page.tsx`（payload map 加 guessPrice/stock）

**退款链路库存归还（2026-05-01 补）**：`completeAdminOrderRefund` 在 PAID → REFUNDED 切换的同事务里执行 `UPDATE bp INNER JOIN p INNER JOIN oi SET bp.stock = bp.stock + oi.quantity WHERE oi.order_id = ?`，按 order_item.quantity 全单退货入库（markOrderPaid 时 frozen_stock 已清，此处只动 stock）。整个仓库只有这一处 PAID→REFUNDED 切换，其他都是 read-only 检查，所以全覆盖。

**遗留**：
- **markOrderPaid 没用 SELECT FOR UPDATE 锁 brand_product**：UPDATE 用 `GREATEST(stock - n, 0)` 兜底防瞬时负数；如果需要严格防超扣，加 `AND stock >= oi.quantity` 条件判断。
- **createPendingOrder 多 item 失败回滚**：item 1 冻结成功后 item 2 失败抛错，事务 rollback 自动归还 item 1 冻结的部分（已验证）。
- **admin 退款 / 取消订单 UI**：当前 admin 没有"主动取消未支付订单"按钮，只能等用户支付/超时。如要补 admin 主动 close pending 订单，记得调 `releaseOrderFrozenStock` 解冻。
- **部分退款不支持**：`completeAdminOrderRefund` 当前是"全单退款 + 全量入库"语义，没有按 order_item 部分退款的 payload。如要支持，得让 admin 在审核时选哪几个 item 退、各退多少件，然后这里按选中数量入库——本期不做。

---

## 26. 多规格品牌商品（SKU）（核心改造完成 2026-05-04，二期遗留）

**设计文档**：`docs/superpowers/specs/2026-05-04-multi-spec-brand-product-design.md`
**SQL（运维待执行）**：`packages/db/sql/multi_spec_schema.sql`

**改造范围**：59 个文件 + 3 个新建（含 `apps/web/src/components/sku-selector/`）
- DB：新增 `brand_product_sku` 表；`brand_product` DROP `guide_price/supply_price/guess_price/stock/frozen_stock` 五列、加 `spec_definitions json` 列；9 张子表（cart_item / order_item / fulfillment_order_item / product_review / consign_trade / virtual_warehouse / physical_warehouse / warehouse_item_log / guess_bet / guess_product）加 `brand_product_sku_id` 列；cart_item 唯一键改 `(user_id, product_id, brand_product_sku_id)`；guess_product 加 `(guess_id, option_idx, product_id, brand_product_sku_id)` UNIQUE
- 后端：所有 SPU 列表 / 卡片场景改用 `brand_product_sku` 聚合子查询（MIN/MAX guide_price + SUM(stock-frozen_stock)）；订单 / 购物车 / 仓库 / 竞猜走 SKU 维度；createPendingOrder / markOrderPaid / 超时关单 / 退款入库 / 退款全部对 `brand_product_sku` 操作
- Admin 前端：「品牌商品库」表单新增多规格 toggle + 规格定义动态行 + SKU 表单网格；详情抽屉加 SKU 列表
- 用户端：商品详情新增 `<SkuSelector>` 组件；购物车 / 订单 / 仓库展示 sku 文案；payment 透传 skuId；create 创建竞猜流程加 SKU bottom sheet picker

**已敲定决策**：SKU 价格 NOT NULL（仅 `guess_price` NULL fallback `guide_price`）；不考虑历史数据；切换单/多规格 toggle 二次确认 + 清空重填；SKU 删除软删 `status=90`、`frozen_stock>0` 拒绝；中奖入仓不扣 `bps.stock`（备货池独立）；价格区间仅算 active SKU；详情画廊选满 SKU 后首图替换为 `sku.image` fallback `default_img`；创建竞猜两步选（商品 → SKU bottom sheet，多规格强制选满）

**2026-05-04 二期决策收口**：

- ① 店铺铺货层无 SKU 维度上下架 — **不做**。整商品上架就全 SKU 上架。
- ② markOrderPaid 严格防超扣 — **已处理**：事务内 `SELECT brand_product_sku ... GROUP BY id FOR UPDATE` 锁 SKU + 应用层 stock>=qty 校验 + UPDATE 加 `WHERE bps.stock >= agg.qty` + affectedRows 不等抛错回滚。改 `apps/api/src/modules/order/order-pay.ts:252`。同时顺手修了原 `UPDATE ... INNER JOIN order_item` 在同 SKU 多行时只扣一次的潜在 bug——改成 GROUP BY 子查询聚合后 join。
- ③ 同选项挂多 SKU — **已处理**：`guess_product` UNIQUE 改 `(guess_id)`——一个竞猜只能关联一个商品 + 一个 SKU，`option_idx` 列保留但恒为 0 不参与唯一键。SQL `packages/db/sql/multi_spec_schema.sql:100`、spec、`docs/full-schema.md` 已同步。admin / 用户端创建竞猜入口本来就只 INSERT option_idx=0 一行 + 强制 brandProductSkuId 必填，无代码改动。
- ④ 部分退款 — **不做**。`completeAdminOrderRefund` 保持"全单退款 + 全量入库"语义。

**遗留（开新线程跟进）**：

1. **二期 UX**：购物车换规格按钮（点开规格选择器换 sku_id 重新合并）、店铺端 SKU 调价（store 维度自定价）、SKU 维度的促销 / 满减、按规格搜索过滤、商品详情评价 tab "按规格筛选"下拉
2. **migration 无回填**：跟运维确认按"清空相关业务表"切换；不允许带历史数据迁移上线
3. **brand_product_extended 字段后续仍归 SPU**：`description / detail_html / spec_table / package_list / freight / ship_from / delivery_days / tags / collab / images` 仍是商品共享属性，不下沉到 SKU；如二期需要按 SKU 分图相册再调整

**部署顺序**（spec 第 11 节）：DB schema 一次性执行 → 同窗口部署代码 PR；不分两段切换。

---

## 27. 我的仓库 `/warehouse` 2026-05-05 修复 + 2026-05-06 提货闭环

**2026-05-05 已修复**：
- 物资总值条下加 12px padding 间距、列表客户端无限滚动（PAGE_SIZE=10，tab 切换重置）、移除底部 tab bar
- 「物流」按钮：从 toast "物流：顺丰 SF1234567890" 假数据改为弹窗（`warehouse-tracking-modal.tsx`）展示 carrier + 运单号 + 复制按钮（`navigator.clipboard` + textarea fallback）；当前后端不返回值，弹窗显示"暂无物流信息"占位
- 「寄售」弹窗：删除"寄售数量"input（接口本就 1:1 整批寄售，输入框是误导），文案改"本次将整批寄售 ×N"
- 「提货」按钮：不再 fake state 切换（之前 `setItems` 把 status 改 'shipping' 但不调任何接口），改为 toast "提货功能即将上线"
- 首屏 loading 4 张 skeleton 占位（之前 loading 时三个分支都不命中是空白）
- **顺手修一个隐藏 bug**：`apps/api/src/modules/warehouse/warehouse-shared.ts` 的 `sanitizePhysicalRow` 之前 `status: row.status as WarehouseItem['status']` 是把 DB INT(10/20/30) 强转成字符串 union；新增 `mapPhysicalStatus` 做 number→label 映射，否则前端 `mapWarehouseTab` 用 `=== 'consigning'` 比对永远 false，**所有实体仓寄售物品都错落到「待提货」tab**

**2026-05-06 提货闭环（批次 1，已完成）**：

- 后端：`POST /api/warehouse/:id/ship` body `{ addressId }` → `warehouse-ship.ts:shipWarehouseItem`。事务内：锁地址 + 锁仓库行（FOR UPDATE）→ 校验 vw.status=10 / pw.status=10 → INSERT `fulfillment_order(type=10/ship, status=10/pending, order_id=NULL, shop_id=反查 product.shop_id)` + INSERT `fulfillment_order_item(brand_product_sku_id, unit_price, quantity)` + UPDATE vw.status=30 / pw.status=30 + INSERT `warehouse_item_log(action=40/outbound, source_id=fulfillment_order.id, operator_role=20/user)`
- 路由：`apps/api/src/modules/warehouse/router.ts` 加 `POST /:id/ship`（id 走 `vw-{id}` / `pw-{id}` 派发）
- 用户列表查询重写（`warehouse-user.ts`）：
  - branch 1 改成 fulfillment_order 驱动：从 `fulfillment_order_item` 展开（之前 INNER JOIN 到 order/order_item 拿不到仓库提货建出来的 fo），CASE 把 fo.status=40 映射 `'completed'`、其余 10/20/30 全映射 `'shipping'`
  - branch 2（physical_warehouse）排除 status=30 fulfilled（提货后退出 listing，由 fo 接管）；status 直接交给 sanitize
  - virtual 排除 status=30 converted（同理）
  - 两个分支都吐 `tracking_no`，sanitize 拼到 `WarehouseItem.tracking`（branch 2 永远是 null）
- `sanitizePhysicalRow` 加 `mapPhysicalRowStatus`：兼容 branch 1 的字符串预映射（'shipping' / 'completed'）和 branch 2 的数字状态码——之前 `Number('shipping')=NaN` 让 branch 1 全部错落到「待提货」tab，是 2026-05-05 那次"hidden bug 修复"引入的回归
- `markOrderPaid` 顺手补 `INSERT INTO fulfillment_order_item SELECT ...`，否则商城已支付订单的履约单也拿不到 _item，新查询展示不了——这是 2026-04-29 写 `markOrderPaid` 时漏的一笔
- shared：`WarehouseShipPayload` / `WarehouseShipResult` 加在 `api-user-commerce.ts`
- 前端：
  - `lib/api/warehouse.ts` 加 `shipWarehouseItem(id, addressId)`
  - 新增 `warehouse-ship-modal.tsx` 底部 sheet：fetchAddresses + 默认选中 default + 单选地址 + 「+ 新增 / 管理收货地址」跳 `/address` + 提交 loading 态。无地址时引导新增
  - `page.tsx` 的 `onPickup` 从 toast 改为 `setShipItem(item)`，提交成功后 toast + reload
  - `warehouse-tracking-modal.tsx`：carrier 为空字符串时不渲染「承运商」字段（warehouse-ship 默认 carrier=''，admin 发货才填 tracking_no）

**遗留**：
- 老 vw.status=20 (locked) 仍然 mapWarehouseTab → 'pending' tab，含 提货按钮可点。提货后端会拒绝（要求 status=10）→ 弹错误 toast 而不会破坏数据。要更干净的 UX 应该在 list 层禁用 locked 行的按钮。本期不做。
- **物资总值口径**：2026-05-09 diff 老系统 `umi-origin/frontend/warehouse.html:206`（`totalVal += (w.price || 0) * w.quantity`，对全部 status 含 consigning），与新版 `page.tsx:105` 写法完全一致——两边口径已对齐，无需改动。寄售中"是否算手里的物资"语义争议保留：老系统沿用至今，本期不动；如产品后期改口径，再独立条目。
- **历史 fulfillment_order 行无 _item**：2026-04-29 ~ 2026-05-06 之间走 markOrderPaid 创建的履约单没写 _item，新查询拿不到。pre-launch 接受不补回填，新订单从此正常显示。

---

## 28. 好友页加好友 + 消息按钮接通（已完成 2026-05-06）

**进度**：好友页（`apps/web/src/app/friends`）顶部"加好友"按钮、好友卡片"消息"按钮两个 stub 全部接通真链路。

### 加好友
- 后端：`POST /api/social/requests` body `{ targetUserId }` → `social/store.ts:sendFriendRequest(viewerId, targetId)`，覆盖 6 种边界（自加自己 / 目标不存在 / 已是好友 / 已 pending 幂等返回 / **reverse pending 自动闭合双向 accepted** / 已 rejected 重投 pending）
- `searchUsers` SELECT/ORDER BY 加 pending 分支，`UserSearchItem.relation` 增加 `'pending'` 枚举值
- 前端：新增 `friends-add-sheet.tsx` 底部 sheet（搜索 debounce 300ms + reqToken 防竞态 + 行尾按钮按 relation 显示「已是好友/已申请/添加」），自动接受路径下关闭 sheet 并触发主页 reload
- shared 类型：`SendFriendRequestPayload` / `SendFriendRequestResult { success, status: 'pending'|'accepted' }`

### 消息按钮
- `friends-tab-sections.tsx` 的 `onOpenMessage` 签名改为 `(item: { id, name }) => void`
- `page.tsx` 直接 `router.push(\`/chat/${id}\`)`；`/chat/[id]` 页面已存在并就绪（`fetchChatDetail` / `sendChatMessage`）

### 仍未做
- 老系统 PK 弹层有"邀请已发送 + 微信/链接分享"成功页，新版直接关闭跳竞猜，**少了 PK 成功反馈态**（CLAUDE.md 记录但不阻塞）
- "发起 PK"语义被偷换：从"发 PK 邀请"改成"跳同一竞猜详情 `?pkFriend=`"，依赖目标用户主动下注，没有真正的 PK 邀请下发链路；与 admin 端「好友竞猜」（`/create?mode=pk`）也未桥接（P2）
- "PK 记录"快捷入口跳混合的 `/guess-history`，没有专属 PK 维度过滤页（P2）
- 删除 / 拉黑好友：两版都缺（P2）

---

## 29. 每日签到（页面 + 后端 + DB 已完成 2026-05-06，签到发券已完成 2026-05-08）

**进度**：`/checkin` 页面 + `POST /api/checkin` + `GET /api/checkin/status` + `user_checkin` 表已落地，签到本身可走通；奖励发券链路已于 2026-05-08 打通。

**已完成：**
- DB：`packages/db/sql/user_checkin.sql`（`(user_id, checkin_date)` UNIQUE，DB 层去重；`reward INT` 字段预留但本期写 0）
- 后端：`apps/api/src/modules/checkin/router.ts` + `store.ts`，`app.ts` 挂 `/api/checkin`
  - `performCheckin` 在事务内 `SELECT ... FOR UPDATE` 锁本人最近一行，已签今日返回 alreadyChecked，router 翻成 `CHECKIN_ALREADY_DONE` 400
  - streak 计算：上一行日期 = 今天-1 → streak+1，否则 streak=1；total 累加
- shared 类型：`CheckinStatus` / `CheckinResult` 加在 `packages/shared/src/api-user-commerce.ts`
- 前端：`apps/web/src/app/checkin/page.tsx` 替换原 stub；7 天时间线展示已签/今日/未来三态；hero 显示真实 streak/total
- 入口：`apps/web/src/app/features/page.tsx` "每日签到" 入口去掉「建设中」禁用态，正常 push `/checkin`

**已完成（2026-05-08）**：performCheckin commit 后调 `maybeGrantCheckinReward(userId, streak)` → 查 `checkin_reward_config WHERE day_no=streak AND status=10`，命中 reward_type=coupon 且 reward_ref_id 非 null 则调 `claimCouponFromTemplate`。失败仅 console.error，签到主流程不回滚。配套 `coupon_template.brand_id` + `coupon` 表快照三列由 #品牌发券改造 批次 1 落地（详见 `docs/superpowers/specs/2026-05-08-coupon-brand-issuance-design.md`）。

**遗留 P2 — 老系统的"今日任务"段不做**：

`umi-origin/frontend/checkin.html` 底部还有"参与 1 次竞猜 +10 零食币 / 发布 1 条动态 +5 零食币"等任务列表。这部分老系统也是纯静态 mock，没有真实任务追踪闭环；新版金币已下线（#20），即便接也没奖励单位可挂，本期不实现。

---

## 30. 邀请有礼（已完成 2026-05-08，老账号 invite_code backfill 由运维手工补）

**进度**：注册带邀请码闭环 + 邀请记录后端 + 奖励发券（单档）三段全部打通；新注册用户都有 `invite_code` 落库，老账号留待运维手工 SQL backfill。

**设计稿**：`docs/superpowers/specs/2026-05-08-invite-reward-design.md`

**已完成（2026-05-08）：**
- 注册路径生成 invite_code：`apps/api/src/modules/auth/store.ts` 加 `generateUniqueInviteCode`（base62 8 位 + 碰撞预查 20 次）；`register()` INSERT user 时同步写 `invite_code` + 反查 `invited_by`
- 注册消费 URL invite：`apps/web/src/app/register/page.tsx` 读 `searchParams.get('invite')`，透传 `register({ inviteCode })`；`RegisterPayload` 加 `inviteCode?: string`
- 无效 invite 静默忽略：`findInviterIdByInviteCode` 命中 + `banned=0` 才返回 inviterId，否则 NULL
- 奖励发券：commit 后调 `maybeGrantInviteRewards(inviterId, inviteeId)`（`apps/api/src/modules/invite/store.ts`），读 `invite_reward_config` 单条 active，按 `reward_type` 分发——仅 `coupon (20)` 调 `claimCouponFromTemplate(userId, templateId)`；coin/physical 跳过 + console.warn；整段 try/catch 失败仅 log，不影响注册返回（与 #29 签到同模式）
- 邀请记录：`GET /api/invite/records`（`apps/api/src/modules/invite/router.ts`）走 `user.invited_by` JOIN（与 admin/invites.ts 同源），返回 100 条 `{ id, name, avatar, registeredAt }`；`/invite` 页 `Promise.allSettled` 并发拉 `fetchMe + fetchMyInviteRecords`，记录列表替换原空状态文案
- inviteCount 修复：`query-store.ts` userSelectSql 加 `(SELECT COUNT(*) FROM user u2 WHERE u2.invited_by = u.id) AS invite_count` 子查询，`model.ts` 已有字段终于读得到真值
- OpenAPI：`schemas/auth.ts` RegisterPayload 加 `inviteCode`；`paths/commerce.ts` 新增 `/api/invite/records`；`tags.ts` 加 `Invite` tag

**单档语义**：`invite_reward_config` 是单条配置，每邀请 1 人触发一次双向奖励（不是 4 档梯度）。`/invite` 页 4 档（1/3/10/30）只是静态文案展示，schema 不动。`coupon_template.user_limit` 兜底防超额（`claimCouponFromTemplate` 抛"已达领取上限"，外层静默 log）。

**遗留 — 老账号 invite_code 全为 NULL：**

注册路径已生成 invite_code，新账号都有；老账号需运维手工 backfill SQL（仅 `WHERE invite_code IS NULL` UPDATE）。本期不做 lazy gen helper。

**已完成（2026-05-09 多档梯度）：**

- DB：`invite_reward_config` 加 `threshold INT UNSIGNED NOT NULL DEFAULT 1` + `UNIQUE KEY uk_invite_reward_threshold` —— 一档一行（运维 SQL `packages/db/sql/invite_reward_threshold.sql`）。
- 触发：`maybeGrantInviteRewards` 改为 register 提交后 `SELECT COUNT(*) FROM user WHERE invited_by=?` 算 inviter 累计邀请数 N，去 `invite_reward_config WHERE threshold=N AND status=10` 命中即按现逻辑双向发奖；未命中静默跳过（`apps/api/src/modules/invite/store.ts`）。
- Admin API：`/api/admin/invites/config` 单行 GET/PUT 替换为 `/api/admin/invites/rewards` 4 端点（GET list / POST create / PUT/:id update / DELETE/:id）；`createAdminInviteRewardConfig` / `updateAdminInviteRewardConfig` 捕获 `ER_DUP_ENTRY` 翻成 `ADMIN_INVITE_CONFIG_DUP_THRESHOLD` 友好提示。
- Admin 前端：`marketing-invite-page.tsx` 顶部新增「邀请奖励档位」表格（threshold 升序）+ 新增/编辑/删除按钮 + 行点击预览抽屉；`admin-invite-config-modal.tsx` 加 threshold InputNumber；`system-settings-page.tsx` InviteRewardPanel 改为指向「营销 → 邀请管理」的 Alert 提示，整个 Form 删除（避免双源 SOT）。
- OpenAPI：schema `AdminInviteRewardConfigItem` 加 threshold；新增 `AdminInviteRewardConfigListResult` / `CreateAdminInviteRewardConfigPayload` / `AdminInviteRewardConfigItemResult`；paths 替换 `/invites/config` → `/invites/rewards`（list/create）+ `/invites/rewards/{id}` (update/delete)。

**遗留 P2 — `/invite` 页 4 档静态文案**：

`/invite` 页面的 4 档梯度（1/3/10/30 人）当前还是静态展示，没读后端 `fetchAdminInviteRewardConfigs`。如要做到"页面展示档位 = admin 实际配置"动态一致，需要：① 提供一个用户侧 GET `/api/invite/rewards`（仅 active）；② `/invite` 页 fetch 后渲染。本期 admin 已自由配置任意阈值，但 /invite 页仍按设计稿静态展示——可在 admin 配置 1/3/10/30 四档对齐文案。

**遗留 P2 — 注册"已绑定邀请人"反馈态**：

无效 invite 码当前是静默忽略，被邀请人不会被告知"邀请码无效"。如要更明确 UX，后端可在 register 返回 `{ invitedBy: inviterId | null }`，前端注册成功后 toast 区分"已绑定邀请人"vs"邀请码无效"。本期为简化体验直接静默。

---

## 小结

| 优先级 | 数量 | 描述 |
|--------|------|------|
| P0     | 0    | （仓库提货闭环已于 2026-05-06 完成，见 #27）|
| P1     | 0    | （邀请奖励发券 + 闭环已于 2026-05-08 完成，见 #30）|
| P2     | 6    | 商城联名穿插卡二期（#17）/ mall_hero banner 倒计时二期（#18）/ 支付页发票二期（#19）/ #26 SKU 二期（购物车换规格 / 店铺 SKU 调价 / SKU 维度促销 / 评价按规格筛选）/ 好友 PK 邀请伪闭环 + PK 记录混合页 + 删除拉黑缺失（#28）/ /invite 页档位动态化 + 注册"已绑定邀请人"反馈态（#30） |
