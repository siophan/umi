# BUG-20260420-050

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-050` |
| `title` | 系统通知列表按消息载荷聚合，重复发送同一内容会被错误合并成一条批次 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/notifications/batch` |
| `scope` | `admin` |
| `page` | `#/system/notifications` |
| `api` | `/api/admin/notifications` |
| `owner` | `测试狗` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-notifications:repeated-sends-merged-by-payload` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 每次“发送通知”都应在后台形成独立的发送批次记录，至少不能把两次不同时间的发送合并成同一条列表记录。 |
| 对齐基准 | 页面命名和文案都在表达“通知批次”，批次边界应按发送动作区分。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 后端用 `type + title + content + target_type + target_id + action_url` 生成 `notification_key` 做聚合；如果同一套内容重复发送，列表会把多次发送合并成一条记录，只把人数累加，并把 `sentAt` 变成最后一次发送时间。 |
| 影响范围 | 运营无法区分“这条消息发过几次、分别什么时候发的、每次发给了多少人”，通知审计和复盘都会失真。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 在 `#/system/notifications` 连续两次发送同样的标题、正文、类型、人群和跳转链接。 |
| 2 | 返回通知列表。 |
| 3 | 页面不会出现两条独立发送记录，而是把两次发送合并成一条，接收人数累加，发送时间取最后一次。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 接口证据 | `fetchAdminNotificationBatches()` 用消息载荷计算 `notification_key`，再按这个 key 聚合整表，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1073) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1110)。 |
| 接口证据 | `getAdminNotifications()` 直接把这套聚合结果映射给页面，`createdAt` 取最早发送时间、`sentAt` 取最后发送时间，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1158) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1173)。 |
| 页面证据 | 列表把这些聚合结果当成“通知批次”展示，见 [system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:130) 到 [system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:174)。 |
| 相关文件 | [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) [system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) | 通知批次查询按消息载荷聚合，缺少真实发送批次标识。 |
| [system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) | 页面把聚合结果直接当成发送批次显示。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 应为每次后台发送动作生成真实批次标识并按批次聚合；在没有批次表前，至少不能把不同发送时间的同内容消息合并成一条。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
