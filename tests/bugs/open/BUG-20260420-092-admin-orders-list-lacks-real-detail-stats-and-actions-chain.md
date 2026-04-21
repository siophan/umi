# BUG-20260420-092

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-092` |
| `title` | 订单列表只剩摘要抽屉，丢失统计、真实详情、发货和退款审核链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/orders/detail-actions` |
| `scope` | `admin` |
| `page` | `#/orders/list` |
| `api` | `/api/admin/orders` |
| `owner` | `测试狗` |
| `source_run` | `admin-orders-qa-2026-04-20.md` |
| `fingerprint` | `admin-orders:list-lacks-real-detail-stats-actions-chain` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 订单列表应承接统计卡、真实订单详情、发货和退款审核动作，至少能完成订单复核和后台处置闭环。 |
| 对齐基准 | 老后台订单页已接 `adminStats`、`adminGet`、`adminShip`、`adminRefundReview`。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面只读取 `/api/admin/orders`，查看动作只是打开当前行摘要抽屉；页面和当前 admin API 都没有订单统计、详情、发货或退款审核承接。 |
| 影响范围 | 后台无法在新实现里完成订单详情复核、发货或退款审核，只能看列表快照。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 当前页面只调用 `fetchAdminOrders()`，查看动作只执行 `setSelected(record)` 打开摘要抽屉，见 [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx:39) 到 [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx:347)。 |
| 前端 API 证据 | 当前订单前端封装只有 `fetchAdminOrders/fetchAdminTransactions/fetchAdminLogistics` 这几条只读接口，没有 stats、detail、ship、refund-review，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts:141) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts:154)。 |
| 后端路由证据 | 当前 admin router 只暴露 `GET /api/admin/orders`，没有订单详情、发货或退款审核路由，见 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:642) 到 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:646)。 |
| 老后台对照 | 老后台订单页会加载 `adminStats`、`adminGet`，并提供 `adminShip`、`adminRefundReview` 动作，见 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/index.tsx:133) 到 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/index.tsx:219) 和 [index.ts](/Users/ezreal/Downloads/joy/admin/src/api/index.ts:82) 到 [index.ts](/Users/ezreal/Downloads/joy/admin/src/api/index.ts:92)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx) | 页面只剩列表和摘要抽屉。 |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts) | 前端订单 API 只读，没有详情和动作封装。 |
| [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) | 后端只暴露订单列表读链。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 恢复订单 stats、详情、发货和退款审核链路；未接通前不要把订单后台当作可操作闭环。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
