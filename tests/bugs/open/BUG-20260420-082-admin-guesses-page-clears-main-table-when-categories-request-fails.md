# BUG-20260420-082

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-082` |
| `title` | 竞猜列表把分类接口失败误当成整页失败，辅助字典异常会清空主表 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/guesses/load` |
| `scope` | `admin` |
| `page` | `#/guesses/list` |
| `api` | `/api/admin/guesses` `/api/admin/categories` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-guesses:categories-failure-clears-main-table` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 竞猜主表应独立依赖 `/api/admin/guesses`；分类字典失败时最多影响筛选器，不应把已成功返回的竞猜主表一起清空。 |
| 对齐基准 | 分类接口是辅助字典读链，不应扩大成整页失败。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面把 `fetchAdminGuesses()` 和 `fetchAdminCategories()` 绑在同一个 `Promise.all()`，任意一条失败都会同时 `setGuesses([])` 和 `setCategories([])`。 |
| 影响范围 | 猜测主表会被辅助字典失败拖空，后台会把读链异常误判成“当前没有竞猜”。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 页面在同一个 `Promise.all()` 里并发读取竞猜和分类，失败后直接同时清空 `guesses` / `categories`，见 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:60) 到 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:80)。 |
| 前端 API 证据 | 竞猜列表和分类列表本来就是两条独立请求，见 [catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts:117) 到 [catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts:119) 和 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:41) 到 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:43)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx) | 主表和分类字典失败面被错误合并。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 拆开竞猜主表和分类字典的错误处理，分类失败时保留主表并单独提示筛选器降级。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
