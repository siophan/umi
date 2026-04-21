# Admin Products List QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 商品列表模块 `#/products/list` |
| 本轮重点 | 商品列表分页/筛选口径、主表失败面、管理动作链 |
| 已确认 Bug | `5` |
| 阻塞项 | `0` |
| 结论 | 当前商品列表不是完整的后台管理页，而是“前 100 条商品的本地浏览壳”：服务端分页/搜索能力没有被消费，分类字典失败会拖垮主表，新增/编辑/上下架/删除链也整体缺失。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/products/list` | `parity_gap` | 只读取前 100 条做本地筛选，且页面操作退化成只读摘要。 |
| `/api/admin/products` | `parity_gap` | 后端已支持服务端分页和状态/关键字筛选，但当前页没有正确消费。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-121` | `P1` | `#/products/list` | 商品列表页只拉前 100 条并在前端做搜索、筛选和分页 | [tests/bugs/open/BUG-20260420-121-admin-products-page-loads-first-100-and-filters-locally.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-121-admin-products-page-loads-first-100-and-filters-locally.md) |
| `BUG-20260420-122` | `P2` | `#/products/list` | 商品列表页把分类字典失败误当成整页失败 | [tests/bugs/open/BUG-20260420-122-admin-products-page-clears-main-table-when-categories-fail.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-122-admin-products-page-clears-main-table-when-categories-fail.md) |
| `BUG-20260420-123` | `P1` | `#/products/list` | 商品列表页退化成只读摘要页，丢失新增、编辑、上下架和删除链路 | [tests/bugs/open/BUG-20260420-123-admin-products-page-lacks-management-actions.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-123-admin-products-page-lacks-management-actions.md) |
| `BUG-20260420-124` | `P2` | `#/products/list` | 商品列表页类目筛选会漏掉停用类目下的现存商品 | [tests/bugs/open/BUG-20260420-124-admin-products-category-filter-hides-disabled-categories.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-124-admin-products-category-filter-hides-disabled-categories.md) |
| `BUG-20260420-125` | `P2` | `#/products/list` | 商品列表页类目筛选只用类目名称，无法区分树形同名类目 | [tests/bugs/open/BUG-20260420-125-admin-products-category-filter-uses-name-instead-of-tree-id.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-125-admin-products-category-filter-uses-name-instead-of-tree-id.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 查询口径 | 页面没有消费后端的真实分页和筛选契约。 |
| 失败面 | 分类字典失败会把商品主表一起拖成错误态。 |
| 筛选准确性 | 类目筛选会漏掉停用类目下的现存商品。 |
| 筛选精度 | 类目筛选当前只按名称比对，无法区分树形同名类目。 |
| 管理动作 | 当前页已经失去商品管理的核心写链。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts) |
| 后端实现 / OpenAPI | [apps/api/src/modules/admin/products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/products.ts) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |
| 老系统参考 | [admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 把商品列表改回服务端分页和真实筛选。 |
| `P1` | 补回新增、编辑、上下架、删除等商品管理动作。 |
| `P2` | 把商品主表读链和分类字典解耦。 |
| `P2` | 让类目筛选覆盖停用类目下的现存商品。 |
| `P2` | 把类目筛选值从名称改成稳定 ID/路径。 |
