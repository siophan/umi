# Admin Orders QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 订单模块 `#/orders/list` `#/orders/transactions` `#/orders/logistics` |
| 本轮重点 | 主列表状态与金额口径、详情与动作链、交易流水语义、物流筛选与履约操作 |
| 已确认 Bug | `8` |
| 阻塞项 | `0` |
| 结论 | 订单后台当前已经有基础只读链路，但订单列表只剩摘要抽屉，统计、详情、发货和退款审核都未承接；同时金额展示、状态映射、交易流水语义、物流筛选和值班动作也存在明显偏差。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/orders/list` 列表 / 状态 / 查看 | `parity_gap` | 当前只有列表和摘要抽屉，缺少 stats / detail / ship / refund-review；金额展示和状态筛选也有问题。 |
| `#/orders/transactions` | `parity_gap` | 流水页会把未支付和已关闭订单混入支付流水，退款状态也被压成泛化标签。 |
| `#/orders/logistics` | `parity_gap` | 物流方式筛选值与返回文案不一致，页面也失去发货和签收动作。 |
| `/api/admin/orders*` | `parity_gap` | 当前只覆盖基础读链，列表动作和若干状态/金额语义仍不可靠。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-092` | `P1` | `#/orders/list` | 订单列表只剩摘要抽屉，丢失统计、真实详情、发货和退款审核链路 | [tests/bugs/open/BUG-20260420-092-admin-orders-list-lacks-real-detail-stats-and-actions-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-092-admin-orders-list-lacks-real-detail-stats-and-actions-chain.md) |
| `BUG-20260420-093` | `P1` | `#/orders/list` `#/orders/transactions` | 订单列表和交易流水把已转元金额再次按分格式化，金额会缩小 100 倍 | [tests/bugs/open/BUG-20260420-093-admin-orders-module-double-divides-money-values.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-093-admin-orders-module-double-divides-money-values.md) |
| `BUG-20260420-094` | `P2` | `#/orders/list` | 订单列表缺少“已送达”状态 tab，`delivered` 订单无法被单独筛出 | [tests/bugs/open/BUG-20260420-094-admin-orders-list-hides-delivered-status-tab.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-094-admin-orders-list-hides-delivered-status-tab.md) |
| `BUG-20260420-095` | `P1` | `#/orders/list` | 订单状态映射把“退款拒绝”直接打成“已关闭” | [tests/bugs/open/BUG-20260420-095-admin-orders-maps-refund-rejected-to-cancelled.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-095-admin-orders-maps-refund-rejected-to-cancelled.md) |
| `BUG-20260420-096` | `P1` | `#/orders/transactions` | 交易流水把未支付和已关闭订单也算成“支付流水” | [tests/bugs/open/BUG-20260420-096-admin-transactions-treats-unpaid-and-closed-orders-as-payment-flows.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-096-admin-transactions-treats-unpaid-and-closed-orders-as-payment-flows.md) |
| `BUG-20260420-097` | `P2` | `#/orders/transactions` | 交易流水把所有退款状态都压成“退款链路” | [tests/bugs/open/BUG-20260420-097-admin-transactions-collapse-refund-statuses-into-generic-label.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-097-admin-transactions-collapse-refund-statuses-into-generic-label.md) |
| `BUG-20260420-098` | `P2` | `#/orders/logistics` | 物流管理“物流方式”筛选值和返回文案不一致，大部分选项永远筛不出来 | [tests/bugs/open/BUG-20260420-098-admin-logistics-shipping-type-filter-does-not-match-returned-labels.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-098-admin-logistics-shipping-type-filter-does-not-match-returned-labels.md) |
| `BUG-20260420-099` | `P1` | `#/orders/logistics` | 物流管理页只剩只读列表，缺少发货和标记签收链路 | [tests/bugs/open/BUG-20260420-099-admin-logistics-page-lacks-ship-and-delivery-actions.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-099-admin-logistics-page-lacks-ship-and-delivery-actions.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 动作链 | 订单列表和物流页都退化成只读视图，核心运营动作没接回来。 |
| 金额口径 | 后端已经转元，前端却继续按分格式化，订单和流水金额都被缩小 100 倍。 |
| 状态语义 | `delivered` 没有筛选入口，退款拒绝还被混成“已关闭”。 |
| 交易流水 | payment rows 取数范围过宽，退款状态文案又被压扁。 |
| 物流筛选 | 物流方式筛选值和真实返回文案不一致，导致筛选器失效。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx) [apps/admin/src/pages/order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx) [apps/admin/src/pages/order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts) [apps/admin/src/lib/format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts) |
| 后端实现 | [apps/api/src/modules/admin/orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts) [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) |
| 文档依据 | [docs/status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md) |
| 对照实现 | [admin/src/pages/orders/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/index.tsx) [admin/src/pages/orders/logistics.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/logistics.tsx) [admin/src/api/index.ts](/Users/ezreal/Downloads/joy/admin/src/api/index.ts) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 把订单详情、统计、发货和退款审核链路接回后台，不再只停留在摘要抽屉。 |
| `P1` | 修正订单后台金额单位契约，避免重复按分格式化。 |
| `P1` | 交易流水改成真实支付/退款事件视角，不要把未支付或已关闭订单混入支付流水。 |
| `P1` | 恢复物流页发货和签收动作。 |
| `P2` | 订单列表补回 `delivered` 阶段筛选。 |
| `P2` | 物流方式筛选和后端返回值统一口径。 |
| `P2` | 退款流水补回真实状态文案。 |
