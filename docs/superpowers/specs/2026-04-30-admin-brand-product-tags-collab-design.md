# Admin 品牌商品库补 tags / collab 输入控件

**日期**：2026-04-30
**关联**：`CLAUDE.md` #22 遗留项

## 背景

2026-04-29 重构「商品共享属性归 brand_product，product 表瘦身」时（`CLAUDE.md` #22），把 `product.tags` / `product.collab` 两列下沉到 `brand_product`，DB schema 已加列：

- `brand_product.tags` — `json` nullable，形如 `["新品","限定","联名"]`
- `brand_product.collab` — `varchar(191)` nullable，形如 `"LISA × CELINE"`

但 admin 端「品牌商品库」编辑表单没有对应输入控件，运营无法配置；前端读取链路（用户端 / admin 店铺商品列表）已经 JOIN `bp.tags` / `bp.collab` 用，目前只能默认空。

## 目标

让运营能在 admin 「品牌商品库」编辑/新增弹层里维护 tags（多 tag）和 collab（联名文案），写入 `brand_product` 对应列，列表查询时回读。

## 非目标

- 不做 tag 字典 / 白名单（运营自由填，和 spec_table / package_list 一致）。
- 不动 store product (`product` 表) 写入路径。`product.tags` / `product.collab` 列在 #22 已 DROP，链路只剩 brand_product。
- 不补 admin 列表的 tag 列展示（编辑/查看抽屉里能看到即可）。

## 设计

### 1. shared 类型（`packages/shared/src/api-admin-merchant.ts`）

`CreateAdminBrandProductPayload` / `UpdateAdminBrandProductPayload` 各加：

```ts
tags?: string[] | null;
collab?: string | null;
```

### 2. API 后端

#### `apps/api/src/modules/admin/products-shared.ts`

- `AdminBrandLibraryRow`：加 `tags: unknown` + `collab: string | null`
- `AdminBrandLibraryItem`：加 `tags: string[]` + `collab: string | null`
- `sanitizeAdminBrandLibrary`：用现有 `parseBrandProductStringList` 解 `tags`，`collab` 直读 trim。
- `normalizeAdminBrandProductPayload`：
  - `tags`: 接收 `string[] | null`，trim + 过滤空 + dedupe，序列化成 `tagsJson`（空数组也写 `[]`，和 `imageListJson` 一致；DB 列 nullable，但写 `[]` 比 NULL 更稳）。
  - `collab`: trim → 空串归 NULL。
- 返回结构加 `tagsJson`、`collab`。

#### `apps/api/src/modules/admin/products-brand-library.ts`

- `getAdminBrandLibrary` 查询 SELECT 加 `bp.tags`、`bp.collab`，并补到 `GROUP BY`。
- `createAdminBrandProduct` INSERT 列与 VALUES 加 `tags`、`collab`。
- `updateAdminBrandProduct` UPDATE SET 加 `tags`、`collab`。

#### OpenAPI（`apps/api/src/routes/openapi/schemas/admin.ts`）

`CreateAdminBrandProductPayload` / `UpdateAdminBrandProductPayload` 两个 schema 加：

- `tags: { type: 'array', items: { type: 'string' }, nullable: true }`
- `collab: { type: 'string', nullable: true }`

> 注：当前两个 schema 本来就漏了 `imageList / videoUrl / detailHtml / specTable / packageList / freight / shipFrom / deliveryDays`，但补全这部分超出本期范围，留给后续 OpenAPI 同步。

### 3. Admin 前端

#### `apps/admin/src/lib/api/catalog-shared.ts`

`AdminBrandLibraryItem` 加 `tags: string[]` + `collab: string | null`。

#### `apps/admin/src/lib/admin-brand-library.tsx`

- `BrandProductFormValues` 加：
  ```ts
  tags?: string[];
  collab?: string;
  ```
- `buildEditBrandProductFormValues` 回填：
  - `tags: record.tags.length ? record.tags : undefined`
  - `collab: record.collab || undefined`

#### `apps/admin/src/components/admin-brand-library-form-modal.tsx`

在「基础信息」section 末尾（`商品说明` 之后、`详情页内容` divider 之前）加两项：

```tsx
<Form.Item label="联名" name="collab" extra="仅展示用，如 LISA × CELINE；可留空">
  <Input allowClear placeholder="如 LISA × CELINE" />
</Form.Item>
<Form.Item label="标签" name="tags" extra="回车添加；用于商品列表/详情页徽标">
  <Select mode="tags" allowClear tokenSeparators={[',', '，']} placeholder="如 新品、限定、联名" />
</Form.Item>
```

> tokenSeparators 让运营粘贴 `新品,限定` 也能拆 tag。

#### `apps/admin/src/pages/brand-library-page.tsx`

`handleSubmitBrandProduct` 拼 payload 时加：

```ts
tags: (values.tags ?? []).map((t) => t.trim()).filter(Boolean).length
  ? (values.tags ?? []).map((t) => t.trim()).filter(Boolean)
  : null,
collab: values.collab?.trim() || null,
```

去重逻辑放后端 `normalizeAdminBrandProductPayload`，前端只 trim/filter，避免双份。

## 数据兼容

- 旧数据 `tags = NULL` / `collab = NULL`：`parseBrandProductStringList(null)` 已返回 `[]`，`collab ?? null` 透传。前端表单 `initialValues` 给 `undefined` → 输入框为空，编辑保存后写入。
- 写入空数组：`tagsJson = '[]'` 而不是 `NULL`，和现有 `imageListJson` 行为一致；如需读侧再 trim 也只在 sanitize 解出 `[]`。

## 测试 / 验证

1. 新增品牌商品，填 1 个 collab + 2 个 tag → 保存 → 列表抽屉读出来。
2. 编辑已有品牌商品，把 collab 清空、tag 加一个 → 保存 → DB `tags`/`collab` 写入正确。
3. 老库存量大商品（tags=NULL, collab=NULL）打开编辑弹层 → 输入框为空、不报错。
4. 用户端商品详情 / 店铺商品列表读 `bp.tags` / `bp.collab` 渲染徽标（手动 spot check 一两个商品）。
5. `pnpm typecheck` 通过。

## 部署顺序

DB 列已经在（`drop_product_original_price.sql` 时已加），可直接发布代码，无需 SQL 变更。

