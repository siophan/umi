# BUG-20260420-047

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-047` |
| `title` | 系统用户列表角色筛选只显示启用角色，导致已绑定停用角色的账号无法被筛出 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/system-users/filter` |
| `scope` | `admin` |
| `page` | `#/system/users` |
| `api` | `/api/admin/system-users` `/api/admin/roles` |
| `owner` | `测试狗` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-system-users:role-filter-active-only` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

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
| 修复说明 | 角色筛选选项应覆盖当前系统用户列表里真实出现的角色绑定，或至少把“停用角色”单独标记出来，而不是直接隐藏。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
