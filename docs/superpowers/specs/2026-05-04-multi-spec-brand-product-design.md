# 多规格品牌商品（SKU）设计

**日期**：2026-05-04
**关联**：`CLAUDE.md` #22 / #24 / #25（brand_product 是 SPU、product 是铺货关联、库存 freeze-on-pending）

## 背景

经过 #22 / #24 / #25 三轮 sweep，当前模型是：

- `brand_product` = 平台 SPU（商品标准单位）：name / guide_price / supply_price / guess_price / stock / frozen_stock / default_img / images / description / detail_html / spec_table / package_list / freight / ship_from / delivery_days / tags / collab
- `product` = 店铺铺货关联表（8 列：id / shop_id / brand_product_id / sales / rating / status + ts）
- 库存 freeze-on-pending：可用库存 = `bp.stock - bp.frozen_stock`，createPendingOrder 占用 / markOrderPaid 扣减+解冻 / 超时关单+退款入库归还

但当前模型只能描述「单规格商品」——同一个品牌商品所有规格（颜色 / 尺寸 / 容量）共用一份价格 + 一份库存。运营无法表达「红色 M 码 ¥299 库存 5 件 / 黑色 L 码 ¥329 库存 0 件」这种真实电商场景，下单时也无法告诉履约方"用户买的是哪个规格"。

## 目标

让 `brand_product` 支持多规格：一个 SPU 可以挂 N 个 SKU，每个 SKU 有独立的价格 / 库存 / 主图 / 状态 / 竞猜价。用户端商品详情可以选规格、加购单点选中具体 SKU；订单 / 履约 / 退款 / 仓库链路全部能区分到 SKU 维度。

## 非目标

- 不做「规格组合的虚拟生成」（如运营声明 颜色×尺寸 后自动展开 N×M 行让运营填）以外的更复杂 SKU 树（如二级嵌套规格）。
- 不动 `product` 表结构 — 它仍然是 8 列纯关联表，所有 SKU 维度信息都在 `brand_product` / `brand_product_sku` 上。
- 不引入"店铺自定义规格"。所有 SKU 由 admin 在 `brand_product` 上声明，店铺铺货时整批继承（铺货 = `(shop_id, brand_product_id)`，自动覆盖全部 SKU，不做"店铺只上架部分 SKU"）。如二期需要再加 `shop_product_sku_status`。
- 不做"按 SKU 调价"（店铺端定价）。当前架构 store 没有定价能力，二期再说。

## 设计

### 1. Schema

#### 新增表 `brand_product_sku`

```
id                bigint  PK auto_inc
brand_product_id  bigint  NOT NULL  MUL                 -- 关联 SPU
sku_code          varchar(64)  NULL                     -- 运营自填的对外 SKU 码（如 "IP15-RED-128G"），可留空
spec_json         json         NOT NULL                 -- {"颜色":"红","尺寸":"M"}；单规格商品写 {}
spec_signature    varchar(255) NOT NULL                 -- 应用层算的 spec_json key=value 排序拼接，UNIQUE 用
guide_price       bigint       NOT NULL                 -- 吊牌价，单位分；运营每个 SKU 必填
supply_price      bigint       NULL                     -- 供货价（不参与展示），可空
guess_price       bigint       NULL                     -- 竞猜价；NULL 时 fallback 到 sku 自己的 guide_price
stock             int          NOT NULL DEFAULT 0
frozen_stock      int          NOT NULL DEFAULT 0
image             varchar(191) NULL                     -- SKU 主图，留空则取 SPU default_img
status            tinyint unsigned NOT NULL DEFAULT 10  -- 10=active 90=disabled
sort              int          NOT NULL DEFAULT 0
created_at / updated_at

UNIQUE KEY uk_bp_spec (brand_product_id, spec_signature)
```

> `spec_signature`：MySQL 不能直接对 JSON 列做唯一，所以加一个普通 varchar 列由应用层 normalize 时拼好（按 spec_json 的 key 字典序排序后拼成 `颜色=红;尺寸=M`，单规格商品写空串）。

