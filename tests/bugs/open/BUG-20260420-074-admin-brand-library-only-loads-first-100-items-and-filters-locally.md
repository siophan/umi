# BUG-20260420-074

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-074` |
| `title` | 品牌商品库只预取前 100 条并在本地筛选分页，100 条后的记录无法被检索或翻页看到 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/brand-library/pagination` |
| `scope` | `admin` |
| `page` | `#/products/brands` |
| `api` | `/api/admin/products/brand-library` |
| `owner` | `测试狗` |
| `source_run` | `admin-brand-library-qa-2026-04-20.md` |
| `fingerprint` | `admin-brand-library:first-100-only-local-filters` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 品牌商品库的分页、搜索、状态和筛选应基于后端总数据集，而不是只在首批预取数据上本地切片。 |
| 对齐基准 | `/api/admin/products/brand-library` 已提供 `page / pageSize / keyword / status / total` 契约，说明这是服务端分页列表。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面初始化固定请求 `fetchAdminBrandLibrary({ page: 1, pageSize: 100 })`，后续表格分页、搜索、状态 tabs 都只在这 100 条本地数据上做过滤和分页，没有继续请求后端下一页，也没使用接口自带的 `keyword / status`。 |
| 影响范围 | 当品牌商品库超过 100 条时，后续记录在页面中完全不可见，也无法被搜索、筛选或状态统计命中。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 准备超过 100 条品牌商品。 |
| 2 | 打开品牌商品库页面。 |
| 3 | 页面只请求一次 `page=1&pageSize=100`。 |
| 4 | 表格的翻页、搜索、状态切换都只作用于这首批 100 条，后续记录不会再出现。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 页面初始化固定请求 `fetchAdminBrandLibrary({ page: 1, pageSize: 100 })`，见 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:88) 到 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:92)。 |
| 页面证据 | 表格分页和筛选都绑定在 `filteredRows` 本地数组上，没有任何地方把 `page / keyword / status` 回传给接口，见 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:135) 到 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:142)，以及 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:223) 到 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:246)。 |
| 接口证据 | 后端品牌商品库列表明确支持 `page / pageSize / keyword / status`，并返回 `total / page / pageSize`，见 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:687) 到 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:702)，以及 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:474) 到 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:531)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx) | 页面把服务端分页列表退化成了首批 100 条本地切片。 |
| [catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts) | 已有分页参数能力，但页面没有按真实交互使用。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 品牌商品库应改成真实服务端列表：分页、搜索、状态、筛选都驱动接口查询，不能再把首批 100 条当全量数据。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
