# BUG-20260420-068

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-068` |
| `title` | 仪表盘热门竞猜只按审核通过取数，已结算竞猜也会混入榜单 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/dashboard/hot-guesses` |
| `scope` | `admin` |
| `page` | `#/dashboard` |
| `api` | `/api/admin/dashboard/stats` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-dashboard-qa-2026-04-20.md` |
| `fingerprint` | `admin-dashboard:hot-guesses-mixes-non-active-guesses` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 仪表盘“热门竞猜”应和老后台一样，只展示当前进行中的竞猜。 |
| 对齐基准 | 老后台仪表盘取热门竞猜时显式使用 `status: 'active'`，见 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/dashboard/index.tsx:87)。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 新仪表盘接口只按 `review_status = approved` 过滤热门竞猜，没有限制 `guess.status = active`，因此已结算但曾经热门的竞猜也会继续混入“热门竞猜”榜单。 |
| 影响范围 | 运营首页会把已结束竞猜误展示成当前热门，首页榜单和老后台口径不一致。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 对照老后台仪表盘的热门竞猜取数方式。 |
| 2 | 查看新后台 `/api/admin/dashboard/stats` 的 `hotGuesses` 查询。 |
| 3 | 可以看到老后台要求 `status = active`，而新接口只要求 `review_status = approved`。 |
| 4 | 因此只要某条竞猜审核通过且参与人数高，即使已经结算，也可能继续出现在热门榜单。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 老页证据 | 老后台仪表盘直接用 `guessApi.list({ status: 'active', limit: 5 })` 获取热门竞猜，见 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/dashboard/index.tsx:87) 到 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/dashboard/index.tsx:89)。 |
| 接口证据 | 新仪表盘的 `hotGuesses` 查询只过滤 `g.review_status = ?`，没有限制 `g.status = active`，见 [dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:193) 到 [dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:204)。 |
| 页面证据 | 页面标题直接写“热门竞猜”，并把接口结果原样渲染，没有额外标出“含历史竞猜”之类口径，见 [dashboard-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx:285) 到 [dashboard-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx:312)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts) | 热门竞猜 SQL 漏掉 `status = active` 过滤。 |
| [dashboard-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx) | 页面把不带活动态约束的结果直接渲染成“热门竞猜”。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 仪表盘 `hotGuesses` 查询已补上 `g.status = active` 过滤，热门竞猜现在只会返回当前进行中的竞猜，不再混入已结算历史热门。 |
| 验证命令 | `pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 通过。API 编译通过，热门竞猜查询口径已与老后台一致。 |
| Verifier 复测结果 | `2026-04-21` 代码复核通过。当前 [apps/api/src/modules/admin/dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:198) 到 [apps/api/src/modules/admin/dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:207) 已同时限制 `g.review_status = approved` 和 `g.status = active`。 |
| 修复提交/变更 | [apps/api/src/modules/admin/dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `已复核通过` |
| `说明` | `2026-04-21` 按 `#/dashboard` 同页合并复核时重新核对当前工作树：[apps/api/src/modules/admin/dashboard.ts:166](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:166) 到 [apps/api/src/modules/admin/dashboard.ts:185](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:185) 的热门竞猜查询已同时限制 `g.review_status = approved` 和 `g.status = active`；原问题已修复。 |
