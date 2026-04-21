# Admin Brands List QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 品牌列表 `#/brands/list` 及其直接依赖的 `/api/admin/brands` `/api/admin/categories` |
| 本轮重点 | 主表加载、类目筛选、编辑表单字典、类目状态语义 |
| 已确认 Bug | `5` |
| 阻塞项 | `0` |
| 结论 | 品牌列表主链已接上真实品牌接口，但页面仍把类目字典和主表绑在一起处理；同时围绕停用类目的前后端语义没有收口，既影响现存品牌筛选/编辑，也允许直接把新品牌挂到停用类目下，搜索能力还从“品牌名/联系人”退化成只搜品牌名，类目筛选本身也缺少树形分类所需的唯一标识。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/brands/list` 主列表 / 筛选 / 编辑弹层 | `parity_gap` | 类目字典失败会清空主表，停用类目也会从筛选器和编辑表单里消失。 |
| `/api/admin/brands` `/api/admin/brands/{id}` | `parity_gap` | 列表读链允许返回停用类目品牌，且写链也允许把品牌直接挂到停用类目上，前后端语义没有收口。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-069` | `P2` | `#/brands/list` | 品牌列表页把类目接口失败误当成整页失败，辅助字典异常会清空主表 | [tests/bugs/open/BUG-20260420-069-admin-brands-page-clears-main-table-when-categories-request-fails.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-069-admin-brands-page-clears-main-table-when-categories-request-fails.md) |
| `BUG-20260420-070` | `P2` | `#/brands/list` | 品牌列表筛选器和编辑表单都隐藏停用类目，现存品牌无法按原类目定位或原样编辑 | [tests/bugs/open/BUG-20260420-070-admin-brands-page-hides-disabled-categories-from-filter-and-edit-form.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-070-admin-brands-page-hides-disabled-categories-from-filter-and-edit-form.md) |
| `BUG-20260420-071` | `P2` | `#/brands/list` | 品牌创建和编辑接口允许直接挂到停用类目，前后端语义不一致 | [tests/bugs/open/BUG-20260420-071-admin-brand-create-update-allows-disabled-categories.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-071-admin-brand-create-update-allows-disabled-categories.md) |
| `BUG-20260420-072` | `P2` | `#/brands/list` | 品牌列表搜索范围退化为只搜品牌名，无法再按联系人定位品牌 | [tests/bugs/open/BUG-20260420-072-admin-brands-search-no-longer-covers-contact-fields.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-072-admin-brands-search-no-longer-covers-contact-fields.md) |
| `BUG-20260420-073` | `P2` | `#/brands/list` | 品牌列表类目筛选只用类目名称，不足以区分树形分类里的同名节点 | [tests/bugs/open/BUG-20260420-073-admin-brands-category-filter-uses-name-instead-of-category-id.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-073-admin-brands-category-filter-uses-name-instead-of-category-id.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 加载失败面 | 页面把品牌主表和类目字典绑成一个失败面，辅助接口异常会扩大成整页失败。 |
| 类目语义 | 列表能读到停用类目品牌，但筛选器和编辑弹层只暴露 active 类目，读写口径脱节。 |
| 写链约束 | 页面把停用类目视为不可选，但后台创建/编辑品牌并不会拒绝停用类目。 |
| 搜索能力 | 老后台支持按品牌名/联系人检索，新页已经退化成只搜品牌名。 |
| 筛选精度 | 品牌类目是树形结构，但当前筛选器只拿类目名称做值，无法区分同名节点。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts) [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts) |
| 后端实现 | [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) |
| OpenAPI | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P2` | 拆开品牌主表和类目字典的失败处理，避免类目接口异常时清空主表。 |
| `P2` | 调整类目筛选器和编辑表单的选项来源，至少保留当前已被品牌使用的停用类目。 |
| `P2` | 收口停用类目的写入语义：要么后端拒绝停用类目，要么页面和接口都明确允许。 |
| `P2` | 把联系人姓名/电话重新纳入品牌检索范围，恢复老后台搜索能力。 |
| `P2` | 把类目筛选切到 `categoryId` 或完整路径，避免树形分类同名节点被混筛。 |
