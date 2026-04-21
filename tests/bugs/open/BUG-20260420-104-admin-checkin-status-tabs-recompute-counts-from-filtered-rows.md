# BUG-20260420-104

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-104` |
| `title` | 管理后台签到配置页状态 tab 只统计当前筛选结果，筛选口径会冒充全局数量 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/marketing/checkin-tabs` |
| `scope` | `admin` |
| `page` | `#/marketing/checkin` |
| `api` | `/api/admin/checkin/rewards` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-marketing-qa-2026-04-20.md` |
| `fingerprint` | `admin-marketing-checkin:status-tabs-recompute-counts-from-filtered-rows` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 状态 tab 的 `全部 / 启用 / 停用` 数量应保持全局统计口径，不应因为当前切到某个状态就把其他状态计数改成 `0`。 |
| 对齐基准 | 后台筛选统计真实性规则；同接口已经返回 `summary`。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面请求 `/api/admin/checkin/rewards` 后只保存 `result.items`，随后又用 `rows` 本地重算 `summary`；当状态切到 `active` 或 `disabled` 时，tab 数量会退化成“当前筛选结果数”。 |
| 影响范围 | 后台运营无法从 tab 数量判断真实全局配置分布，只能看到当前过滤后的假统计。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/marketing/checkin`。 |
| 2 | 确保后台同时存在启用和停用的签到奖励配置。 |
| 3 | 点击“启用”或“停用”状态 tab。 |
| 4 | 观察 tab 上的另外两个计数，会被重算成当前过滤子集，而不是全局真实数量。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx:114) 到 [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx:123) 请求后只 `setRows(result.items)`；[apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx:144) 到 [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx:159) 又用 `rows` 本地重算 tab 数量。 |
| 接口证据 | [apps/api/src/modules/admin/checkin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/checkin.ts:279) 到 [apps/api/src/modules/admin/checkin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/checkin.ts:315) 已经返回 `summary.total / active / disabled`，而且 summary 是基于过滤前的全量结果计算。 |
| 日志/断言 | 同一个接口已经提供全局 summary，页面仍用本地子集重算，属于前端假统计。 |
| 相关文件 | [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx) [apps/api/src/modules/admin/checkin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/checkin.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx) | 页面忽略后端 `summary`，自己按 `rows` 重新统计。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
