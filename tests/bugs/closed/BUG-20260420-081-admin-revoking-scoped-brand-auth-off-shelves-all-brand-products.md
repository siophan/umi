# BUG-20260420-081

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-081` |
| `title` | 撤销指定类目/指定商品授权时，后端会把该品牌全部在售商品一起下架 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `admin/brand-auth/revoke-scope` |
| `scope` | `admin` |
| `page` | `#/shops/brand-auth` |
| `api` | `/api/admin/brands/auth-records/{id}/revoke` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brand-auth-qa-2026-04-20.md` |
| `fingerprint` | `admin-brand-auth:revoke-scoped-auth-off-shelves-all-brand-products` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 撤销“指定类目授权”或“指定商品授权”时，只应收口对应 scope 内的商品，不应把该品牌在店铺内的全部商品都一起下架。 |
| 对齐基准 | 授权记录模型本身已经支持 `all_brand / category_only / product_only` 三种范围。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `revokeAdminBrandAuthRecord()` 在撤销授权后，直接按 `shop_id + brand_id` 把所有 `active` 商品统一更新为 `off_shelf`，完全没有读取 `auth_scope` 和 `scope_value`。 |
| 影响范围 | 对 scoped 授权执行撤销时，会越权影响未在授权范围内的同品牌商品。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 模型证据 | 授权记录明确支持 `all_brand`、`category_only`、`product_only` 三种范围，并返回 `scopeValue`，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:431) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:450)。 |
| 接口证据 | 撤销授权时，后端下架商品的 SQL 只按 `p.shop_id = ? AND bp.brand_id = ?` 过滤，没有使用 `auth_scope` 或 `scope_value`，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1391) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1423)。 |
| 页面证据 | 页面撤销提示直接写“该店铺当前品牌在售商品会自动下架”，也暴露了当前实现是按整品牌处理，而不是按 scoped 授权处理，见 [shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx:326) 到 [shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx:333)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) | 撤销授权后的商品下架逻辑没有按授权范围收口。 |
| [shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx) | 页面提示语把“整品牌下架”当成默认语义。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已按 `auth_scope + scope_value` 收口撤销链。`all_brand` 仍按整品牌下架；`category_only` 只下架授权类目对应的品牌商品；`product_only` 只下架授权范围内的商品，后端会从 `scope_value` 递归提取类目/商品 ID 并精确拼接下架条件。前端撤销确认文案也同步区分“整品牌在售商品”与“授权范围内的在售商品”。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。撤销品牌授权现在只会按授权范围精确下架商品，不再对 scoped 授权整品牌误伤；API、admin `typecheck` 与 admin `build` 均通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前撤销逻辑已迁到 `apps/api/src/modules/admin/merchant-brand-auth.ts`，会先解析 `auth_scope + scope_value`：`all_brand` 仍整品牌下架，`category_only` 只下架授权类目对应商品，`product_only` 只下架授权范围内商品；前端撤销提示语也已同步区分“整品牌”与“授权范围内”。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant-brand-auth.ts`；`/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/merchant-routes.ts`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-brand-auth.tsx`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `已复核通过` |
| `说明` | `2026-04-21` 按 `#/shops/brand-auth` 同页合并复核时重新核对当前工作树：[apps/api/src/modules/admin/merchant-brand-auth.ts:385](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant-brand-auth.ts:385) 到 [apps/api/src/modules/admin/merchant-brand-auth.ts:453](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant-brand-auth.ts:385) 已按 `auth_scope` 分支精确下架，`all_brand`、`category_only`、`product_only` 各走不同条件；[apps/admin/src/lib/admin-brand-auth.tsx:372](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-brand-auth.tsx:372) 到 [apps/admin/src/lib/admin-brand-auth.tsx:376](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-brand-auth.tsx:376) 的前端确认文案也已同步成 scoped 语义。 |
