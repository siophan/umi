# BUG-20260420-010

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-010` |
| `title` | 购物车页把购物车和推荐流请求失败静默吞成空内容 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `cart/page` |
| `page` | `/cart` |
| `api` | `/api/cart` `/api/products` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-cart:cart-and-discovery-failures-swallowed-to-empty-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 购物车或推荐流读取失败时，页面应提示失败并支持重试，不应把失败伪装成空购物车。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `CartPage` 在装配时把 `/api/cart` 和 `/api/products` 的失败都降级为 `[]`。 |
| 影响范围 | 用户会被误导为“购物车为空”；推荐流失败也看不出来。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/cart`。 |
| 2 | 让 `/api/cart` 或 `/api/products` 返回失败。 |
| 3 | 页面继续渲染，但数据退为空列表。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/cart/page.tsx:38](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx:38) 到 [apps/web/src/app/cart/page.tsx:58](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx:58)。 |
| 接口证据 | 页面依赖 `/api/cart` 和 `/api/products`。 |
| 日志/断言 | 失败时直接 `setItems([])`、`setDiscoverItems([])`。 |
| 相关文件 | [apps/web/src/app/cart/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/cart/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx) | 页面把装配失败伪装成空购物车和空推荐流。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 购物车主链和推荐流改成独立错误态；购物车失败时显示主错误页并提供重试，推荐流失败时只在推荐区暴露错误，不再把失败伪装成空购物车。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；购物车和推荐流失败都不再被吞成空内容。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/cart/page.tsx:34](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx:34) 到 [apps/web/src/app/cart/page.tsx:76](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx:76) 的加载逻辑，以及 [apps/web/src/app/cart/page.tsx:285](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx:285) 到 [apps/web/src/app/cart/page.tsx:289](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx:285) 和 [apps/web/src/app/cart/page.tsx:422](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx:422) 到 [apps/web/src/app/cart/page.tsx:430](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx:422) 的渲染分支；购物车失败会展示显式错误卡，推荐流失败会展示独立推荐区错误和重试按钮，空购物车态只在真实无数据时出现。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/cart/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx)、[apps/web/src/app/cart/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了购物车页的首屏 `Promise.allSettled` 装配、`cartError`/`discoverError` 两条错误链，以及主内容和推荐区的渲染分支；当前购物车读取失败会展示主错误卡并支持重试，推荐流失败只在推荐区展示错误提示和重试按钮，不再把失败伪装成空购物车或空推荐流。 |