#### `brand_product` schema 调整

- **新增**：`spec_definitions json NULL` — 声明该 SPU 的规格维度，结构 `[{"name":"颜色","values":["红","黑"]},{"name":"尺寸","values":["S","M","L"]}]`。NULL = 单规格商品（仍需建一条 `spec_json={}` 的 default sku）。
- **DROP**：`guide_price / supply_price / guess_price / stock / frozen_stock` 五列。所有价格 / 库存语义下沉到 `brand_product_sku`。
- 保留：`default_img / images / description / tags / collab / video_url / detail_html / spec_table / package_list / freight / ship_from / delivery_days`（商品共享属性，不按 SKU 区分）。

#### 价格策略

**SKU 价格 NOT NULL，没有 SPU fallback**。运营每个 SKU 必填 `guide_price`。例外：`guess_price` 仍可 NULL，NULL 时 fallback 到 SKU 自己的 `guide_price`（与 #25 的 `COALESCE(guess_price, guide_price)` 语义一致），多数 SKU 不必单独维护竞猜价。

### 2. order_item / cart_item / fulfillment_order_item / product_review / consign_trade / virtual_warehouse / physical_warehouse / warehouse_item_log / guess_bet / guess_product 加 sku_id

不考虑历史数据，所有列直接 NOT NULL（写入路径同步改完）：

- `cart_item`、`order_item`、`fulfillment_order_item`、`guess_bet`、`guess_product`：`brand_product_sku_id bigint NOT NULL MUL`。
- `product_review`：`brand_product_sku_id bigint NOT NULL MUL`（评价归 SKU 维度）。
- `consign_trade`、`virtual_warehouse`、`physical_warehouse`：`brand_product_sku_id bigint NOT NULL MUL`。
- `warehouse_item_log`：`brand_product_sku_id bigint NULL MUL`（日志列保持可空，方便记非 SKU 相关操作）。

`cart_item.specs` 这个旧 varchar 列保留作为 UI 文案缓存（"红色 / M 码"），真实判断走 `brand_product_sku_id`。

**购物车合并键**：现在是 `(user_id, product_id)`，改为 `(user_id, product_id, brand_product_sku_id)` UNIQUE。

**guess_product 唯一约束**：`(guess_id)` UNIQUE——一个竞猜只能关联一个商品 + 一个 SKU。`option_idx` 列保留但恒为 0，不参与唯一键。

### 3. 库存占用模式（freeze-on-pending）从 brand_product 改到 sku 层

#25 的 `UPDATE brand_product SET frozen_stock = frozen_stock + n WHERE id=? AND (stock - frozen_stock) >= n` 这条核心 SQL 全部改成 `UPDATE brand_product_sku SET ...`，按 sku_id 锁。其它路径同样改：

- createPendingOrder：`UPDATE brand_product_sku SET frozen_stock += n WHERE id=? AND (stock - frozen_stock) >= n`，affectedRows=0 抛 `PRODUCT_STOCK_NOT_ENOUGH`。
- markOrderPaid：`UPDATE brand_product_sku bps INNER JOIN order_item oi ON oi.brand_product_sku_id=bps.id SET bps.stock=stock-oi.quantity, bps.frozen_stock=frozen_stock-oi.quantity WHERE oi.order_id=?`。
- 超时关单：`releaseOrderFrozenStock` 改成 `UPDATE brand_product_sku ... SET frozen_stock -= oi.quantity`。
- 退款入库（`completeAdminOrderRefund`）：`UPDATE brand_product_sku ... SET stock += oi.quantity`。

### 4. 单规格 / 多规格语义

`brand_product.spec_definitions` 决定渲染分支：

