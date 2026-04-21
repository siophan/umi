# BUG-20260420-127

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-127` |
| `title` | 后台改密 OpenAPI 没有声明真实的 403/404 错误契约 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/change-password-openapi` |
| `scope` | `admin` |
| `page` | `后台壳层` |
| `api` | `/api/admin/auth/change-password` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-login-qa-2026-04-20.md` |
| `fingerprint` | `admin-change-password:openapi-misses-real-error-statuses` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-21` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | `/api/admin/auth/change-password` 的 OpenAPI 应完整声明真实错误分支，至少覆盖缺参/校验失败 `400`、未登录 `401`、账号停用 `403`、账号不存在 `404`。 |
| 对齐基准 | 当前后台改密路由实际抛出的错误状态。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | Swagger 目前只声明了 `200`、`400`、`401`，但真实路由还会返回 `403 ADMIN_ACCOUNT_DISABLED` 和 `404 ADMIN_USER_NOT_FOUND`。 |
| 影响范围 | 联调、接口测试和后台壳层改密弹窗只能从 Swagger 看到被写窄的错误契约，无法按真实状态码覆盖账号停用或账号缺失场景。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 查看 `/api/admin/auth/change-password` 的 OpenAPI 定义。 |
| 2 | 查看后台改密路由的错误映射。 |
| 3 | 对照两边状态码。 |
| 4 | OpenAPI 只声明了 `200`、`400`、`401`，但真实实现还会返回 `403` 和 `404`。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 壳层证据 | [apps/admin/src/App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:95) 到 [apps/admin/src/App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:120) 当前密码弹窗直接调用 `/api/admin/auth/change-password`；[apps/admin/src/components/admin-shell-header.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/components/admin-shell-header.tsx:36) 到 [apps/admin/src/components/admin-shell-header.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/components/admin-shell-header.tsx:46) 入口挂在右上角账号菜单。 |
| OpenAPI 证据 | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:42) 到 [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:60) 当前只声明了 `200`、`400`、`401`。 |
| 路由证据 | [apps/api/src/modules/admin/routes/auth-routes.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/auth-routes.ts:63) 到 [apps/api/src/modules/admin/routes/auth-routes.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/auth-routes.ts:90) 改密错误映射实际包含 `400`、`403`、`404`。 |
| 服务证据 | [apps/api/src/modules/admin/auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:285) 到 [apps/api/src/modules/admin/auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts:319) 改密服务真实会先校验管理员存在且可用，再做密码校验与更新。 |
| 相关文件 | [apps/admin/src/App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx) [apps/admin/src/components/admin-shell-header.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/components/admin-shell-header.tsx) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) [apps/api/src/modules/admin/routes/auth-routes.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/auth-routes.ts) [apps/api/src/modules/admin/auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) | 改密接口的错误响应声明不完整。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
