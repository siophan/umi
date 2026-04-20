# Admin Shops List QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 后台店铺列表 `#/shops/list` 模块审查 |
| 本轮重点 | 列表筛选、状态操作、查看动作、店铺详情承接 |
| 已确认 Bug | `2` |
| 阻塞项 | `0` |
| 结论 | 店铺列表主列表和状态变更链路已接真实 API，但当前模块仍有两个关键缺口：一是“查看”只有摘要抽屉，没有真实详情和关联记录链路；二是主营类目筛选会漏掉停用类目下仍存在的店铺。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/shops/list` 主列表 | `parity_gap` | 列表可读、状态可改，但详情和筛选仍有明显缺口。 |
| `#/shops/list` 查看抽屉 | `parity_gap` | 只有摘要预览，没有真实详情链路或关联记录。 |
| `#/shops/list` 状态操作 | `checked` | `/api/admin/shops/{id}/status` 已接入，启用/暂停/关闭动作链路存在。 |
| `/api/admin/shops` | `parity_gap` | 只提供列表摘要，不足以支撑“查看”动作的完整详情。 |
| `/api/admin/shops/{id}/status` | `checked` | 接口契约和页面动作已对接，本轮未发现新的状态映射错误。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-044` | `P1` | `#/shops/list` | 店铺列表“查看”动作只有摘要抽屉，缺少真实详情链路和关联记录 | [tests/bugs/open/BUG-20260420-044-admin-shops-view-action-lacks-real-detail-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-044-admin-shops-view-action-lacks-real-detail-chain.md) |
| `BUG-20260420-045` | `P2` | `#/shops/list` | 店铺列表主营类目筛选会漏掉停用类目下的现存店铺 | [tests/bugs/open/BUG-20260420-045-admin-shops-category-filter-hides-disabled-categories.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-045-admin-shops-category-filter-hides-disabled-categories.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 详情链路 | 当前“查看”只是把列表摘要再显示一遍，没有商品、订单、品牌授权等关联记录。 |
| API 承接 | 店铺列表 API 只承接摘要，没有对应详情接口或详情契约。 |
| 筛选覆盖 | 主营类目筛选优先只看启用分类，无法完整覆盖当前表格里真实存在的类目值。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts) |
| 后端列表查询 | [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) |
| OpenAPI | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |
| 老后台详情参考 | [admin/src/pages/shops/detail.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/shops/detail.tsx) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 为店铺列表补真实详情链路和对应 API，至少覆盖基础信息、状态、商品、订单、品牌授权。 |
| `P2` | 调整主营类目筛选选项来源，确保能覆盖停用但仍被店铺引用的类目。 |
| `P2` | 后续为 `/api/admin/shops` 和店铺详情链路补专项自动化。 |
