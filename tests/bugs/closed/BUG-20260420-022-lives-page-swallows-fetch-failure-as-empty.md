# BUG-20260420-022

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-022` |
| `title` | 直播列表页把直播读取失败静默吞成空列表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `live/list` |
| `page` | `/lives` |
| `api` | `/api/lives` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-lives:fetch-failure-swallowed-to-empty-list` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 直播列表读取失败时，应显示错误态，而不是空直播页。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 服务端装配层 `catch` 后直接向客户端传 `[]`。 |
| 影响范围 | 直播链路故障会被误判为“当前没有直播”。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/lives`。 |
| 2 | 让 `/api/lives` 返回失败。 |
| 3 | 页面会显示空直播列表。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/lives/page.tsx:17](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx:17) 到 [apps/web/src/app/lives/page.tsx:22](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx:22)。 |
| 接口证据 | 页面主链路依赖 `/api/lives`。 |
| 日志/断言 | 失败时直接 `initialItems={[]}`。 |
| 相关文件 | [apps/web/src/app/lives/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/lives/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx) | 服务端装配层把读取失败伪装成空列表。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 服务端不再把 `/api/lives` 失败吞成空列表，改为把错误文本透给客户端；客户端新增整页错误卡和重试按钮，只有真实无数据时才显示空直播页。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| 验证结果 | 通过 |
| 修复提交/变更 | [apps/web/src/app/lives/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx)、[apps/web/src/app/lives/page-client.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page-client.tsx)、[apps/web/src/app/lives/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.module.css) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 直播列表失败时页面会明确显示加载失败和重试，不再伪装成“当前没有直播”。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |

## Verifier

| 字段 | 值 |
| --- | --- |
| `verify_owner` | `测试猫` |
| `verify_result` | 测试猫独立复核了 [apps/web/src/app/lives/page.tsx:17](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx:17) 到 [apps/web/src/app/lives/page.tsx:25](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx:17) 的服务端装配逻辑，以及 [apps/web/src/app/lives/page-client.tsx:120](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page-client.tsx:120) 到 [apps/web/src/app/lives/page-client.tsx:128](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page-client.tsx:120) 和 [apps/web/src/app/lives/page-client.tsx:130](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page-client.tsx:130) 到 [apps/web/src/app/lives/page-client.tsx:163](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page-client.tsx:163) 的渲染分支；失败时页面会显示“直播列表加载失败”和重试按钮，并且不会同时渲染“暂无直播/暂无更多直播”。只有真实无数据时才展示空态。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了直播列表页服务端错误透传和客户端 `initialError` 分支；当前 `/api/lives` 失败时会明确展示“直播列表加载失败 + 重试”，并阻断“暂无直播/暂无更多直播”的空态分支，只有真实成功且无数据时才显示空列表提示。 |
