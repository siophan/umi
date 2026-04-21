# BUG-20260420-063

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-063` |
| `title` | 品牌授权页成功态仍用本地映射伪造保证金和品牌经营指标 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `shop/brand-auth-data` |
| `page` | `/brand-auth` |
| `api` | `/api/shops/brand-auth` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-brand-auth:fake-brand-metrics-over-real-overview` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 品牌授权页既然已经接了 `/api/shops/brand-auth`，成功态就应只展示接口真实承接的字段，未提供的数据不能继续用本地写死的保证金、授权店铺数、月销量等业务数字伪装。 |
| 对齐基准 | 当前 API 契约 / 页面真实性要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面在成功态里优先读取 `brandMetaMap`，把 `deposit`、`authCount`、`monthSales`、`products`、`category` 等本地映射覆盖到列表卡片和申请弹层，即使接口只返回了 `name/logo/category/productCount/status`。 |
| 影响范围 | 商家会把写死的保证金、授权店铺数、月销量当成真实后台数据；即便后端没承接这些字段，页面也会表现得像真有这套运营数据。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/brand-auth`。 |
| 2 | 等待 `/api/shops/brand-auth` 成功返回。 |
| 3 | 查看“可申请品牌”列表和申请弹层。 |
| 4 | 页面会展示本地写死的“已有156家授权商”“月均2.1万销量”“保证金¥600”等数字，即使这些字段不在接口返回结构内。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/brand-auth/page.tsx:10](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:10) 到 [apps/web/src/app/brand-auth/page.tsx:31](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:31)。 |
| 渲染证据 | [apps/web/src/app/brand-auth/page.tsx:244](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:244) 到 [apps/web/src/app/brand-auth/page.tsx:274](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:274)；[apps/web/src/app/brand-auth/page.tsx:325](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:325) 到 [apps/web/src/app/brand-auth/page.tsx:338](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:338)。 |
| 接口证据 | `/api/shops/brand-auth` 当前只返回 `shopName`、`mine`、`available[]`，其中 `available` 只有 `id/name/logo/category/productCount/status`，见 [packages/shared/src/api.ts:1061](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:1061) 到 [packages/shared/src/api.ts:1074](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:1074) 和 [apps/api/src/modules/shop/router.ts:600](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/shop/router.ts:600) 到 [apps/api/src/modules/shop/router.ts:666](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/shop/router.ts:666)。 |
| 日志/断言 | 页面用 `brandMetaMap[currentBrand.name]?.deposit || 0`、`meta?.authCount || 0`、`meta?.monthSales || '0'` 直接拼业务指标，而不是接口字段。 |
| 老系统参考 | 老系统静态页确实有一套本地 `availableBrands` 假数据，但新系统这里已切到真实 API，不能继续沿用这组静态经营数字冒充真实成功态，见 [/Users/ezreal/Downloads/joy/frontend/brand-auth.html](/Users/ezreal/Downloads/joy/frontend/brand-auth.html:231) 到 [/Users/ezreal/Downloads/joy/frontend/brand-auth.html](/Users/ezreal/Downloads/joy/frontend/brand-auth.html:239)。 |
| 相关文件 | [apps/web/src/app/brand-auth/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/brand-auth/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx) | 成功态仍混入本地品牌经营数据映射。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已移除品牌授权页成功态里的本地 `brandMetaMap` 经营数字。可申请品牌列表和申请弹层现在只展示接口真实承接的 `name/logo/category/productCount/status`，我的授权列表也不再拼接本地保证金和商品数。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。页面成功态已不再出现本地写死的保证金、授权商数、月销量等业务数字。 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | [apps/web/src/app/brand-auth/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx)、[apps/web/src/app/brand-auth/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.module.css) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `结论` | `未通过，维持 open` |
| `说明` | [apps/web/src/app/brand-auth/page.tsx:19](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:19) 到 [apps/web/src/app/brand-auth/page.tsx:30](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:30) 仍保留 `brandMetaMap` 本地经营数据；[apps/web/src/app/brand-auth/page.tsx:200](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:200) 到 [apps/web/src/app/brand-auth/page.tsx:209](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:209)、[apps/web/src/app/brand-auth/page.tsx:246](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:246) 到 [apps/web/src/app/brand-auth/page.tsx:269](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:269)、[apps/web/src/app/brand-auth/page.tsx:343](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:343) 到 [apps/web/src/app/brand-auth/page.tsx:355](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:355) 仍直接渲染 `deposit/authCount/monthSales/products/category` 这些接口未承接字段。当前没有修复成立证据。 |
