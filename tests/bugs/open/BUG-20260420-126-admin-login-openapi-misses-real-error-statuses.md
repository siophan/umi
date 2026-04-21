# BUG-20260420-126

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-126` |
| `title` | 后台登录 OpenAPI 没有声明真实的 401/403 错误契约 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/login-openapi` |
| `scope` | `admin` |
| `page` | `#/login` |
| `api` | `/api/admin/auth/login` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-login-qa-2026-04-20.md` |
| `fingerprint` | `admin-login:openapi-misses-real-error-statuses` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | `/api/admin/auth/login` 的 OpenAPI 应完整声明真实错误分支，至少覆盖缺参 `400`、凭证错误 `401`、账号停用 `403`。 |
| 对齐基准 | 当前后台登录路由实际抛出的错误状态。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | Swagger 目前只声明了一个 `400 用户名或密码错误`，但真实路由还会返回 `401 ADMIN_INVALID_CREDENTIALS` 和 `403 ADMIN_ACCOUNT_DISABLED`。 |
| 影响范围 | 前后端联调、测试脚本和接口消费者会误判后台登录失败的真实状态码和语义。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 查看 `/api/admin/auth/login` 的 OpenAPI 定义。 |
| 2 | 查看后台登录路由的错误映射。 |
| 3 | 对照两边状态码。 |
| 4 | OpenAPI 只声明 `400`，但真实实现还会返回 `401` 和 `403`。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| OpenAPI 证据 | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:10) 到 [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:26) 当前只声明了 `200` 和 `400`。 |
| 路由证据 | [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:215) 到 [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:239) 登录错误映射实际包含 `400`、`401`、`403` 三类状态。 |
| 相关文件 | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) | 登录接口的错误响应声明不完整。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
