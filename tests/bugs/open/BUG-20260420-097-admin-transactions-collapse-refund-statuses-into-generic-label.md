# BUG-20260420-097

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-097` |
| `title` | 交易流水把所有退款状态都压成“退款链路” |
| `severity` | `P2` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/orders/refund-status` |
| `scope` | `admin` |
| `page` | `#/orders/transactions` |
| `api` | `/api/admin/orders/transactions` |
| `owner` | `测试狗` |
| `source_run` | `admin-orders-qa-2026-04-20.md` |
| `fingerprint` | `admin-orders:transactions-collapse-refund-statuses` |
| `fix_owner` | `管理后台全栈` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 退款流水应能区分待审核、审核中、已通过、已拒绝、已完成等阶段。 |
| 对齐基准 | `order_refund.status` 在状态文档里已明确区分多个阶段。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 后端 `mapRefundStatusLabel()` 固定返回“退款链路”，前端列表和抽屉只能看到一个泛化标签。 |
| 影响范围 | 运营无法从流水页分辨退款当前阶段，必须回跳别处再查。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 状态编码证据 | `order_refund.status` 明确有 `pending/reviewing/approved/rejected/completed` 多个阶段，见 [status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md:51) 到 [status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md:57)。 |
| 后端证据 | `mapRefundStatusLabel()` 固定返回“退款链路”，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:453) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:455)。 |
| 页面证据 | 前端直接展示 `statusLabel`，抽屉也只展示这一项，见 [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx:123) 到 [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx:201)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts) | 退款状态被压成固定标签。 |
| [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx) | 页面只能承接泛化后的状态文案。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 后端退款状态文案已恢复真实阶段映射：`待审核 / 审核中 / 已通过 / 已拒绝 / 已完成`，交易流水列表和详情会直接显示真实退款阶段。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 通过：交易流水不再把所有退款都压成“退款链路”。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | [apps/api/src/modules/admin/orders-shared.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders-shared.ts)；[apps/api/src/modules/admin/order-transactions.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/order-transactions.ts) |
