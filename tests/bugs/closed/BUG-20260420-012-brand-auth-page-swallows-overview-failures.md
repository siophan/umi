# BUG-20260420-012

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-012` |
| `title` | 品牌授权页把概览请求失败静默吞成空页面 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `shop/brand-auth` |
| `page` | `/brand-auth` |
| `api` | `/api/shops/brand-auth` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-brand-auth:overview-fetch-failure-swallowed-to-empty-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 品牌授权概览读取失败时，页面应暴露错误态，不应渲染成“暂无授权品牌/所有品牌均已申请”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `fetchBrandAuthOverview()` 失败后，页面直接把 `mine` 和 `available` 置空。 |
| 影响范围 | 用户会误判自己的授权状态和可申请品牌池。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/brand-auth`。 |
| 2 | 让 `/api/shops/brand-auth` 返回失败。 |
| 3 | 页面会显示空授权和空可申请品牌，而不是错误态。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/brand-auth/page.tsx:49](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:49) 到 [apps/web/src/app/brand-auth/page.tsx:62](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:62)。 |
| 接口证据 | 页面核心数据完全依赖 `/api/shops/brand-auth`。 |
| 日志/断言 | 失败时直接 `setOverview({ shopName: null, mine: [], available: [] })`。 |
| 相关文件 | [apps/web/src/app/brand-auth/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/brand-auth/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx) | 页面把授权概览失败伪装成空结果。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 为授权概览增加显式错误态和重试入口；概览读取失败时不再把 mine/available 伪装成空结果。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；概览失败时会显示错误卡片，不再误导为“暂无授权/所有品牌均已申请”。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/brand-auth/page.tsx:54](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:54) 到 [apps/web/src/app/brand-auth/page.tsx:75](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:54) 的加载逻辑，以及 [apps/web/src/app/brand-auth/page.tsx:180](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:180) 到 [apps/web/src/app/brand-auth/page.tsx:186](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:180) 和 [apps/web/src/app/brand-auth/page.tsx:229](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:229) / [apps/web/src/app/brand-auth/page.tsx:286](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx:286) 的空态保护；概览失败时页面会展示“授权概览加载失败”和重试按钮，不再伪装成正常空页面。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/brand-auth/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx)、[apps/web/src/app/brand-auth/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了品牌授权页对 `fetchBrandAuthOverview` 的异常处理，以及错误态与空态的渲染保护；当前概览失败会设置显式 `error` 并展示“授权概览加载失败 + 重新加载”，`mine`/`available` 的空态文案只在非错误场景下出现，不再把请求失败伪装成空页面。 |
