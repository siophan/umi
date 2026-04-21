# Admin Login QA Report

最后更新：2026-04-21

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 后台认证壳层 `#/login`、右上角改密弹窗与 `/api/admin/auth/*` |
| 本轮重点 | 登录提交链、改密链、错误反馈契约、Swagger 对齐 |
| 已确认 Bug | `2` |
| 阻塞项 | `0` |
| 结论 | 登录页面本身目前没有坐实新的页面级回归，但后台认证链的 Swagger 契约仍然偏窄，登录和改密两个接口都没有完整声明真实错误状态。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/login` | `parity_gap` | 登录页和右上角改密弹窗依赖的错误契约都比真实路由写得更窄。 |
| `/api/admin/auth/login` | `parity_gap` | OpenAPI 没有声明真实 `401/403` 错误分支。 |
| `/api/admin/auth/change-password` | `parity_gap` | OpenAPI 没有声明真实 `403/404` 错误分支。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-126` | `P2` | `#/login` | 后台登录 OpenAPI 没有声明真实的 401/403 错误契约 | [tests/bugs/open/BUG-20260420-126-admin-login-openapi-misses-real-error-statuses.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-126-admin-login-openapi-misses-real-error-statuses.md) |
| `BUG-20260420-127` | `P2` | `后台壳层` | 后台改密 OpenAPI 没有声明真实的 403/404 错误契约 | [tests/bugs/open/BUG-20260420-127-admin-change-password-openapi-misses-real-error-statuses.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-127-admin-change-password-openapi-misses-real-error-statuses.md) |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/components/login-screen.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/components/login-screen.tsx) [apps/admin/src/App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/auth.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/auth.ts) |
| 后端实现 / OpenAPI | [apps/api/src/modules/admin/routes/auth-routes.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/auth-routes.ts) [apps/api/src/modules/admin/auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/auth.ts) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P2` | 把登录接口的 OpenAPI 错误响应补齐到真实路由状态码。 |
| `P2` | 把改密接口的 OpenAPI 错误响应补齐到真实路由状态码。 |
