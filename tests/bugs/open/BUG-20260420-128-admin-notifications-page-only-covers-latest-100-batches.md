# BUG-20260420-128

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-128` |
| `title` | 系统通知页只覆盖最近 100 个批次，搜索和分页都退化成本地截断结果 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/notifications-local-window` |
| `scope` | `admin` |
| `page` | `#/system/notifications` |
| `api` | `/api/admin/notifications` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-notifications:page-only-covers-latest-100-batches` |
| `fix_owner` | `管理后台全栈` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-21` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 通知管理页的搜索、筛选和分页应建立在完整批次集合或真实后端分页之上，不能只对最近一小段截断结果生效。 |
| 对齐基准 | 后台通知列表的管理语义，以及仓库内对“不能把当前页结果冒充全局结果”的 QA 约束。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 后端列表固定 `LIMIT 100`，前端再对这 100 条做本地搜索、筛选和分页；超过 100 条后的历史通知批次会直接从后台管理视图消失。 |
| 影响范围 | 运营无法搜索或翻到更早的通知批次，页面上的搜索结果和分页都只是“最近 100 条内的局部视图”，不是通知全量管理视图。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 查看 `#/system/notifications` 的数据加载逻辑。 |
| 2 | 查看 `/api/admin/notifications` 的 SQL。 |
| 3 | 对照页面搜索、筛选和分页实现。 |
| 4 | 后端只取最近 100 个批次，前端再在这 100 条里做本地筛选和翻页，因此更早的通知不会进入页面结果集。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:45) 当前 `filteredRows` 只是对本地 `rows` 做过滤；[apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx:83) 页面分页也只是表格本地分页。 |
| 前端 helper 证据 | [apps/admin/src/lib/admin-notifications.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-notifications.tsx:53) 到 [apps/admin/src/lib/admin-notifications.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-notifications.tsx:69) 搜索和筛选全部在前端数组上完成。 |
| 后端证据 | [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts:247) 到 [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts:248) 通知批次查询固定 `LIMIT 100`。 |
| OpenAPI 证据 | [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:1384) 到 [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:1411) 当前也没有任何分页或搜索参数。 |
| 相关文件 | [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) [apps/admin/src/lib/admin-notifications.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-notifications.tsx) [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts) | 通知批次列表被硬截断在 100 条。 |
| [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) | 页面把后端截断结果继续当成完整列表做搜索和分页。 |
| [apps/admin/src/lib/admin-notifications.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-notifications.tsx) | 当前筛选逻辑全部建立在前端数组上。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | `/api/admin/notifications` 已改成真实服务端分页和筛选，支持 `page / pageSize / keyword / type / audience`；前端通知管理页不再对最近 100 条做本地搜索和本地分页，而是直接消费后端返回的 `items / total / page / pageSize`。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin build`；`pnpm --filter @umi/api build` |
| Fixer 自测结果 | 通过：通知管理页现在按真实批次全集做搜索和分页，不再固定卡在最近 100 个批次窗口内。 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx)；[apps/admin/src/lib/api/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/system-notifications.ts)；[apps/api/src/modules/admin/system-notifications.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system-notifications.ts)；[apps/api/src/modules/admin/routes/system-ops-routes.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/system-ops-routes.ts)；[apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |
