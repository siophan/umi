# BUG-20260420-078

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-078` |
| `title` | 品牌商品创建和编辑接口允许直接挂到停用品牌或停用分类，前后端语义不一致 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/brand-library/status-semantic` |
| `scope` | `admin` |
| `page` | `#/products/brands` |
| `api` | `/api/admin/products/brand-library` `/api/admin/products/brand-library/{id}` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brand-library-qa-2026-04-20.md` |
| `fingerprint` | `admin-brand-library:create-update-allows-disabled-brand-category` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 如果页面把停用品牌和停用商品分类视为不可选，后台创建/编辑品牌商品也应拒绝把新商品挂到这些停用对象上。 |
| 对齐基准 | 当前页面品牌下拉只暴露 active 品牌，分类下拉只暴露 active 商品分类。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `createAdminBrandProduct()` 和 `updateAdminBrandProduct()` 校验品牌、分类时只检查是否存在，不检查其状态是否为 active。也就是说，只要直接调用 API，就能把新品牌商品或已有品牌商品挂到停用品牌、停用分类下。 |
| 影响范围 | 品牌/分类状态约束只停留在前端表单层，无法真正阻止停用对象继续承接新品牌商品。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 页面品牌下拉只保留 active 品牌，分类下拉只保留 active 商品分类，见 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:106) 到 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:133)。 |
| 接口证据 | 创建品牌商品时，后端只校验品牌和分类存在，不校验状态，见 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:605) 到 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:628)。 |
| 接口证据 | 编辑品牌商品时，后端同样只校验品牌和分类存在，不校验状态，见 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:708) 到 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:731)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts) | 创建/编辑品牌商品没有把品牌状态、分类状态纳入校验。 |
| [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx) | 页面和接口对停用品牌/停用分类的语义不一致。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已在真实写链 `products-brand-library.ts` 收口品牌商品创建/编辑的状态约束：新增时要求品牌与商品分类都处于 active；编辑时允许保留“当前已绑定的停用品牌/停用分类”，但不允许改挂到其他停用对象。路由错误映射同步补了 `ADMIN_BRAND_PRODUCT_BRAND_DISABLED` 与 `ADMIN_BRAND_PRODUCT_CATEGORY_DISABLED`。 |
| 验证命令 | `pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 通过。品牌商品新增现在会拒绝停用品牌/停用分类；编辑仅允许保留当前已绑定的停用对象，不允许改挂到其他停用对象。`@umi/api` typecheck 通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复核通过。当前 [apps/api/src/modules/admin/products-brand-library.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products-brand-library.ts:137) 到 [apps/api/src/modules/admin/products-brand-library.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products-brand-library.ts:170) 创建链已拒绝停用品牌/停用类目；[apps/api/src/modules/admin/products-brand-library.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products-brand-library.ts:250) 到 [apps/api/src/modules/admin/products-brand-library.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products-brand-library.ts:285) 编辑链也只允许保留当前绑定的停用对象，不允许改挂到其他停用对象。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products-brand-library.ts`；`/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/catalog-routes.ts` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `已复核通过` |
| `说明` | `2026-04-21` 复核当前工作树后，真实写链 [apps/api/src/modules/admin/products-brand-library.ts:137](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products-brand-library.ts:137) 到 [apps/api/src/modules/admin/products-brand-library.ts:170](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products-brand-library.ts:170)、[apps/api/src/modules/admin/products-brand-library.ts:250](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products-brand-library.ts:250) 到 [apps/api/src/modules/admin/products-brand-library.ts:285](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products-brand-library.ts:285) 已补状态约束；原问题已修复。 |
