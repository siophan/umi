# BUG-20260420-065

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-065` |
| `title` | 支付页暴露了不会进入下单 payload 的发票开关 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `order/payment-invoice` |
| `page` | `/payment` |
| `api` | `/api/orders` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-payment:invoice-toggle-not-persisted` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 如果支付页展示“发票信息/发票类型”控件，它就应该进入真实下单链路；如果当前订单接口不承接发票字段，就不应把它做成可切换的真实配置项。 |
| 对齐基准 | 下单 payload 与页面能力一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面允许用户切换“电子发票（个人）/不开发票”，但这个状态只存在本地 `invoiceOn`，提交订单时 `createOrder(...)` payload 并没有任何发票字段。 |
| 影响范围 | 用户会误以为发票选项已经随订单提交，实际订单链路完全不知道这个选择。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/payment`。 |
| 2 | 切换“发票信息”到“电子发票（个人）”。 |
| 3 | 提交订单。 |
| 4 | 页面会显示下单成功，但提交 payload 没有任何发票字段，订单链路并未承接这个选择。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/payment/page.tsx:58](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:58) 到 [apps/web/src/app/payment/page.tsx:59](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:59)；[apps/web/src/app/payment/page.tsx:438](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:438) 到 [apps/web/src/app/payment/page.tsx:444](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:438)。 |
| 下单证据 | [apps/web/src/app/payment/page.tsx:194](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:194) 到 [apps/web/src/app/payment/page.tsx:210](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:210)。 |
| 契约证据 | `CreateOrderPayload` 只有 `source/addressId/couponId/paymentMethod/note/productId/quantity/cartItemIds`，没有发票字段，见 [packages/shared/src/api.ts:951](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:951) 到 [packages/shared/src/api.ts:959](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:959)。 |
| 日志/断言 | `invoiceOn` 仅驱动文案显示，不进入 `createOrder(...)` payload。 |
| 相关文件 | [apps/web/src/app/payment/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/payment/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx) | 发票控件是本地假状态，没有落到真实下单链路。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 当前订单链路还没有发票字段，所以支付页已先移除这段本地发票开关，不再继续伪装“电子发票（个人）/不开发票”这种不会进下单 payload 的配置项。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 已通过。支付页不再暴露本地假发票开关，`web typecheck` 和 `next build` 均通过。 |
| Verifier 复测结果 | 测试总监代码验证通过，允许关闭。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `结论` | `通过，关闭` |
| `说明` | 当前 [apps/web/src/app/payment/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx) 已不存在 `invoice` / `发票` 相关本地状态和展示控件；[apps/web/src/app/payment/page.tsx:234](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:234) 到 [apps/web/src/app/payment/page.tsx:246](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:246) 的 `createOrder(...)` payload 只提交 `source/addressId/couponId/paymentMethod/note/productId/quantity/cartItemIds`，页面能力与下单契约现已一致，不再伪装承接发票配置。 |
