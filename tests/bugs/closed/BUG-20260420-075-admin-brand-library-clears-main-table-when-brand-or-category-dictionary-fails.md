# BUG-20260420-075

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-075` |
| `title` | 品牌商品库把品牌/分类字典失败误当成整页失败，辅助字典异常会清空主表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/brand-library/load` |
| `scope` | `admin` |
| `page` | `#/products/brands` |
| `api` | `/api/admin/products/brand-library` `/api/admin/brands` `/api/admin/categories` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brand-library-qa-2026-04-20.md` |
| `fingerprint` | `admin-brand-library:dictionary-failure-clears-main-table` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 品牌商品主表应独立可读；品牌字典或分类字典失败时，最多影响筛选器和表单，不应把主表一起清空。 |
| 对齐基准 | 品牌商品库是主链路，品牌/分类列表只是辅助字典。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面初始化把品牌商品、品牌字典、分类字典绑进同一个 `Promise.all`。只要任意一个辅助字典失败，就会 `setData(emptyData)`，把品牌商品主表也一起清空。 |
| 影响范围 | 后台会把“品牌字典失败”或“分类字典失败”误展示成整页无数据。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 页面初始化把三条请求绑进同一个 `Promise.all`，失败后直接 `setData(emptyData)`，见 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:86) 到 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:98)。 |
| 接口证据 | 品牌商品、品牌字典、分类字典本来是三条独立请求，见 [catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts:109)、[merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:169)、[categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:42)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx) | 主表和辅助字典被绑成一个失败面。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已拆开品牌商品主表与品牌/分类字典的失败处理：页面初始化改成 `Promise.allSettled`，主表、品牌字典、分类字典各自落各自结果；字典失败时只暴露局部 warning，不再把品牌商品主表一起清空。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。品牌商品主表现在可以在字典异常时独立保留；admin `typecheck` 与 `build` 均通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前品牌商品库页已改成 `Promise.allSettled` 分开处理主列表、品牌字典和分类字典；任一辅助字典失败时只会记录局部 warning，不再把主表一起清空。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `通过，关闭` |
| `说明` | [apps/admin/src/pages/brand-library-page.tsx:128](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:128) 到 [apps/admin/src/pages/brand-library-page.tsx:169](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:128) 已用 `Promise.allSettled` 分开处理主表、品牌字典、分类字典；[apps/admin/src/pages/brand-library-page.tsx:368](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:368) 到 [apps/admin/src/pages/brand-library-page.tsx:382](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:368) 已把品牌/分类字典失败降成局部 warning。原问题代码路径已消失。 |
