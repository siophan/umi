# BUG-20260420-084

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-084` |
| `title` | 创建竞猜入口跳到空壳页面，没有表单和创建写链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/guesses/create` |
| `scope` | `admin` |
| `page` | `#/guesses/create` |
| `api` | `/api/admin/guesses` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-guesses:create-route-empty-shell` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 点击“创建竞猜”应进入可提交的创建页，至少包含表单、校验和真实创建写链路。 |
| 对齐基准 | 老后台创建页有完整表单并直接调用 `guessApi.create()` 写入。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 列表页“创建竞猜”会跳到 `#/guesses/create`，但当前创建页只展示“创建前检查”和“最近待处理竞猜”；后台路由里也只有 `GET /api/admin/guesses` 与审核 `PUT /api/admin/guesses/{id}/review`，没有对应创建写链。 |
| 影响范围 | 管理后台当前无法真正新建竞猜，主入口会把运营带到一个只读空壳页。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面入口证据 | 列表页工具栏按钮直接跳转到 `#/guesses/create`，见 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:314) 到 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:323)。 |
| 创建页证据 | 当前创建页只加载只读数据并渲染检查卡片、最近待处理竞猜，没有任何表单输入或提交动作，见 [guess-create-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guess-create-page.tsx:24) 到 [guess-create-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guess-create-page.tsx:90)。 |
| 路由 / API 证据 | 后台路由只提供 `GET /guesses` 和 `PUT /guesses/:id/review`，没有 admin 创建接口，见 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:583) 到 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:600)。 |
| 老后台对照 | 老后台创建页包含完整表单并调用 `guessApi.create()`，见 [create.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/create.tsx:49) 到 [create.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/create.tsx:174)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx) | 主入口把用户导向空壳创建页。 |
| [guess-create-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guess-create-page.tsx) | 当前页面没有创建表单和提交链路。 |
| [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) | 缺少 admin 创建竞猜写接口。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 补齐 admin 竞猜创建写链和对应表单页；在写链未接通前，不应把“创建竞猜”作为主 CTA 暴露。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
