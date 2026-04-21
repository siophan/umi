# BUG-20260420-050

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-050` |
| `title` | 系统通知列表按消息载荷聚合，重复发送同一内容会被错误合并成一条批次 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/notifications-batch-merge` |
| `scope` | `admin` |
| `page` | `#/system/notifications` |
| `api` | `/api/admin/notifications` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-notifications:batch-list-merges-repeated-sends` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 后台通知列表应按真实发送批次展示；同一标题、内容、类型的通知如果是两次独立发送，也应保留两条批次记录。 |
| 对齐基准 | “发送通知”后台动作语义，以及通知发送批次应可独立追溯的管理要求。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `/api/admin/notifications` 直接按消息载荷和时间戳拼 `notification_key` 聚合 `notification` 真表；相同载荷的通知会被归并成同一条“批次”，页面无法区分这是一次发送还是多次重复发送。 |
| 影响范围 | 运营无法在后台确认某条通知是否被重复发送，也无法按真实发送动作追踪接收人数、已读率和发送时间。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 查看 `#/system/notifications` 的列表来源。 |
| 2 | 查看 `/api/admin/notifications` 的批次聚合实现。 |
| 3 | 对照当前“发送通知”写链。 |
| 4 | 列表不是基于真实批次表读取，而是把 `notification` 真表按消息载荷聚合，所以重复发送同内容消息会被并到一条记录里。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:123) 到 [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:124) 页面直接展示 `/api/admin/notifications` 返回的 `items`，没有额外批次修正。 |
| 后端证据 | [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts:212) 到 [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts:249) 通过 `title/content/type/target/action_url/created_at` 拼接 `notification_key` 聚合“批次”；[apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts:322) 到 [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts:324) 也明确写了当前只是“按 notification 真表聚合为发送批次视图”。 |
| 写链证据 | [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts:356) 到 [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts:395) 发送通知时只是逐个用户插入 `notification` 记录，没有真实批次主键或批次表。 |
| OpenAPI 证据 | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:1384) 到 [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:1411) 只暴露了通知批次列表接口，没有单独的批次实体读链。 |
| 相关文件 | [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts) | 当前没有真实通知批次模型，只能按消息载荷聚合真表。 |
| [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) | 页面直接消费聚合结果，因此重复发送边界被吃掉。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
