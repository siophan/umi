# BUG-20260420-070

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-070` |
| `title` | 品牌列表筛选器和编辑表单都隐藏停用类目，现存品牌无法按原类目定位或原样编辑 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/brands/category-filter` |
| `scope` | `admin` |
| `page` | `#/brands/list` |
| `api` | `/api/admin/brands` `/api/admin/categories` `/api/admin/brands/{id}` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brands-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-brands:disabled-categories-hidden-from-filter-and-edit` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

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
| 修复说明 | 品牌列表筛选器已改成展示全部品牌类目，不再只保留 active；停用类目会带“停用”标识。编辑弹层类目下拉只默认开放 active 类目，但会额外保留当前品牌已绑定的停用类目，确保现存品牌仍能按原类目定位并原样编辑。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。停用类目已能在品牌筛选器中出现；编辑停用类目下品牌时，当前绑定类目会在表单中保留可见。admin `typecheck` 与 `build` 均通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前品牌页筛选和编辑表单都已补回“当前绑定但已停用”的分类选项，不再把停用类目下的现存品牌静默藏掉。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `通过，关闭` |
| `说明` | [apps/admin/src/pages/brands-page.tsx:117](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:117) 到 [apps/admin/src/pages/brands-page.tsx:128](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:128) 的列表筛选器现已展示全部品牌类目，并给停用类目追加“（停用）”标记；[apps/admin/src/pages/brands-page.tsx:144](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:144) 到 [apps/admin/src/pages/brands-page.tsx:177](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:144) 的编辑表单选项默认保留 active 类目，同时会把当前品牌绑定的停用类目补回为“当前绑定，已停用”。原问题代码路径已消失。 |
