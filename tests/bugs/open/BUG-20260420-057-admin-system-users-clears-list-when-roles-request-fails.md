# BUG-20260420-057

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-057` |
| `title` | 系统用户页把角色接口失败误当成整页失败，角色读链异常时用户列表会被清空 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/system-users/load` |
| `scope` | `admin` |
| `page` | `#/system/users` |
| `api` | `/api/admin/system-users` `/api/admin/roles` |
| `owner` | `测试狗` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-system-users:roles-request-failure-clears-user-list` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

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
| 修复说明 | 把系统用户列表和角色字典拆成独立加载链，角色请求失败时仅禁用角色筛选/编辑相关能力，不要清空主列表。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
