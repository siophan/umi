# Admin Warehouse QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 仓库模块 `#/warehouse/virtual` `#/warehouse/physical` `#/warehouse/consign` |
| 本轮重点 | 仓库统计概览、实体仓记录可见性、寄售金额口径、寄售动作链 |
| 已确认 Bug | `4` |
| 阻塞项 | `0` |
| 结论 | 仓库后台已有基础读链，但主仓页没有消费 admin stats，实体仓还会主动丢掉 `completed` 记录；寄售市场则同时存在金额口径错误和运营动作缺失。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/warehouse/virtual` / `#/warehouse/physical` | `parity_gap` | 主页面没有统计概览，实体仓还会过滤掉后端已返回的 `completed` 记录。 |
| `#/warehouse/consign` | `parity_gap` | 金额展示错误，且页面只剩查看抽屉，没有审核和强制下架动作。 |
| `/api/warehouse/admin/stats` `/api/warehouse/admin/virtual` `/api/warehouse/admin/physical` | `parity_gap` | stats 已暴露但未被页面消费，实体仓返回结果也被前端主动裁掉。 |
| `/api/admin/orders/consign` | `parity_gap` | 只读寄售链可用，但金额单位和动作闭环都不可靠。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-100` | `P2` | `#/warehouse/virtual` `#/warehouse/physical` | 仓库主页面没有接入 admin stats，虚拟仓和实体仓统计概览整体缺失 | [tests/bugs/open/BUG-20260420-100-admin-warehouse-page-ignores-admin-stats-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-100-admin-warehouse-page-ignores-admin-stats-chain.md) |
| `BUG-20260420-101` | `P1` | `#/warehouse/physical` | 实体仓页面把后端返回的 `completed` 记录直接过滤掉 | [tests/bugs/open/BUG-20260420-101-admin-physical-warehouse-page-drops-completed-records.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-101-admin-physical-warehouse-page-drops-completed-records.md) |
| `BUG-20260420-102` | `P1` | `#/warehouse/consign` | 寄售市场把已转元金额再次按分格式化，挂单价和成交价会缩小 100 倍 | [tests/bugs/open/BUG-20260420-102-admin-consign-page-double-divides-money-values.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-102-admin-consign-page-double-divides-money-values.md) |
| `BUG-20260420-103` | `P1` | `#/warehouse/consign` | 寄售市场页只剩查看抽屉，缺少审核和强制下架链路 | [tests/bugs/open/BUG-20260420-103-admin-consign-page-lacks-review-and-force-off-shelf-actions.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-103-admin-consign-page-lacks-review-and-force-off-shelf-actions.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 统计概览 | 仓库后台现有 stats 链路未被页面消费。 |
| 数据可见性 | 实体仓把已返回的 `completed` 记录直接吞掉。 |
| 金额口径 | 寄售市场金额再次按分格式化。 |
| 动作链 | 寄售后台失去审核和强制下架动作。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx) [apps/admin/src/pages/warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts) [apps/admin/src/lib/api/orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts) [apps/admin/src/lib/format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts) |
| 后端实现 | [apps/api/src/modules/warehouse/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/router.ts) [apps/api/src/modules/admin/orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts) |
| 对照实现 | [admin/src/pages/warehouse/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/index.tsx) [admin/src/pages/warehouse/consign.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/consign.tsx) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 给 `completed` 实体仓记录保留后台可见入口。 |
| `P1` | 修正寄售市场金额单位，避免重复按分格式化。 |
| `P1` | 恢复寄售市场审核和强制下架动作。 |
| `P2` | 把仓库页首屏统计接回 admin stats。 |
