# BUG-20260420-122

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-122` |
| `title` | 商品列表页把分类字典失败误当成整页失败 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/products-load` |
| `scope` | `admin` |
| `page` | `#/products/list` |
| `api` | `/api/admin/products` `/api/admin/categories` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-products-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-products:clears-main-table-when-categories-fail` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 分类字典失败时，应只影响分类筛选器，不应把商品主表一起清空。 |
| 对齐基准 | 主表读链和辅助字典解耦规则。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面用一个 `Promise.all` 同时读取商品列表和分类字典，只要 `fetchAdminCategories()` 失败，就会进入统一 `catch`，把 `products` 和 `categories` 一起清空。 |
| 影响范围 | `/api/admin/products` 即使成功，商品列表也会被辅助字典失败拖成整页错误态。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/products/list`。 |
| 2 | 查看页面初始化加载逻辑。 |
| 3 | 模拟分类接口失败或直接审查代码。 |
| 4 | 页面会把商品主表和分类字典一起清空。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:41) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:49) 把 `fetchAdminProducts()` 和 `fetchAdminCategories()` 绑进同一个 `Promise.all`；[apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:50) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:56) 失败时会同时 `setProducts([])` 和 `setCategories([])`。 |
| 主表接口证据 | [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:1004) 到 [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:1028) `/api/admin/products` 本身是独立读链，不依赖分类字典。 |
| 相关文件 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) | 页面把主表和分类字典绑成同一失败面。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
