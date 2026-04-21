# BUG-20260420-042

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-042` |
| `title` | 店铺详情成功态仍用本地推导伪造评分和开店时间 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `shop/detail` |
| `page` | `/shop/[id]` |
| `api` | `/api/shops/:id` |
| `owner` | `用户端全栈一` |
| `source_run` | `manual-review-2026-04-20` |
| `fingerprint` | `web-shop-detail:success-state-synthetic-score-opened-year` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Regression

| 字段 | 值 |
| --- | --- |
| `reopened_at` | `2026-04-21` |
| `reopened_by` | `测试猫` |
| `reason` | 当前 [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:125) 到 [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:126) 仍在无真实评分数据时回退 `avgRating = '4.8'`，并在 [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:331) 到 [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:332) 作为“商品均分”正式展示，属于旧问题回归。 |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 店铺详情成功态应只展示真实接口字段或基于真实列表的明确聚合结果，不应在页面内推导“商品质量 / 物流速度 / 服务态度 / 开店时间”这类看起来像平台真实口径的数据。 |
| 对齐基准 | 当前产品要求 / 页面真实接口语义 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面成功读取店铺后，仍然把 `avgRating`、`openedYear`、`scoreQuality`、`scoreShipping`、`scoreService`、`scoreAverage` 在前端自行推导出来，并渲染成正式店铺评分卡和“城市 · 开店时间”。 |
| 影响范围 | 用户会把本地推导值误认为平台真实店铺评分、真实服务指标和真实开店时间，页面数据语义失真。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开任意已有数据的 `/shop/[id]`。 |
| 2 | 观察头图标签、评分卡和经营概览。 |
| 3 | 页面会展示“商品质量 / 物流速度 / 服务态度 / 开店时间”等本地推导值，而不是接口真实字段。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:152) 到 [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:192)，以及 [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:376) 到 [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:435)。 |
| 接口证据 | 当前页面读链是 `fetchShopDetail(shopId)`，但这些评分和开店时间并非接口字段。 |
| 日志/断言 | `openedYear` 来自商品创建时间最小值，`scoreQuality / scoreShipping / scoreService` 都来自 `avgRating` 二次推导。 |
| 相关文件 | [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx) | 成功态仍混入本地合成评分和开店时间。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 后端 `GET /api/shops/:id` 改为直接返回真实 `product.sales` 和 `product.rating`，店铺均分只基于真实评分字段聚合；前端移除了本地 `4.8` 回退和“商品均分”伪统计卡，不再把本地推导值包装成正式评分表达。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/api typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。接口和页面都已不再伪造评分口径；`/shop/[id]` 成功态只展示真实店铺字段和明确聚合值。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | [apps/api/src/modules/shop/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/shop/router.ts)、[apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 店铺详情成功态只保留真实店铺字段和明确聚合值，不再展示本地合成的评分、服务分和开店时间。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/web/src/app/shop/[id]/page.tsx:87](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:87) 到 [apps/web/src/app/shop/[id]/page.tsx:96](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:96)、[apps/web/src/app/shop/[id]/page.tsx:136](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:136) 到 [apps/web/src/app/shop/[id]/page.tsx:145](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:145)、[apps/web/src/app/shop/[id]/page.tsx:320](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:320) 到 [apps/web/src/app/shop/[id]/page.tsx:355](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:320)，页面已不再生成原问题里的 `openedYear / scoreQuality / scoreShipping / scoreService / scoreAverage` 这类本地合成字段，也没有“城市 · 开店时间”式伪表达；当前只保留真实店铺字段，以及基于真实商品/竞猜列表做的明确聚合值。 |
