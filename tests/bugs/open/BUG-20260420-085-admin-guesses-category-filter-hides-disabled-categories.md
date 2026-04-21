# BUG-20260420-085

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-085` |
| `title` | 竞猜分类筛选只显示启用分类，现存停用分类下的竞猜无法被筛出 |
| `severity` | `P2` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/guesses/category-filter` |
| `scope` | `admin` |
| `page` | `#/guesses/list` |
| `api` | `/api/admin/guesses` `/api/admin/categories` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-guesses:category-filter-hides-disabled-categories` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 分类筛选器至少应覆盖当前列表里已经存在的竞猜分类，包括已停用但仍有关联竞猜的分类。 |
| 对齐基准 | 后台筛选器应服务现存数据复核，不应因为分类停用就失去定位入口。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面优先只把 `bizType === 'guess' && status === 'active'` 的分类放进筛选器；只要存在任意启用分类，就不会回退到当前列表实际出现的分类集合。 |
| 影响范围 | 已关联停用竞猜分类的现存竞猜无法通过筛选器精确筛出。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 分类选项只取启用中的竞猜分类，且仅在“没有任何启用分类”时才退回到当前列表值集合，见 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:118) 到 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:137)。 |
| 后端证据 | 竞猜列表仍会返回 `guess.category_id` 关联出来的分类名称，没有按分类状态过滤掉这些竞猜，见 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:422) 到 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:456)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx) | 分类筛选器把停用分类下的现存竞猜排除在外。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | `buildGuessCategoryOptions()` 改为先保留启用的竞猜分类，再把当前结果集中实际出现但已停用或不在字典里的分类补回筛选器，并标记为“当前结果”，避免现存竞猜失去定位入口。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过：后台类型检查和构建均成功，分类筛选器会保留当前结果里出现的停用分类。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | [apps/admin/src/lib/admin-guesses.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-guesses.tsx) |
