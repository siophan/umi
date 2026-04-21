# BUG-20260420-077

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-077` |
| `title` | 品牌商品库分类筛选只用类目名称，不足以区分树形商品分类里的同名节点 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/brand-library/category-filter-precision` |
| `scope` | `admin` |
| `page` | `#/products/brands` |
| `api` | `/api/admin/products/brand-library` `/api/admin/categories` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brand-library-qa-2026-04-20.md` |
| `fingerprint` | `admin-brand-library:category-filter-uses-name-instead-of-id` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 品牌商品库的分类筛选应基于唯一标识，例如 `categoryId` 或完整路径，而不是只用展示名称。 |
| 对齐基准 | 当前 `category` 体系明确是树形结构，`parent_id / level / path` 用于表达层级。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面分类筛选器选项值直接使用 `item.name`，过滤时也只比较 `record.category === filters.category`。当商品分类树里存在同名节点时，筛选器无法精确区分到底筛的是哪个分类节点。 |
| 影响范围 | 品牌商品库在树形商品分类下会出现筛选精度丢失，同名分类商品会被混筛。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 分类筛选选项直接使用 `item.name` 作为 value，过滤时只比较 `record.category` 文本，见 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:116) 到 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:126)，以及 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:138) 到 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:142)。 |
| 分类证据 | 当前分类树包含 `parent_id / level / path`，且创建/更新分类没有名称唯一性校验，见 [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:59)，以及 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts:292) 到 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts:414)。 |
| 列表证据 | 品牌商品库列表本身返回了 `categoryId`，页面理论上有唯一标识可用，但当前筛选没有使用，见 [catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts:28) 到 [catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts:35)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx) | 分类筛选值和过滤条件都建在名称文本上。 |
| [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts) | 商品分类是树形结构，不能假设名称天然唯一。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 品牌商品库的分类筛选已切到唯一标识维度：当前筛选值使用 `categoryId`，不会再按名称文本混筛；下拉展示补了父类/ID 线索，树形同名分类也能区分。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。品牌商品库分类筛选现在按 `categoryId` 生效，同名分类不会再被混筛；admin `typecheck` 与 `build` 均通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前品牌商品库页筛选参数和本地状态都已经统一成 `categoryId`，不再靠分类名称做匹配；和品牌页一样，这条主键口径已经收齐。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `通过，关闭` |
| `说明` | [apps/admin/src/pages/brand-library-page.tsx:198](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:198) 到 [apps/admin/src/pages/brand-library-page.tsx:214](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:198) 的分类筛选器当前已用 `categoryId` 作为 value；页面查询参数也已在 [apps/admin/src/pages/brand-library-page.tsx:135](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:135) 透传 `categoryId`。原先按名称文本混筛的代码路径已消失。 |
