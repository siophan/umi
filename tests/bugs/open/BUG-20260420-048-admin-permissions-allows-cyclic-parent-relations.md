# BUG-20260420-048

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-048` |
| `title` | 权限管理允许把权限父节点改成自己的子节点，能写出循环父子关系 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/permissions/tree` |
| `scope` | `admin` |
| `page` | `#/users/permissions` |
| `api` | `/api/admin/permissions/{id}` |
| `owner` | `测试狗` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-permissions:cyclic-parent-allowed` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 编辑权限时，父权限选择应排除自身及自身后代，后端也应阻止循环父子关系写入。 |
| 对齐基准 | 权限树需要保持有向无环，否则权限层级、矩阵和后续树表展示都会失真。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 前端父权限下拉只排除了“自己”，没有排除“自己的子节点/后代”；后端更新接口也只阻止 `parentId === permissionId`，未检查祖先链，因此可以把 A 的父节点改成 B，而 B 原本又挂在 A 下，形成循环。 |
| 影响范围 | 权限树完整性被破坏，后续任何依赖父子结构的展示、分组和校验都会变得不可信。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 在权限管理页准备一对已有父子关系的权限 A、B。 |
| 2 | 编辑父权限 A。 |
| 3 | 在“父权限”下拉里选择子权限 B。 |
| 4 | 页面允许提交，后端也会接受，只要 B 存在且不等于 A。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | `parentOptions` 只排除当前编辑项自身，未排除其子节点或后代，见 [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:123) 到 [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:130)。 |
| 页面证据 | 编辑弹层直接把任意 `parentId` 提交给更新接口，见 [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:278) 到 [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:304)。 |
| 接口证据 | 后端更新权限只检查“父权限不能是自己”和“父权限存在”，没有校验祖先链，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1953) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1998)。 |
| 相关文件 | [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx) [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx) | 父权限下拉未做祖先链过滤。 |
| [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) | 更新接口只做自引用校验，没有防循环校验。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 前后端都要校验父权限合法性：前端过滤掉自身后代，后端在写入前校验新父节点不在当前权限子树内。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