- **单规格商品**：`spec_definitions=NULL`，admin 创建时系统自动建 1 条 `spec_json={}` 的 default sku（`spec_signature=''`）。前端商品详情不渲染规格选择器，加购 / 创建竞猜自动落到 default sku。
- **多规格商品**：`spec_definitions=[...]`，admin 创建时按 N×M 网格建多条 sku。前端渲染规格选择器，**必须选完才能加购 / 关联竞猜**。

读取层（getProductById / cart / order_item join）的"价格 / 库存来源"统一从 `bp` 切到 `bps`：`bp.guide_price` → `bps.guide_price`，`bp.stock - bp.frozen_stock` → `bps.stock - bps.frozen_stock`。

#### 价格区间渲染

- 列表卡片（首页 / 搜索 / 店铺 / admin 列表）：取 `bps.status=10` 的 SKU 算
  - 只有 1 条 active SKU：显示单价 `¥X`
  - 多条 active SKU 价相等：显示单价
  - 多条 active SKU 价不等：显示区间 `¥X - ¥Y`（`MIN/MAX(bps.guide_price)`）
  - 全部 SKU disabled：商品本身视为下架，不展示
- 详情页未选规格时：同列表规则；选满某 SKU 后：切到该 SKU 单价

#### 库存可售性

- 列表卡片：`SUM(bps.stock - bps.frozen_stock) WHERE status=10 > 0` per brand_product
- 详情页选满 SKU 后：仅看该 SKU 的 `stock - frozen_stock`

#### 排序 / 过滤规则（搜索 / 列表）

- 价格升序：`ORDER BY MIN(bps.guide_price) WHERE bps.status=10`
- 价格区间过滤（`?priceMin=X&priceMax=Y`）：**任一 active SKU 价格落在区间内**即匹配（`EXISTS (SELECT 1 FROM brand_product_sku WHERE bp_id=bp.id AND status=10 AND guide_price BETWEEN ? AND ?)`）
- 销量排序：仍走 `product.sales`（铺货层维度，不下沉）

### 5. 用户端 UX

#### 商品详情（`apps/web/src/app/product/[id]/page.tsx` 与 detail 子组件）

- 加规格选择器组件：按 `spec_definitions` 渲染 N 行，每行一组 chips（`颜色：红 / 黑`、`尺寸：S / M / L`）。
- 用户选满后命中具体 SKU：前端拿全 SKU 列表（嵌在 product detail response 里，不另开端点），按 spec 组合查找。
- 选满前：价格显示区间；选满后：切到该 SKU 价格 / 库存。
- **画廊主图**：默认 SPU `default_img + images` 全相册；选满 SKU 后**首图替换为 `sku.image`（fallback `bp.default_img`）**，其它图保留。
- 没库存的 SKU 选项 chip 置灰但仍可点（让用户看到组合存在），点完显示"已售罄"按钮。
- 加购 / 立即购买按钮在 `spec_definitions !== null` 时 **必须选满才能点**；单规格商品按现有流程，自动落 default sku。

#### 购物车（`apps/web/src/app/cart/page.tsx`）

- 同一商品不同 SKU 显示成两行（合并键已改 `+ sku_id`）。
- 每行展示 `sku.spec_json` 翻译后的文案（"红色 / M 码"）。
- "修改规格"按钮二期再做（点开规格选择器换 sku_id 重新合并），本期只展示。

#### 订单 / 履约 / 评价

- 订单列表 / 详情展示 `order_item.specs`（来自 sku.spec_json 序列化）+ `sku.image` 兜底回 SPU `default_img`。
- 评价表单写到 SKU 维度（`product_review.brand_product_sku_id`）。
- 商品详情评价 tab：**默认显示 SPU 全量评价**（所有 SKU 评价混合渲染，每条评价上展示用户购买的规格 "红色 / M 码"），平均分 / 总数按 SPU 聚合。tab 顶部加"按规格筛选"下拉，用户主动选才过滤到具体 SKU。

### 6. Admin UX

#### 「品牌商品库」编辑/新增弹层

在 `admin-brand-library-form-modal.tsx` 末尾新增「规格 & SKU」段（详情段之后，状态之前）：

