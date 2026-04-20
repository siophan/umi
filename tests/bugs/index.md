# Bug Index

最后更新：2026-04-20

当前活跃 Bug 已开始录入，修复线程默认从 `status = new / triaged / in_progress` 的单据里认领。

## Open Bugs

| bug_id | severity | area | page_or_api | title | status | owner | source_run | last_seen_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BUG-20260420-003` | `P1` | `product/detail` | `/product/[id]` | 商品详情页伪造徽标和换购价格表达 | `triaged` | `用户端全栈一` | `tests/reports/user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-044` | `P1` | `admin/shops/detail` | `#/shops/list` | 店铺列表“查看”动作只有摘要抽屉，缺少真实详情链路和关联记录 | `fixed_pending_verify` | `用户端全栈一` | `admin-shops-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-045` | `P2` | `admin/shops/filter` | `#/shops/list` | 店铺列表主营类目筛选会漏掉停用类目下的现存店铺 | `triaged` | `测试狗` | `admin-shops-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-046` | `P2` | `admin/system-users/status` | `#/system/users` | 系统用户列表对当前登录账号仍暴露“停用”动作，点击后只会命中后端拒绝 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-047` | `P2` | `admin/system-users/filter` | `#/system/users` | 系统用户列表角色筛选只显示启用角色，导致已绑定停用角色的账号无法被筛出 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-048` | `P1` | `admin/permissions/tree` | `#/users/permissions` | 权限管理允许把权限父节点改成自己的子节点，能写出循环父子关系 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-049` | `P1` | `admin/notifications/detail` | `#/system/notifications` | 系统通知“查看”抽屉不展示通知正文，发送后无法在后台复核实际内容 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-050` | `P1` | `admin/notifications/batch` | `#/system/notifications` | 系统通知列表按消息载荷聚合，重复发送同一内容会被错误合并成一条批次 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-051` | `P2` | `register/step` | `/register` | 注册页把本地长度判断伪装成已完成手机验证步骤 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-052` | `P2` | `post/detail/header` | `/post/[id]` | 动态详情页顶栏缺失旧页作者信息和关注入口 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-057` | `P2` | `admin/system-users/load` | `#/system/users` | 系统用户页把角色接口失败误当成整页失败，角色读链异常时用户列表会被清空 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-058` | `P2` | `admin/roles/stats` | `#/system/roles` | 角色管理页的权限数和权限模块会把已停用权限继续算进去，与实际生效权限不一致 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-059` | `P1` | `admin/permissions/catalog-sync` | `#/users/permissions` | 权限管理允许编辑内置权限，但目录同步会覆盖编辑结果，改码后还会长出重复权限 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-060` | `P2` | `admin/categories/create` | `#/system/categories` | 分类管理新增弹层仍把停用父分类当成可选项，提交后才会被后端拒绝 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-061` | `P1` | `admin/permissions/status` | `#/users/permissions` | 停用父权限不会撤销已展开到角色上的子权限，模块根权限停用后页面访问仍可能继续生效 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-066` | `P1` | `admin/rbac/api-authz` | `#/users/permissions` | 后台受保护接口只校验登录态，不校验权限码，隐藏模块仍可被直接调用 | `triaged` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-053` | `P2` | `review/page` | `/review` | 评价页缺少图片上传占位，页面能力和矩阵要求不一致 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-062` | `P2` | `mall/category` | `/mall` | 商城分类页把分类请求失败静默吞成“当前分类暂无商品” | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-063` | `P1` | `shop/brand-auth-data` | `/brand-auth` | 品牌授权页成功态仍用本地映射伪造保证金和品牌经营指标 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-064` | `P1` | `shop/my-shop-actions` | `/my-shop` | 我的店铺页暴露了未承接的店铺设置和商品管理操作 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-065` | `P2` | `order/payment-invoice` | `/payment` | 支付页暴露了不会进入下单 payload 的发票开关 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-066` | `P2` | `address/manage-mode` | `/address` | 收货地址页“管理/完成”切换只是空状态切换，没有实际管理模式 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |

## Rules

| 规则 | 说明 |
| --- | --- |
| 一行一个 Bug | 不在总表写长段说明 |
| 详情放单文件 | `tests/bugs/open/BUG-xxxx.md` |
| 状态变更同步总表 | 包括 owner、last_seen_at |
| 修复后不删记录 | 移到 `closed/` 继续保留历史 |
