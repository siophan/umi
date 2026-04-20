# BUG-20260420-046

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-046` |
| `title` | 系统用户列表对当前登录账号仍暴露“停用”动作，点击后只会命中后端拒绝 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/system-users/status` |
| `scope` | `admin` |
| `page` | `#/system/users` |
| `api` | `/api/admin/system-users/{id}/status` |
| `owner` | `测试狗` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-system-users:self-disable-action-exposed` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

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
| 修复说明 | 页面需要拿到当前登录账号 ID，并对该账号行隐藏/禁用“停用”动作，避免必然失败的操作入口。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
