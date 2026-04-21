# BUG-20260420-045

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-045` |
| `title` | 店铺列表主营类目筛选会漏掉停用类目下的现存店铺 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/shops/filter` |
| `scope` | `admin` |
| `page` | `#/shops/list` |
| `api` | `/api/admin/shops` / `/api/admin/categories` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-shops-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-shops:category-filter-only-active-categories` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 店铺列表的“主营类目”筛选应覆盖当前列表里实际存在的所有店铺类目；如果历史店铺仍挂在已停用类目下，也应能被筛出来。 |
| 对齐基准 | 当前产品要求 / 管理后台列表筛选准确性要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当分类接口里存在任意启用中的店铺类目时，页面只把 `status === active` 的类目放进筛选选项；当前列表中属于停用类目的店铺仍会显示在表格里，但下拉框不会提供对应类目值。 |
| 影响范围 | 后台无法通过“主营类目”精确筛出挂在停用类目、历史类目或已下线类目下的店铺，筛选结果和当前列表事实不一致。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 准备至少一个挂在已停用店铺类目下的店铺。 |
| 2 | 打开 `#/shops/list`，确认该店铺仍显示在表格中。 |
| 3 | 打开“主营类目”筛选，当前下拉框不会出现这个停用类目，因此无法按该类目筛出这家店铺。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | `categoryOptions` 优先只取 `item.bizType === 'shop' && item.status === 'active'` 的分类；只要存在启用类目，就不会再回退到当前店铺行里的真实类目集合，见 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:91) 到 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:103)。 |
| 接口证据 | 页面同时拉取 `/api/admin/shops` 与 `/api/admin/categories`，见 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:59) 到 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:70)；分类项类型里明确区分 `status: 'active' | 'disabled'`，见 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:24) 到 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:31)。 |
| 日志/断言 | 当前筛选逻辑以类目名称字符串做精确匹配，见 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:127) 到 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:148)；如果下拉里没有停用类目，用户就无法通过正式筛选入口触达这些现存店铺。 |
| 相关文件 | [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx) [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx) | 类目选项只保留启用类目，导致筛选覆盖不完整。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已调整店铺列表类目筛选：优先展示启用类目，同时补回“停用但仍被当前店铺引用”的类目；如果列表中出现分类主数据里已不存在的历史类目，也会以“历史类目”补进下拉选项。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。管理台类型检查和生产构建均通过，筛选下拉不再遗漏停用/历史类目。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前类目筛选已改成 `buildShopCategoryOptions()` 统一生成：启用类目正常展示，停用但仍被当前店铺引用的类目会标记“已停用”，缺主数据的历史值会标记“历史类目”，现存店铺类目都能正式筛出。 |
| 修复提交/变更 | `apps/admin/src/pages/shops-page.tsx` |

## Fixer

- 已让店铺列表的“主营类目”筛选覆盖当前表格里实际出现过的全部类目值。
- 停用类目会以“`类目名（已停用）`”显示，历史遗留但分类表已不存在的值会以“`类目名（历史类目）`”显示。

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/admin/src/pages/shops-page.tsx:87](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:87) 到 [apps/admin/src/pages/shops-page.tsx:108](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:87)，类目筛选已不再只保留启用类目：被当前店铺引用的停用类目会以“已停用”补回，分类主数据缺失但列表仍存在的值也会以“历史类目”补回，因此当前表格里实际存在的店铺类目现在都能通过正式筛选入口触达。 |
