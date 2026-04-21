# BUG-20260420-116

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-116` |
| `title` | 开店审核页主营类目筛选会漏掉停用类目下的现存申请 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/shops/apply-category-filter` |
| `scope` | `admin` |
| `page` | `#/shops/apply` |
| `api` | `/api/admin/shops/applies` `/api/admin/categories` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-shop-products-applies-qa-2026-04-20.md` |
| `fingerprint` | `admin-shop-applies:category-filter-hides-disabled-categories` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 开店审核筛选器应能筛出所有现存申请的主营类目，包括后来被停用的类目。 |
| 对齐基准 | 后台筛选准确性规则。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `categoryOptions` 优先只取 `bizType === 'shop' && status === 'active'` 的类目；只要当前还有任何启用类目，就不会 fallback 到申请列表里的真实类目集合。结果是停用类目下仍待审核或历史申请的记录，无法通过筛选器精确筛出。 |
| 影响范围 | 运营无法按原始主营类目定位落在停用类目上的店铺申请。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 保证存在一条主营类目已停用的开店申请记录。 |
| 2 | 打开 `#/shops/apply`。 |
| 3 | 展开“主营类目”筛选器。 |
| 4 | 停用类目不会出现在下拉里，导致该类目申请无法被精确筛选。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx:98) 到 [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx:110) `categoryOptions` 优先只取启用的店铺类目，只要 `activeCategories.length > 0` 就不会回退到申请列表的真实类目值。 |
| 后端证据 | [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:838) 到 [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:889) 开店申请列表会直接返回申请记录上的 `category_name`，说明现存申请本身并未消失。 |
| 相关文件 | [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx) [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx) | 类目筛选器只保留启用类目，导致停用类目申请漏筛。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
