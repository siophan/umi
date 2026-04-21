# BUG-20260420-046

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-046` |
| `title` | 系统用户列表对当前登录账号仍暴露“停用”动作，点击后只会命中后端拒绝 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/system-users/status` |
| `scope` | `admin` |
| `page` | `#/system/users` |
| `api` | `/api/admin/system-users/{id}/status` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-system-users:self-disable-action-exposed` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 当前登录管理员自己的行不应再暴露“停用”动作，或者至少在前端直接禁用并给出明确说明。 |
| 对齐基准 | 后端 `/api/admin/system-users/{id}/status` 已明确禁止停用当前登录账号。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 系统用户列表为所有账号统一渲染“停用/启用”按钮，没有排除当前登录账号；当前用户点“停用”后只能收到后端报错“不能停用当前登录账号”。 |
| 影响范围 | 后台账号管理存在必然失败的无效动作，运营会把它理解成接口异常或权限异常。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 使用任意系统账号登录后台。 |
| 2 | 打开 `#/system/users`，定位当前登录账号所在行。 |
| 3 | 点击“停用”。 |
| 4 | 页面会请求状态更新接口，但后端固定返回“不能停用当前登录账号”。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 列表操作列对所有记录统一渲染“停用/启用”按钮，没有任何当前用户保护，见 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:207) 和 [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:223)。 |
| 接口证据 | 路由层已把“不能停用当前登录账号”映射成固定错误，见 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:399) 和 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:423)。 |
| 逻辑证据 | 状态更新服务直接禁止 `adminUserId === operatorAdminUserId` 且目标状态为停用，见 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1490) 到 [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts:1508)。 |
| 相关文件 | [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx) [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) [system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx) | 前端未对当前登录账号隐藏或禁用停用动作。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已让系统用户页单独读取当前登录管理员信息；当前登录账号所在行不再暴露“停用”按钮，直接显示“当前账号”，避免前端暴露必然失败的入口。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。管理台类型检查和生产构建通过，当前账号行不再渲染停用动作。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前系统用户页会先读取 `currentAdminId`，列表操作列在“当前登录账号且状态为启用”时已改为展示“当前账号”，不再暴露必然失败的“停用”入口。 |
| 修复提交/变更 | `apps/admin/src/pages/system-users-page.tsx` |

## Fixer

- 已给系统用户页补当前登录管理员识别逻辑。
- 当前登录账号仍可查看、编辑、重置密码，但不再暴露“停用”动作。

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/admin/src/pages/system-users-page.tsx:118](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:118) 到 [apps/admin/src/pages/system-users-page.tsx:134](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:118) 以及 [apps/admin/src/pages/system-users-page.tsx:264](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:264) 到 [apps/admin/src/pages/system-users-page.tsx:288](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx:264)，页面已先读取当前登录管理员 `id`，并在当前账号且状态为启用时改为展示“当前账号”，不再渲染“停用”操作。 |
