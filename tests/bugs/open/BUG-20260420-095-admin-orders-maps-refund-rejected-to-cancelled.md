# BUG-20260420-095

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-095` |
| `title` | 订单状态映射把“退款拒绝”直接打成“已关闭” |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/orders/status-semantic` |
| `scope` | `admin` |
| `page` | `#/orders/list` |
| `api` | `/api/admin/orders` |
| `owner` | `测试狗` |
| `source_run` | `admin-orders-qa-2026-04-20.md` |
| `fingerprint` | `admin-orders:maps-refund-rejected-to-cancelled` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 退款被拒绝后，订单应回到真实订单阶段或至少保留“退款被拒绝”语义，不能直接伪装成订单关闭。 |
| 对齐基准 | `order.status` 的 `closed=40` 与 `order_refund.status` 的 `rejected=40` 在状态编码表里是不同领域含义。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `mapAdminOrderStatus()` 把 `refundStatus === REFUND_REJECTED` 和 `orderStatus === ORDER_CLOSED` 合并成同一个 `cancelled`。 |
| 影响范围 | 后台无法区分“订单真的关闭”与“退款申请被拒”，容易误判用户履约状态和售后结果。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 状态编码证据 | 状态文档明确 `order.status.closed=40`、`order_refund.status.rejected=40` 是两个不同业务域，见 [status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md:36) 到 [status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md:63)。 |
| 后端证据 | `mapAdminOrderStatus()` 直接把 `refundStatus === REFUND_REJECTED` 映射成 `cancelled`，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:400) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:437)。 |
| 前端呈现证据 | 前端会把 `cancelled` 展示成“已关闭”，见 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:54) 到 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:62)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts) | 订单状态映射混淆订单关闭与退款拒绝。 |
| [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts) | `cancelled` 会被运营理解为订单关闭。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 拆开订单主状态和退款审核状态，不要用 `cancelled` 吞掉退款拒绝语义。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
