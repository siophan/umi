# BUG-20260420-114

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-114` |
| `title` | 店铺商品页一次性拉全量商品再做本地筛选和分页 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/shops/products-local-filtering` |
| `scope` | `admin` |
| `page` | `#/shops/products` |
| `api` | `/api/admin/shops/products` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-shop-products-applies-qa-2026-04-20.md` |
| `fingerprint` | `admin-shop-products:loads-entire-table-and-filters-locally` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 店铺商品页的搜索、筛选和分页应走服务端查询，不应先把整表拉回前端再本地裁切。 |
| 对齐基准 | 后台分页/筛选真实性规则。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面初始化时直接调用一次 `fetchAdminShopProducts()` 取回全量 `items`，之后所有店铺名、商品名、品牌和状态筛选都在浏览器本地完成，分页也是前端表格分页。 |
| 影响范围 | 数据量上来后会导致首屏过重、筛选结果不稳定，也无法保证分页和检索对全量数据始终可靠。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/shops/products`。 |
| 2 | 查看页面和接口封装。 |
| 3 | 观察筛选和分页逻辑。 |
| 4 | 页面只请求一次 `/api/admin/shops/products`，随后所有筛选和分页都在本地 `rows` 上执行。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx:41) 到 [apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx:49) 首屏只把 `result.items` 整体塞进 `rows`；[apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx:81) 到 [apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx:102) 所有筛选都在 `rows.filter()` 上本地执行；[apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx:157) 到 [apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx:166) 分页完全交给前端表格。 |
| 接口证据 | [apps/admin/src/lib/api/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:224) 到 [apps/admin/src/lib/api/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:230) `fetchAdminShopProducts()` 没有任何查询参数；[apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1435) 到 [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1489) 后端也是整表查询 `product` 后直接返回全部结果。 |
| 相关文件 | [apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx) [apps/admin/src/lib/api/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts) [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx) | 页面按整表结果做本地筛选和分页。 |
| [apps/admin/src/lib/api/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts) | 店铺商品查询没有承接任何筛选参数。 |
| [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) | `/api/admin/shops/products` 当前直接返回全量商品。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
