# BUG-20260420-061

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-061` |
| `title` | 停用父权限不会撤销已展开到角色上的子权限，模块根权限停用后页面访问仍可能继续生效 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/permissions/status` |
| `scope` | `admin` |
| `page` | `#/users/permissions` |
| `api` | `/api/admin/permissions/{id}/status` `/api/admin/roles/{id}/permissions` |
| `owner` | `测试狗` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-permissions:disabling-parent-does-not-revoke-child-access` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 停用父权限后，其子权限不应继续作为有效访问权限对外生效；至少对共享目录里的模块根权限，应同步收口已展开到角色上的叶子页权限。 |
| 对齐基准 | 权限树的状态语义应一致，停用上层权限不能让下层叶子权限继续静默放行。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 角色分配权限时，根权限会通过 `expandRolePermissionIds()` 自动展开成子权限并写入 `admin_role_permission`。后续停用父权限时，后端只是改当前权限自己的 `status`，不会处理已物化的子权限关联；鉴权又只检查“角色有效 + 叶子权限有效”，所以只要子权限仍是 active，页面访问就会继续成立。 |
| 影响范围 | 后台以为自己停用了某个模块根权限，但已有角色仍可能继续访问该模块页面，权限收口失真。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 给某个角色分配一条模块根权限，例如共享目录里的 `*.manage`。 |
| 2 | 系统会把对应子权限一并展开到 `admin_role_permission`。 |
| 3 | 在权限管理页停用这个父权限。 |
| 4 | 由于子权限仍是 active 且仍绑定在角色上，后台菜单和页面访问仍可能继续生效。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 接口证据 | 角色分配权限时，会通过 `expandRolePermissionIds()` 自动把父权限展开成子权限并写入角色权限关联，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1580) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1631)，以及 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:930) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:947)。 |
| 接口证据 | 停用权限时，后端只更新当前权限一条记录的 `status`，不会级联处理子权限或角色关联，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:2006) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:2023)。 |
| 鉴权证据 | 后台鉴权只要角色有效且某条叶子权限 `ap.status = active` 就会放行，见 [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:171) 到 [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:185)。 |
| 菜单证据 | 菜单显示和页面访问最终只依赖当前用户是否持有目标叶子权限码，见 [admin-navigation.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-navigation.tsx:395) 到 [admin-navigation.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-navigation.tsx:402)。 |
| 页面证据 | 权限页停用文案只提示“后续不能再分配该权限”，没有暴露“已有子权限仍可能继续生效”的风险，见 [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:231) 到 [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:257)。 |
| 相关文件 | [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts) [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx) [admin-navigation.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-navigation.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) | 权限状态更新没有树级联和角色关联收口。 |
| [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts) | 鉴权只认叶子权限 active，无法感知祖先权限被停用。 |
| [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx) | 页面停用文案会让操作者误判停用后果。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 对树形权限需要明确“停用父权限”的语义：要么级联停用/解除子权限，要么在鉴权时把祖先状态一起纳入判定；至少不能让父权限停用后已有子权限继续静默放行。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
