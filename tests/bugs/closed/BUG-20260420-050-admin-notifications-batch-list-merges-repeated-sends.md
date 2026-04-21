# BUG-20260420-050

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-050` |
| `title` | 系统通知列表按消息载荷聚合，重复发送同一内容会被错误合并成一条批次 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `admin/notifications/batch` |
| `scope` | `admin` |
| `page` | `#/system/notifications` |
| `api` | `/api/admin/notifications` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-notifications:repeated-sends-merged-by-payload` |
| `fix_owner` | `用户端全栈一` |
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
| 修复说明 | 已把后台通知发送动作固定成“同一次发送共享同一个批次时间戳”，通知列表改为按“消息载荷 + 批次时间”聚合，不再把不同时间重复发送的同内容消息错误合并成一条。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。前后端类型检查通过，管理台构建通过；重复发送同内容通知时，后端批次聚合键已按发送动作区分。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | `apps/api/src/modules/admin/system.ts` |

## Fixer

- 已为每次通知发送动作生成统一批次时间。
- 通知列表聚合键现在包含批次时间，不再跨发送动作合并相同内容。

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/api/src/modules/admin/system.ts:1289](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1289) 到 [apps/api/src/modules/admin/system.ts:1326](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1289)，每次发送动作都会先生成统一的 `batchCreatedAt` 并写入本次所有 `notification.created_at`；同时 [apps/api/src/modules/admin/system.ts:1158](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1158) 到 [apps/api/src/modules/admin/system.ts:1196](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1158) 的批次聚合键已经把精确 `created_at` 纳入哈希和分组条件，因此不同时间重复发送同内容通知不会再被错误合并成同一条。 |
