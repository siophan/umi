# BUG-20260420-125

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-125` |
| `title` | 商品列表页类目筛选只用类目名称，无法区分树形同名类目 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/products-category-filter-precision` |
| `scope` | `admin` |
| `page` | `#/products/list` |
| `api` | `/api/admin/categories` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-products-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-products:category-filter-uses-name-instead-of-tree-id` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 树形商品分类筛选应基于稳定 ID 或路径，而不是只拿类目名称做筛选值。 |
| 对齐基准 | 分类树结构本身包含 `id`、`parentId`、`level`、`path` 的事实。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面把类目筛选项的 `value` 直接设成 `item.name`，筛选判断也只是 `product.category === filters.category`，完全丢掉了树形类目的 ID 和路径。 |
| 影响范围 | 只要商品分类树里出现同名节点，商品列表就无法按准确节点筛出目标商品。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/products/list`。 |
| 2 | 查看类目筛选选项和值。 |
| 3 | 对照分类对象结构。 |
| 4 | 页面只用类目名称做筛选，无法区分树形同名类目。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:94) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:99) 类目筛选项直接用 `item.name` 作为 `label` 和 `value`；[apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:82) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:84) 筛选判断也只比较类目名称。 |
| 分类结构证据 | [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:12) 到 [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:21) admin 分类对象本身带有 `id`、`parentId`、`level`、`path` 等树结构字段，但页面没有使用。 |
| 相关文件 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) | 当前类目筛选把树结构压扁成单纯名称匹配。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