- **顶部 toggle「多规格」**：开 / 关
  - 关：`spec_definitions=NULL`，仅渲染一行"价格 / 库存 / SKU 主图"输入；写入时构造 default sku（`spec_json={}, spec_signature=''`）。
  - 开：渲染规格定义段 + SKU 表。
- **规格定义**：N 行 `[规格名][规格值（多 tag）]` 输入控件，可增删行。声明完后点"生成 SKU 表"按钮。
- **SKU 表**：N×M 网格，每行字段：`spec_json 摘要文案（只读）/ sku_code / guide_price / supply_price / guess_price / stock / image / status / sort`。
- 提交时前端校验：每个 SKU `guide_price > 0`、`stock >= 0`，spec 组合在表内唯一。
- **编辑模式 SKU 删除**：admin 在 SKU 表里点删除时
  - 后端不物理删，统一软删 `status=90`（disabled）；保留行让历史 cart_item / order_item / 仓库 / 评价的 sku_id 引用不 dangling。
  - admin UI 上软删的 SKU 默认隐藏，可通过"显示已禁用"toggle 看到，点"恢复"改回 `status=10`。
- **单 ↔ 多切换（编辑模式 toggle）**：保存时按提交的状态写入；切换会让原有 SKU 价格 / 库存配置丢失（运营自己重填），不做"保留旧 default sku"的兜底——**操作前 admin UI 显示二次确认**「切换会清空当前 SKU 配置，确认继续？」

#### 「店铺商品列表」/「品牌商品列表」

- admin 列表页"价格"列：显示价格区间（`¥299 - ¥329`，单一时显示 `¥299`），来自 `MIN/MAX(bps.guide_price)`。
- 库存列：显示总可售（`SUM(bps.stock - bps.frozen_stock)`）。
- 详情抽屉新增"SKU 列表"段：每行展示规格 / 价格 / 库存 / 状态。

### 7. 竞猜关联商品选到 SKU 维度（关键）

**业务诉求**：创建竞猜时关联的奖品是「店铺铺货 × 具体 SKU」，例如同一店铺里"iPhone 15 红色 128G"和"iPhone 15 黑色 256G"是两个独立的奖品，奖池金额、扣费、寄出物品都按 SKU 维度区分。

#### 数据模型

`guess_product` 列含义：
- `product_id`：店铺铺货 id（决定奖品由哪家店铺发出 + 关联 SPU）
- `brand_product_sku_id`：奖品的具体规格（决定价格 / 库存 / 主图 / 履约时寄哪一个）
- `(guess_id, option_idx, product_id, brand_product_sku_id)` 上加 UNIQUE（一个选项下同一店铺的同一 SKU 只能挂一条；不同店铺或不同 SKU 算不同关联）

#### 创建竞猜（admin / 用户）

**用户端创建竞猜**（`apps/web/src/app/create/...` + `guess/guess-create.ts`）：
- 「关联商品」picker 改两步选择：
  1. 选店铺商品（`product` 行，复用现有商品选择器）
  2. 命中后，如果对应 SPU 的 `spec_definitions !== null`，弹出 SKU 选择器（按规格定义渲染 chips，必须选满才能确认）；如果是单规格商品，直接落到 default sku，不弹。
- 提交 payload 加 `skuId`，写入 `guess_product.brand_product_sku_id`。

**admin 创建竞猜**（`admin/guess-management.ts` + `apps/admin/src/pages/guesses-page.tsx`）：
- 同上，关联商品的弹层补 SKU 选择段。
- 列表 / 详情列展示 `奖品：iPhone 15 / 红色 128G ¥5999`（拼 sku.spec_json 摘要）。

#### 下注扣费（guess-pay）

`guess-pay.ts` 取竞猜价的 SQL 改为 `COALESCE(bps.guess_price, bps.guide_price) AS product_price`，join 链路 `guess_product gp INNER JOIN brand_product_sku bps ON bps.id=gp.brand_product_sku_id`，不再走 `bp` 兜底。

