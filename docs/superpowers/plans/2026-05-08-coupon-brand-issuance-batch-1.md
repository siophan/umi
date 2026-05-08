# 品牌发券改造 批次 1：基建 + 签到发券 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `coupon_template` 从店铺维度切到品牌维度（drop shop_id / add brand_id + brand_product_ids），所有可领券 / 可用券 / 抵扣链路全部按品牌走，并把签到 `performCheckin` 接通 `claimCouponFromTemplate` 让 #29 P1 关闭。

**Architecture:** 单库单服务 monorepo（apps/api + apps/admin + apps/web + packages/shared）。改造跨 5 个模块：admin/coupons / coupon / cart / order / checkin。已发出 coupon 行做语义快照（snapshot 3 列：`scope_type / brand_id / brand_product_ids`）冻结，让模板后续变动不影响历史券。批次 2（邀请闭环 + 邀请发券）等批次 1 落地后另起 plan。

**Tech Stack:** TypeScript / Express / mysql2 / Next.js / Antd / Ant Design Pro 风（admin）；DB MySQL 8（JSON_CONTAINS 可用）。

> **CLAUDE.md 约束**：不本地起服务、不跑 typecheck / pnpm typecheck、不 tail 日志。每个 task 完成即 commit，由用户在本地 IDE / CI 验证 typecheck + 跑通；调试运行时错误纯靠读代码。
>
> **mysql2 LIMIT 占位符约定**：LIMIT/OFFSET 是 `?` 时一律 `db.query`，不要 `db.execute`；具体见 CLAUDE.md。

---

## 文件结构

新建：

- `packages/db/sql/coupon_brand_refactor.sql` — DB migration（手工执行）

修改：

- `packages/shared/src/api-admin-ops.ts` — admin 类型 scopeType union + 加 brand 字段 / payload 加 brandId / brandProductIds
- `packages/shared/src/api-user-commerce.ts` — `CouponTemplateItem.scopeType` union 改 `'platform' | 'brand'` + 加 brand 字段
- `apps/api/src/modules/admin/coupons-shared.ts` — SCOPE_BRAND 常量 / normalize / sanitize / 新增 brand 校验 helper
- `apps/api/src/modules/admin/coupon-templates.ts` — CRUD SELECT/INSERT/UPDATE 切换字段
- `apps/api/src/modules/admin/coupon-grant-batches.ts` — coupon INSERT 加快照 3 列
- `apps/api/src/modules/coupon/store.ts` — listClaimableCouponTemplates 改签名 + claimCouponFromTemplate INSERT 加快照 3 列
- `apps/api/src/modules/coupon/router.ts` — query parse 接 brandId / brandProductId
- `apps/api/src/modules/order/order-write.ts` — getAvailableCoupon 改 brand 抵扣
- `apps/api/src/modules/cart/store.ts` — 用券候选筛选改 brand 集合
- `apps/api/src/modules/checkin/store.ts` — performCheckin commit 后调发券
- `apps/api/src/routes/openapi/schemas/admin.ts` — scopeType enum 改 + brand 字段
- `apps/api/src/routes/openapi/schemas/common.ts`（如有相关 schema）
- `apps/admin/src/lib/admin-coupon.ts` — SCOPE_OPTIONS 切 brand / FormValues 加 brandId+brandProductIds
- `apps/admin/src/lib/admin-coupon-page.tsx` — 列表「适用范围」列显示 brand
- `apps/admin/src/lib/admin-coupon-page-state.ts` — 表单提交映射加 brand 字段
- `apps/admin/src/components/admin-coupon-form-modal.tsx` — 表单加 brand select + brand_product 多选控件
- `apps/admin/src/components/admin-coupon-detail-drawer.tsx` — 详情抽屉显示 brand
- `apps/admin/src/lib/api/catalog-shared.ts`（或 admin-brands.ts，按现状） — 提供 brand list / brand_product list 拉取（如缺）
- `apps/web/src/lib/api/coupons.ts` — fetchCouponTemplates 改签名
- `apps/web/src/app/coupons/center/page.tsx` — query 改 brandId
- `apps/web/src/app/product/[id]/page.tsx` — 商品详情可领券入口跳 `/coupons/center?brandId=...&brandProductId=...`
- `docs/full-schema.md` / `docs/status-codes.md` / `CLAUDE.md` — 文档收尾

---

## 全局风险点速览

1. **`scope_type=20` 编码语义改**：旧 = `shop`，新 = `brand`。spec § 6.1 step 1 假设运维清空旧测试数据；DB 中如果残留 `scope_type=20` 的 shop 模板，迁移后语义会错位。Task 1 SQL 包含 `DELETE WHERE scope_type=20`（清掉所有旧 shop 模板）作为兜底，避免代码切换后误读。
2. **`coupon` 表 INSERT 有两处**：`coupon/store.ts:357`（用户领券）+ `admin/coupon-grant-batches.ts:188`（admin 批量发券）。两处都要加快照 3 列，否则 admin 批量发出的券无 brand_id。
3. **Admin OpenAPI schemas/admin.ts** 三个位置（line 1990 / 2117 / 2170）都有 `enum: ['platform', 'shop']`，要全部改 `['platform', 'brand']`。
4. **brand_product_ids JSON 列**：MySQL 5.7+ 支持 `JSON_CONTAINS`；不需 generated column。
5. **claimCouponFromTemplate INSERT 字段顺序**：spec 中加的 3 列要插入到 INSERT 列声明 + VALUES 占位符 + values 数组三处都对齐。

---

## Task 1：执行 SQL migration

**Files:**
- Create: `packages/db/sql/coupon_brand_refactor.sql`

- [ ] **Step 1：写 migration SQL**

```sql
-- 品牌发券改造 批次 1
-- 改造目标：coupon_template 从店铺维度切到品牌维度
--
-- 不向前兼容：scope_type=20 编码从 shop 改为 brand。
-- 上线前提条件：运维已清空旧测试数据，本脚本兜底 DELETE 旧 shop 模板。
--
-- 步骤：
-- 1. 兜底清掉旧 shop 模板（scope_type=20 在旧语义=shop）
-- 2. coupon_template DROP shop_id，ADD brand_id + brand_product_ids
-- 3. coupon ADD scope_type / brand_id / brand_product_ids 快照三列

-- 1) 兜底清旧 shop 模板（防止 scope_type=20 残留行被新代码当做 brand 误读）
DELETE FROM coupon WHERE template_id IN (SELECT id FROM coupon_template WHERE scope_type = 20);
DELETE FROM coupon_grant_batch WHERE template_id IN (SELECT id FROM coupon_template WHERE scope_type = 20);
DELETE FROM coupon_template WHERE scope_type = 20;

-- 2) coupon_template
ALTER TABLE `coupon_template`
  DROP COLUMN `shop_id`,
  ADD COLUMN `brand_id` BIGINT NULL COMMENT '品牌 ID（scope_type=20 时必填）' AFTER `scope_type`,
  ADD COLUMN `brand_product_ids` JSON NULL COMMENT '范围限定 SPU id 列表；NULL=该品牌全量' AFTER `brand_id`,
  ADD INDEX `idx_coupon_template_brand` (`brand_id`);

-- 3) coupon 已发券快照表
ALTER TABLE `coupon`
  ADD COLUMN `scope_type` TINYINT UNSIGNED NOT NULL DEFAULT 10 COMMENT '范围类型快照' AFTER `template_id`,
  ADD COLUMN `brand_id` BIGINT NULL COMMENT '品牌 ID 快照' AFTER `scope_type`,
  ADD COLUMN `brand_product_ids` JSON NULL COMMENT '范围限定 SPU 快照' AFTER `brand_id`,
  ADD INDEX `idx_coupon_brand` (`brand_id`);
```

- [ ] **Step 2：commit**

```bash
git add packages/db/sql/coupon_brand_refactor.sql
git commit -m "feat(db): coupon brand refactor migration sql (manual run)"
```

> 这一步不真跑 SQL；写 spec 同时约定运维同窗口部署期间手工执行。

---

## Task 2：shared types 改 scope union + 加 brand 字段

**Files:**
- Modify: `packages/shared/src/api-admin-ops.ts`
- Modify: `packages/shared/src/api-user-commerce.ts`

- [ ] **Step 1：admin scope union + AdminCouponTemplateItem 加 brand 字段**

