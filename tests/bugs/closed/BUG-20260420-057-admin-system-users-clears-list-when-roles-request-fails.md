# BUG-20260420-057

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-057` |
| `title` | 系统用户页把角色接口失败误当成整页失败，角色读链异常时用户列表会被清空 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/system-users/load` |
| `scope` | `admin` |
| `page` | `#/system/users` |
| `api` | `/api/admin/system-users` `/api/admin/roles` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-system-users:roles-request-failure-clears-user-list` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 即使角色接口失败，系统用户主列表也应尽量继续展示，最多只让角色筛选和编辑表单降级不可用。 |
| 对齐基准 | 系统用户表格本身由 `/api/admin/system-users` 返回的行数据即可渲染，不应被辅助接口连坐清空。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面初始化用 `Promise.all([fetchAdminSystemUsers(), fetchAdminRoles()])`，任一请求失败都会进入统一 `catch`，然后同时 `setUsers([])` 和 `setRoles([])`；也就是说，只要角色接口失败，整张系统用户表就被清空。 |
| 影响范围 | 后台会把“角色字典异常”误判成“系统用户列表为空/不可用”，扩大故障面。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/system/users`。 |
| 2 | 让 `/api/admin/roles` 失败，而 `/api/admin/system-users` 仍返回成功。 |
| 3 | 页面进入统一失败分支。 |
| 4 | 原本可渲染的系统用户列表会被直接清空。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 初始化加载把系统用户和角色请求绑在同一个 `Promise.all` 上，失败后统一清空 `users` 和 `roles`，见 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:84) 到 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:97)。 |
| 页面证据 | 表格本身实际渲染依赖的是 `users` 行数据，角色列也直接消费 `record.role`，见 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:129) 到 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:153)，以及 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:169) 到 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:173)。 |
| 接口证据 | `/api/admin/system-users` 本身会返回用户名、显示名、角色字符串和角色编码数组，足以支撑列表展示，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1288) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1319)。 |
| 相关文件 | [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx) [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx) | 把主列表与角色字典初始化绑成同一个失败面。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已把系统用户列表和角色字典拆成独立失败面：角色接口失败时只清空角色字典并展示 warning，不再把用户主列表一起清空；只有 `/api/admin/system-users` 本身失败时才视作整页失败。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。管理台类型检查和构建通过，角色请求失败不再连坐清空用户表格。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前系统用户页真实加载逻辑已下沉到 `apps/admin/src/lib/admin-system-users-page.ts`，页面使用 `Promise.allSettled([fetchAdminSystemUsers(), fetchAdminRoles()])` 分开处理主表和角色字典；角色接口失败只会写入 `roleIssue` 并清空角色选项，不再把 `users` 主列表一起清空。 |
| 修复提交/变更 | `apps/admin/src/pages/system-users-page.tsx` |

## Fixer

- 已把系统用户主列表和角色字典拆开加载。
- 角色接口失败时页面会显示 warning，但仍保留系统用户列表。

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/admin/src/pages/system-users-page.tsx:77](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:77) 到 [apps/admin/src/pages/system-users-page.tsx:104](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:77)，页面已改成 `Promise.allSettled(...)` 分别处理系统用户和角色字典：只有系统用户请求失败才会清空主表；角色请求失败只会清空角色字典并记录 `roleIssue`。 |
