# BUG-20260420-007

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-007` |
| `title` | 首页把多个接口失败静默吞成正常空区块 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `home/data` |
| `page` | `/` |
| `api` | `/api/banners` `/api/guesses` `/api/lives` `/api/rankings` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-home:allsettled-fallbacks-hide-fetch-failures` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 首页分区接口失败时，应显示明确的异常状态或降级说明，不应把失败直接渲染成“正常空内容”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 首页使用 `Promise.allSettled`，任何分区请求失败都会被直接替换成空数组，再交给页面正常渲染。 |
| 影响范围 | Banner、竞猜、直播、榜单都可能在故障时看起来只是“暂时没有内容”，掩盖真实故障。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开首页 `/`。 |
| 2 | 让任一首页接口返回失败。 |
| 3 | 对应区块不会暴露错误，只会收到空数组并按正常空内容渲染。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/page.tsx:24](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx:24) 到 [apps/web/src/app/page.tsx:42](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx:42)。 |
| 接口证据 | 首页同时依赖 `/api/banners`、`/api/guesses`、`/api/lives`、`/api/rankings`。 |
| 日志/断言 | `fulfilled` 才取值，否则直接回退 `[]`，没有错误态透出。 |
| 相关文件 | [apps/web/src/app/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx) | 服务端首页装配层把分区失败全部吞成空数据。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 首页服务端首屏和客户端补拉都已保留分区级错误信息：Banner、竞猜、直播、榜单请求失败时不再只回退空数组，而是同步透出 `sectionErrors`，页面按区块渲染错误提示；真正的空内容和接口故障已分开。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；首页装配层不再把分区失败无差别伪装成正常空区块。 |
| Verifier 复测结果 | 通过。已复核首页保留并消费 `sectionErrors`，Banner/竞猜/榜单/直播失败会渲染分区提示而不是伪装成正常空区块；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
| 修复提交/变更 | [apps/web/src/app/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx)、[apps/web/src/app/page-client.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page-client.tsx)、[apps/web/src/app/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了首页服务端 `Promise.allSettled` 装配、客户端补拉逻辑以及各区块渲染分支；当前 Banner、竞猜、榜单、直播请求失败都会同步写入 `sectionErrors` 并渲染区块级错误提示，只在真实无数据时才展示空内容，不再把故障静默吞成正常空区块。 |
