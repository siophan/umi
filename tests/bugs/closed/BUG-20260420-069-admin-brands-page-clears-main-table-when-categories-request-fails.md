# BUG-20260420-069

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-069` |
| `title` | 品牌列表页把类目接口失败误当成整页失败，辅助字典异常会清空主表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/brands/load` |
| `scope` | `admin` |
| `page` | `#/brands/list` |
| `api` | `/api/admin/brands` `/api/admin/categories` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brands-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-brands:categories-failure-clears-main-table` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 品牌主表应优先独立展示；类目字典失败最多影响筛选器和编辑弹层，不应把已经成功返回的品牌列表一起清空。 |
| 对齐基准 | 品牌列表是主链路，类目只是辅助筛选和表单字典。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面初始化把 `fetchAdminBrands()` 和 `fetchAdminCategories()` 绑进同一个 `Promise.all`。只要类目接口报错，catch 分支就会 `setData(emptyData)`，导致品牌主表一起清空。 |
| 影响范围 | 后台会把“类目字典失败”误展示成“品牌列表为空或整页失败”，扩大故障面。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开品牌列表页。 |
| 2 | 让 `/api/admin/categories` 失败，而 `/api/admin/brands` 仍成功。 |
| 3 | 页面会进入统一 catch。 |
| 4 | 主表和类目字典会一起被清空。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 页面初始化把品牌列表和类目字典绑成 `Promise.all`，失败后直接 `setData(emptyData)`，见 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:78) 到 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:90)。 |
| 接口证据 | 品牌主表和类目字典本来就是两条独立请求：`/api/admin/brands` 与 `/api/admin/categories`，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:140) 和 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts:59)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx) | 页面初始化失败面把辅助字典和主列表绑死。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已拆开品牌主表和类目字典的失败处理：页面初始化改成 `Promise.allSettled`，品牌主表与类目字典分别落各自结果；`/api/admin/categories` 失败时保留 `/api/admin/brands` 成功返回的主表数据，只对筛选器和编辑弹层暴露局部 warning，并用已加载品牌里的 `categoryId/category` 作为类目回退选项。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。后台品牌页已避免“类目字典失败拖垮主表”；admin `typecheck` 与 `build` 均通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前品牌页已用 `Promise.allSettled` 分开处理主表和类目字典；类目接口失败只会降级局部 warning 和回退选项，不再把品牌主表一起清空。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `通过，关闭` |
| `说明` | [apps/admin/src/pages/brands-page.tsx:80](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:80) 到 [apps/admin/src/pages/brands-page.tsx:102](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:102) 已改为 `Promise.allSettled`，品牌主表与类目字典分别处理成功/失败结果；[apps/admin/src/pages/brands-page.tsx:299](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:299) 到 [apps/admin/src/pages/brands-page.tsx:306](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:306) 在类目失败时只展示局部 warning；[apps/admin/src/pages/brands-page.tsx:131](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:131) 到 [apps/admin/src/pages/brands-page.tsx:141](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:141) 还补了基于已加载品牌数据的类目回退选项。原问题代码路径已消失。 |
