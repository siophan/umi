# BUG-20260420-071

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-071` |
| `title` | 品牌创建和编辑接口允许直接挂到停用类目，前后端语义不一致 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/brands/category-status` |
| `scope` | `admin` |
| `page` | `#/brands/list` |
| `api` | `/api/admin/brands` `/api/admin/brands/{id}` |
| `owner` | `测试狗` |
| `source_run` | `admin-brands-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-brands:create-update-allows-disabled-categories` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

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
| 修复说明 | 如果停用类目不应继续承接新品牌，就把 `status = active` 纳入后端校验；如果业务允许，就需要把页面表单语义一并放开并写清楚。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
