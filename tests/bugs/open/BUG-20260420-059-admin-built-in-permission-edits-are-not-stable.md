# BUG-20260420-059

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-059` |
| `title` | 权限管理允许编辑内置权限，但目录同步会覆盖编辑结果，改码后还会长出重复权限 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/permissions/catalog-sync` |
| `scope` | `admin` |
| `page` | `#/users/permissions` |
| `api` | `/api/admin/permissions` `/api/admin/permissions/{id}` |
| `owner` | `测试狗` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-permissions:built-in-edits-overwritten-by-catalog-sync` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 如果某些权限是共享目录维护的内置权限，页面应禁止直接编辑这些定义，或者明确把修改落到共享目录源头；不应出现“页面提示更新成功，但下一次读取又被覆盖”的假成功。 |
| 对齐基准 | README 已明确共享权限目录由 `packages/shared/src/admin-permissions.ts` 维护，并同步到 `admin_permission`。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 权限页允许直接编辑所有权限的 `code / name / module / action / parentId / sort`；但每次读取权限列表都会先执行 `ensureAdminPermissionCatalogSynced()`，把内置权限按共享目录重新写回。结果是：改名/改模块/改动作/改父级/改排序会在下次读取时被覆盖；如果把内置权限 `code` 改掉，目录同步还会按原始 code 再插入一条新内置权限，造成重复权限。 |
| 影响范围 | 后台会产生“编辑成功但不生效”的假象，严重时还会把内置权限拆成一条被改码的旧记录和一条重新同步出来的新记录，污染权限表。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/users/permissions`。 |
| 2 | 编辑一条内置权限，修改名称、模块、动作、父权限、排序或编码。 |
| 3 | 页面提示“权限已更新”。 |
| 4 | 重新进入权限列表或触发下一次目录同步。 |
| 5 | 如果 code 未改，内置字段会被目录同步写回；如果 code 改了，系统还会按共享目录原 code 再补插一条新的内置权限。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 权限页对所有记录都暴露“编辑”，并且会把 `code / name / module / action / parentId / sort` 一起提交更新，见 [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:223) 到 [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:305)。 |
| 接口证据 | 读取权限列表时会先执行 `ensureAdminPermissionCatalogSynced()`，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1881) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1883)。 |
| 同步证据 | 目录同步会按 `ADMIN_PERMISSION_DEFINITIONS` 回写内置权限的 `name / module / action / parent_id / sort`，见 [permission-catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/permission-catalog.ts:119) 到 [permission-catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/permission-catalog.ts:155)。 |
| 同步证据 | 如果按共享目录 code 找不到现有记录，目录同步会重新插入一条内置权限；同时清理逻辑只删除 `OBSOLETE_PERMISSION_CODES`，不会清理被改码的内置旧记录，见 [permission-catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/permission-catalog.ts:117) 到 [permission-catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/permission-catalog.ts:175)。 |
| 规则证据 | README 已写明共享权限目录由 `packages/shared/src/admin-permissions.ts` 维护，见 [README.md](/Users/ezreal/Downloads/joy/umi/README.md:48) 到 [README.md](/Users/ezreal/Downloads/joy/umi/README.md:50)。 |
| 相关文件 | [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx) [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) [permission-catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/permission-catalog.ts) [README.md](/Users/ezreal/Downloads/joy/umi/README.md) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx) | 没有区分“内置权限”和“可自由维护权限”。 |
| [permission-catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/permission-catalog.ts) | 目录同步会覆盖内置定义，且不会清理被改码的旧内置记录。 |
| [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) | 读列表时总会触发目录同步，加速暴露这个问题。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 对共享目录维护的内置权限，应在页面禁改或只允许改状态；如果确实需要可配置权限，必须把“内置目录”和“运营自定义权限”拆开，不要共用同一套可编辑字段。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
