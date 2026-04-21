# Admin Brand Auth QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 品牌授权审核与授权记录 `#/shops/brand-auth` |
| 本轮重点 | 审核链、记录链、撤销语义、记录详情可追溯性 |
| 已确认 Bug | `3` |
| 阻塞项 | `0` |
| 结论 | 品牌授权模块主链已接真实 API，但页面把两条列表读链绑成了同一失败面；记录详情又没有把 scoped 授权的具体对象展示出来，而后端撤销 scoped 授权时还会把整品牌商品一起下架。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/shops/brand-auth` 审核列表 / 记录列表 / 详情抽屉 | `parity_gap` | 列表加载失败面耦合，记录详情缺具体授权对象，撤销语义按整品牌处理。 |
| `/api/admin/brands/auth-applies` `/api/admin/brands/auth-records` `/api/admin/brands/auth-records/{id}/revoke` | `parity_gap` | 两条读链独立但被页面合并处理；撤销写链没有按授权范围收口。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-079` | `P2` | `#/shops/brand-auth` | 品牌授权页把审核列表和授权记录绑成同一失败面，一条请求失败会清空两页数据 | [tests/bugs/open/BUG-20260420-079-admin-brand-auth-page-clears-both-tabs-when-one-request-fails.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-079-admin-brand-auth-page-clears-both-tabs-when-one-request-fails.md) |
| `BUG-20260420-080` | `P2` | `#/shops/brand-auth` | 品牌授权记录抽屉不展示具体授权对象，指定类目/商品授权无法复核 | [tests/bugs/open/BUG-20260420-080-admin-brand-auth-record-drawer-omits-scope-details.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-080-admin-brand-auth-record-drawer-omits-scope-details.md) |
| `BUG-20260420-081` | `P1` | `#/shops/brand-auth` | 撤销指定类目/指定商品授权时，后端会把该品牌全部在售商品一起下架 | [tests/bugs/open/BUG-20260420-081-admin-revoking-scoped-brand-auth-off-shelves-all-brand-products.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-081-admin-revoking-scoped-brand-auth-off-shelves-all-brand-products.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 加载失败面 | 审核列表和授权记录被绑进同一个失败面。 |
| 记录可追溯性 | 授权记录抽屉只展示范围标签，没有把 scoped 对象带出来。 |
| 撤销语义 | scoped 授权撤销时没有按范围精确收口，而是整品牌下架。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts) |
| 后端实现 | [apps/api/src/modules/admin/merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) |
| OpenAPI | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 撤销授权时按 `auth_scope + scope_value` 精确收口商品，不要再默认整品牌下架。 |
| `P2` | 拆开审核列表和授权记录的失败处理。 |
| `P2` | 在记录抽屉补齐 scoped 授权对象、subject 和必要审计字段。 |