`packages/shared/src/api-admin-ops.ts:236` 改 union：

```ts
export type AdminCouponTemplateScopeType = 'platform' | 'brand';
```

同文件 `AdminCouponTemplateItem`（line 261-294）改 scopeType 相关 + 加 brand 字段：

```ts
export interface AdminCouponTemplateItem {
  id: EntityId;
  code: string;
  name: string;
  type: AdminCouponTemplateType;
  typeLabel: '满减券' | '折扣券' | '运费券';
  rawStatus: AdminCouponTemplateRawStatus;
  status: AdminCouponTemplateDisplayStatus;
  statusLabel: '启用' | '待开始' | '已暂停' | '已停用' | '已结束';
  scopeType: AdminCouponTemplateScopeType;
  scopeTypeLabel: '平台通用' | '指定品牌';
  brandId: EntityId | null;
  brandName: string | null;
  brandProductIds: EntityId[] | null;
  brandProductCount: number;
  description: string | null;
  sourceType: AdminCouponSourceType;
  sourceTypeLabel: '后台人工' | '活动发放' | '补偿发放' | '系统发放';
  minAmount: number;
  discountAmount: number;
  discountRate: number | null;
  maxDiscountAmount: number;
  validityType: AdminCouponTemplateValidityType;
  validityTypeLabel: '固定时间段' | '领取后 N 天';
  startAt: string | null;
  endAt: string | null;
  validDays: number;
  totalQuantity: number;
  userLimit: number;
  grantedCount: number;
  remainingQuantity: number | null;
  batchCount: number;
  lastBatchAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

> 删除 `shopId / shopName` 字段。

- [ ] **Step 2：CreateAdminCouponTemplatePayload + Update 同步**

`api-admin-ops.ts:329` `CreateAdminCouponTemplatePayload`：

```ts
export interface CreateAdminCouponTemplatePayload {
  name: string;
  type: AdminCouponTemplateType;
  scopeType: AdminCouponTemplateScopeType;
  brandId?: EntityId | null;
  brandProductIds?: EntityId[] | null;
  description?: string | null;
  minAmount: number;
  discountAmount?: number;
  discountRate?: number;
  maxDiscountAmount?: number;
  validityType: AdminCouponTemplateValidityType;
  startAt?: string | null;
  endAt?: string | null;
  validDays?: number;
  totalQuantity: number;
  userLimit: number;
  status?: AdminCouponTemplateRawStatus;
}
```

同样改 `UpdateAdminCouponTemplatePayload`（line 352）：把 `shopId` 替换为 `brandId / brandProductIds` 同样字段。

- [ ] **Step 3：用户端 CouponTemplateItem 改 union + 加 brand 字段**

`packages/shared/src/api-user-commerce.ts:320` `CouponTemplateItem.scopeType` 改：

```ts
scopeType: 'platform' | 'brand';
brandId: string | null;
brandProductIds: string[] | null;
```

> 删除原 `'category'` 选项（dead code）。删除 `shopId` 字段。

- [ ] **Step 4：commit**

```bash
git add packages/shared/src/api-admin-ops.ts packages/shared/src/api-user-commerce.ts
git commit -m "refactor(shared): coupon scopeType platform|brand + brand_product_ids"
```

---

## Task 3：admin/coupons-shared.ts 常量 + normalize + sanitize 改造

**Files:**
- Modify: `apps/api/src/modules/admin/coupons-shared.ts`

- [ ] **Step 1：常量改名 + 加 brand 校验 helper**

文件顶部：

```ts
export const COUPON_SCOPE_PLATFORM = 10;
export const COUPON_SCOPE_BRAND = 20;  // 重用编码（drop SHOP）
```

文件末尾（在 `assertShopExists` 位置替换）：

```ts
// 替换原 assertShopExists
export async function assertBrandExists(connection: mysql.PoolConnection, brandId: string) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    'SELECT id, status FROM brand WHERE id = ? LIMIT 1',
    [brandId],
  );
  const row = (rows as Array<{ id?: number | string; status?: number | string }>)[0];
  if (!row) {
    throw new HttpError(404, 'ADMIN_COUPON_BRAND_NOT_FOUND', '指定品牌不存在');
  }
  if (Number(row.status ?? 0) !== 10) {
    throw new HttpError(400, 'ADMIN_COUPON_BRAND_INACTIVE', '品牌已停用');
  }
}

