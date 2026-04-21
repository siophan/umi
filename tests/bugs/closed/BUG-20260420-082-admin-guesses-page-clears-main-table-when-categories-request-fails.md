# BUG-20260420-082

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-082` |
| `title` | 竞猜列表把分类接口失败误当成整页失败，辅助字典异常会清空主表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/guesses/load` |
| `scope` | `admin` |
| `page` | `#/guesses/list` |
| `api` | `/api/admin/guesses` `/api/admin/categories` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-guesses:categories-failure-clears-main-table` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

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
| 修复说明 | 已把竞猜主表和分类字典拆成独立失败处理：页面初始化改为 `Promise.allSettled`，竞猜列表失败时只清空主表并显示整页错误；分类字典失败时只保留主表并单独暴露 warning，分类筛选降级为当前列表可见分类。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。竞猜列表现在不会再被分类字典失败拖空；分类接口异常时主表仍按真实接口结果保留，admin `typecheck` 与 `build` 均通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前竞猜页已经改成 `Promise.allSettled([fetchAdminGuesses(), fetchAdminCategories()])` 分开处理主表与分类字典；分类接口失败时只会写入 `categoryIssue` 并降级筛选，不再把竞猜主表一起清空。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `已复核通过` |
| `说明` | `2026-04-21` 重新核对当前工作树后，[apps/admin/src/pages/guesses-page.tsx:48](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:48) 到 [apps/admin/src/pages/guesses-page.tsx:81](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:48) 已用 `Promise.allSettled` 分开处理竞猜主表和分类字典；分类字典失败时只保留主表并暴露 `categoryIssue` warning，原问题已修复。 |
