# BUG-20260420-117

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-117` |
| `title` | 聊天管理页只有会话摘要，缺少消息明细审查链路 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/system-chats-detail` |
| `scope` | `admin` |
| `page` | `#/system/chats` |
| `api` | `/api/admin/chats` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-chat-equity-rankings-qa-2026-04-20.md` |
| `fingerprint` | `admin-system-chats:lacks-message-detail-review-chain` |
| `fix_owner` | `管理后台全栈` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 管理后台聊天管理在查看某个会话时，应能进入消息明细链路，至少能看到真实消息时间线和会话双方上下文，而不是只展示列表摘要。 |
| 对齐基准 | 聊天管理页语义、`chat_message` / `chat_conversation` 数据链，以及用户侧已存在的聊天明细接口能力。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面点“查看”后只打开一个摘要抽屉，里面仍然只有用户名、消息数、未读数、风险等级、状态和更新时间；后台也只暴露 `/api/admin/chats` 列表接口，没有任何 admin 侧聊天明细接口。 |
| 影响范围 | 运营或风控无法在后台直接复核某条风险会话的真实消息内容，`#/system/chats` 会退化成只读摘要表。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/system/chats`。 |
| 2 | 任选一条会话点击“查看”。 |
| 3 | 观察抽屉内容和 admin API。 |
| 4 | 抽屉只有摘要字段，没有消息列表；后台也不存在 admin 侧聊天详情接口。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx:88) 到 [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx:95) 的“查看”动作只会 `setSelected(record)`；[apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx:149) 到 [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx:159) 的抽屉只展示摘要字段，没有消息时间线。 |
| 后端证据 | [apps/api/src/modules/admin/system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1345) 到 [apps/api/src/modules/admin/system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1385) 只把 `chat_message` 聚合成双人会话摘要；[apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:1249) 到 [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:1265) 当前只定义了 `GET /api/admin/chats`。 |
| 对照证据 | [apps/api/src/routes/openapi/paths/chats.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/chats.ts:29) 到 [apps/api/src/routes/openapi/paths/chats.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/chats.ts:49) 用户侧仍有 `GET /api/chats/{userId}` 消息明细接口；[docs/schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md:356) 到 [docs/schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md:360) 当前库里也已经有 `chat_conversation` / `chat_message` 承接。 |
| 相关文件 | [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx) [apps/api/src/modules/admin/system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) [apps/api/src/routes/openapi/paths/chats.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/chats.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx) | 当前只有摘要表和摘要抽屉，没有消息详情承接。 |
| [apps/api/src/modules/admin/system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) | admin chat 目前只做聚合列表，没有明细读取。 |
| [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) | OpenAPI 也只装配了 `/api/admin/chats` 列表接口。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 聊天管理页已取消摘要抽屉，改成独立详情子页 `#/system/chats/detail/:id`；后台新增 `GET /api/admin/chats/:id`，直接返回会话双方上下文和真实 `chat_message` 时间线，且不会改写已读状态。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin build`；`pnpm --filter @umi/api build` |
| Fixer 自测结果 | 通过：聊天管理现在可以从列表进入真实详情子页，查看双方信息、风险等级和完整消息时间线。 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx)；[apps/admin/src/pages/system-chat-detail-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chat-detail-page.tsx)；[apps/admin/src/lib/admin-page-registry.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-page-registry.tsx)；[apps/admin/src/lib/admin-navigation.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-navigation.tsx)；[apps/api/src/modules/admin/system-chats.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-chats.ts)；[apps/api/src/modules/admin/routes/system-ops-routes.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/system-ops-routes.ts) |
