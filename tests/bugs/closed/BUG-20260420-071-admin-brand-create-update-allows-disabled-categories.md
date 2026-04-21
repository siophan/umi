# BUG-20260420-071

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-071` |
| `title` | 品牌创建和编辑接口允许直接挂到停用类目，前后端语义不一致 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/brands/category-status` |
| `scope` | `admin` |
| `page` | `#/brands/list` |
| `api` | `/api/admin/brands` `/api/admin/brands/{id}` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brands-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-brands:create-update-allows-disabled-categories` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 如果页面已经把停用品牌类目视为不可选，后台创建/编辑品牌也应拒绝把品牌挂到停用类目上。 |
| 对齐基准 | 品牌列表页的新增/编辑表单只暴露 active 品牌类目，说明当前产品语义是“停用类目不应再被新分配”。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `createAdminBrand()` 和 `updateAdminBrand()` 校验类目时只检查 `biz_type = 10`，不检查类目状态是否为 active。也就是说，只要直接调用 API，就能把新品牌或已有品牌挂到停用类目下。 |
| 影响范围 | 品牌类目状态的约束只停留在前端表单层，无法真正阻止停用类目继续承接新品牌。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 选一个已停用的品牌类目。 |
| 2 | 直接请求 `/api/admin/brands` 或 `/api/admin/brands/{id}`，提交这个停用类目的 `categoryId`。 |
| 3 | 后端只验证类目存在且 `biz_type = 10`。 |
| 4 | 请求会通过，把品牌挂到停用类目下。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 品牌页新增/编辑表单的类目下拉只取 `bizType === 'brand' && status === 'active'`，见 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:120) 到 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:125)。 |
| 接口证据 | 创建品牌时，后端只校验类目 `id = ? AND biz_type = 10`，没有检查 `status`，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1076) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1086)。 |
| 接口证据 | 编辑品牌时，后端同样只校验 `id = ? AND biz_type = 10`，没有检查 `status`，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1168) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1178)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) | 创建/编辑品牌时没有把类目状态纳入校验。 |
| [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx) | 页面和接口对停用类目的语义不一致。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已把品牌创建/编辑的后端类目校验收口到当前页面语义：新增品牌时要求类目存在且 `status = active`；编辑品牌时允许保留“当前已绑定的停用类目”，但不允许改挂到其他停用类目。路由错误映射同步补了 `ADMIN_BRAND_CATEGORY_DISABLED`。 |
| 验证命令 | `pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 通过。API 现在会拒绝把新品牌或已有品牌改挂到停用类目，同时允许编辑时保留当前已绑定的停用类目。`@umi/api` typecheck 通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前 `apps/api/src/modules/admin/merchant-brands.ts` 在品牌新建和更新时都会校验类目状态：新建不能挂停用类目，编辑也只允许保留当前已绑定的停用类目，不允许切到另一个停用类目。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts`；`/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `通过，关闭` |
| `说明` | [apps/api/src/modules/admin/merchant.ts:1083](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1083) 到 [apps/api/src/modules/admin/merchant.ts:1099](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1083) 的新增写链现已在 `biz_type = 10` 之外额外要求类目 `status = active`；[apps/api/src/modules/admin/merchant.ts:1186](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1186) 到 [apps/api/src/modules/admin/merchant.ts:1203](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1186) 的编辑写链只允许保留当前已绑定的停用类目，不允许改挂到其他停用类目；[apps/api/src/modules/admin/routes/merchant-routes.ts:142](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/merchant-routes.ts:142) 和 [apps/api/src/modules/admin/routes/merchant-routes.ts:173](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/merchant-routes.ts:173) 也已补 `ADMIN_BRAND_CATEGORY_DISABLED` 错误映射。原问题代码路径已消失。 |
