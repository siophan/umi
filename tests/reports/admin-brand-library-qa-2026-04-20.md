# Admin Brand Library QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 品牌商品库 `#/products/brands` 及其直接依赖的 `/api/admin/products/brand-library` `/api/admin/brands` `/api/admin/categories` |
| 本轮重点 | 分页口径、主表加载、品牌/分类字典、编辑表单绑定 |
| 已确认 Bug | `5` |
| 阻塞项 | `0` |
| 结论 | 品牌商品库的核心问题是把服务端分页列表退化成了“首批 100 条本地切片”；同时页面仍把两个辅助字典失败扩大成整页失败，没有承接停用品牌/停用分类下的现存商品绑定，分类筛选本身也缺少树形分类所需的唯一标识，而且后台写链仍允许把新商品直接挂到停用品牌/停用分类上。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/products/brands` 主列表 / 筛选 / 编辑弹层 | `parity_gap` | 页面只预取前 100 条本地分页，品牌/分类字典失败会清空主表，停用绑定也会从筛选和编辑中消失。 |
| `/api/admin/products/brand-library` | `parity_gap` | 后端已提供真实分页和筛选契约，但页面没有按真实列表链路消费。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-074` | `P1` | `#/products/brands` | 品牌商品库只预取前 100 条并在本地筛选分页，100 条后的记录无法被检索或翻页看到 | [tests/bugs/open/BUG-20260420-074-admin-brand-library-only-loads-first-100-items-and-filters-locally.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-074-admin-brand-library-only-loads-first-100-items-and-filters-locally.md) |
| `BUG-20260420-075` | `P2` | `#/products/brands` | 品牌商品库把品牌/分类字典失败误当成整页失败，辅助字典异常会清空主表 | [tests/bugs/open/BUG-20260420-075-admin-brand-library-clears-main-table-when-brand-or-category-dictionary-fails.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-075-admin-brand-library-clears-main-table-when-brand-or-category-dictionary-fails.md) |
| `BUG-20260420-076` | `P2` | `#/products/brands` | 品牌商品库筛选器和编辑表单都隐藏停用品牌/停用分类，现存商品无法按原绑定定位或原样编辑 | [tests/bugs/open/BUG-20260420-076-admin-brand-library-form-and-filters-hide-disabled-brand-and-category-bindings.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-076-admin-brand-library-form-and-filters-hide-disabled-brand-and-category-bindings.md) |
| `BUG-20260420-077` | `P2` | `#/products/brands` | 品牌商品库分类筛选只用类目名称，不足以区分树形商品分类里的同名节点 | [tests/bugs/open/BUG-20260420-077-admin-brand-library-category-filter-uses-name-instead-of-category-id.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-077-admin-brand-library-category-filter-uses-name-instead-of-category-id.md) |
| `BUG-20260420-078` | `P2` | `#/products/brands` | 品牌商品创建和编辑接口允许直接挂到停用品牌或停用分类，前后端语义不一致 | [tests/bugs/open/BUG-20260420-078-admin-brand-library-create-update-allows-disabled-brand-and-category.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-078-admin-brand-library-create-update-allows-disabled-brand-and-category.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 列表口径 | 页面把服务端分页列表退化成首批 100 条本地切片，后续记录无法进入页面。 |
| 加载失败面 | 主表和品牌/分类字典被绑成一个失败面，辅助接口异常会扩大成整页失败。 |
| 绑定语义 | 页面筛选器和编辑表单不承接停用品牌/停用分类下的现存绑定。 |
| 筛选精度 | 商品分类是树形结构，但当前筛选器只拿分类名称做值，无法区分同名节点。 |
| 写链约束 | 页面把停用品牌/停用分类视为不可选，但后台创建/编辑品牌商品并不会拒绝它们。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts) [apps/admin/src/lib/api/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts) [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts) |
| 后端实现 | [apps/api/src/modules/admin/products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts) |
| OpenAPI | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 把品牌商品库切回真实服务端分页、搜索和状态筛选，不能再只操作前 100 条本地切片。 |
| `P2` | 拆开品牌商品主表与品牌/分类字典的失败处理。 |
| `P2` | 承接停用品牌/停用分类下的现存绑定，至少保证可筛选、可查看、可原样编辑。 |
| `P2` | 把商品分类筛选切到 `categoryId` 或完整路径，避免树形分类同名节点被混筛。 |
| `P2` | 收口停用品牌/停用分类的写入语义：要么后端拒绝，要么页面和接口一起明确允许。 |
