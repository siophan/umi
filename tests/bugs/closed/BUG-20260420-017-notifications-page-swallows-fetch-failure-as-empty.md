# BUG-20260420-017

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-017` |
| `title` | 通知页把通知读取失败静默吞成空列表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `notifications/list` |
| `page` | `/notifications` |
| `api` | `/api/auth/notifications` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-notifications:fetch-failure-swallowed-to-empty-list` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 通知读取失败时，应显示错误态，不应把失败伪装成“暂无通知”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `fetchNotifications()` 失败后，页面直接 `setItems([])` 并进入 ready。 |
| 影响范围 | 用户会误判通知为空，真实故障被隐藏。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/notifications`。 |
| 2 | 让通知接口返回失败。 |
| 3 | 页面显示空通知列表，而不是错误态。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/notifications/page.tsx:51](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:51) 到 [apps/web/src/app/notifications/page.tsx:65](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:65)。 |
| 接口证据 | 页面主链路依赖通知读取接口。 |
| 日志/断言 | 失败时直接 `setItems([])` 并 `setReady(true)`。 |
| 相关文件 | [apps/web/src/app/notifications/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/notifications/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx) | 失败分支被伪装成空通知页。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 通知读取失败时改成显式错误态和重试入口，不再回退成“暂无通知”。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；通知读取失败已不再伪装成空列表。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/notifications/page.tsx:47](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:47) 到 [apps/web/src/app/notifications/page.tsx:68](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:68) 的加载逻辑，以及 [apps/web/src/app/notifications/page.tsx:150](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:150) 到 [apps/web/src/app/notifications/page.tsx:157](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:157) 和 [apps/web/src/app/notifications/page.tsx:176](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:176) 到 [apps/web/src/app/notifications/page.tsx:178](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:178) 的渲染分支；失败分支现在设置显式 `error`，页面会展示“通知加载失败”和重试按钮，空态只在真实无通知时出现。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/notifications/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx)、[apps/web/src/app/notifications/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了通知页的首屏读取异常分支和列表区渲染路径；当前通知读取失败会设置显式 `error` 并展示“通知加载失败 + 重新加载”，不会再把失败伪装成“暂无通知”的空列表。 |
