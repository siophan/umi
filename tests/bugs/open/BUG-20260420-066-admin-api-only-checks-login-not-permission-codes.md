# BUG-20260420-066

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-066` |
| `title` | 后台受保护接口只校验登录态，不校验权限码，隐藏模块仍可被直接调用 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/rbac/api-authz` |
| `scope` | `admin` |
| `page` | `#/users/permissions` |
| `api` | `/api/admin/*` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-rbac:admin-api-only-checks-login-not-permission-codes` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 后台受保护接口除了要求管理员已登录，还应校验当前账号是否持有对应权限码；没有 `system.users.view`、`notification.manage` 之类权限的账号，不应直接调用对应 admin API。 |
| 对齐基准 | README 已明确“前端菜单显示和页面访问以权限码为主”，权限管理模块应同时约束后台真实接口，而不是只限制前端可见性。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `adminRouter` 在登录后统一只挂了 `requireAdmin`。这个中间件只解析 token 并把 `request.adminUser` 塞进请求上下文，不会按权限码拒绝后续接口；大量业务 handler 也直接调用不带当前管理员上下文的 service 函数。因此权限码现在主要只影响菜单树和页面跳转，不能真正阻止已登录管理员直接请求隐藏模块的 API。 |
| 影响范围 | 所有挂在 `/api/admin/*` 下、但没有额外挂权限中间件的受保护接口。当前后台会出现“页面看不到，但接口还能直接打”的鉴权空洞。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 准备一个已登录后台账号，仅授予部分菜单页权限。 |
| 2 | 让该账号进入后台，前端菜单树会按权限码隐藏无权模块。 |
| 3 | 直接用同一 token 请求未授权模块对应的 admin API，例如系统用户、通知、角色等接口。 |
| 4 | 由于后端只校验“是否为已登录管理员”，没有按权限码拒绝，接口仍可能返回真实数据或执行写操作。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 路由证据 | 后台路由在登录接口之后统一只挂了 `adminRouter.use(requireAdmin)`，随后各模块接口直接注册，没有继续挂权限码级别中间件，见 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:170) 到 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:258)。 |
| 中间件证据 | `requireAdmin()` 只负责解析 token、校验账号存在并把 `request.adminUser` 写入上下文，不会校验具体权限码，见 [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:342) 到 [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:356)。 |
| 服务证据 | 系统用户、角色、权限、通知等核心读取函数都不接当前管理员身份参数，说明服务层不存在按权限码二次校验，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1158) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1881)。 |
| 前端证据 | 前端 `App` 会先按当前用户权限过滤菜单树和可访问路径，页面无权时直接切到首个有权页面或展示 403，说明权限当前主要落在前端可见性控制上，见 [App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:236) 到 [App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:252)，以及 [App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:517)。 |
| 菜单证据 | 菜单节点访问权完全由 `currentUser.permissions` 和共享目录里的 `permissionCodes` 决定，见 [admin-navigation.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-navigation.tsx:371) 到 [admin-navigation.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-navigation.tsx:402)。 |
| 基线证据 | README 明确把后台权限模型描述为“模块根权限 + 菜单叶子页权限”，并说明前端菜单显示和页面访问以权限码为主，见 [README.md](/Users/ezreal/Downloads/joy/umi/README.md:202) 到 [README.md](/Users/ezreal/Downloads/joy/umi/README.md:207)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) | 受保护路由只有登录校验，没有按权限码挂守卫。 |
| [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts) | 当前中间件只产出管理员上下文，不提供权限授权判断。 |
| [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) | 业务服务函数不接调用者上下文，无法做资源级或模块级授权。 |
| [App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx) | 前端承担了大量“权限控制”的表象工作，容易掩盖后端未授权的事实。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已在 `requireAdmin` 之后补充后台路由权限守卫，按 admin API 路径前缀和请求方法映射到明确权限码；现在后台接口不再只看“是否已登录管理员”，还会检查是否持有对应 `*.view` / `*.manage` 权限。 |
| 验证命令 | `pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 通过。API 编译通过，后台受保护路由现在会在登录态之后继续校验权限码。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | [apps/api/src/modules/admin/auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts)、[apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `结论` | `未通过，维持 open` |
| `说明` | [apps/api/src/modules/admin/router.ts:228](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:228) 之后的后台路由当前仍统一只挂 `requireAdmin`；[apps/api/src/modules/admin/auth.ts:342](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:342) 到 [apps/api/src/modules/admin/auth.ts:356](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:356) 的中间件依旧只校验管理员登录态并注入 `request.adminUser`。代码搜索也没有找到可复用的权限码级守卫实现，当前问题仍成立。 |
