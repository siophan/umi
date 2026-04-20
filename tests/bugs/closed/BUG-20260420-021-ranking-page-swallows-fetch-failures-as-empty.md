# BUG-20260420-021

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-021` |
| `title` | 排行榜页把各榜单读取失败静默吞成空榜单 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `ranking/page` |
| `page` | `/ranking` |
| `api` | `/api/rankings` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-ranking:fetch-failures-swallowed-to-empty-tabs` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 任一榜单读取失败时，应暴露该榜单的错误态，不应直接显示空榜。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 三个榜单都在服务端装配层被 `catch` 吞掉，失败后直接回退成空数组。 |
| 影响范围 | 排行榜故障会被误判为“当前没人上榜”。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/ranking`。 |
| 2 | 让任一 `/api/rankings` 请求失败。 |
| 3 | 对应榜单会显示空数据，而不是错误态。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/ranking/page.tsx:32](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx:32) 到 [apps/web/src/app/ranking/page.tsx:39](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx:39)。 |
| 接口证据 | 页面依赖多个 `/api/rankings` 结果。 |
| 日志/断言 | 失败时直接 `initialDataMap[key] = []`。 |
| 相关文件 | [apps/web/src/app/ranking/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/ranking/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx) | 服务端装配层把榜单失败伪装成空榜。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 服务端不再把单榜单失败吞成 `[]`，改为给每个榜单传 `items + error`；客户端按当前 tab 显式渲染错误卡和重试按钮，只有真实空榜才显示空态。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| 验证结果 | 通过 |
| 修复提交/变更 | [apps/web/src/app/ranking/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx)、[apps/web/src/app/ranking/page-client.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page-client.tsx)、[apps/web/src/app/ranking/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.module.css) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 服务端 catch 不再伪造空榜，榜单失败时前端会在当前 tab 暴露错误态并允许刷新重试。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |

## Verifier

| 字段 | 值 |
| --- | --- |
| `verify_owner` | `测试猫` |
| `verify_result` | 测试猫独立复核了 [apps/web/src/app/ranking/page.tsx:30](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx:30) 到 [apps/web/src/app/ranking/page.tsx:49](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx:30) 的服务端装配逻辑，以及 [apps/web/src/app/ranking/page-client.tsx:80](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page-client.tsx:80) 到 [apps/web/src/app/ranking/page-client.tsx:88](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page-client.tsx:80) 和 [apps/web/src/app/ranking/page-client.tsx:89](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page-client.tsx:89) 的渲染分支；失败榜单现在会保留 `error` 并显示“榜单加载失败”卡片与重试按钮，只有真实无数据时才显示“暂无榜单结果”。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了排行榜页服务端初始装配和客户端当前 tab 的渲染分支；当前任一榜单读取失败都会保留对应 `error` 并展示“榜单加载失败 + 重试”，只有在真实成功且该榜无数据时才显示“暂无榜单结果”。 |