export async function assertBrandProductsBelongToBrand(
  connection: mysql.PoolConnection,
  brandId: string,
  brandProductIds: string[],
) {
  if (brandProductIds.length === 0) return;
  const placeholders = brandProductIds.map(() => '?').join(',');
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT id, brand_id, status FROM brand_product WHERE id IN (${placeholders})`,
    brandProductIds,
  );
  if ((rows as Array<unknown>).length !== brandProductIds.length) {
    throw new HttpError(400, 'ADMIN_COUPON_BRAND_PRODUCT_NOT_FOUND', '部分商品不存在');
  }
  for (const row of rows as Array<{ brand_id: number | string; status: number | string }>) {
    if (String(row.brand_id) !== String(brandId)) {
      throw new HttpError(400, 'ADMIN_COUPON_BRAND_PRODUCT_MISMATCH', '商品与所选品牌不一致');
    }
    if (Number(row.status) !== 10) {
      throw new HttpError(400, 'ADMIN_COUPON_BRAND_PRODUCT_INACTIVE', '所选商品已下架');
    }
  }
}
```

- [ ] **Step 2：CouponTemplateRow 字段切换**

`CouponTemplateRow` 类型（line 45-71）：删 `shop_id / shop_name`，加：

```ts
brand_id: number | string | null;
brand_name: string | null;
brand_product_ids: unknown;  // JSON
```

- [ ] **Step 3：mapCouponScopeType / mapCouponScopeTypeLabel 改 brand**

```ts
function mapCouponScopeType(
  scopeType: number | string | null | undefined,
): AdminCouponTemplateItem['scopeType'] {
  return toNumber(scopeType) === COUPON_SCOPE_BRAND ? 'brand' : 'platform';
}

function mapCouponScopeTypeLabel(scopeType: AdminCouponTemplateItem['scopeType']) {
  return scopeType === 'brand' ? '指定品牌' : '平台通用';
}

function mapCouponScopeTypeCode(scopeType: CreateAdminCouponTemplatePayload['scopeType']) {
  return scopeType === 'brand' ? COUPON_SCOPE_BRAND : COUPON_SCOPE_PLATFORM;
}
```

- [ ] **Step 4：sanitizeCouponTemplate 切字段**

替换 line 378-423 `sanitizeCouponTemplate`：删 `shopId / shopName`，加：

```ts
export function sanitizeCouponTemplate(row: CouponTemplateRow): AdminCouponTemplateItem {
  const type = mapCouponType(row.type);
  const scopeType = mapCouponScopeType(row.scope_type);
  const validityType = mapCouponValidityType(row.validity_type);
  const rawStatus = mapCouponRawStatus(row.status);
  const startAt = toIsoString(row.start_at);
  const endAt = toIsoString(row.end_at);
  const displayStatus = getCouponDisplayStatus(rawStatus, validityType, startAt, endAt);
  const totalQuantity = toNumber(row.total_quantity);
  const grantedCount = toNumber(row.granted_count);
  const brandProductIds = parseJsonIdArray(row.brand_product_ids);

  return {
    id: toEntityId(row.id),
    code: row.code,
    name: row.name,
    type,
    typeLabel: mapCouponTypeLabel(type),
    rawStatus,
    status: displayStatus.key,
    statusLabel: displayStatus.label,
    scopeType,
    scopeTypeLabel: mapCouponScopeTypeLabel(scopeType),
    brandId: row.brand_id == null ? null : toEntityId(row.brand_id),
    brandName: row.brand_name,
    brandProductIds,
    brandProductCount: brandProductIds?.length ?? 0,
    description: row.description,
    sourceType: mapCouponSourceType(row.source_type),
    sourceTypeLabel: mapCouponSourceTypeLabel(mapCouponSourceType(row.source_type)),
    minAmount: toNumber(row.min_amount),
    discountAmount: toNumber(row.discount_amount),
    discountRate: row.discount_rate == null ? null : Number(row.discount_rate),
    maxDiscountAmount: toNumber(row.max_discount_amount),
    validityType,
    validityTypeLabel: mapCouponValidityTypeLabel(validityType),
    startAt,
    endAt,
    validDays: toNumber(row.valid_days),
    totalQuantity,
    userLimit: toNumber(row.user_limit),
    grantedCount,
    remainingQuantity: totalQuantity < 0 ? null : Math.max(totalQuantity - grantedCount, 0),
    batchCount: toNumber(row.batch_count),
    lastBatchAt: toIsoString(row.last_batch_at),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function parseJsonIdArray(value: unknown): EntityId[] | null {
  if (value == null) return null;
  let arr: unknown = value;
  if (typeof value === 'string') {
    try { arr = JSON.parse(value); } catch { return null; }
  }
  if (!Array.isArray(arr)) return null;
  return arr.filter((v) => v != null).map((v) => toEntityId(v as number | string));
}
```

> `EntityId` import 已在 `@umi/shared`，sanitize 顶部 import 加 `type EntityId`。

- [ ] **Step 5：normalizeCouponTemplatePayload 改字段**

替换 line 467-547，把 `shopId` 路径改为 `brandId / brandProductIds`：

```ts
type NormalizedCouponTemplatePayload = {
  name: string;
  typeCode: number;
  scopeTypeCode: number;
  brandId: string | null;
  brandProductIds: string[] | null;
  description: string | null;
  minAmount: number;
  discountAmount: number;
  discountRate: number | null;
  maxDiscountAmount: number;
  validityTypeCode: number;
  startAt: Date | null;
  endAt: Date | null;
  validDays: number;
  totalQuantity: number;
  userLimit: number;
  statusCode: number;
};

function normalizeCouponScopeType(
  value:
    | CreateAdminCouponTemplatePayload['scopeType']
    | UpdateAdminCouponTemplatePayload['scopeType'],
) {
  if (value === 'platform' || value === 'brand') return value;
  throw new Error('适用范围不合法');
}

export function normalizeCouponTemplatePayload(
  payload: CreateAdminCouponTemplatePayload | UpdateAdminCouponTemplatePayload,
): NormalizedCouponTemplatePayload {
  const name = requireText(payload.name, '优惠券名称');
  const type = normalizeCouponType(payload.type);
  const scopeType = normalizeCouponScopeType(payload.scopeType);
  const validityType = normalizeCouponValidityType(payload.validityType);
  const minAmount = requireNonNegativeInteger(payload.minAmount, '使用门槛');
  const totalQuantity = Math.round(Number(payload.totalQuantity ?? -1));
  const userLimit = Math.round(Number(payload.userLimit ?? 1));

  if (!Number.isFinite(totalQuantity) || totalQuantity === 0 || totalQuantity < -1) {
    throw new Error('发放数量不合法');
  }
  if (!Number.isFinite(userLimit) || userLimit < 1) {
    throw new Error('每人限领数量不合法');
  }

  let brandId: string | null = null;
  let brandProductIds: string[] | null = null;
  if (scopeType === 'brand') {
    if (!payload.brandId) {
      throw new Error('指定品牌时品牌不能为空');
    }
    brandId = String(payload.brandId).trim();
    if (!brandId) throw new Error('指定品牌时品牌不能为空');
    if (Array.isArray(payload.brandProductIds) && payload.brandProductIds.length > 0) {
      const ids = payload.brandProductIds.map((v) => String(v).trim()).filter(Boolean);
      brandProductIds = ids.length > 0 ? Array.from(new Set(ids)) : null;
    }
  }

  const normalized: NormalizedCouponTemplatePayload = {
    name,
    typeCode: mapCouponTypeCode(type),
    scopeTypeCode: mapCouponScopeTypeCode(scopeType),
    brandId,
    brandProductIds,
    description: trimOptionalText(payload.description),
    minAmount,
    discountAmount: 0,
    discountRate: null,
    maxDiscountAmount: 0,
    validityTypeCode: mapCouponValidityTypeCode(validityType),
    startAt: null,
    endAt: null,
    validDays: 0,
    totalQuantity,
    userLimit,
    statusCode: normalizeCouponTemplateStatus(payload.status),
  };

  if (type === 'discount') {
    const discountRate = Number(payload.discountRate ?? 0);
    if (!Number.isFinite(discountRate) || discountRate <= 0 || discountRate > 10) {
      throw new Error('折扣需填写 0 到 10 之间的数值');
    }
    normalized.discountRate = Number(discountRate.toFixed(2));
    normalized.maxDiscountAmount = requireNonNegativeInteger(
      payload.maxDiscountAmount ?? 0,
      '最高优惠金额',
    );
  } else {
    normalized.discountAmount = requireNonNegativeInteger(
      payload.discountAmount,
      type === 'shipping' ? '减免金额' : '优惠金额',
    );
  }

  if (validityType === 'fixed') {
    const startAt = payload.startAt ? new Date(payload.startAt) : null;
    const endAt = payload.endAt ? new Date(payload.endAt) : null;
    if (!startAt || Number.isNaN(startAt.getTime())) throw new Error('开始时间不能为空');
    if (!endAt || Number.isNaN(endAt.getTime())) throw new Error('结束时间不能为空');
    if (startAt.getTime() > endAt.getTime()) throw new Error('结束时间不能早于开始时间');
    normalized.startAt = startAt;
    normalized.endAt = endAt;
  } else {
    const validDays = Math.round(Number(payload.validDays ?? 0));
    if (!Number.isFinite(validDays) || validDays < 1) throw new Error('领取后有效天数不合法');
    normalized.validDays = validDays;
  }

  return normalized;
}
```

> 删除 `assertShopExists` 函数。`mapCouponScopeTypeCode` 已在 step 3 改为 brand。

- [ ] **Step 6：buildCouponListWhere 同步**

line 560-588 函数内 `params.scopeType` 走 `mapCouponScopeTypeCode`，旧实现已正确，仅依赖 union 改即可，无需改动。

确认 `CouponListParams.scopeType` 类型走 `CreateAdminCouponTemplatePayload['scopeType']`，跟着 step 1 自动变。

- [ ] **Step 7：commit**

```bash
git add apps/api/src/modules/admin/coupons-shared.ts
git commit -m "refactor(admin/coupons): scope_type=brand 校验 + sanitize 切字段"
```

---

## Task 4：admin/coupon-templates.ts CRUD 改造

**Files:**
- Modify: `apps/api/src/modules/admin/coupon-templates.ts`

- [ ] **Step 1：getAdminCoupons SELECT 改 brand JOIN**

line 27-92 `getAdminCoupons`，把 SELECT 中 `s.name AS shop_name` 改为 brand：

```ts
const [rows] = await db.execute<mysql.RowDataPacket[]>(
  `
    SELECT
      ct.id,
      ct.code,
      ct.name,
      ct.type,
      ct.status,
      ct.scope_type,
      ct.brand_id,
      ct.brand_product_ids,
      ct.description,
      ct.source_type,
      ct.min_amount,
      ct.discount_amount,
      ct.discount_rate,
      ct.max_discount_amount,
      ct.validity_type,
      ct.start_at,
      ct.end_at,
      ct.valid_days,
      ct.total_quantity,
      ct.user_limit,
      ct.created_at,
      ct.updated_at,
      b.name AS brand_name,
      COALESCE(gs.batch_count, 0) AS batch_count,
      COALESCE(gs.granted_count, 0) AS granted_count,
      gs.last_batch_at
    FROM coupon_template ct
    LEFT JOIN brand b ON b.id = ct.brand_id
    LEFT JOIN (
      SELECT
        template_id,
        COUNT(*) AS batch_count,
        COALESCE(SUM(granted_count), 0) AS granted_count,
        MAX(created_at) AS last_batch_at
      FROM coupon_grant_batch
      GROUP BY template_id
    ) gs ON gs.template_id = ct.id
    ${whereSql}
    ORDER BY ct.updated_at DESC, ct.id DESC
  `,
  values,
);
```

- [ ] **Step 2：createAdminCouponTemplate INSERT 改字段**

替换 line 94-157：

```ts
export async function createAdminCouponTemplate(
  payload: CreateAdminCouponTemplatePayload,
): Promise<CreateAdminCouponTemplateResult> {
  const normalized = normalizeCouponTemplatePayload(payload);
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    if (normalized.brandId) {
      await assertBrandExists(connection, normalized.brandId);
      if (normalized.brandProductIds && normalized.brandProductIds.length > 0) {
        await assertBrandProductsBelongToBrand(
          connection,
          normalized.brandId,
          normalized.brandProductIds,
        );
      }
    }

    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO coupon_template (
          code,
          name,
          type,
          status,
          scope_type,
          brand_id,
          brand_product_ids,
          description,
          source_type,
          min_amount,
          discount_amount,
          discount_rate,
          max_discount_amount,
          validity_type,
          start_at,
          end_at,
          valid_days,
          total_quantity,
          user_limit,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
      `,
      [
        createNo('TPL'),
        normalized.name,
        normalized.typeCode,
        normalized.statusCode,
        normalized.scopeTypeCode,
        normalized.brandId,
        normalized.brandProductIds ? JSON.stringify(normalized.brandProductIds) : null,
        normalized.description,
        COUPON_SOURCE_ADMIN,
        normalized.minAmount,
        normalized.discountAmount,
        normalized.discountRate,
        normalized.maxDiscountAmount,
        normalized.validityTypeCode,
        normalized.startAt,
        normalized.endAt,
        normalized.validDays,
        normalized.totalQuantity,
        normalized.userLimit,
      ],
    );

    return { id: toEntityId(result.insertId) };
  } finally {
    connection.release();
  }
}
```

> import 头部加 `assertBrandExists, assertBrandProductsBelongToBrand` 替换 `assertShopExists`。

- [ ] **Step 3：updateAdminCouponTemplate 同步改字段**

替换 line 159-221：

```ts
export async function updateAdminCouponTemplate(
  templateId: string,
  payload: UpdateAdminCouponTemplatePayload,
): Promise<UpdateAdminCouponTemplateResult> {
  const normalized = normalizeCouponTemplatePayload(payload);
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await fetchCouponTemplateById(connection, templateId);
    if (normalized.brandId) {
      await assertBrandExists(connection, normalized.brandId);
      if (normalized.brandProductIds && normalized.brandProductIds.length > 0) {
        await assertBrandProductsBelongToBrand(
          connection,
          normalized.brandId,
          normalized.brandProductIds,
        );
      }
    }

    await connection.execute(
      `
        UPDATE coupon_template
        SET
          name = ?,
          type = ?,
          status = ?,
          scope_type = ?,
          brand_id = ?,
          brand_product_ids = ?,
          description = ?,
          min_amount = ?,
          discount_amount = ?,
          discount_rate = ?,
          max_discount_amount = ?,
          validity_type = ?,
          start_at = ?,
          end_at = ?,
          valid_days = ?,
          total_quantity = ?,
          user_limit = ?,
          updated_at = NOW(3)
        WHERE id = ?
      `,
      [
        normalized.name,
        normalized.typeCode,
        normalized.statusCode,
        normalized.scopeTypeCode,
        normalized.brandId,
        normalized.brandProductIds ? JSON.stringify(normalized.brandProductIds) : null,
        normalized.description,
        normalized.minAmount,
        normalized.discountAmount,
        normalized.discountRate,
        normalized.maxDiscountAmount,
        normalized.validityTypeCode,
        normalized.startAt,
        normalized.endAt,
        normalized.validDays,
        normalized.totalQuantity,
        normalized.userLimit,
        templateId,
      ],
    );

    return { id: toEntityId(templateId) };
  } finally {
    connection.release();
  }
}
```

- [ ] **Step 4：fetchCouponTemplateById SELECT 改字段**

`coupons-shared.ts:590` 的 `fetchCouponTemplateById`：把 SELECT 中 `ct.shop_id` / `LEFT JOIN shop` 改为 `ct.brand_id, ct.brand_product_ids` / `LEFT JOIN brand b ON b.id = ct.brand_id` + `b.name AS brand_name`。

> 这一步严格说是 Task 3 范围，但因为 `fetchCouponTemplateById` 在 coupons-shared.ts 里被 Task 4 调用，先放这里一起改更内聚。检查 Task 3 完成时如果已改就跳过。

- [ ] **Step 5：commit**

```bash
git add apps/api/src/modules/admin/coupon-templates.ts apps/api/src/modules/admin/coupons-shared.ts
git commit -m "refactor(admin/coupons): coupon_template CRUD 切 brand_id + brand_product_ids"
```

---

## Task 5：admin/coupon-grant-batches.ts coupon INSERT 加快照 3 列

**Files:**
- Modify: `apps/api/src/modules/admin/coupon-grant-batches.ts`

- [ ] **Step 1：buildCouponAmountForIssuedCoupon 上下文获取 scope/brand 字段**

`templateRow` 已经从 `fetchCouponTemplateById` 拿到（Task 4 step 4 已让它带 `scope_type / brand_id / brand_product_ids`）。

把 line 168-184 `couponRows` map 改为：

```ts
const brandProductIdsJson = templateRow.brand_product_ids
  ? (typeof templateRow.brand_product_ids === 'string'
    ? templateRow.brand_product_ids
    : JSON.stringify(templateRow.brand_product_ids))
  : null;

