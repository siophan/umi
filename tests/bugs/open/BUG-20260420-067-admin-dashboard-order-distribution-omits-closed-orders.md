# BUG-20260420-067

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-067` |
| `title` | 仪表盘订单状态分布遗漏“已关闭”订单，分布图口径不完整 |
| `severity` | `P2` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/dashboard/order-distribution` |
| `scope` | `admin` |
| `page` | `#/dashboard` |
| `api` | `/api/admin/dashboard/stats` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-dashboard-qa-2026-04-20.md` |
| `fingerprint` | `admin-dashboard:order-distribution-omits-closed-orders` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | “订单状态分布”应覆盖当前订单域里的全部主要状态，至少不能把 `closed` 这类正式状态静默漏掉。 |
| 对齐基准 | 当前订单状态编码包含 `pending / paid / fulfilled / closed / refunded` 五类，见 [docs/status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md:57)。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `/api/admin/dashboard/stats` 只统计“待支付 / 已支付 / 已完成 / 已退款”，没有把 `closed` 状态纳入返回；页面标题却直接写“订单状态分布”，导致图表天然少一块。 |
| 影响范围 | 仪表盘运营视图会低估已关闭订单规模，分布图与真实订单状态池不一致。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开后台仪表盘的“订单状态分布”。 |
| 2 | 核对接口实现和订单状态编码。 |
| 3 | 可以看到返回只有待支付、已支付、已完成、已退款四类，没有 `closed`。 |
| 4 | 页面会把这四类直接渲染成完整状态分布。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 仪表盘页面直接把 `stats.orderDistribution` 渲染为“订单状态分布”，没有额外补状态或标注口径限制，见 [dashboard-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx:248) 到 [dashboard-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx:263)。 |
| 接口证据 | 仪表盘 SQL 只 `UNION ALL` 了待支付、已支付、已完成、已退款四种状态，没有 `closed`，见 [dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:145) 到 [dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:175)。 |
| 编码证据 | 当前订单状态明确包含 `closed = 40`，见 [docs/status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md:57) 到 [docs/status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md:61)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts) | 订单状态分布查询漏掉 `closed`。 |
| [dashboard-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx) | 页面直接把不完整状态池渲染成完整分布图。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 仪表盘订单状态分布 SQL 已补齐 `closed`，现在返回口径覆盖“待支付 / 已支付 / 已完成 / 已关闭 / 已退款”五类正式订单状态。 |
| 验证命令 | `pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 通过。接口编译通过，订单状态分布口径已包含 `closed`。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | [apps/api/src/modules/admin/dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `结论` | `未通过，维持 open` |
| `说明` | [apps/api/src/modules/admin/dashboard.ts:156](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:156) 到 [apps/api/src/modules/admin/dashboard.ts:172](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:172) 的订单分布 SQL 仍只统计“待支付 / 已支付 / 已完成 / 已退款”四类，没有 `closed`；[apps/admin/src/pages/dashboard-page.tsx:249](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx:249) 到 [apps/admin/src/pages/dashboard-page.tsx:263](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx:263) 仍直接把该结果渲染成完整“订单状态分布”。当前问题未修复。 |
