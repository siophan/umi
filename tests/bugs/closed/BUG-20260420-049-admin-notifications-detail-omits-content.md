# BUG-20260420-049

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-049` |
| `title` | 系统通知“查看”抽屉不展示通知正文，发送后无法在后台复核实际内容 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `admin/notifications/detail` |
| `scope` | `admin` |
| `page` | `#/system/notifications` |
| `api` | `/api/admin/notifications` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-notifications:detail-omits-content` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 通知列表发送完成后，后台应能在“查看”里看到该批通知的正文，至少支持核对标题、正文、目标人群和跳转链接。 |
| 对齐基准 | 通知管理的核心对象是“通知内容”，详情页不能丢正文。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面抽屉只显示标题、目标人群、人数、跳转链接、目标类型/ID 和时间，不显示通知正文；同时前端 `AdminNotificationItem` 和后端 `getAdminNotifications()` 也都没有把 `content` 暴露给页面。 |
| 影响范围 | 后台无法复核历史通知到底发了什么内容，发送成功后缺少可追溯的内容审计能力。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 在 `#/system/notifications` 发送一条通知。 |
| 2 | 返回列表，点击该条“查看”。 |
| 3 | 抽屉里找不到正文内容，只能看到标题和统计信息。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 抽屉展示字段里没有通知正文，见 [system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:269) 到 [system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:304)。 |
| 类型证据 | 前端 `AdminNotificationItem` 根本没有 `content` 字段，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/system.ts:21) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/system.ts:33)。 |
| 接口证据 | 后端通知批次查询实际拿到了 `content`，但在 `getAdminNotifications()` 映射返回时直接丢掉了，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1073) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1095)，以及 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1158) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1173)。 |
| 相关文件 | [system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) [system.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/system.ts) [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) | 详情抽屉未展示通知正文。 |
| [system.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/system.ts) | 前端通知类型缺少 `content`。 |
| [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) | 返回通知批次时把 `content` 丢掉了。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已让 `/api/admin/notifications` 返回正文 `content`，并在系统通知“查看”抽屉里补展示通知正文，支持核对标题、正文、目标人群和跳转链接。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。前后端类型检查通过，管理台构建通过，通知详情抽屉已展示正文。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前通知列表结果和前端类型都已包含 `content`，系统通知“查看”抽屉可以直接复核正文内容；原先“只能看标题，正文丢失”的链路已消失。 |
| 修复提交/变更 | `apps/api/src/modules/admin/system.ts`；`apps/api/src/routes/openapi/paths/admin.ts`；`apps/admin/src/lib/api/system.ts`；`apps/admin/src/pages/system-notifications-page.tsx` |

## Fixer

- 已把通知正文从后台批次查询透传到前端类型和页面。
- “查看”抽屉现在会展示正文内容，并保留换行。

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/api/src/modules/admin/system.ts:1246](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1246) 到 [apps/api/src/modules/admin/system.ts:1260](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1246)，`/api/admin/notifications` 返回项已包含 `content`；[apps/admin/src/lib/api/system.ts:23](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/system.ts:23) 到 [apps/admin/src/lib/api/system.ts:35](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/system.ts:23) 的前端类型也已承接；[apps/admin/src/pages/system-notifications-page.tsx:232](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:232) 到 [apps/admin/src/pages/system-notifications-page.tsx:238](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:232) 已在“查看”抽屉展示正文并保留换行。 |
