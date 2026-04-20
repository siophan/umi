# BUG-20260420-032

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-032` |
| `title` | 店铺详情页在读取失败后回退成一张合成店铺页 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `shop/detail` |
| `page` | `/shop/[id]` |
| `api` | `/api/shops/:id` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-shop-detail:load-failure-synthetic-shop-fallback` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 店铺详情读取失败时，应展示明确错误态或不可用态，不应继续用路由参数、默认文案和本地推导分数拼出一张“看起来正常”的店铺页。 |
| 对齐基准 | [docs/feature-progress.md:114](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:114) / 当前产品要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `fetchShopDetail(shopId)` 失败后，页面把 `shopData` 置为 `null`，但并不进入错误态；而是继续用 `searchParams.brand`、`shopId`、默认文案、`0` 粉丝、默认等级和本地推导评分渲染页面。 |
| 影响范围 | 用户和修复线程会把接口失败误判成“这个店铺就是没有数据/刚开店”，同时页面还会展示伪造的综合评分、服务分和开店时间。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开任意 `/shop/[id]`。 |
| 2 | 让 `/api/shops/:id` 返回错误或不可达。 |
| 3 | 页面不会报错，而是继续显示一张合成的店铺详情页。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/shop/[id]/page.tsx:63](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:63) 到 [apps/web/src/app/shop/[id]/page.tsx:83](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:63)，[apps/web/src/app/shop/[id]/page.tsx:90](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:90) 到 [apps/web/src/app/shop/[id]/page.tsx:109](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:109)，[apps/web/src/app/shop/[id]/page.tsx:161](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:161) 到 [apps/web/src/app/shop/[id]/page.tsx:193](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:161)。 |
| 接口证据 | 店铺详情页正式读链是 [docs/feature-progress.md:114](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:114) 标注的 `GET /api/shops/:id`。 |
| 日志/断言 | 失败后 `shopData = null`，但 `meta`、`scoreQuality`、`scoreShipping`、`scoreService`、`openedYear` 都继续用默认值或本地推导生成。 |
| 相关文件 | [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx) | 读取失败后继续渲染合成店铺数据。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 为 `/api/shops/:id` 失败引入整页错误态和重试入口，不再用路由参数、默认文案和本地评分推导出一张合成店铺页。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/shop/[id]/page.tsx:64](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:64) 到 [apps/web/src/app/shop/[id]/page.tsx:87](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:64) 的加载逻辑，以及 [apps/web/src/app/shop/[id]/page.tsx:251](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:251) 到 [apps/web/src/app/shop/[id]/page.tsx:274](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:251) 的错误态渲染；读取失败时页面已直接展示“店铺详情暂时不可用”和重试按钮，不再回退成合成店铺页。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx)、[apps/web/src/app/shop/[id]/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.module.css) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 店铺详情读取失败时会显示显式不可用态和重试，不再继续渲染伪造店铺信息、评分和开店时间。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了店铺详情页的读取失败分支和 `!shopData || !meta` 时的渲染路径；当前失败会直接展示“店铺详情暂时不可用 + 重新加载”，不会再用 `shopId`、默认文案、本地评分或等级推导出一张合成店铺页。 |