#### 中奖发货 / 仓库

竞猜中奖后入虚拟仓 / 实体仓的 SQL（`warehouse/warehouse-user.ts` 中奖入库逻辑）写入 `virtual_warehouse.brand_product_sku_id` / `physical_warehouse.brand_product_sku_id`，履约时按 SKU 寄。

**中奖入仓不扣 `brand_product_sku.stock`**：中奖发的是虚拟物品（用户后续可提货 / 寄售），售卖库存与中奖物品库存独立，由运营从备货池里出货。`bps.stock` 仅在用户**真实下单购买**链路被占用 / 扣减（createPendingOrder / markOrderPaid / 退款入库）。

### 8. 退款 / 仓库链路

- `completeAdminOrderRefund` 入库 SQL 加一个 `oi.brand_product_sku_id` 上的 join，按 sku 维度回 stock。
- 寄售上架（`physical_warehouse`）必须带 `brand_product_sku_id`，admin 后台寄售单展示"红色 M 码 ¥299"。
- 仓库日志 `warehouse_item_log.brand_product_sku_id` nullable，写入时带，方便审计。

### 9. DB 变更（无历史数据迁移）

不考虑历史数据，所有现存 `brand_product / cart_item / order_item / 仓库 / 评价 / 竞猜` 行允许在 schema 切换时被截断（运维上线前 TRUNCATE 这几张表，或在测试环境切换）。SQL 一次性变更，单文件 `packages/db/sql/multi_spec_schema.sql`：

1. 新建 `brand_product_sku` 表（含 spec_signature + UNIQUE KEY）。
2. `ALTER TABLE brand_product ADD COLUMN spec_definitions json NULL, DROP COLUMN guide_price, DROP COLUMN supply_price, DROP COLUMN guess_price, DROP COLUMN stock, DROP COLUMN frozen_stock`。
3. 9 张表加 `brand_product_sku_id`：
   - `cart_item / order_item / fulfillment_order_item / product_review / consign_trade / virtual_warehouse / physical_warehouse / guess_bet / guess_product` 列 NOT NULL
   - `warehouse_item_log` 列 NULL
4. `cart_item` UNIQUE `(user_id, product_id, brand_product_sku_id)`（如老 `(user_id, product_id)` 唯一在则先 DROP）。
5. `guess_product` UNIQUE `(guess_id)`（如老唯一在则先 DROP）。语义：一个竞猜只能关联一个商品 + 一个 SKU。

由运维手工执行（与 `drop_pk_record.sql` / `drop_coin_ledger.sql` 同流程）。代码 + schema 一起发布即可，没有"先 nullable 再 NOT NULL"的两段切换。

### 10. 影响文件清单（参照 #25 的范围 + 增量）

#### 后端（`apps/api/src/modules/`）

商品流：
- `product/product-shared.ts` - getProductById SELECT 加 SKU 子查询；ProductRow 加 sku 数组字段；price/stock 兜底从 SKU 算
- `product/product-feed.ts` - 列表卡片 SELECT 加 `(SELECT MIN(guide_price) FROM brand_product_sku WHERE brand_product_id=bp.id) AS min_price` 等聚合
- `product/product-detail.ts` - 详情 response 加 `skus` + `specDefinitions` 字段

搜索：
- `search/search-products.ts`、`search/search-shared.ts`、`search/search-guesses.ts` - 价格/库存改聚合

购物车：
- `cart/store.ts` - addCartItem/updateCartItem 入参加 `skuId`；唯一键改 `(user_id, product_id, sku_id)`；库存 cap 用 `bps.stock - bps.frozen_stock`

订单：
- `order/order-write.ts` - getProductPurchaseRows / getCartPurchaseRows 加 sku_id 字段；条件 UPDATE 切到 `brand_product_sku`
- `order/order-shared.ts` - ProductPurchaseRow 加 sku_id / sku_stock / sku_frozen_stock
- `order/order-pay.ts` - markOrderPaid SQL join 改 sku 维度；queryOrderPayStatus 超时路径调 `releaseOrderFrozenStock`