const couponRows = eligibleUserIds.map((userId) => [
  createNo('CPN'),
  userId,
  templateId,
  Number(templateRow.scope_type),
  templateRow.brand_id ?? null,
  brandProductIdsJson,
  batchId,
  templateRow.name,
  couponAmount,
  templateRow.type,
  condition,
  expireAt,
  COUPON_SOURCE_ADMIN,
  COUPON_STATUS_UNUSED,
  issuedAt,
  issuedAt,
  issuedAt,
  issuedAt,
]);
```

- [ ] **Step 2：INSERT 列声明同步加 3 列**

替换 line 187-205：

```ts
await connection.query(
  `
    INSERT INTO coupon (
      coupon_no,
      user_id,
      template_id,
      scope_type,
      brand_id,
      brand_product_ids,
      grant_batch_id,
      name,
      amount,
      type,
      \`condition\`,
      expire_at,
      source_type,
      status,
      claimed_at,
      used_at,
      created_at,
      updated_at
    ) VALUES ?
  `,
  [couponRows],
);
```

- [ ] **Step 3：commit**

```bash
git add apps/api/src/modules/admin/coupon-grant-batches.ts
git commit -m "refactor(admin/coupons): grant batch INSERT 加 scope/brand 快照三列"
```

---

## Task 6：admin OpenAPI schemas 同步

**Files:**
- Modify: `apps/api/src/routes/openapi/schemas/admin.ts`

- [ ] **Step 1：scopeType enum 替换**

`apps/api/src/routes/openapi/schemas/admin.ts` 三处 `enum: ['platform', 'shop']`（line 1990 / 2117 / 2170）全部改为 `enum: ['platform', 'brand']`，旁边 `example: 'shop'` 改为 `example: 'brand'`。

- [ ] **Step 2：AdminCouponTemplateItem schema 字段同步**

找到 `AdminCouponTemplateItem` schema 定义（line 1980 附近）：删 `shopId / shopName` 两个 properties，加：

```ts
brandId: { type: 'string', nullable: true },
brandName: { type: 'string', nullable: true },
brandProductIds: { type: 'array', items: { type: 'string' }, nullable: true },
brandProductCount: { type: 'integer' },
```

`scopeTypeLabel` 的 enum 改：`['平台通用', '指定品牌']`。

CreateAdminCouponTemplatePayload / UpdateAdminCouponTemplatePayload schema 同样替换 `shopId` 为 `brandId + brandProductIds`。

- [ ] **Step 3：commit**

```bash
git add apps/api/src/routes/openapi/schemas/admin.ts
git commit -m "refactor(openapi): coupon scopeType platform|brand + brand fields"
```

---

## Task 7：admin/marketing-routes 透传 query / body（如有）

**Files:**
- Modify: `apps/api/src/modules/admin/routes/marketing-routes.ts`

- [ ] **Step 1：检查 marketing-routes 中 coupon 相关路由是否需 query 接收 brandId**

`apps/api/src/modules/admin/routes/marketing-routes.ts:221` 有 `scopeType` query 接收：

```ts
scopeType:
  typeof request.query.scopeType === 'string'
    ? (request.query.scopeType as CreateAdminCouponTemplatePayload['scopeType'])
    : undefined,
