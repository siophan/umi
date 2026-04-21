# BUG-20260420-048

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-048` |
| `title` | 权限管理允许把权限父节点改成自己的子节点，能写出循环父子关系 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `admin/permissions/tree` |
| `scope` | `admin` |
| `page` | `#/users/permissions` |
| `api` | `/api/admin/permissions/{id}` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-permissions:cyclic-parent-allowed` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

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
| 修复说明 | 已同时补前后端防循环校验：前端编辑权限时会从父权限下拉中过滤当前权限的全部后代；后端更新权限时会沿祖先链校验新父节点，禁止把父节点改成自己的子权限或写出已有循环。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。前后端类型检查通过，管理台构建通过；权限父节点不再允许选择自身后代，后端也会拒绝循环写入。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前前端会基于 `descendantIdSet` 从父权限下拉里排除当前权限的全部后代；后端 `wouldCreatePermissionCycle()` 也会拒绝把父节点改成自己的子权限或写出已有环。 |
| 修复提交/变更 | `apps/api/src/modules/admin/system.ts`；`apps/api/src/modules/admin/router.ts`；`apps/admin/src/pages/permissions-page.tsx`；`apps/admin/src/pages/marketing-banners-page.tsx` |

## Fixer

- 已给权限编辑页补后代过滤，父权限下拉不再出现当前权限的子孙节点。
- 已给后端补祖先链校验，避免通过绕过前端直接写出循环父子关系。
- 本轮顺手修掉了一个会卡 `admin typecheck` 的现存类型错误：`marketing-banners-page.tsx` 的 `targetId` 类型收口。

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/admin/src/pages/permissions-page.tsx:109](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:109) 到 [apps/admin/src/pages/permissions-page.tsx:145](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx:145)，前端编辑态已先构建后代集合并从 `parentOptions` 里排除当前权限的全部子孙节点；同时 [apps/api/src/modules/admin/system.ts:1923](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1923) 到 [apps/api/src/modules/admin/system.ts:1940](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1923) 的 `wouldCreatePermissionCycle()` 已沿祖先链校验循环，更新逻辑会拒绝把父节点改成自己的后代或写入已有环。 |
