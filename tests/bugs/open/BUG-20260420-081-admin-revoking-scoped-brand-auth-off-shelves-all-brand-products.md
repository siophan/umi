# BUG-20260420-081

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-081` |
| `title` | 撤销指定类目/指定商品授权时，后端会把该品牌全部在售商品一起下架 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/brand-auth/revoke-scope` |
| `scope` | `admin` |
| `page` | `#/shops/brand-auth` |
| `api` | `/api/admin/brands/auth-records/{id}/revoke` |
| `owner` | `测试狗` |
| `source_run` | `admin-brand-auth-qa-2026-04-20.md` |
| `fingerprint` | `admin-brand-auth:revoke-scoped-auth-off-shelves-all-brand-products` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

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
| 修复说明 | 撤销授权时应按 `auth_scope + scope_value` 精确收口；如果记录是 `all_brand` 才能整品牌下架。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
