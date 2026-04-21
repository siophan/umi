# BUG-20260420-070

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-070` |
| `title` | 品牌列表筛选器和编辑表单都隐藏停用类目，现存品牌无法按原类目定位或原样编辑 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/brands/category-filter` |
| `scope` | `admin` |
| `page` | `#/brands/list` |
| `api` | `/api/admin/brands` `/api/admin/categories` `/api/admin/brands/{id}` |
| `owner` | `测试狗` |
| `source_run` | `admin-brands-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-brands:disabled-categories-hidden-from-filter-and-edit` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 如果品牌当前仍挂在停用类目下，后台至少要允许按该类目筛出这批品牌，并在编辑时能看见当前类目归属。 |
| 对齐基准 | 现存业务数据不应因为类目状态变化就从后台筛选器和编辑表单里“消失”。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 品牌列表筛选器和编辑表单的类目选项都只取 `status === 'active'` 的品牌类目；而品牌列表接口本身并不会过滤掉停用类目，编辑接口也只校验 `biz_type = 10`。结果是现存品牌若挂在停用类目下，就无法通过筛选器精准定位，编辑时也看不到当前类目选项。 |
| 影响范围 | 后台对停用类目下的现存品牌失去精确筛选和原样编辑能力。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 准备一个仍绑定在停用品牌类目下的品牌。 |
| 2 | 打开品牌列表页，查看“类目”筛选器。 |
| 3 | 由于选项只保留 active 类目，这个停用类目不会出现。 |
| 4 | 再打开该品牌的编辑弹层，当前类目同样不会出现在下拉选项里。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 列表筛选器的 `categoryOptions` 只保留 `bizType === 'brand' && status === 'active'` 的类目；编辑表单的 `categoryIdOptions` 也一样，见 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:106) 到 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:123)。 |
| 列表证据 | 品牌列表接口直接 `LEFT JOIN category` 读取 `category_name`，没有按类目状态过滤，所以停用类目下的品牌仍会出现在表格里，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1504) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1527)。 |
| 写链证据 | 新增/编辑品牌时，后端只校验类目 `biz_type = 10`，没有要求类目必须 active，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1076) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1086)，以及 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1168) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:1178)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx) | 筛选器和编辑表单都把停用类目硬过滤掉了。 |
| [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts) | 列表和写链对类目状态语义不一致。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 列表筛选器至少应覆盖当前数据里已被品牌使用的类目；编辑表单需要保留“当前绑定类目”可见性，避免因类目停用而强制改类目。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
