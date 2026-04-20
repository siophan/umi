# BUG-20260420-030

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-030` |
| `title` | 功能聚合页把未闭环的邀请/签到能力当成正常入口暴露 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `features/page` |
| `page` | `/features` |
| `api` | `/api/auth/me` `/api/auth/notifications` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-features:exposes-unready-invite-checkin-entry` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 入口聚合页应反映真实能力状态；对尚未闭环的邀请/签到链路应明确标记不可用或隐藏入口，不应继续作为正常福利入口暴露。 |
| 对齐基准 | [docs/feature-progress.md:134](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:134) / 当前产品要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面在“福利中心”直接暴露 `/invite` 和 `/checkin` 入口，而文档已明确这两条链路只处于“部分依赖未完成”；同时 `fetchMe` 和通知读取失败会回退成默认用户与 `0` 未读，让入口页看起来一切正常。 |
| 影响范围 | 用户会被导航到当前未闭环能力，且入口页本身无法暴露真实异常状态。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/features`。 |
| 2 | 查看 [docs/feature-progress.md:132](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:132) 到 [docs/feature-progress.md:134](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:134)，邀请/签到入口依赖未完成。 |
| 3 | 页面仍把“邀请好友”“每日签到”作为正常入口展示。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/features/page.tsx:18](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:18) 到 [apps/web/src/app/features/page.tsx:22](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:22)，[apps/web/src/app/features/page.tsx:68](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:68) 到 [apps/web/src/app/features/page.tsx:99](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:68)。 |
| 接口证据 | [docs/feature-progress.md:134](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:134) 已明确“入口存在不代表后端链路完整”。 |
| 日志/断言 | `fetchMe` 失败后回退成默认用户，通知读取失败后回退成 `0` 未读。 |
| 相关文件 | [apps/web/src/app/features/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/features/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx) | 未按能力真实状态管理福利入口。 |
| [docs/feature-progress.md](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:134) | 已说明入口页不代表链路完整。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 对未闭环能力加显式“建设中/暂不可用”状态，或先隐藏入口；同时不要把入口页的用户/通知失败伪装成正常默认态。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/features/page.tsx:67](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:67) 到 [apps/web/src/app/features/page.tsx:93](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:67) 的用户/通知加载逻辑，以及 [apps/web/src/app/features/page.tsx:120](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:120) 到 [apps/web/src/app/features/page.tsx:125](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:120) 和 [apps/web/src/app/features/page.tsx:176](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:176) 到 [apps/web/src/app/features/page.tsx:191](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx:176) 的渲染分支；入口页现在会显式暴露加载不完整问题，`/invite` 与 `/checkin` 入口已标记“建设中”并禁用，不再作为正常福利入口跳转。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/features/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx)、[apps/web/src/app/features/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了 `/features` 的福利入口渲染和用户/通知加载失败处理；当前 `/invite` 与 `/checkin` 已标记“建设中”并禁用，不再作为正常入口跳转，且入口页本身会通过 `issueCard` 暴露用户或通知加载不完整问题，不再把异常伪装成正常默认态。 |