竞猜：
- `guess/guess-shared.ts`、`guess/guess-pay.ts`、`guess/guess-create.ts`：guess_bet / guess_product 加 sku_id；guess-pay join `brand_product_sku` 取 `COALESCE(bps.guess_price, bps.guide_price)`；guess-create 入参加 `skuId`，写入 guess_product
- `admin/guesses-shared.ts`、`admin/guess-management.ts`：admin 创建/编辑竞猜的关联商品 picker 加 SKU 选择段；列表 / 详情展示 SKU spec 摘要
- 用户端 `apps/web/src/app/create/...`：关联商品选完后弹 SKU 选择层（多规格商品强制选满）
- Admin 前端 `apps/admin/src/pages/guesses-page.tsx` + 关联组件：商品 picker 改两步选

Admin 商品：
- `admin/products-inventory.ts`、`admin/products-shared.ts`：低库存判断改 `SUM(bps.stock - bps.frozen_stock)`
- `admin/products-brand-library.ts`：CRUD 加 SKU 子表读写；`getAdminBrandLibrary` left join `brand_product_sku` 聚合
- `admin/merchant-shops.ts`、`admin/merchant-shared.ts`：店铺商品列表价格 / 库存改聚合
- `admin/users.ts`、`admin/dashboard.ts`：库存类指标改聚合

店铺：
- `shop/shop-public.ts`：店铺主页商品卡片价格 / 库存改聚合
- `shop/shop-my.ts`：my-shop 商品列表 + hero 在售数改聚合

仓库：
- `warehouse/warehouse-user.ts`、`warehouse/warehouse-admin.ts`：实体仓 / 虚拟仓物品加 sku_id

退款：
- `admin/order-refund.ts`（实际是 `admin/orders-shared.ts` 中 `completeAdminOrderRefund`）：UPDATE 加 sku join

Banner：
- `banner/router.ts`：banner 关联商品时只取 SPU，价格仍按聚合算

#### Shared

- `packages/shared/src/api-admin-merchant.ts`：CreateAdminBrandProductPayload / UpdateAdminBrandProductPayload 加 `specDefinitions: SpecDefinition[] | null` + `skus: BrandProductSkuPayload[]`
- `packages/shared/src/domain.ts`：Product 加 `skus?: ProductSku[]` + `specDefinitions?: SpecDefinition[] | null`
- `packages/shared/src/api-user-commerce.ts`：CartAddPayload / OrderCreatePayload 加 `skuId`
- `packages/shared/src/status.ts`：brand_product_sku.status 编码加进 `productStatuses`

#### OpenAPI

- `apps/api/src/routes/openapi/schemas/admin.ts`：相关 payload + response schema 全部加 sku 字段
- `apps/api/src/routes/openapi/schemas/common.ts`：ProductDetail / CartItem / OrderItem 加 sku 字段

#### Admin 前端（`apps/admin/src/`）

- `lib/api/catalog-shared.ts`：AdminBrandLibraryItem 加 `specDefinitions` + `skus`
- `lib/admin-brand-library.tsx`：FormValues + buildEditBrandProductFormValues + columns 加 SKU 段
- `components/admin-brand-library-form-modal.tsx`：加规格定义段 + SKU 表单（核心 UI 改造）
- `components/admin-brand-library-detail-drawer.tsx`：详情加 SKU 列表
- `pages/brand-library-page.tsx`：payload map 加 specDefinitions / skus

#### 用户端（`apps/web/src/`）

- `app/product/[id]/page.tsx` + 相关 detail 子组件：加规格选择器
- `app/cart/page.tsx`：每行展示 sku spec 文案
- `app/orders/page.tsx`：订单 item 展示 spec
- `app/me/reviews/...`：评价表单写 sku_id
- `app/warehouse/page.tsx`：仓库物品展示 sku spec
- `lib/api/cart.ts`、`lib/api/order.ts`：addCart / createOrder 入参加 skuId

