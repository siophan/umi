# BUG-20260420-115

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-115` |
| `title` | 开店审核页把类目字典失败误当成整页失败 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/shops/apply-load` |
| `scope` | `admin` |
| `page` | `#/shops/apply` |
| `api` | `/api/admin/shops/applies` `/api/admin/categories` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-shop-products-applies-qa-2026-04-20.md` |
| `fingerprint` | `admin-shop-applies:clears-main-table-when-categories-request-fails` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 开店申请主表应独立于类目字典读取，辅助字典失败时不应把主审核列表一起清空。 |
| 对齐基准 | 后台主表/字典读链解耦规则。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面把 `fetchAdminShopApplies()` 和 `fetchAdminCategories()` 放进同一个 `Promise.all`，只要类目接口失败，就会把 `shopApplies` 主表一起清空并展示整页错误。 |
| 影响范围 | 后台会把“类目字典异常”误判成“审核列表为空/不可用”，影响店铺入驻审核。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/shops/apply`。 |
| 2 | 让 `/api/admin/categories` 请求失败，但 `/api/admin/shops/applies` 保持成功。 |
| 3 | 观察页面主表。 |
| 4 | 当前整页会进入错误态，开店审核主表被一起清空。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx:66) 到 [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx:77) 把审核列表和类目字典绑进同一个 `Promise.all`；[apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx:78) 到 [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx:83) 失败后直接 `setData(emptyData)`。 |
| 后端证据 | [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:832) 到 [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:889) 开店申请列表本身是独立可读链，不依赖类目字典。 |
| 相关文件 | [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx) [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx) | 主表和字典读链被错误绑死。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
