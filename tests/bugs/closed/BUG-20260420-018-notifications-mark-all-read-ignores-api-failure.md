# BUG-20260420-018

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-018` |
| `title` | 通知页“全部已读”在接口失败时仍本地标记成功 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `notifications/actions` |
| `page` | `/notifications` |
| `api` | `/api/auth/notifications/read-all` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-notifications:mark-all-read-ignores-api-failure` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | “全部已读”失败时，页面不应假装成功，应回滚或提示失败。 |
| 对齐基准 | 当前产品要求 / 页面与接口契约一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `markAllNotificationsRead()` 失败后，页面仍把所有通知本地设为已读，并提示“全部已读”。 |
| 影响范围 | 用户会以为通知状态已同步成功，刷新后可能发现未读仍在。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/notifications`。 |
| 2 | 让“全部已读”接口返回失败。 |
| 3 | 页面仍把通知全部标记已读并显示成功 toast。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/notifications/page.tsx:93](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:93) 到 [apps/web/src/app/notifications/page.tsx:101](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx:101)。 |
| 接口证据 | 页面调用真实“全部已读”接口。 |
| 日志/断言 | `catch` 里直接忽略错误，之后仍 `setItems(...read: true)` 并提示成功。 |
| 相关文件 | [apps/web/src/app/notifications/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/notifications/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx) | “全部已读”动作和接口结果脱节。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | “全部已读”只在接口成功后才本地更新；失败时保留原通知状态并提示失败。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；接口失败时不会再假装“全部已读”。 |
| Verifier 复测结果 | 通过。已复核“全部已读”仅在接口成功后更新本地状态，失败时保留原状态并提示错误；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
| 修复提交/变更 | [apps/web/src/app/notifications/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx)、[apps/web/src/app/notifications/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了通知页 `handleMarkAllRead` 的控制流；当前只有在 `markAllNotificationsRead()` 成功返回后才会执行本地 `setItems(...read: true)` 并提示“全部已读”，失败分支只保留原状态并展示错误提示，没有看到旧的假成功更新残留。 |
