# BUG-20260420-039

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-039` |
| `title` | 用户列表页手机号和店铺名称筛选只过滤当前页数据且保留全局分页总数 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `admin/users/list` |
| `scope` | `admin` |
| `page` | `#/users/list` |
| `api` | `/api/admin/users` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-user-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-users:list-phone-shop-filters-local-only` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | “手机号”“店铺名称”这两个搜索控件应驱动真实后端查询，并让表格数据、总条数、分页结果保持同一口径；如果当前接口不支持，就不应把它们做成正式筛选控件。 |
| 对齐基准 | 当前产品要求 / 管理后台列表页基本约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面把 `phone` 和 `shopName` 存进本地 `extraFilters`，只在当前页 `listData` 上做前端二次过滤；同时 `/api/admin/users` 请求仍只带 `page / pageSize / keyword / role`，总条数 `total` 也保持后端全量结果。 |
| 影响范围 | 管理员按手机号或店铺名称检索用户时，只能过滤“当前页已经拿到的 10/20/50 条数据”，无法在全量用户中准确定位；页面还能同时展示“空表格 + 全局总条数”，误导运营判断。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/users/list`，保持默认分页。 |
| 2 | 在“手机号”或“店铺名称”里输入一个不在当前页、但在全量用户里存在的值。 |
| 3 | 点击搜索，页面只会在当前页数据上做本地过滤，可能直接显示空表格，同时分页总数仍保持后端原始总量。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 页面把 `phone` 和 `shopName` 写入本地 `extraFilters`，并仅在 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:229) 到 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:249) 的 `visibleUsers` 上过滤；搜索提交逻辑在 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:495) 到 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:523)。 |
| 接口证据 | 前端请求封装 [users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts:17) 到 [users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts:34) 只发送 `page / pageSize / keyword / role`；共享查询类型 [api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:574) 到 [api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:579) 也没有 `phone / shopName`。 |
| 日志/断言 | 后端过滤条件 [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:9) 到 [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:34) 只处理 `keyword` 和 `role`；表格分页总数使用后端 `total`，见 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:545) 到 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:566)。 |
| 相关文件 | [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) [users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts) [api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts) [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) | 页面把“手机号 / 店铺名称”做成了只作用于当前页数据的本地筛选。 |
| [users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts) | `/api/admin/users` 请求未承接 `phone / shopName` 参数。 |
| [api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts) | `AdminUserListQuery` 缺少对应筛选字段。 |
| [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts) | 后端查询条件没有“手机号 / 店铺名称”筛选。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | “手机号 / 店铺名称” 已进入 `/api/admin/users` 真实查询参数，页面不再对当前页做本地二次过滤，列表、分页和总条数统一使用后端结果口径。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/api typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前用户列表会把 `phone / shopName` 直接带进 `fetchAdminUsersPage()` 请求；`packages/shared/src/api.ts` 与 `apps/api/src/modules/users/admin-store.ts` 也都已承接这两个真实查询字段，页面不再对当前页做本地二次过滤。 |
| 修复提交/变更 | [apps/admin/src/pages/users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx)、[apps/admin/src/lib/api/users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts)、[packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts)、[apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts)、[apps/api/src/modules/users/admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts)、[apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 管理后台用户列表的手机号和店铺名称筛选已改成真实后端筛选，不再出现“空表格但总数还是全局总量”的口径错乱。 |
| `self_check` | 已完成代码自查，并通过 `api/admin typecheck`。 |

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/admin/src/pages/users-page.tsx:223](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:223) 到 [apps/admin/src/pages/users-page.tsx:240](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:240) 和 [apps/admin/src/pages/users-page.tsx:537](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:537) 到 [apps/admin/src/pages/users-page.tsx:556](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:556)，列表请求已直接带上 `phone / shopName`，页面不再对当前页数据做本地二次过滤；同时 [apps/admin/src/lib/api/users.ts:21](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts:21) 到 [apps/admin/src/lib/api/users.ts:29](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts:29)、[packages/shared/src/api.ts:663](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:663) 到 [packages/shared/src/api.ts:669](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:669)、[apps/api/src/modules/admin/router.ts:231](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:231) 到 [apps/api/src/modules/admin/router.ts:246](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:246)、[apps/api/src/modules/users/admin-store.ts:10](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:10) 到 [apps/api/src/modules/users/admin-store.ts:30](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:10) 都已承接这两个筛选字段。按代码口径，列表、分页和总数现在统一使用后端结果。 |