```

类型自然跟着 union 变。本步无需改动，仅保留当前调用即可。如果列表 filter 要补 `brandId` 过滤，本批次先不做（spec § 4.1 admin 列表过滤范围未要求按 brand 过滤），保持现状。

- [ ] **Step 2：commit（如本 task 无修改则跳过）**

```bash
# 无改动则跳过
```

---

## Task 8：admin frontend lib：admin-coupon.ts 改 SCOPE_OPTIONS + FormValues

**Files:**
- Modify: `apps/admin/src/lib/admin-coupon.ts`

- [ ] **Step 1：SCOPE_OPTIONS 切 brand**

替换 line 50-53：

```ts
export const SCOPE_OPTIONS = [
  { label: '平台通用', value: 'platform' },
  { label: '指定品牌', value: 'brand' },
] as const;
```

- [ ] **Step 2：CouponFormValues 加 brand 字段**

替换 line 21-37 `CouponFormValues`：

```ts
export type CouponFormValues = {
  name: string;
  type: AdminCouponTemplateType;
  scopeType: AdminCouponTemplateScopeType;
  brandId?: string;
  brandProductIds?: string[];
  description?: string;
  minAmountYuan: number;
  discountAmountYuan?: number;
  discountRate?: number;
  maxDiscountAmountYuan?: number;
  validityType: CreateAdminCouponTemplatePayload['validityType'];
  timeRange?: [Dayjs | null, Dayjs | null] | null;
  validDays?: number;
  totalQuantity: number;
  userLimit: number;
  status: AdminCouponTemplateRawStatus;
};
```

- [ ] **Step 3：buildCouponFormValues 切字段**

替换 line 113-133：

```ts
export function buildCouponFormValues(record: AdminCouponTemplateItem): CouponFormValues {
  const startDayjs = record.startAt ? dayjs(record.startAt) : null;
  const endDayjs = record.endAt ? dayjs(record.endAt) : null;
  return {
    name: record.name,
    type: record.type,
    scopeType: record.scopeType,
    brandId: record.brandId ?? undefined,
    brandProductIds: record.brandProductIds ?? undefined,
    description: record.description || undefined,
    minAmountYuan: centsToYuan(record.minAmount),
    discountAmountYuan: centsToYuan(record.discountAmount),
    discountRate: record.discountRate ?? undefined,
    maxDiscountAmountYuan: centsToYuan(record.maxDiscountAmount),
    validityType: record.validityType,
    timeRange: startDayjs || endDayjs ? [startDayjs, endDayjs] : null,
    validDays: record.validDays || undefined,
    totalQuantity: record.totalQuantity,
    userLimit: record.userLimit,
    status: record.rawStatus,
  };
}
```

- [ ] **Step 4：commit**

```bash
git add apps/admin/src/lib/admin-coupon.ts
git commit -m "refactor(admin/web): coupon SCOPE_OPTIONS + FormValues 加 brand"
```

---

## Task 9：admin frontend：列表 + state 提交 brand 字段

**Files:**
- Modify: `apps/admin/src/lib/admin-coupon-page.tsx`
- Modify: `apps/admin/src/lib/admin-coupon-page-state.ts`

- [ ] **Step 1：列表「适用范围」列改 brand 显示**

`apps/admin/src/lib/admin-coupon-page.tsx:75-83` 替换：

```tsx
{
  title: '适用范围',
  dataIndex: 'scopeType',
  width: 220,
  render: (_: unknown, record: AdminCouponTemplateItem) => {
    if (record.scopeType === 'brand') {
      const productSuffix =
        record.brandProductCount > 0
          ? ` · ${record.brandProductCount} 个 SPU`
          : '';
      return record.brandName
        ? `${record.scopeTypeLabel} · ${record.brandName}${productSuffix}`
        : `${record.scopeTypeLabel} · 品牌ID ${record.brandId ?? '-'}${productSuffix}`;
    }
    return record.scopeTypeLabel;
  },
},
```

- [ ] **Step 2：admin-coupon-page-state.ts 提交映射切 brand**

`apps/admin/src/lib/admin-coupon-page-state.ts:225-228` 替换：

```ts
scopeType: values.scopeType,
brandId:
  values.scopeType === 'brand' ? ((values.brandId?.trim() || null) as EntityId | null) : null,
brandProductIds:
  values.scopeType === 'brand' && values.brandProductIds && values.brandProductIds.length > 0
    ? (values.brandProductIds as EntityId[])
    : null,
