# BUG-20260420-049

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-049` |
| `title` | 系统通知“查看”抽屉不展示通知正文，发送后无法在后台复核实际内容 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/notifications/detail` |
| `scope` | `admin` |
| `page` | `#/system/notifications` |
| `api` | `/api/admin/notifications` |
| `owner` | `测试狗` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-notifications:detail-omits-content` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

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
| 修复说明 | `/api/admin/notifications` 返回结构应补上正文，前端详情抽屉同步展示 `content`。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
