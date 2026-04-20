# Admin User List QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 后台用户列表 `#/users/list` 页面与 `/api/admin/users*` 契约审查 |
| 本轮重点 | 搜索筛选、分页口径、角色标签页计数、用户详情抽屉子表 |
| 已确认 Bug | `2` |
| 阻塞项 | `0` |
| 结论 | 用户列表主链路已接入真实 API，但当前存在两类关键 QA 缺口：一是手机号/店铺名称筛选只在当前页做本地过滤，伪装成全局搜索；二是“店主”标签计数与实际过滤/角色口径不一致，会误导后台运营统计判断。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/users/list` | `parity_gap` | 核心列表已接真实 API，但搜索与统计口径存在实质缺陷。 |
| `/api/admin/users` | `parity_gap` | 只承接 `keyword / role / page / pageSize`，未承接页面暴露的 `phone / shopName` 筛选。 |
| `/api/admin/users/:id` | `checked` | 详情抽屉主详情读取链路已接入，未在本轮发现新的契约错位。 |
| `/api/admin/users/:id/orders` | `checked` | 子表分页请求已接入，本轮重点不在详情子表。 |
| `/api/admin/users/:id/guesses` | `checked` | 子表分页请求已接入，本轮重点不在详情子表。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-039` | `P1` | `#/users/list` | 用户列表页手机号和店铺名称筛选只过滤当前页数据且保留全局分页总数 | [tests/bugs/open/BUG-20260420-039-admin-user-list-phone-shop-filters-only-apply-to-current-page.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-039-admin-user-list-phone-shop-filters-only-apply-to-current-page.md) |
| `BUG-20260420-040` | `P2` | `#/users/list` | 用户列表页“店主”标签计数与实际过滤口径不一致 | [tests/bugs/open/BUG-20260420-040-admin-user-list-shop-owner-tab-count-does-not-match-filter.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-040-admin-user-list-shop-owner-tab-count-does-not-match-filter.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 筛选口径 | 页面暴露了“手机号 / 店铺名称”两个正式搜索控件，但接口与共享查询类型完全不承接；最终表现成“当前页过滤冒充全局搜索”。 |
| 分页口径 | 表格 `total` 仍使用后端全量总数，和前端二次过滤后的 `visibleUsers` 不一致，会出现“空表格 + 全局总数”的假象。 |
| 统计口径 | “店主”标签计数只统计已认证店铺，但行级角色和过滤结果把“有店铺名但未认证”的用户也算成店主。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts) |
| 共享查询类型 | [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts) |
| 后端列表查询 | [apps/api/src/modules/users/admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts) |
| 行级角色映射 | [apps/api/src/modules/users/model.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/model.ts) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 让“手机号 / 店铺名称”进入真实后端查询，统一列表、总数、分页口径；如果暂不承接，移除这两个正式筛选控件。 |
| `P2` | 统一“店主”标签计数、`shop_owner` 过滤、行级 `role` 判定的语义；或者明确把标签改名为“已认证店铺”。 |
| `P2` | 为 `/api/admin/users` 增加专项自动化，覆盖筛选参数、角色统计和分页一致性。 |
