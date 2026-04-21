# BUG-20260420-121

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-121` |
| `title` | 商品列表页只拉前 100 条并在前端做搜索、筛选和分页 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/products-local-filtering` |
| `scope` | `admin` |
| `page` | `#/products/list` |
| `api` | `/api/admin/products` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-products-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-products:loads-first-100-and-filters-locally` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 商品列表页的搜索、状态切换和分页应走服务端查询，不能先固化读取前 100 条再在浏览器本地裁切。 |
| 对齐基准 | 后台列表真实性规则，以及 `/api/admin/products` 已声明的分页/关键字/状态查询契约。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面初始化固定请求 `fetchAdminProducts({ page: 1, pageSize: 100 })`，后续“商品名称 / 分类 / 店铺 / 状态”全都在本地 `products` 数组上过滤，表格分页也只是在这 100 条里翻页。 |
| 影响范围 | 第 101 条之后的商品无法被当前页面搜索或翻页定位，服务端分页和状态筛选能力被前端绕开。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/products/list`。 |
| 2 | 查看页面取数和筛选逻辑。 |
| 3 | 对照 `/api/admin/products` 的契约。 |
| 4 | 页面始终只读取前 100 条，然后在本地搜索、切状态和分页。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:41) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:49) 固定请求 `page: 1, pageSize: 100`；[apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:71) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:90) 所有筛选都在 `products.filter()` 上本地完成；[apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:202) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:210) 表格分页也只是当前本地结果分页。 |
| 前端接口证据 | [apps/admin/src/lib/api/catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts:108) 到 [apps/admin/src/lib/api/catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts:117) `fetchAdminProducts()` 目前只承接 `page/pageSize`，页面没有把搜索和状态传进去。 |
| 后端证据 | [apps/api/src/modules/admin/products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:314) 到 [apps/api/src/modules/admin/products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:375) 后端已经支持 `keyword` 和 `status` 过滤；[apps/api/src/modules/admin/products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:409) 到 [apps/api/src/modules/admin/products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:471) 也是真正的服务端分页查询；[apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:330) 到 [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:359) 公开契约同样声明了这些参数。 |
| 相关文件 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) [apps/admin/src/lib/api/catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts) [apps/api/src/modules/admin/products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) | 当前把商品列表退化成“前 100 条本地过滤”。 |
| [apps/admin/src/lib/api/catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts) | 前端没有把查询条件完整承接到接口层。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
