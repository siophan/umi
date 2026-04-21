# BUG-20260420-118

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-118` |
| `title` | 聊天管理页丢失统计概览，只把后端 summary 闲置在接口里 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/system-chats-stats` |
| `scope` | `admin` |
| `page` | `#/system/chats` |
| `api` | `/api/admin/chats` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-chat-equity-rankings-qa-2026-04-20.md` |
| `fingerprint` | `admin-system-chats:drops-summary-stats-chain` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 聊天管理页应展示会话总数、高风险/复核/升级等概览统计，至少要消费当前 `/api/admin/chats` 已返回的 `summary`。 |
| 对齐基准 | 旧页聊天统计概览，以及当前 admin chat list API 已显式返回的 `summary` / `basis`。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面拿到 `/api/admin/chats` 的返回后只保存 `items`，完全忽略 `summary` 和 `basis`，顶部只有本地 tab 计数，没有任何概览统计。 |
| 影响范围 | 后端已经产出的会话总览数据无法在页面消费，聊天管理页缺少运营视角的整体风险概览。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/system/chats`。 |
| 2 | 查看页面取数和渲染逻辑。 |
| 3 | 观察 `/api/admin/chats` 返回结构。 |
| 4 | 页面仅使用 `result.items`，`summary` 和 `basis` 都未被消费，统计概览整体缺失。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx:43) 到 [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx:45) 只把 `result.items` 放进 `rows`；[apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx:125) 到 [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx:134) 的 tab 计数全部从 `rows` 本地重算。 |
| 接口证据 | [apps/api/src/modules/admin/system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1375) 到 [apps/api/src/modules/admin/system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1385) 返回了 `summary.total`、`summary.review`、`summary.escalated`、`summary.highRisk` 和 `basis`；[apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:1249) 到 [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:1261) 也明确声明了这些字段。 |
| 旧页对照 | [admin/src/pages/chats/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/chats/index.tsx:12) 到 [admin/src/pages/chats/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/chats/index.tsx:45) 旧后台至少还展示了活跃对话数、今日消息数和总消息数三张统计卡。 |
| 相关文件 | [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx) [apps/api/src/modules/admin/system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) [admin/src/pages/chats/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/chats/index.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx) | 当前完全没有消费接口 summary。 |
| [apps/api/src/modules/admin/system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) | 已返回 summary，但页面没有接。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
