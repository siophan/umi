# BUG-20260420-061

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-061` |
| `title` | 停用父权限不会撤销已展开到角色上的子权限，模块根权限停用后页面访问仍可能继续生效 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `admin/permissions/status` |
| `scope` | `admin` |
| `page` | `#/users/permissions` |
| `api` | `/api/admin/permissions/{id}/status` `/api/admin/roles/{id}/permissions` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-permissions:disabling-parent-does-not-revoke-child-access` |
| `fix_owner` | `用户端全栈一` |
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
| 修复说明 | 停用权限现在会级联停用整棵子权限树，父权限停用时其下已展开到角色上的子权限也会同步失效；权限页停用提示文案也改成了“当前权限及其子权限都会一并失效”，避免继续误导操作者。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 已通过。停用父权限时后端会批量把子权限一并置为 disabled，后台三项验证均通过。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx` |

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/api/src/modules/admin/system.ts:2121](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:2121) 到 [apps/api/src/modules/admin/system.ts:2128](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:2121)，停用权限时后端已先收集全部后代 `descendantIds`，再把当前权限和整棵子树一起置为 `disabled`；同时 [apps/admin/src/pages/permissions-page.tsx:249](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:249) 到 [apps/admin/src/pages/permissions-page.tsx:253](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:249) 的停用提示也已明确“当前权限及其子权限都会一并失效”。 |
