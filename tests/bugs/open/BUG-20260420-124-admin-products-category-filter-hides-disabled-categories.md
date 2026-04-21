# BUG-20260420-124

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-124` |
| `title` | 商品列表页类目筛选会漏掉停用类目下的现存商品 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/products-category-filter` |
| `scope` | `admin` |
| `page` | `#/products/list` |
| `api` | `/api/admin/categories` `/api/admin/products` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-products-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-products:category-filter-hides-disabled-categories` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 商品列表的类目筛选应覆盖当前仍有商品挂载的停用类目，避免现存商品失去按原类目定位入口。 |
| 对齐基准 | 后台筛选真实性规则，以及分类表当前有 `status` / `parentId` / `path` 的完整类目体系。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面构建 `categoryOptions` 时优先只保留 `bizType === 'product' && status === 'active'` 的分类；只要有任意启用分类存在，就不会回退到当前商品结果里的类目集合。 |
| 影响范围 | 仍然挂在停用类目下的商品无法通过类目筛选精确筛出。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/products/list`。 |
| 2 | 查看类目筛选选项构建逻辑。 |
| 3 | 对照分类接口返回结构。 |
| 4 | 页面只展示启用商品分类，停用类目下的现存商品没有对应筛选项。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:92) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:110) `categoryOptions` 优先只取 `status === 'active'` 的商品分类，并直接以该集合返回。 |
| 分类接口证据 | [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:8) 到 [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:26) admin 分类返回里本身就带 `status`、`parentId`、`level`、`path` 等完整类目信息，说明页面当前是在主动裁掉停用类目。 |
| 相关文件 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) | 类目筛选当前会漏掉停用类目下的现存商品。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