### 11. 测试 / 验证

1. admin 新建多规格商品（颜色×尺寸 = 4 个 SKU），保存后从详情抽屉看 SKU 列表正确。
2. admin 新建单规格商品（toggle 关）只填一份价格 / 库存 → DB 存一条 `spec_json={}` 的 default sku。
3. 用户端商品详情：单规格不显示规格选择器；多规格必须选满才能加购；选满后切换价格 / 主图（`sku.image` fallback `default_img`）/ 库存。
4. 购物车合并：同商品不同 SKU 加两次 → 购物车两行；同 SKU 加两次 → 数量累加。
5. 下单 → 库存：仅该 SKU `frozen_stock` 被占用；超时关单后归还；其它 SKU 不受影响。
6. 退款入库：admin 完结退款，仅该 SKU `stock` 加回。
7. 仓库 / 寄售：寄售上架带 sku_id，仓库列表展示规格信息。
8. 竞猜关联：关联多规格商品 → 弹 SKU 选择 → 选完写入 `guess_product.brand_product_sku_id`；下注扣费按 `COALESCE(bps.guess_price, bps.guide_price)`；中奖入仓 sku_id 正确，`bps.stock` 不变。
9. 单规格商品创建竞猜：直接落 default sku，无 SKU 选择层。
10. SKU 软删：admin 表里删 SKU → DB 写 `status=90`；该 SKU 历史 cart/order 行还在；前端列表过滤掉。
11. 单 ↔ 多规格切换：开 toggle → 二次确认弹层 → 确认后清空 SKU 表重填。
12. 价格区间：列表卡片只有 1 个 active SKU 时显示单价；多个时显示 `¥X - ¥Y`；全 SKU disabled 时商品不展示。
13. 评价 tab：默认 SPU 全量评价混合 + 评价上展示规格；下拉筛选某 SKU 后只显示该规格评价。
14. `pnpm typecheck` 通过。

## 部署顺序

不考虑历史数据，可一次性发布：

1. 运维执行 `multi_spec_schema.sql`（建表 + 加列 + 加约束 + DROP 老列）。
2. 同一窗口合并 + 发布代码 PR：API（modules sweep）+ shared types + OpenAPI + admin 前端 + 用户端。
3. 上线后冒烟：admin 创建一个多规格商品 + 一个单规格商品，用户端走完"加购→下单→支付→退款"全链路。

实施时如果改动太大，可以拆 PR：
- PR1：DB schema + API（modules sweep）+ shared + OpenAPI（端到端通顺，admin 老 UI 仍能工作单规格商品）
- PR2：admin 「品牌商品库」多规格 UI（toggle + SKU 表）
- PR3：用户端规格选择器 + 购物车 / 订单 / 仓库 SKU 文案 + 创建竞猜 SKU 选择层

## 风险 / 遗留

- **店铺铺货层无 SKU 维度上下架**：当前店铺不能"只上架部分 SKU"，整商品上架就全 SKU 上架。如运营反馈需要再加 `shop_product_sku_status` 表。
- **markOrderPaid 严格防超扣（2026-05-04 已收紧）**：事务内 SELECT brand_product_sku FOR UPDATE 锁住相关 SKU；UPDATE 加 `AND bps.stock >= oi.quantity` 双保险；affectedRows < 期望值则抛错回滚。
- **product 表 sales / rating 仍是店铺铺货维度**：不下沉到 SKU。SKU 维度销量统计在评价 / 订单 join 时聚合。
- **二期**：购物车换规格按钮、店铺端 SKU 调价、SKU 维度促销 / 满减、按规格搜索过滤。
- **一竞猜一商品一 SKU（2026-05-04 已收紧）**：`guess_product` UNIQUE `(guess_id)`，`option_idx` 恒为 0。要支持"每个选项挂不同奖品"需重做 UNIQUE + 创建竞猜 UI。