```

> 文件顶部确认 `EntityId` 已 import 自 `@umi/shared`。原 `shopId` 字段从 payload map 删掉。

`useAdminCouponPageState` 内的 filters dep array（line 117）`filters.shopId` 如果存在改成 `filters.brandId`，CouponFilters 也同步加 brandId（替代 shopId）。

- [ ] **Step 3：CouponFilters 类型同步**

回到 `apps/admin/src/lib/admin-coupon.ts:14-19` `CouponFilters` 定义，本批次不加 brandId 过滤（admin 列表暂不按 brand 过滤）。仅删除可能存在的 `shopId` 字段。如果 CouponFilters 当前没有 shopId（看 step 1）则跳过。

- [ ] **Step 4：commit**

```bash
git add apps/admin/src/lib/admin-coupon-page.tsx apps/admin/src/lib/admin-coupon-page-state.ts apps/admin/src/lib/admin-coupon.ts
git commit -m "refactor(admin/web): coupon 列表 brand 显示 + 表单提交映射"
```

---

## Task 10：admin frontend：FormModal 加 brand select + brand_product 多选

**Files:**
- Modify: `apps/admin/src/components/admin-coupon-form-modal.tsx`
- Reference (do not modify): `apps/admin/src/lib/admin-brand-library.tsx` 看现有品牌列表 / 商品列表 fetch pattern

- [ ] **Step 1：扫现状确认 brand list fetch API 是否已有**

```bash
grep -rn "fetchBrands\|admin/brands\|listBrands" /root/projects/umi/apps/admin/src --include="*.ts" --include="*.tsx" | head
```

如果已有 `fetchBrands` / `fetchBrandProducts(brandId)`，复用；如果没有，本 task step 2 先在 admin 加这两个 fetch helper（可以抽到 `apps/admin/src/lib/api/catalog-shared.ts`）。

- [ ] **Step 2：缺则加 fetch helper（如果 step 1 已有则跳）**

```ts
// apps/admin/src/lib/api/catalog-shared.ts 末尾追加（如缺）
export function fetchBrands(): Promise<{ items: Array<{ id: string; name: string }> }> {
  return getJson('/api/admin/brands?status=active&pageSize=200');
}
export function fetchBrandProducts(brandId: string): Promise<{ items: Array<{ id: string; name: string }> }> {
  return getJson(`/api/admin/brand-library?brandId=${encodeURIComponent(brandId)}&status=active&pageSize=500`);
}
```

> 路径与项目现有 admin brand-library API 对齐；step 1 grep 命中先确认实际接口路径。

- [ ] **Step 3：FormModal 加 brand select + brand_product 多选 controls**

打开 `apps/admin/src/components/admin-coupon-form-modal.tsx`，在 `scopeType === 'brand'` 分支追加：

```tsx
{scopeType === 'brand' && (
  <>
    <Form.Item
      label="品牌"
      name="brandId"
      rules={[{ required: true, message: '请选择品牌' }]}
    >
      <Select
        showSearch
        placeholder="搜索品牌"
        loading={brandsLoading}
        filterOption={(input, option) =>
          (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
        }
        options={brandOptions}
        onChange={(value) => {
          form.setFieldValue('brandProductIds', undefined);
          if (value) loadBrandProducts(value);
        }}
      />
    </Form.Item>
    <Form.Item
      label="限定商品（不选 = 该品牌全量）"
      name="brandProductIds"
      tooltip="不勾选任何商品时，模板对该品牌下所有商品生效"
    >
      <Select
        mode="multiple"
        placeholder="按需限定到部分商品"
        loading={brandProductsLoading}
        options={brandProductOptions}
        disabled={!Form.useWatch('brandId', form)}
      />
    </Form.Item>
  </>
)}
```

组件顶部加 state：

```tsx
const [brandOptions, setBrandOptions] = useState<{ label: string; value: string }[]>([]);
const [brandsLoading, setBrandsLoading] = useState(false);
const [brandProductOptions, setBrandProductOptions] = useState<{ label: string; value: string }[]>([]);
const [brandProductsLoading, setBrandProductsLoading] = useState(false);

const loadBrandProducts = useCallback(async (brandId: string) => {
  setBrandProductsLoading(true);
  try {
    const result = await fetchBrandProducts(brandId);
    setBrandProductOptions(result.items.map((item) => ({ label: item.name, value: item.id })));
  } finally {
    setBrandProductsLoading(false);
  }
}, []);

useEffect(() => {
  if (!open) return;
  setBrandsLoading(true);
  fetchBrands()
    .then((result) => setBrandOptions(result.items.map((b) => ({ label: b.name, value: b.id }))))
    .finally(() => setBrandsLoading(false));
}, [open]);

useEffect(() => {
  // 编辑场景：进来已经选中 brand 时预拉 SPU 列表
  if (open && editingCoupon?.brandId) {
    loadBrandProducts(String(editingCoupon.brandId));
  }
}, [open, editingCoupon?.brandId, loadBrandProducts]);
```

> import head 加 `import { fetchBrands, fetchBrandProducts } from '../lib/api/catalog-shared';`

> 如果原文件 prop 没有 `editingCoupon`（仅有 form），从 `form.getFieldValue('brandId')` 读初始值替代。

- [ ] **Step 4：admin-coupon-detail-drawer.tsx 显示 brand**

`apps/admin/src/components/admin-coupon-detail-drawer.tsx`：「适用范围」描述项把 `coupon.shopName / coupon.shopId` 替换为 `coupon.brandName / coupon.brandId / coupon.brandProductCount`。

- [ ] **Step 5：commit**

```bash
git add apps/admin/src/components/admin-coupon-form-modal.tsx apps/admin/src/components/admin-coupon-detail-drawer.tsx apps/admin/src/lib/api/catalog-shared.ts
git commit -m "feat(admin/web): coupon 表单加 brand select + SPU 多选"
```

---

## Task 11：用户端 listClaimableCouponTemplates 改签名 + 快照入库

**Files:**
- Modify: `apps/api/src/modules/coupon/store.ts`
- Modify: `apps/api/src/modules/coupon/router.ts`

- [ ] **Step 1：listClaimableCouponTemplates 签名 + WHERE 改造**

替换 `apps/api/src/modules/coupon/store.ts:169-262`：

```ts
export async function listClaimableCouponTemplates(
  userId: string | null,
  options: { brandId?: string | null; brandProductId?: string | null } = {},
): Promise<CouponTemplateListResult> {
  const db = getDbPool();
  const params: Array<string | number> = [];
  const whereParts = [
    `ct.status = ${COUPON_TEMPLATE_STATUS_ACTIVE}`,
    '(ct.end_at IS NULL OR ct.end_at > NOW())',
  ];
  if (options.brandId) {
    whereParts.push(
      `(
        ct.scope_type = ${COUPON_SCOPE_PLATFORM}
        OR (
          ct.scope_type = ${COUPON_SCOPE_BRAND}
          AND ct.brand_id = ?
          AND (
            ct.brand_product_ids IS NULL
            OR ${
              options.brandProductId
                ? `JSON_CONTAINS(ct.brand_product_ids, JSON_QUOTE(?), '$')`
                : `1=0`  // 没传 SPU 时，限定 SPU 的模板不展示
            }
          )
        )
      )`,
    );
    params.push(options.brandId);
    if (options.brandProductId) params.push(options.brandProductId);
  } else {
    whereParts.push(`ct.scope_type = ${COUPON_SCOPE_PLATFORM}`);
  }

  const userIdParam = userId ?? 0;
  const userClaimedExpr = `(SELECT COUNT(*) FROM coupon c WHERE c.template_id = ct.id AND c.user_id = ?)`;
  const grantedExpr = `(SELECT COUNT(*) FROM coupon c WHERE c.template_id = ct.id)`;

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        ct.id,
        ct.name,
        ct.description,
        ct.type,
        ct.scope_type,
        ct.brand_id,
        ct.brand_product_ids,
        ct.min_amount,
        ct.discount_amount,
        ct.validity_type,
        ct.end_at,
        ct.valid_days,
        ct.total_quantity,
        ct.user_limit,
        ${grantedExpr} AS granted_count,
        ${userClaimedExpr} AS user_claimed
      FROM coupon_template ct
      WHERE ${whereParts.join(' AND ')}
      ORDER BY ct.created_at DESC, ct.id DESC
    `,
    [userIdParam, ...params],
  );

  return {
    items: (rows as CouponTemplateRow[]).map((row): CouponTemplateItem => {
      const totalQuantity = Number(row.total_quantity);
      const granted = Number(row.granted_count ?? 0);
      const remaining = totalQuantity < 0 ? null : Math.max(0, totalQuantity - granted);
      const userClaimed = Number(row.user_claimed ?? 0);
      const userLimit = Math.max(0, Number(row.user_limit) || 0);
      let claimable = true;
      let reason: string | null = null;
      if (!userId) {
        claimable = false;
        reason = '请登录后领取';
      } else if (remaining != null && remaining <= 0) {
        claimable = false;
        reason = '已被领完';
      } else if (userLimit > 0 && userClaimed >= userLimit) {
        claimable = false;
        reason = '已达领取上限';
      }

      const tplType = mapTemplateType(Number(row.type ?? COUPON_TYPE_CASH));
      const rawAmount = Number(row.discount_amount);
      const amount = tplType === 'percent' ? rawAmount : rawAmount / 100;
      return {
        id: toEntityId(row.id),
        name: row.name,
        description: row.description ?? null,
        amount,
        type: tplType,
        minAmount: Number(row.min_amount) / 100,
        condition: buildTemplateConditionText(row),
        scopeType: mapTemplateScopeType(Number(row.scope_type)),
        brandId: row.brand_id == null ? null : toEntityId(row.brand_id),
        brandProductIds: parseJsonIds(row.brand_product_ids),
        expireAt: row.end_at ? new Date(row.end_at).toISOString() : null,
        validDays: Number(row.valid_days) || 0,
        remaining,
        userClaimed,
        userLimit,
        claimable,
        claimDisabledReason: reason,
      };
    }),
  };
}

function parseJsonIds(value: unknown): string[] | null {
  if (value == null) return null;
  let arr: unknown = value;
  if (typeof value === 'string') {
    try { arr = JSON.parse(value); } catch { return null; }
  }
  return Array.isArray(arr) ? arr.map((v) => String(v)) : null;
}
```

> `mapTemplateScopeType` 改：

```ts
function mapTemplateScopeType(code: number): CouponTemplateItem['scopeType'] {
  return code === COUPON_SCOPE_BRAND ? 'brand' : 'platform';
}
```

> 文件顶部加 `const COUPON_SCOPE_BRAND = 20;` 替换原 `COUPON_SCOPE_SHOP`，类型 `CouponTemplateRow` 删 shop_id，加 `brand_id / brand_product_ids`。

- [ ] **Step 2：claimCouponFromTemplate INSERT 加 3 列快照**

`apps/api/src/modules/coupon/store.ts:264-387` 改造：

```ts
// SELECT 加 scope_type / brand_id / brand_product_ids
const [tplRows] = await connection.execute<mysql.RowDataPacket[]>(
  `
    SELECT id, code, name, type, status, scope_type, brand_id, brand_product_ids,
           min_amount, discount_amount, validity_type,
           start_at, end_at, valid_days, total_quantity, user_limit
    FROM coupon_template
    WHERE id = ?
    LIMIT 1
  `,
  [templateId],
);
const template = tplRows[0] as
  | (mysql.RowDataPacket & {
      id: number | string;
      code: string | null;
      name: string;
      type: number | string | null;
      status: number | string;
      scope_type: number | string;
      brand_id: number | string | null;
      brand_product_ids: unknown;
      min_amount: number | string;
      discount_amount: number | string;
      validity_type: number | string;
      start_at: Date | string | null;
      end_at: Date | string | null;
      valid_days: number | string;
      total_quantity: number | string;
      user_limit: number | string;
    })
  | undefined;
```

INSERT 替换：

```ts
const brandProductIdsJson = template.brand_product_ids
  ? (typeof template.brand_product_ids === 'string'
    ? template.brand_product_ids
    : JSON.stringify(template.brand_product_ids))
  : null;

const [result] = await connection.execute<mysql.ResultSetHeader>(
  `
    INSERT INTO coupon (
      coupon_no, user_id, template_id,
      scope_type, brand_id, brand_product_ids,
      name, amount, type, \`condition\`,
      expire_at, source_type, status, claimed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3), NOW(3))
  `,
  [
    couponNo,
    userId,
    templateId,
    Number(template.scope_type),
    template.brand_id ?? null,
    brandProductIdsJson,
    template.name,
    Number(template.discount_amount),
    Number(template.type ?? COUPON_TYPE_CASH),
    condition,
    expireAt,
    COUPON_SOURCE_ACTIVITY,
    COUPON_STATUS_UNUSED,
  ],
);
```

- [ ] **Step 3：router 接收 brandId / brandProductId**

`apps/api/src/modules/coupon/router.ts:25-34` 替换：

```ts
couponRouter.get(
  '/templates',
  optionalUser,
  asyncHandler(async (request, response) => {
    const brandId =
      typeof request.query.brandId === 'string' ? request.query.brandId : undefined;
    const brandProductId =
      typeof request.query.brandProductId === 'string' ? request.query.brandProductId : undefined;
    const result = await listClaimableCouponTemplates(request.user?.id ?? null, {
      brandId,
      brandProductId,
    });
    ok(response, result);
  }),
);
```

- [ ] **Step 4：commit**

```bash
git add apps/api/src/modules/coupon/store.ts apps/api/src/modules/coupon/router.ts
git commit -m "refactor(coupon): listClaimable + claim 改 brand 维度 + 快照入库"
```

---

## Task 12：web 用户端 fetchCouponTemplates 调用方迁移

**Files:**
- Modify: `apps/web/src/lib/api/coupons.ts`
- Modify: `apps/web/src/app/coupons/center/page.tsx`
- Modify: `apps/web/src/app/product/[id]/page.tsx`

- [ ] **Step 1：fetchCouponTemplates 改签名**

替换 `apps/web/src/lib/api/coupons.ts:10-17`：

```ts
export function fetchCouponTemplates(
  options: { brandId?: string; brandProductId?: string } = {},
) {
  const search = new URLSearchParams();
  if (options.brandId) search.set('brandId', options.brandId);
  if (options.brandProductId) search.set('brandProductId', options.brandProductId);
  const suffix = search.toString();
  return getJson<CouponTemplateListResult>(
    `/api/coupons/templates${suffix ? `?${suffix}` : ''}`,
  );
}
```

- [ ] **Step 2：coupons/center 页面 query 改 brandId**

`apps/web/src/app/coupons/center/page.tsx:22` 把读 `shopId` 的逻辑替换为读 `brandId / brandProductId`：

```tsx
// 顶部 useSearchParams 解析
const searchParams = useSearchParams();
const brandId = searchParams.get('brandId') ?? undefined;
const brandProductId = searchParams.get('brandProductId') ?? undefined;

// fetch 使用
fetchCouponTemplates({ brandId, brandProductId })
```

> 检查页面中所有 `shopId` 引用，替换或删除。具体读 `apps/web/src/app/coupons/center/page.tsx` 文件再做精准替换。

- [ ] **Step 3：商品详情页跳转 url 改 brandId**

`apps/web/src/app/product/[id]/page.tsx:320-321` 替换：

```tsx
href={
  product.brandId
    ? `/coupons/center?brandId=${encodeURIComponent(product.brandId)}${
        product.brandProductId
          ? `&brandProductId=${encodeURIComponent(product.brandProductId)}`
          : ''
      }`
    : '/coupons/center'
}
```

> `product.brandId / brandProductId` 字段确认：商品详情 ProductDetail 类型已含（#22 改造后）。如果当前 `ProductDetail` 没有 `brandProductId`，从 `product.brandProductId` / `product.spuId` / 等字段查阅命名。如果缺，通过 `product.brandProductId = ...` 透传由 `getProductDetail` SELECT 已含的列。这一步触及面 — 如果检查发现 `brandProductId` 未透传到前端，新增 spec：把 `brandProductId` 加到 `ProductDetail` payload。

- [ ] **Step 4：commit**

```bash
git add apps/web/src/lib/api/coupons.ts apps/web/src/app/coupons/center/page.tsx apps/web/src/app/product/[id]/page.tsx
git commit -m "refactor(web/coupons): fetchCouponTemplates 切 brandId/brandProductId"
```

---

## Task 13：cart/store.ts 用券候选筛选改造

**Files:**
- Modify: `apps/api/src/modules/cart/store.ts`

- [ ] **Step 1：扫现有用券候选逻辑**

```bash
grep -n "coupon\|可用券\|availableCoupon" apps/api/src/modules/cart/store.ts
```

如果 cart store 没有"列出可用券"的接口，本批次不需要改 cart（用户在 payment 时才选券）。

如果有 — 改 SELECT JOIN brand_product 拿 brand_id 集合，过滤 coupon WHERE platform OR (brand AND brand_id IN ... AND (brand_product_ids IS NULL OR JSON_CONTAINS_ANY))。具体代码视命中路径写。

> **判定**：grep 没命中"可用券"路径就跳过本 task，cart store 仅服务 cart CRUD。可用券按 task 14 在 payment 路径处理。

- [ ] **Step 2：commit（如有改动）**

```bash
git add apps/api/src/modules/cart/store.ts
git commit -m "refactor(cart): 用券候选按 brand 集合筛选"
```

---

## Task 14：order-write.ts getAvailableCoupon brand 抵扣改造

**Files:**
- Modify: `apps/api/src/modules/order/order-write.ts`

- [ ] **Step 1：getAvailableCoupon SELECT 加 scope/brand 字段**

替换 `apps/api/src/modules/order/order-write.ts:49-96`：

```ts
async function getAvailableCoupon(
  connection: mysql.Connection | mysql.PoolConnection,
  userId: string,
  couponId: string | null | undefined,
  itemRows: Array<{ brandId: string | null; spuId: string | null; itemAmount: number }>,
  originalAmountCents: number,
) {
  if (!couponId) {
    return { couponRow: null as CouponRow | null, discountCents: 0 };
  }

  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, coupon_no, name, amount, type, \`condition\`, expire_at, source_type, status,
             scope_type, brand_id, brand_product_ids
      FROM coupon
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [couponId, userId],
  );

  const row = (rows[0] as (CouponRow & {
    scope_type: number | string;
    brand_id: number | string | null;
    brand_product_ids: unknown;
  }) | undefined) ?? null;
  if (!row) {
    throw new HttpError(404, 'COUPON_NOT_FOUND', '优惠券不存在');
  }
  if (Number(row.status ?? 0) !== COUPON_STATUS_UNUSED) {
    throw new HttpError(400, 'COUPON_INVALID', '优惠券不可用');
  }
  if (row.expire_at && new Date(row.expire_at).getTime() < Date.now()) {
    throw new HttpError(400, 'COUPON_EXPIRED', '优惠券已过期');
  }

  // 算可参与抵扣的子小计
  const scopeType = Number(row.scope_type ?? 10);
  let eligibleSubtotal = originalAmountCents;
  if (scopeType === 20 /* brand */) {
    const brandId = row.brand_id == null ? null : String(row.brand_id);
    if (!brandId) {
      throw new HttpError(400, 'COUPON_INVALID', '优惠券范围异常');
    }
    const allowedSpuIds = parseJsonIdSet(row.brand_product_ids);
    eligibleSubtotal = itemRows
      .filter((it) => it.brandId === brandId)
      .filter((it) => !allowedSpuIds || (it.spuId && allowedSpuIds.has(it.spuId)))
      .reduce((sum, it) => sum + it.itemAmount, 0);
  }

  const type = Number(row.type ?? 0);
  const minAmountCents = parseCouponCondition(row.condition);
  if (minAmountCents > 0 && eligibleSubtotal < minAmountCents) {
    throw new HttpError(400, 'COUPON_CONDITION_NOT_MET', '订单金额未满足优惠券条件');
  }

  let discountCents = 0;
  if (type === COUPON_TYPE_CASH || type === 30) {
    discountCents = Math.min(eligibleSubtotal, Number(row.amount ?? 0));
  } else if (type === COUPON_TYPE_DISCOUNT) {
    const discountRate = Math.max(0, Math.min(100, Number(row.amount ?? 0)));
    discountCents = Math.round((eligibleSubtotal * (100 - discountRate)) / 100);
  }

  return { couponRow: row, discountCents };
}

function parseJsonIdSet(value: unknown): Set<string> | null {
  if (value == null) return null;
  let arr: unknown = value;
  if (typeof value === 'string') {
    try { arr = JSON.parse(value); } catch { return null; }
  }
  return Array.isArray(arr) ? new Set(arr.map((v) => String(v))) : null;
}
```

- [ ] **Step 2：调用方传入 itemRows**

`order-write.ts:246` 调 `getAvailableCoupon`：往上找 `getProductPurchaseRows` / `getCartPurchaseRows` 的返回值，确认每个 row 都已包含 brand_id 和 brand_product_id（即 spuId）。

`getProductPurchaseRows` SELECT 已经 JOIN `bp` 拿 `brand_product_id`；只需把 `bp.brand_id AS brand_id` 加进 SELECT，再让聚合阶段把 `brandId / spuId / itemAmount` 三元组传给 `getAvailableCoupon`。

精准代码定位由 step 1 改完后跑一遍 grep 调用方，再做小修补。

调用替换示例：

```ts
const itemRowsForCoupon = purchaseRows.map((it) => ({
  brandId: it.row.brand_id == null ? null : String(it.row.brand_id),
  spuId: it.row.brand_product_id == null ? null : String(it.row.brand_product_id),
  itemAmount: Number(it.row.price) * it.quantity,
}));
const { couponRow, discountCents } = await getAvailableCoupon(
  connection,
  userId,
  payload.couponId,
  itemRowsForCoupon,
  originalAmountCents,
);
```

- [ ] **Step 3：commit**

```bash
git add apps/api/src/modules/order/order-write.ts
git commit -m "refactor(order): 优惠券抵扣按 brand 子小计计算"
```

---

## Task 15：checkin/store.ts 接通发券

**Files:**
- Modify: `apps/api/src/modules/checkin/store.ts`

- [ ] **Step 1：performCheckin commit 后查 reward_config 调发券**

替换 `apps/api/src/modules/checkin/store.ts:71-148` 的 `performCheckin` 末尾（commit 后段）：

```ts
    await conn.commit();

    // 事务外触发发券；任何异常静默 log，不影响签到主流程返回
    const couponGranted = await maybeGrantCheckinReward(userId, streak).catch((e) => {
      console.error('checkin reward grant failed', { userId, streak, e });
      return false;
    });

    return {
      alreadyChecked: false,
      streak,
      total,
      reward: couponGranted ? 1 : 0,
    };
```

文件末尾加：

```ts
import { claimCouponFromTemplate } from '../coupon/store';

const CHECKIN_REWARD_TYPE_COUPON = 20;
const CHECKIN_CONFIG_STATUS_ACTIVE = 10;

async function maybeGrantCheckinReward(userId: string, streak: number): Promise<boolean> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT reward_type, reward_ref_id
      FROM checkin_reward_config
      WHERE day_no = ? AND status = ?
      LIMIT 1
    `,
    [streak, CHECKIN_CONFIG_STATUS_ACTIVE],
  );
  const row = (rows as Array<{ reward_type: number | string; reward_ref_id: number | string | null }>)[0];
  if (!row) return false;
  if (Number(row.reward_type) !== CHECKIN_REWARD_TYPE_COUPON) return false;
  const templateId = row.reward_ref_id;
  if (templateId == null) return false;

  await claimCouponFromTemplate(userId, String(templateId));
  return true;
}
```

> import head 加 `import { claimCouponFromTemplate } from '../coupon/store';`。
>
> 确认无循环依赖：`coupon/store` 不引用 `checkin`，OK。

- [ ] **Step 2：commit**

```bash
git add apps/api/src/modules/checkin/store.ts
git commit -m "feat(checkin): 接通签到发券（事务外触发，失败仅 log）"
```

---

## Task 16：文档收尾

**Files:**
- Modify: `docs/full-schema.md`
- Modify: `docs/status-codes.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1：full-schema.md 同步**

找到 `## coupon_template` 段（line 501）：删 `shop_id` 行，加：

```
| 7 | `brand_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 品牌 ID（scope_type=20 时必填） |
| 8 | `brand_product_ids` | `json` | `YES` | `NULL` | `-` | `-` | 范围限定 SPU；NULL=该品牌全量 |
```

`## coupon` 段（line 460）加：

```
| `scope_type` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 范围类型快照 |
| `brand_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 品牌 ID 快照 |
| `brand_product_ids` | `json` | `YES` | `NULL` | `-` | `-` | 范围限定 SPU 快照 |
```

> 字段顺序号按"快照 3 列在 template_id 之后"重新编号。

- [ ] **Step 2：status-codes.md 同步**

找到 `### coupon_template.scope_type` 段（line 124），第二行从：

```
| `shop` | `20` | 指定店铺 |
```

改成：

```
| `brand` | `20` | 指定品牌 |
```

- [ ] **Step 3：CLAUDE.md 同步**

CLAUDE.md `## 29 每日签到` 段：把"奖励发券待二期"段删掉，改为"已完成 2026-05-08：performCheckin commit 后调 claimCouponFromTemplate，签到即发券"。

CLAUDE.md `## 30 邀请有礼` 段保持原状（批次 2 才动）。

CLAUDE.md `## 小结` 表 P1 数量从 2 改 1（仅剩 #30 的邀请发券 + 闭环；签到已完成）。

- [ ] **Step 4：commit**

```bash
git add docs/full-schema.md docs/status-codes.md CLAUDE.md
git commit -m "docs: coupon brand refactor + 签到发券落地（批次 1 收尾）"
```

---

## 验收路径（用户在本地 IDE / CI 跑过）

按 spec § 7 测试范围：

1. 运维清空旧 coupon 数据 → 跑 `coupon_brand_refactor.sql`
2. admin 后台优惠券模板：新建一个 platform 模板 + 一个 brand 模板（绑某品牌 + 限定 1 个 SPU）
3. 用户端 `/coupons/center` 默认看 platform 券（拉到 1 个）
4. 用户端 `/coupons/center?brandId=X&brandProductId=Y`：拉到 platform + 该品牌该 SPU 模板
5. 商品详情页跳 `/coupons/center?brandId=...&brandProductId=...` 路径正确
6. 用户领取 brand 模板 → `/coupons` 能看到 + 详情显示快照字段
7. 加入购物车 1 件该 brand 商品 + 1 件其他 brand 商品 → 选 brand 券 → 抵扣按子小计
8. admin「签到奖励」配 day_no=2，reward_type=coupon，reward_ref_id=平台券模板 id
9. 用户连续签到 2 天 → 第二天签到后 `/coupons` 多一张券（reward 字段返回 1）

---

## 全 plan 自检（self-review）

**1. Spec coverage**：
- spec § 3 数据模型：T1 ✓
- spec § 4.1 admin coupon_template 改造：T2/T3/T4/T6/T8/T9/T10 ✓
- spec § 4.2 用户端可领券：T11/T12 ✓
- spec § 4.3 claim 快照入库：T11 ✓ + admin batch T5 ✓
- spec § 4.4 cart/payment 抵扣：T13/T14 ✓
- spec § 4.5 签到接通发券：T15 ✓
- spec § 4.11 OpenAPI：T6 ✓
- spec § 6 上线策略：T1 SQL + 文档 T16 ✓
- 批次 2（spec § 4.6-4.10）不在本 plan 范围 ✓

**2. Placeholder scan**：
- T13 显式标"如 grep 未命中则跳过"——前置探测命令明确，不算占位
- T7 显式标"如无修改则跳过 commit"——同上
- T10 step 1 grep 探测 + step 2 缺则加 helper——精准前置探测

**3. Type consistency**：
- `assertBrandExists / assertBrandProductsBelongToBrand`（T3）+ `mapCouponScopeTypeCode`（T3）+ `CouponFormValues.brandId/brandProductIds`（T8）+ `payload.brandId/brandProductIds`（T2）一致
- 列声明顺序在 T1 SQL / T4 INSERT / T5 admin INSERT / T11 user INSERT 都把 `scope_type / brand_id / brand_product_ids` 放在 `template_id` 之后，一致
- `parseJsonIds` / `parseJsonIdSet` / `parseJsonIdArray` 三个工具函数语义相近但作用域不同（admin sanitize / web list / order-write），各自定义不重复
