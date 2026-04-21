# BUG-20260420-073

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-073` |
| `title` | 品牌列表类目筛选只用类目名称，不足以区分树形分类里的同名节点 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/brands/category-filter-precision` |
| `scope` | `admin` |
| `page` | `#/brands/list` |
| `api` | `/api/admin/brands` `/api/admin/categories` |
| `owner` | `测试狗` |
| `source_run` | `admin-brands-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-brands:category-filter-uses-name-instead-of-id` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 类目筛选应基于稳定且唯一的类目标识，例如 `categoryId` 或完整路径，而不是只用展示名称。 |
| 对齐基准 | 当前分类体系是树形结构，`category.parent_id / level / path` 已经明确用于表达分类树。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 品牌页的类目筛选器选项值直接使用 `item.name`，过滤时也只比较 `record.category === filters.category`。一旦品牌分类树里存在同名节点，筛选器就无法精确区分到底筛的是哪个类目节点。 |
| 影响范围 | 品牌列表在树形类目下会出现筛选精度丢失，同名类目品牌会被混在一起。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 在品牌分类树中准备两个同名但不同节点的类目。 |
| 2 | 打开品牌列表页，查看“类目”筛选器。 |
| 3 | 选项值只显示名称，不带 `id` 或路径。 |
| 4 | 选择该类目名后，会把同名节点下的品牌一起筛出来，无法精确区分。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 类目筛选选项直接使用 `item.name` 作为 value，过滤时只比较 `record.category` 文本，见 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:106) 到 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:116)，以及 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:136) 到 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:145)。 |
| 分类证据 | 当前分类体系包含 `parent_id`、`level`、`path`，说明是树形分类；而创建/更新分类时也没有名称唯一性校验，见 [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:59)，以及 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts:292) 到 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts:414)。 |
| 列表证据 | 品牌列表接口本身返回了 `categoryId`，页面理论上有唯一标识可用，但当前筛选没有使用，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1542) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1545)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx) | 类目筛选值和过滤条件都建在名称文本上。 |
| [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts) | 分类体系是树形结构，不能假设名称天然唯一。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 类目筛选应切到 `categoryId` 或完整路径维度；展示层可以继续显示名称，但筛选条件不能再只靠名称文本。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
