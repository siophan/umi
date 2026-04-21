# Admin Dashboard QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 后台仪表盘 `#/dashboard` 和 `/api/admin/dashboard/stats` |
| 本轮重点 | 统计卡、状态分布、热门榜单、旧后台口径对齐 |
| 已确认 Bug | `2` |
| 阻塞项 | `0` |
| 结论 | 仪表盘页面本身没有明显的静默吞错伪装，但统计口径已经出现两处明确偏差：订单状态分布漏掉正式状态，热门竞猜也没有对齐老后台的进行中口径。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/dashboard` 统计卡 / 分布区 / 热门榜单 | `parity_gap` | 订单状态分布口径不完整，热门竞猜会混入非进行中数据。 |
| `/api/admin/dashboard/stats` | `parity_gap` | 订单状态分布少 `closed`，热门竞猜少 `status = active` 约束。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-067` | `P2` | `#/dashboard` | 仪表盘订单状态分布遗漏“已关闭”订单，分布图口径不完整 | [tests/bugs/open/BUG-20260420-067-admin-dashboard-order-distribution-omits-closed-orders.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-067-admin-dashboard-order-distribution-omits-closed-orders.md) |
| `BUG-20260420-068` | `P2` | `#/dashboard` | 仪表盘热门竞猜只按审核通过取数，已结算竞猜也会混入榜单 | [tests/bugs/open/BUG-20260420-068-admin-dashboard-hot-guesses-mixes-in-non-active-guesses.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-068-admin-dashboard-hot-guesses-mixes-in-non-active-guesses.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 订单分布 | 图表标题写的是完整“订单状态分布”，但后端只返回四种状态，漏掉 `closed`。 |
| 热门竞猜 | 老后台只看 `active` 竞猜，新接口只看审核通过，历史热点会继续混进当前榜单。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/dashboard-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/dashboard.ts) |
| 后端实现 | [apps/api/src/modules/admin/dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts) |
| OpenAPI | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |
| 对照旧页 | [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/dashboard/index.tsx) |
| 编码基线 | [docs/status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P2` | 为订单状态分布补齐 `closed`，或显式收窄页面标题和统计口径。 |
| `P2` | 为热门竞猜补 `status = active` 约束，或显式改成历史热度榜语义。 |
