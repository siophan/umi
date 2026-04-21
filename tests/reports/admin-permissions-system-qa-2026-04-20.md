# Admin Permissions And System QA Report

最后更新：2026-04-21

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 后台“权限与系统”分组模块审查：`#/system/users` `#/system/roles` `#/users/permissions` `#/system/categories` `#/system/notifications` |
| 本轮重点 | 系统用户动作与筛选、角色权限链、权限树完整性、分类管理、通知批次与详情可追溯性 |
| 已确认 Bug | `16` |
| 阻塞项 | `0` |
| 结论 | 这组模块的基础读写链路大体已接真实 API，但 5 个模块逐页细看后都还能确认到管理闭环缺口：系统用户不但有动作和加载耦合问题，还把接口已经产出的系统用户总览丢掉了；角色管理除了权限统计失真，还把接口已经产出的角色总览丢掉了；权限管理除了树结构和目录同步问题外，后台 API 授权本身也还没真正落到权限码层，而且连接口已经产出的权限总览也没接；分类管理除了暴露必然失败的父分类选项，还把接口已经产出的分类总览丢掉了；系统通知则仍有批次边界缺失、列表截断和总览丢失问题。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/system/users` 主列表 | `parity_gap` | 当前登录账号仍暴露必然失败的停用动作，角色筛选不能覆盖停用角色绑定，角色接口失败还会把整张用户表清空，而且系统用户列表接口已返回 summary，但页面没有展示系统用户总览。 |
| `#/system/roles` 主列表 / 权限配置 | `parity_gap` | 角色统计把停用权限继续算进“权限数 / 权限模块”，和真实生效权限不一致；角色列表接口已经返回 summary，但页面没有展示角色总览。 |
| `#/users/permissions` 主列表 / 编辑弹层 | `parity_gap` | 既没有防循环校验，又允许直接编辑内置权限，而这些编辑会被目录同步覆盖或导致重复权限；此外停用父权限也不会撤销已展开到角色上的子权限生效，权限管理页本身还未真正把后台接口授权收口到权限码，而且权限列表接口已返回 summary，但页面没有展示权限总览。 |
| `#/system/categories` 主列表 / 编辑弹层 | `parity_gap` | 新增弹层仍暴露停用父分类，页面允许选择但后端必然拒绝；分类列表接口已经返回 summary，但页面没有展示分类总览。 |
| `#/system/notifications` 列表 / 发送 / 查看 | `parity_gap` | 列表不是基于真实批次模型，重复发送会误并，且当前只覆盖最近 100 个批次，接口已返回的 summary/basis 也没有在页面展示。 |
| `/api/admin/system-users` `/api/admin/system-users/{id}/status` | `parity_gap` | 页面动作与后端规则不一致，筛选维度没有覆盖停用角色，且角色接口异常会扩大成整页失败。 |
| `/api/admin/roles` `/api/admin/roles/{id}/permissions` | `parity_gap` | 角色统计口径会高估停用权限。 |
| `/api/admin/permissions/{id}` | `parity_gap` | 更新权限时缺少循环父子关系校验；内置权限编辑结果不会稳定保留，父权限停用后子权限也不会一起收口。 |
| `/api/admin/*` 受保护后台接口 | `parity_gap` | 当前后端只做管理员登录校验，没有按权限码拦截隐藏模块对应的 admin API。 |
| `/api/admin/notifications` | `parity_gap` | 当前没有真实批次主键，重复发送会被批次聚合吞边界；列表还固定截断在最近 100 条，虽然返回了 summary/basis，但页面没有消费。 |
| `/api/admin/categories` | `parity_gap` | 创建链路不允许停用父分类，但页面选项源没有同步收口；接口已返回 summary，页面却没有消费分类总览。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-046` | `P2` | `#/system/users` | 系统用户列表对当前登录账号仍暴露“停用”动作，点击后只会命中后端拒绝 | [tests/bugs/open/BUG-20260420-046-admin-system-users-self-disable-action-should-be-hidden.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-046-admin-system-users-self-disable-action-should-be-hidden.md) |
| `BUG-20260420-047` | `P2` | `#/system/users` | 系统用户列表角色筛选只显示启用角色，导致已绑定停用角色的账号无法被筛出 | [tests/bugs/open/BUG-20260420-047-admin-system-users-role-filter-hides-disabled-roles.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-047-admin-system-users-role-filter-hides-disabled-roles.md) |
| `BUG-20260420-048` | `P1` | `#/users/permissions` | 权限管理允许把权限父节点改成自己的子节点，能写出循环父子关系 | [tests/bugs/open/BUG-20260420-048-admin-permissions-allows-cyclic-parent-relations.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-048-admin-permissions-allows-cyclic-parent-relations.md) |
| `BUG-20260420-050` | `P1` | `#/system/notifications` | 系统通知列表按消息载荷聚合，重复发送同一内容会被错误合并成一条批次 | [tests/bugs/open/BUG-20260420-050-admin-notifications-batch-list-merges-repeated-sends.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-050-admin-notifications-batch-list-merges-repeated-sends.md) |
| `BUG-20260420-057` | `P2` | `#/system/users` | 系统用户页把角色接口失败误当成整页失败，角色读链异常时用户列表会被清空 | [tests/bugs/open/BUG-20260420-057-admin-system-users-clears-list-when-roles-request-fails.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-057-admin-system-users-clears-list-when-roles-request-fails.md) |
| `BUG-20260420-058` | `P2` | `#/system/roles` | 角色管理页的权限数和权限模块会把已停用权限继续算进去，与实际生效权限不一致 | [tests/bugs/open/BUG-20260420-058-admin-roles-stats-still-count-disabled-permissions.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-058-admin-roles-stats-still-count-disabled-permissions.md) |
| `BUG-20260420-059` | `P1` | `#/users/permissions` | 权限管理允许编辑内置权限，但目录同步会覆盖编辑结果，改码后还会长出重复权限 | [tests/bugs/open/BUG-20260420-059-admin-built-in-permission-edits-are-not-stable.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-059-admin-built-in-permission-edits-are-not-stable.md) |
| `BUG-20260420-060` | `P2` | `#/system/categories` | 分类管理新增弹层仍把停用父分类当成可选项，提交后才会被后端拒绝 | [tests/bugs/open/BUG-20260420-060-admin-categories-create-modal-allows-disabled-parents.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-060-admin-categories-create-modal-allows-disabled-parents.md) |
| `BUG-20260420-061` | `P1` | `#/users/permissions` | 停用父权限不会撤销已展开到角色上的子权限，模块根权限停用后页面访问仍可能继续生效 | [tests/bugs/open/BUG-20260420-061-admin-disabling-parent-permission-does-not-revoke-child-access.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-061-admin-disabling-parent-permission-does-not-revoke-child-access.md) |
| `BUG-20260420-066` | `P1` | `#/users/permissions` | 后台受保护接口只校验登录态，不校验权限码，隐藏模块仍可被直接调用 | [tests/bugs/open/BUG-20260420-066-admin-api-only-checks-login-not-permission-codes.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-066-admin-api-only-checks-login-not-permission-codes.md) |
| `BUG-20260420-128` | `P1` | `#/system/notifications` | 系统通知页只覆盖最近 100 个批次，搜索和分页都退化成本地截断结果 | [tests/bugs/open/BUG-20260420-128-admin-notifications-page-only-covers-latest-100-batches.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-128-admin-notifications-page-only-covers-latest-100-batches.md) |
| `BUG-20260420-129` | `P2` | `#/system/notifications` | 系统通知页丢失发送总览，列表接口返回的 summary 没有被页面消费 | [tests/bugs/open/BUG-20260420-129-admin-notifications-page-drops-summary-overview.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-129-admin-notifications-page-drops-summary-overview.md) |
| `BUG-20260420-130` | `P2` | `#/system/categories` | 分类管理页丢失总览统计，列表接口返回的 summary 没有被页面消费 | [tests/bugs/open/BUG-20260420-130-admin-categories-page-drops-summary-overview.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-130-admin-categories-page-drops-summary-overview.md) |
| `BUG-20260420-131` | `P2` | `#/system/roles` | 角色管理页丢失总览统计，列表接口返回的 summary 没有被页面消费 | [tests/bugs/open/BUG-20260420-131-admin-roles-page-drops-summary-overview.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-131-admin-roles-page-drops-summary-overview.md) |
| `BUG-20260420-132` | `P2` | `#/users/permissions` | 权限管理页丢失总览统计，列表接口返回的 summary 没有被页面消费 | [tests/bugs/open/BUG-20260420-132-admin-permissions-page-drops-summary-overview.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-132-admin-permissions-page-drops-summary-overview.md) |
| `BUG-20260420-133` | `P2` | `#/system/users` | 系统用户页丢失总览统计，列表接口返回的 summary 没有被页面消费 | [tests/bugs/open/BUG-20260420-133-admin-system-users-page-drops-summary-overview.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-133-admin-system-users-page-drops-summary-overview.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 系统用户动作 | 页面没有前置吸收后端“不能停用当前登录账号”的硬规则，导致存在必然失败的危险按钮。 |
| 系统用户筛选 | 角色筛选只看启用角色，和系统用户列表里真实存在的角色绑定口径脱节。 |
| 系统用户加载 | 系统用户主列表被角色字典请求连坐，辅助接口失败会扩大成整页失败。 |
| 系统用户总览 | 系统用户列表接口已经返回 `summary.total / active / disabled / admins`，但页面没有任何总览承接。 |
| 角色统计 | 角色页的权限数和权限模块在统计停用权限时口径失真，会高估真实生效权限。 |
| 角色总览 | 角色列表接口已经返回 `summary.total / active / disabled / members`，但页面没有任何总览承接。 |
| 权限树完整性 | 权限页和后端都没有防循环校验，父子关系可以被改坏。 |
| 权限目录同步 | 内置权限同时“允许手工编辑”和“会被共享目录同步回写”，导致编辑结果不稳定，甚至生成重复权限。 |
| 权限状态语义 | 停用父权限不会收口已展开到角色上的子权限，权限树状态和实际访问结果脱节。 |
| 权限总览 | 权限列表接口已经返回 `summary.total / active / disabled / modules`，但页面没有任何总览承接。 |
| 后端权限授权 | 后台 API 当前只校验管理员是否登录，没有把权限码真正落实到受保护接口，菜单隐藏不能等价替代接口鉴权。 |
| 分类新增 | 新增分类弹层暴露了后端明令禁止的停用父分类选项。 |
| 分类总览 | 分类列表接口已经返回 `summary.total / active / disabled / byBizType`，但页面没有任何总览承接。 |
| 通知批次 | 当前“批次列表”其实是消息载荷聚合视图，不是真实发送批次视图。 |
| 通知列表窗口 | 通知页只覆盖最近 100 个批次，页面搜索和分页都是对局部截断结果操作。 |
| 通知总览 | 接口已返回 `summary/basis`，但页面没有任何发送概览或统计承接。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx) [apps/admin/src/pages/roles-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/roles-page.tsx) [apps/admin/src/pages/permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx) [apps/admin/src/pages/categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx) [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/system.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/system.ts) [apps/admin/src/lib/admin-notifications.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-notifications.tsx) [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts) |
| 后端实现 | [apps/api/src/modules/admin/system-users.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-users.ts) [apps/api/src/modules/admin/system-rbac.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-rbac.ts) [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts) [apps/api/src/modules/admin/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts) [apps/api/src/modules/admin/routes/system-ops-routes.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/system-ops-routes.ts) [apps/api/src/modules/admin/auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts) |
| OpenAPI | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |
| 规则基线 | [README.md](/Users/ezreal/Downloads/joy/umi/README.md) [AGENTS.md](/Users/ezreal/Downloads/joy/umi/AGENTS.md) [docs/flows.md](/Users/ezreal/Downloads/joy/umi/docs/flows.md) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 为权限更新补前后端防循环校验，避免写出损坏的权限树。 |
| `P1` | 收口内置权限维护边界，禁止在页面直接改共享目录维护的字段，避免目录同步回写和重复权限。 |
| `P1` | 明确父权限停用的树语义，停用上层权限时同步收口子权限或在鉴权中纳入祖先状态。 |
| `P1` | 为 `/api/admin/*` 补权限码级别守卫，不能再只靠前端菜单隐藏和页面跳转表达“无权访问”。 |
| `P1` | 为通知发送链补真实批次标识或等价批次边界，禁止同内容重复发送被误合并。 |
| `P1` | 给通知列表补真实分页或搜索参数，不能再只读取最近 100 条后在前端本地搜。 |
| `P2` | 系统用户页吸收后端“禁止自停用”规则，前端直接隐藏/禁用该动作。 |
| `P2` | 调整系统用户角色筛选来源，确保能覆盖停用但仍被账号绑定的角色。 |
| `P2` | 拆开系统用户列表与角色字典的初始化失败面，避免角色接口异常时清空主列表。 |
| `P2` | 让系统用户页把现有 `summary` 正常展示出来。 |
| `P2` | 修正角色页权限统计口径，至少把“已绑定权限”和“生效权限”拆开。 |
| `P2` | 让角色管理页把现有 `summary` 正常展示出来。 |
| `P2` | 让权限管理页把现有 `summary` 正常展示出来。 |
| `P2` | 新增分类弹层过滤停用父分类，避免暴露必然失败的选项。 |
| `P2` | 让分类管理页把现有 `summary` 正常展示出来。 |
| `P2` | 让系统通知页把现有 `summary/basis` 正常展示出来。 |
| `P2` | 后续为 `system-users` / `permissions` / `notifications` 补专项自动化。 |
