# BUG-20260420-119

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-119` |
| `title` | 权益管理页丢失总览统计展示，列表接口返回的 summary 没有被消费 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/equity-summary` |
| `scope` | `admin` |
| `page` | `#/equity` |
| `api` | `/api/admin/equity` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-chat-equity-rankings-qa-2026-04-20.md` |
| `fingerprint` | `admin-equity:drops-summary-overview` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 权益管理页应展示总账户数、累计发放、累计使用、累计过期、活跃余额等概览统计，至少要消费 `/api/admin/equity` 当前返回的 `summary`。 |
| 对齐基准 | 旧后台权益页统计卡，以及当前 `AdminEquityListResult.summary` 契约。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面加载 `/api/admin/equity` 后只保存 `items` 和 `total`，没有任何状态位承接 `summary`，页面上也完全没有统计概览区域。 |
| 影响范围 | 运营无法在权益页直接看到总账户、发放/消耗/过期和活跃余额总览，只能逐行看表格。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/equity`。 |
| 2 | 查看页面取数逻辑和页面结构。 |
| 3 | 查看 `/api/admin/equity` 返回结构。 |
| 4 | 页面只承接 `items` 和 `total`，没有消费 `summary`，统计概览区域整体消失。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/equity-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/equity-page.tsx:114) 到 [apps/admin/src/pages/equity-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/equity-page.tsx:125) 只设置 `rows` 和 `total`；[apps/admin/src/pages/equity-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/equity-page.tsx:245) 到 [apps/admin/src/pages/equity-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/equity-page.tsx:260) 之后直接进入列表列定义，页面没有任何统计卡区域。 |
| 接口证据 | [apps/api/src/modules/admin/equity.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/equity.ts:240) 到 [apps/api/src/modules/admin/equity.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/equity.ts:276) 会计算并返回 `summary.totalAccounts`、`summary.totalGranted`、`summary.totalUsed`、`summary.totalExpired`、`summary.activeBalance`；[apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:515) 到 [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:528) 也把 `/api/admin/equity` 定义成 `AdminEquityListResult`。 |
| 旧页对照 | [admin/src/pages/equity/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/equity/index.tsx:66) 到 [admin/src/pages/equity/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/equity/index.tsx:76) 旧页会同时读取列表和 stats；[admin/src/pages/equity/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/equity/index.tsx:139) 到 [admin/src/pages/equity/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/equity/index.tsx:147) 旧页展示了五张统计卡。 |
| 相关文件 | [apps/admin/src/pages/equity-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/equity-page.tsx) [apps/api/src/modules/admin/equity.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/equity.ts) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) [admin/src/pages/equity/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/equity/index.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/equity-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/equity-page.tsx) | 页面没有状态位承接 `summary`，也没有渲染统计概览。 |
| [apps/admin/src/lib/api/equity.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/equity.ts) | 已能拿到列表 summary，但页面没有消费。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
