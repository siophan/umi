# BUG-20260420-024

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-024` |
| `title` | 社区搜索页把推荐和搜索请求失败静默吞成空内容 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `community/search` |
| `page` | `/community-search` |
| `api` | `/api/community/discovery` `/api/users/search` `/api/community/search` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-community-search:fetch-failures-swallowed-to-empty-content` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 推荐关注、热搜和搜索结果读取失败时，应显示错误态，不应显示成空内容。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 推荐加载失败时直接置空 `recommendedUsers/hotSearches`；执行搜索失败时直接置空 `posts/users`。 |
| 影响范围 | 社区搜索故障会被误判为“没人”“没结果”“没热搜”。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/community-search`。 |
| 2 | 让 discovery、用户搜索或社区搜索接口返回失败。 |
| 3 | 页面显示空内容，而不是错误态。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/community-search/page.tsx:156](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:156) 到 [apps/web/src/app/community-search/page.tsx:179](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:179)，以及 [apps/web/src/app/community-search/page.tsx:192](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:192) 到 [apps/web/src/app/community-search/page.tsx:217](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:217)。 |
| 接口证据 | 页面依赖 discovery、用户搜索和社区搜索三条链路。 |
| 日志/断言 | 失败时直接 `setRecommendedUsers([])`、`setHotSearches([])`、`setPosts([])`、`setUsers([])`。 |
| 相关文件 | [apps/web/src/app/community-search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/community-search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx) | 页面把推荐和搜索失败伪装成空结果。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 社区搜索页把热搜、推荐关注、搜索结果拆成独立错误状态；任一接口失败时分别显示错误卡和重试，不再统一降级成“暂无热搜/暂无推荐/未找到内容”。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| 验证结果 | 通过 |
| 修复提交/变更 | [apps/web/src/app/community-search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx)、[apps/web/src/app/community-search/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.module.css) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 推荐链和搜索链失败时都会显式暴露错误，不再伪装成空内容。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |

## Verifier

| 字段 | 值 |
| --- | --- |
| `verify_owner` | `测试猫` |
| `verify_result` | 测试猫独立复核了 [apps/web/src/app/community-search/page.tsx:149](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:149) 到 [apps/web/src/app/community-search/page.tsx:196](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:196) 的 discovery 装配逻辑，以及 [apps/web/src/app/community-search/page.tsx:211](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:211) 到 [apps/web/src/app/community-search/page.tsx:234](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:234) 的搜索逻辑，配合 [apps/web/src/app/community-search/page.tsx:437](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:437) 到 [apps/web/src/app/community-search/page.tsx:503](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:437) 和 [apps/web/src/app/community-search/page.tsx:512](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:512) 到 [apps/web/src/app/community-search/page.tsx:523](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:523) 的渲染分支；热搜、推荐关注、搜索结果现在都会分别显示错误卡和重试按钮，不再回退成空内容。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了社区搜索页的热搜、推荐关注、正式搜索三条读取链以及默认态/结果态渲染；当前热搜加载失败、推荐关注加载失败、搜索失败都会分别展示独立错误区和重试入口，只有真实无数据时才显示空内容。 |
