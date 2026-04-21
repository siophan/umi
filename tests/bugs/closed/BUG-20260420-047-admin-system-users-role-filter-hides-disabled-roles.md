# BUG-20260420-047

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-047` |
| `title` | 系统用户列表角色筛选只显示启用角色，导致已绑定停用角色的账号无法被筛出 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/system-users/filter` |
| `scope` | `admin` |
| `page` | `#/system/users` |
| `api` | `/api/admin/system-users` `/api/admin/roles` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-system-users:role-filter-active-only` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 角色筛选应覆盖当前列表里真实存在的角色绑定结果，包括已停用但仍绑定在账号上的角色。 |
| 对齐基准 | 系统用户列表显示的是当前账号真实角色绑定，而不是“仅可新分配角色”。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 前端把角色筛选选项限制成 `status === 'active'` 的角色；但系统用户列表查询会保留所有 `admin_user_role -> admin_role` 绑定关系，因此账号如果仍绑定停用角色，会显示在表格里，却无法通过筛选器反查。 |
| 影响范围 | 后台无法精确定位“仍挂着某个已停用角色的账号”，角色清理和复核成本升高。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 停用一个已有系统用户绑定的角色。 |
| 2 | 打开 `#/system/users`，确认对应账号行仍显示该角色。 |
| 3 | 打开“角色”筛选框。 |
| 4 | 该停用角色不会出现在筛选选项里，因此无法用筛选器精确筛出这些账号。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 角色筛选选项只保留 `status === 'active'` 的角色，见 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:118) 到 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:126)。 |
| 页面证据 | 实际过滤逻辑又是按系统用户记录里的 `roleCodes` 匹配，见 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:129) 到 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:146)。 |
| 后端证据 | 系统用户列表 SQL 会把所有 `admin_user_role -> admin_role` 绑定角色聚合出来，并未过滤停用角色，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:667) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:691)。 |
| 相关文件 | [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx) [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx) | 角色筛选选项来源过窄，只覆盖启用角色。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已调整系统用户页角色筛选：保留启用角色，同时补回“停用但仍被当前账号绑定”的角色，并在下拉里标记为“已停用”。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。管理台类型检查和生产构建通过，角色筛选不再遗漏停用但仍绑定的角色。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前系统用户页角色筛选已改成 `buildRoleFilterOptions(roles, users)` 基于“真实绑定结果”生成，下拉会补回停用但仍挂在账号上的角色，并标记“已停用”。 |
| 修复提交/变更 | `apps/admin/src/pages/system-users-page.tsx` |

## Fixer

- 已让系统用户页角色筛选覆盖当前列表里真实出现的角色绑定结果。
- 停用角色会以“`角色名（已停用）`”展示，不再直接被隐藏。

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/admin/src/pages/system-users-page.tsx:159](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:159) 到 [apps/admin/src/pages/system-users-page.tsx:174](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:159)，角色筛选已不再只保留启用角色，而是把“停用但仍被当前账号绑定”的角色也补进下拉，并标记为“已停用”；同时 [apps/admin/src/pages/system-users-page.tsx:185](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:185) 到 [apps/admin/src/pages/system-users-page.tsx:196](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:185) 的实际过滤逻辑仍按 `roleCodes` 匹配，所以当前列表里真实存在的角色绑定结果现在都能被正式筛出来。 |
