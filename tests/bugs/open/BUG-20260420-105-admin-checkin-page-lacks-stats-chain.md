# BUG-20260420-105

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-105` |
| `title` | 管理后台签到配置页丢失签到统计概览和 stats 链路 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/marketing/checkin-stats` |
| `scope` | `admin` |
| `page` | `#/marketing/checkin` |
| `api` | `/api/admin/checkin/stats` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-marketing-qa-2026-04-20.md` |
| `fingerprint` | `admin-marketing-checkin:lacks-stats-chain` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 签到后台应像老页一样展示今日签到、连续签到分布、总签到次数等概览，方便运营判断奖励配置效果。 |
| 对齐基准 | 老后台签到页统计卡片和 `/api/admin/checkin/stats` 链路。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面只读写奖励配置列表，没有任何签到统计卡片；当前 admin router 也只暴露 `/checkin/rewards*`，缺少旧页的 stats 读链路。 |
| 影响范围 | 运营只能编辑配置，无法在同模块内查看签到活动实际效果，造成明显能力回退。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/marketing/checkin`。 |
| 2 | 对照老后台签到页。 |
| 3 | 观察当前页面顶部。 |
| 4 | 会发现当前只有搜索、状态 tab 和配置表，没有任何签到统计概览；接口层也不存在 `/api/admin/checkin/stats`。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx:90) 到 [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx:307) 整页只围绕奖励配置列表和编辑弹窗，没有任何 stats 卡片。 |
| 路由证据 | [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:768) 到 [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:831) 当前只暴露 `/api/admin/checkin/rewards` 相关路由，未见 `/api/admin/checkin/stats`。 |
| 对照证据 | [admin/src/pages/marketing/checkin.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/checkin.tsx:37) 到 [admin/src/pages/marketing/checkin.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/checkin.tsx:52) 老页会同时请求 `/api/admin/checkin/stats` 和配置接口；[admin/src/pages/marketing/checkin.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/checkin.tsx:104) 到 [admin/src/pages/marketing/checkin.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/checkin.tsx:123) 还展示今日签到、连续签到分布和总签到次数。 |
| 相关文件 | [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx) [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) [admin/src/pages/marketing/checkin.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/checkin.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx) | 页面能力只剩配置 CRUD。 |
| [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) | 缺少签到统计读接口。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
