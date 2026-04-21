# BUG-20260420-096

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-096` |
| `title` | 交易流水把未支付和已关闭订单也算成“支付流水” |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/orders/transactions-semantic` |
| `scope` | `admin` |
| `page` | `#/orders/transactions` |
| `api` | `/api/admin/orders/transactions` |
| `owner` | `测试狗` |
| `source_run` | `admin-orders-qa-2026-04-20.md` |
| `fingerprint` | `admin-orders:transactions-treats-unpaid-closed-orders-as-payments` |
| `fix_owner` | `管理后台全栈` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 交易流水应只展示真实支付成功或真实退款相关流水，不应把待支付、已关闭订单直接伪装成支付记录。 |
| 对齐基准 | 支付列表至少应区分“未支付订单”与“已入账流水”，不能同列展示为支付流水。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `/api/admin/orders/transactions` 直接从整张 `order` 表取数生成 payment rows，包括 `ORDER_PENDING` 和 `ORDER_CLOSED`；前端再统一放进“支付”tab。 |
| 影响范围 | 后台会把未支付订单和关闭订单误看成真实支付流水，交易口径被污染。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 后端查询证据 | payment rows 直接从整张 `order` 表查询，没有限制已支付状态，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:690) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:748)。 |
| 状态文案证据 | 后端只是把 `ORDER_PENDING` 标成“待支付”、`ORDER_CLOSED` 标成“已关闭”，但仍作为 payment rows 输出，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:440) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:450)。 |
| 页面证据 | 前端交易页按 `direction === 'payment'` 直接归入“支付”tab，没有二次排除，见 [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx:68) 到 [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx:168)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts) | 交易流水 payment rows 取数范围过宽。 |
| [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx) | 页面把所有 payment rows 视为真实支付流水。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | `/api/admin/orders/transactions` 的 payment rows 已收紧到真实支付成功链路，只保留 `paid / fulfilled / refunded` 订单，不再把 `pending / closed` 订单混进“支付”流水。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 通过：交易流水“支付”tab 不再包含未支付和已关闭订单。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | [apps/api/src/modules/admin/order-transactions.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/order-transactions.ts) |
