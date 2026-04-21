# Admin Shop Products & Applies QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 店铺商品和入驻审核模块 `#/shops/products` `#/shops/apply` |
| 本轮重点 | 店铺商品筛选/分页口径、开店审核主表读链、主营类目筛选准确性 |
| 已确认 Bug | `3` |
| 阻塞项 | `0` |
| 结论 | 两个页面都已经接上 admin API，但店铺商品仍然是“全量拉取 + 本地筛选/分页”的假查询模式；开店审核则继续存在“字典失败拖垮主表”和“停用类目申请无法筛出”的老问题。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/shops/products` | `parity_gap` | 当前整表拉取商品并在前端做搜索、筛选和分页。 |
| `#/shops/apply` | `parity_gap` | 审核链可读写，但辅助字典失败会拖垮主表，类目筛选也会漏掉停用类目申请。 |
| `/api/admin/shops/products` | `parity_gap` | 当前只返回全量商品，未承接分页和筛选参数。 |
| `/api/admin/shops/applies` | `parity_gap` | 主审核列表可读，但页面没有把它和类目字典正确解耦。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-114` | `P1` | `#/shops/products` | 店铺商品页一次性拉全量商品再做本地筛选和分页 | [tests/bugs/open/BUG-20260420-114-admin-shop-products-page-loads-entire-table-and-filters-locally.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-114-admin-shop-products-page-loads-entire-table-and-filters-locally.md) |
| `BUG-20260420-115` | `P2` | `#/shops/apply` | 开店审核页把类目字典失败误当成整页失败 | [tests/bugs/open/BUG-20260420-115-admin-shop-applies-page-clears-main-table-when-categories-request-fails.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-115-admin-shop-applies-page-clears-main-table-when-categories-request-fails.md) |
| `BUG-20260420-116` | `P2` | `#/shops/apply` | 开店审核页主营类目筛选会漏掉停用类目下的现存申请 | [tests/bugs/open/BUG-20260420-116-admin-shop-applies-category-filter-hides-disabled-categories.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-116-admin-shop-applies-category-filter-hides-disabled-categories.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 查询口径 | 店铺商品页仍是本地假查询，不是真正的服务端分页/筛选。 |
| 失败面 | 开店审核主表和类目字典仍被绑成同一失败面。 |
| 筛选精度 | 开店审核类目筛选会漏掉停用类目下的现存申请。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx) [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts) |
| 后端实现 | [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 把店铺商品页改成服务端承接筛选和分页。 |
| `P2` | 把开店审核主表和类目字典解耦，避免字典失败清空主表。 |
| `P2` | 让开店审核类目筛选覆盖停用类目下的现存申请。 |
