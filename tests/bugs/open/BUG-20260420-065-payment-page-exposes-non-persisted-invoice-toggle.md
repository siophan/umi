# BUG-20260420-065

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-065` |
| `title` | 支付页暴露了不会进入下单 payload 的发票开关 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `order/payment-invoice` |
| `page` | `/payment` |
| `api` | `/api/orders` |
| `owner` | `测试猫` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-payment:invoice-toggle-not-persisted` |
| `fix_owner` | `` |
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
| 修复说明 | 要么把发票字段正式接进下单接口和订单详情，要么先移除/禁用这个切换控件，不要继续伪装成功能已可用。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
