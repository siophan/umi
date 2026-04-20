# BUG-20260420-009

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-009` |
| `title` | 商城首页把商品和购物车请求失败静默吞成空内容 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `mall/home` |
| `page` | `/mall` |
| `api` | `/api/products` `/api/cart` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-mall:products-cart-failures-swallowed-to-empty-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 商城首页商品流或购物车数读取失败时，应暴露异常信息，不应渲染成正常空商城。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `MallHome` 使用 `Promise.allSettled`，商品和购物车请求失败都会被直接回退成空数组或 `0`。 |
| 影响范围 | 商城首屏可能在接口故障时看起来只是“没商品”“购物车为空”，掩盖真实故障。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/mall`。 |
| 2 | 让 `/api/products` 或 `/api/cart` 返回失败。 |
| 3 | 页面继续显示正常商城框架，但内容退化为空。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/components/mall-home.tsx:181](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:181) 到 [apps/web/src/components/mall-home.tsx:203](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:203)。 |
| 接口证据 | 页面依赖 `/api/products` 和 `/api/cart`。 |
| 日志/断言 | 失败时直接 `setMallItems([])`、`setProductCategories([])`、`setCartCount(0)`。 |
| 相关文件 | [apps/web/src/components/mall-home.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/components/mall-home.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx) | 首屏装配层把接口失败伪装成正常空内容。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 商品流和购物车数改成独立错误态并提供重试入口；失败时保留错误信息，不再回退成正常空商城或 `0` 购物车。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；商品流失败会显示错误卡片，购物车读取失败会显示独立告警，不再伪装成空内容。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/components/mall-home.tsx:171](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:171) 到 [apps/web/src/components/mall-home.tsx:217](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:217) 的加载逻辑，以及 [apps/web/src/components/mall-home.tsx:625](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:625) 到 [apps/web/src/components/mall-home.tsx:644](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:625) 的渲染分支；购物车失败会展示独立告警卡，商品流失败会展示“商品流加载失败”和重试按钮，不再回退成空数组或 `0` 购物车。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/components/mall-home.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx)、[apps/web/src/app/globals.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/globals.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了 `MallHome` 的首屏 `Promise.allSettled` 加载链、商品/购物车两个错误状态，以及渲染分支；当前商品流失败会展示“商品流加载失败 + 重试”，购物车读取失败会展示独立告警卡并允许重新加载，不再通过空商品流或 `0` 购物车把故障伪装成正常内容。 |
