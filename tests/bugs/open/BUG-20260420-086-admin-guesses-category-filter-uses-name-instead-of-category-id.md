# BUG-20260420-086

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-086` |
| `title` | 竞猜分类筛选只用分类名称，不足以区分树形分类里的同名节点 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/guesses/category-filter-precision` |
| `scope` | `admin` |
| `page` | `#/guesses/list` |
| `api` | `/api/admin/guesses` `/api/admin/categories` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-guesses:category-filter-uses-name-instead-of-id` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 后台应按 `category_id` 这类稳定主键筛选竞猜分类，而不是只按展示名称字符串比较。 |
| 对齐基准 | 当前分类体系是树形结构，靠 `parent_id / level / path` 承接，不应默认名称天然唯一。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 分类筛选器的 option `value` 直接使用 `item.name`，过滤时也只比较 `guess.category === filters.category`。同时 admin 竞猜列表结果已经把 `category_id` 丢掉，只剩分类名称。 |
| 影响范围 | 只要树里出现同名竞猜分类，后台就无法精确区分和筛选。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 分类筛选器把 `item.name` 当成唯一值，过滤逻辑也只按名称比较，见 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:108) 到 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:125)。 |
| 后端证据 | admin 竞猜列表最终只返回 `category` 名称，没有把 `guess.category_id` 暴露给前端，见 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:401) 到 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:419)。 |
| 数据模型证据 | 当前分类表明确是树形结构，依赖 `parent_id / level / path` 表达层级；创建和更新分类也没有名称唯一性约束，见 [schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md:77) 到 [schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md:85) 和 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts:311) 到 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts:418)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx) | 分类筛选只按名称工作。 |
| [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts) | 列表结果丢失分类主键，前端只能退回名称比较。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | admin 竞猜列表应返回 `categoryId`，前端筛选器和详情展示分离，筛选按主键、展示按名称。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
