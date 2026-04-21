# BUG-20260420-094

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-094` |
| `title` | 订单列表缺少“已送达”状态 tab，`delivered` 订单无法被单独筛出 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/orders/status-tabs` |
| `scope` | `admin` |
| `page` | `#/orders/list` |
| `api` | `/api/admin/orders` |
| `owner` | `测试狗` |
| `source_run` | `admin-orders-qa-2026-04-20.md` |
| `fingerprint` | `admin-orders:list-hides-delivered-status-tab` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 既然后端和前端状态模型都保留了 `delivered`，列表 tab 应允许运营单独查看“已送达未完成”订单。 |
| 对齐基准 | 老后台物流与订单链路会区分已发货、已签收/已送达、已完成等阶段。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `AdminOrderRecord.status` 含 `delivered`，`orderStatusMeta` 也定义了“已送达”，但订单页状态 tabs 没有对应入口。 |
| 影响范围 | 已送达但未完成的订单只能混在“全部”里，后台无法按该阶段独立追单。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 类型证据 | 订单前端类型已包含 `delivered`，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts:23) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts:31)。 |
| 状态文案证据 | `orderStatusMeta` 也保留了“已送达”，见 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:54) 到 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:62)。 |
| 页面证据 | 订单页 tabs 只渲染 `pending/paid/shipping/completed/refund_pending/refunded/cancelled`，没有 `delivered`，见 [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx:245) 到 [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx:257)。 |
| 老后台对照 | 老后台订单与物流页会明确区分 `shipped`、`delivered`、`completed`，见 [logistics.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/logistics.tsx:31) 到 [logistics.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/logistics.tsx:35)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx) | 状态 tabs 漏掉 `delivered`。 |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts) | 前端状态模型与页面筛选入口不一致。 |
| [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts) | 状态文案已支持“已送达”。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 把订单页状态筛选和现有状态模型对齐，补回 `delivered` 阶段入口。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
