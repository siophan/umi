# BUG-20260420-004

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-004` |
| `title` | 订单页把接口失败静默吞成空列表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `order/list` |
| `page` | `/orders` |
| `api` | `/api/orders` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-orders:/api/orders:error-swallowed-to-empty-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 订单接口失败时，页面应明确暴露错误态或重试态，不应把失败伪装成“暂无订单”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `fetchOrders()` 抛错后，页面直接 `setOrders([])`，后续只会渲染空态，不暴露请求失败。 |
| 影响范围 | 用户会被误导为自己没有订单；测试线程也无法从页面分辨“空态”和“接口异常”。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/orders`。 |
| 2 | 让 `/api/orders` 返回失败，或在本地让请求抛异常。 |
| 3 | 页面不会展示错误，只会显示空订单页。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/orders/page.tsx:130](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:130) 到 [apps/web/src/app/orders/page.tsx:145](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:145)。 |
| 接口证据 | `/api/orders` 已有真实用户链路和集成测试覆盖。 |
| 日志/断言 | `catch` 分支直接 `setOrders([])`，没有 `error` 状态。 |
| 相关文件 | [apps/web/src/app/orders/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/orders/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx) | 页面把失败分支伪装成了正常空态。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 订单页已引入显式 `error` 状态和重试动作；`/api/orders` 失败时不再 `setOrders([])` 伪装空态，而是展示“订单加载失败”错误页并允许重新加载。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；失败分支不再把异常吞成“暂无订单”。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/orders/page.tsx:117](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:117) 到 [apps/web/src/app/orders/page.tsx:145](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:145) 和 [apps/web/src/app/orders/page.tsx:290](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:290) 到 [apps/web/src/app/orders/page.tsx:297](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:297)；失败分支现在只设置显式 `error`，页面会渲染“订单加载失败”和重试按钮，不再伪装成“暂无订单”。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/orders/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了订单页 `loadOrders` 的异常分支、`getJson('/api/orders')` 的非 2xx 抛错路径，以及主渲染区对 `error`/空态的分支判断；当前失败时只会设置显式 `error` 并展示“订单加载失败 + 重新加载”，不再通过 `setOrders([])` 伪装成“暂无订单”。 |
