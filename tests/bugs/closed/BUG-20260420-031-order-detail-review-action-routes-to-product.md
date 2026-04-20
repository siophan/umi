# BUG-20260420-031

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-031` |
| `title` | 订单详情页“评价”主按钮跳到了商品详情而不是评价页 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `order/detail` |
| `page` | `/order-detail` |
| `api` | `POST /api/orders/:id/review` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-order-detail:review-cta-routes-to-product` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 已完成订单的“评价”主按钮应进入 `/review?orderId=...&productId=...`，与订单列表页的评价入口保持一致。 |
| 对齐基准 | [apps/web/src/app/orders/page.tsx:223](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:223) 到 [apps/web/src/app/orders/page.tsx:226](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:226) / 当前产品要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当订单状态为 `completed` 时，主按钮文案显示“评价”，但点击后跳转到 `/product/:id`。 |
| 影响范围 | 用户无法从订单详情进入真实评价提交流程，评价闭环被中断。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开一个 `completed` 状态的 `/order-detail?id=...`。 |
| 2 | 点击底部主按钮“评价”。 |
| 3 | 页面会跳到商品详情，而不是 `/review?orderId=...&productId=...`。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/order-detail/page.tsx:320](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/order-detail/page.tsx:320) 到 [apps/web/src/app/order-detail/page.tsx:341](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/order-detail/page.tsx:320)。 |
| 接口证据 | 评价页的真实入口依赖 [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:10) 读取 `orderId` 与 `productId`。 |
| 日志/断言 | 订单列表页在 [apps/web/src/app/orders/page.tsx:223](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:223) 到 [apps/web/src/app/orders/page.tsx:226](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:226) 已正确跳到 `/review?...`，而订单详情页没有复用这条路径。 |
| 相关文件 | [apps/web/src/app/order-detail/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/order-detail/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/order-detail/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/order-detail/page.tsx) | 已完成订单的主按钮走错路由。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已完成订单的主按钮应复用订单列表页的评价跳转逻辑，进入真实 `/review` 提交流程。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/order-detail/page.tsx:324](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/order-detail/page.tsx:324) 到 [apps/web/src/app/order-detail/page.tsx:337](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/order-detail/page.tsx:324) 的主按钮逻辑；`completed` 状态下已经改为跳转到 `/review?orderId=...&productId=...`，与订单列表页评价入口保持一致，不再回到商品详情。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/order-detail/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/order-detail/page.tsx) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了订单详情页底部主按钮在 `completed` 状态下的分支；当前会明确跳转到 `/review?orderId=...&productId=...`，与订单列表页的评价入口保持一致，没有再回到商品详情页。 |
