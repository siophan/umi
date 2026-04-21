# BUG-20260420-120

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-120` |
| `title` | 排行榜管理页丢失“刷新排行榜”管理动作和 refresh 链路 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/rankings-refresh` |
| `scope` | `admin` |
| `page` | `#/system/rankings` |
| `api` | `/api/admin/rankings` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-chat-equity-rankings-qa-2026-04-20.md` |
| `fingerprint` | `admin-rankings:lacks-refresh-chain` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 排行榜管理页应保留显式的“刷新排行榜”管理动作，能够触发榜单重新生成，而不只是查看当前 `leaderboard_entry` 结果。 |
| 对齐基准 | 旧后台排行榜管理页，以及 `leaderboard_entry` 作为结果表的流程语义。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面只有查询和查看榜单明细，没有任何刷新动作；新后台 OpenAPI 也只装配了列表和某一期明细两个 GET 接口，看不到 refresh 写链路。 |
| 影响范围 | 运营无法从后台主动触发榜单重算，只能被动查看现有结果，排行榜管理退化成只读结果浏览。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/system/rankings`。 |
| 2 | 查看页面顶部操作区和接口装配。 |
| 3 | 对照老后台排行页。 |
| 4 | 新页没有“刷新排行榜”按钮，接口也没有 admin refresh 路由。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/system-rankings-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-rankings-page.tsx:244) 到 [apps/admin/src/pages/system-rankings-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-rankings-page.tsx:289) 顶部只有搜索、tab 和表格 reload，没有任何 refresh 管理动作。 |
| 接口证据 | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:788) 到 [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:850) 当前只定义了排行榜列表和详情两个 GET 接口，没有 refresh 路由。 |
| 旧页对照 | [admin/src/pages/rankings/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/rankings/index.tsx:62) 到 [admin/src/pages/rankings/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/rankings/index.tsx:76) 旧页明确提供“刷新排行榜”按钮，并调用 `adminRankingApi.refresh()`。 |
| 流程证据 | [docs/flows.md](/Users/ezreal/Downloads/joy/umi/docs/flows.md:74) 到 [docs/flows.md](/Users/ezreal/Downloads/joy/umi/docs/flows.md:78) 当前文档把 `leaderboard_entry` 定义成排行榜刷新后的结果承接表，后台只读结果而没有刷新动作，会让“排行榜管理”失去结果重算入口。 |
| 相关文件 | [apps/admin/src/pages/system-rankings-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-rankings-page.tsx) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) [admin/src/pages/rankings/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/rankings/index.tsx) [docs/flows.md](/Users/ezreal/Downloads/joy/umi/docs/flows.md) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/system-rankings-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-rankings-page.tsx) | 页面当前只有只读查询/查看能力。 |
| [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) | 当前没有装配排行榜 refresh 写接口。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
