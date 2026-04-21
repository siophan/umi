# BUG-20260420-076

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-076` |
| `title` | 品牌商品库筛选器和编辑表单都隐藏停用品牌/停用分类，现存商品无法按原绑定定位或原样编辑 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/brand-library/dictionaries` |
| `scope` | `admin` |
| `page` | `#/products/brands` |
| `api` | `/api/admin/products/brand-library` `/api/admin/brands` `/api/admin/categories` `/api/admin/products/brand-library/{id}` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brand-library-qa-2026-04-20.md` |
| `fingerprint` | `admin-brand-library:hide-disabled-brand-category-bindings` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 如果品牌商品当前仍挂在停用品牌或停用商品分类下，后台至少要允许按这些绑定筛出，并在编辑时保留当前绑定可见性。 |
| 对齐基准 | 现存业务数据不应因为品牌/分类停用就从筛选器和编辑表单里“消失”。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 品牌筛选器、品牌下拉只保留 `status === 'active'` 的品牌；分类筛选器、分类下拉只保留 `bizType === 'product' && status === 'active'` 的分类。结果是现存品牌商品若挂在停用品牌或停用分类下，就无法按原绑定筛出，编辑时也看不到当前品牌/分类选项。 |
| 影响范围 | 运营对停用品牌/停用分类下的现存品牌商品失去精确筛选和原样编辑能力。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 品牌筛选器和品牌下拉只保留 active 品牌，见 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:106) 到 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:121)。 |
| 页面证据 | 分类筛选器和分类下拉只保留 active 商品分类，见 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:116) 到 [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:133)。 |
| 接口证据 | 后端创建/编辑品牌商品时只校验品牌/分类存在，不校验它们是否 active，见 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:605) 到 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:628)，以及 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:708) 到 [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts:731)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx) | 字典选项把停用品牌和停用分类硬过滤掉了。 |
| [products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts) | 写链并没有和页面的 active-only 语义对齐。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 筛选器至少应覆盖当前数据里已被品牌商品使用的品牌/分类；编辑表单也要保留“当前绑定项”可见性。若停用品牌/分类不应再承接写入，则后端也要同步拒绝。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前品牌商品库筛选与编辑选项都会补回“当前绑定，已停用”的品牌和分类，现存绑定关系不会再因为主数据停用而从页面上消失。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `通过，关闭` |
| `说明` | [apps/admin/src/pages/brand-library-page.tsx:181](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:181) 到 [apps/admin/src/pages/brand-library-page.tsx:214](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:181) 的品牌/分类筛选器现已展示全量字典，并给停用项加标记；[apps/admin/src/pages/brand-library-page.tsx:215](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:215) 到 [apps/admin/src/pages/brand-library-page.tsx:305](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx:215) 的编辑表单选项会额外保留“当前绑定”的停用品牌和停用分类。原问题代码路径已消失。与停用品牌/分类的写链语义相关的问题继续由 `BUG-20260420-078` 单独跟踪。 |
