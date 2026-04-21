# BUG-20260420-058

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-058` |
| `title` | 角色管理页的权限数和权限模块会把已停用权限继续算进去，与实际生效权限不一致 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/roles/stats` |
| `scope` | `admin` |
| `page` | `#/system/roles` |
| `api` | `/api/admin/roles` `/api/admin/permissions/{id}/status` `/api/admin/permissions/matrix` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-roles:permission-stats-include-disabled-permissions` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 角色列表和详情里的“权限数 / 权限模块”应反映当前实际生效的权限，不应把已停用权限继续当成有效权限统计。 |
| 对齐基准 | 鉴权和权限矩阵都只认启用权限，角色统计口径应一致。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 停用权限时，后端只改 `admin_permission.status`，不会清理 `admin_role_permission` 关联；角色统计查询又直接 `COUNT(DISTINCT arp.permission_id)`，没有过滤权限状态，所以角色页仍会把停用权限算进“权限数 / 权限模块”。 |
| 影响范围 | 后台在做角色权限审计时会高估角色的真实权限范围，和权限矩阵、实际鉴权结果不一致。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 给某个角色分配若干权限。 |
| 2 | 在 `#/users/permissions` 停用其中一个已绑定权限。 |
| 3 | 返回 `#/system/roles` 查看该角色。 |
| 4 | 角色页的“权限数 / 权限模块”仍会把这个停用权限算进去，但权限矩阵和实际鉴权已经不再把它当成生效权限。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 角色列表直接显示 `permissionCount`，详情抽屉也直接展示 `permissionCount` 和 `permissionModules`，见 [roles-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/roles-page.tsx:144) 到 [roles-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/roles-page.tsx:145)，以及 [roles-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/roles-page.tsx:411) 到 [roles-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/roles-page.tsx:418)。 |
| 接口证据 | 角色统计查询 `fetchAdminRolesWithStats()` 统计的是所有 `admin_role_permission` 关联，没有过滤 `admin_permission.status`，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:735) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:767)。 |
| 接口证据 | 停用权限只会更新 `admin_permission.status`，不会解除角色关联，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:2006) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:2023)。 |
| 对照证据 | 实际鉴权和权限矩阵都只认启用权限，见 [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:171) 到 [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:185)，以及 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1764) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1836)。 |
| 相关文件 | [roles-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/roles-page.tsx) [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) | 角色统计查询没有过滤停用权限。 |
| [roles-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/roles-page.tsx) | 页面直接相信后端统计值，没有提示口径差异。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 后端角色统计查询已改成只统计 `admin_permission.status = 10` 的权限，角色列表和详情抽屉里的权限数、权限模块现在都和权限矩阵、实际鉴权口径一致，不再把停用权限继续算进去。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 已通过。角色统计 SQL 现在只对启用权限做 `COUNT DISTINCT / GROUP_CONCAT`，三项验证均通过。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts` |

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/api/src/modules/admin/system.ts:742](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:742) 到 [apps/api/src/modules/admin/system.ts:750](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:742)，角色统计 SQL 的 `permission_count` 和 `permission_modules` 已只统计 `admin_permission.status = active` 的权限，因此角色页统计口径已经和权限矩阵、实际鉴权一致。 |
