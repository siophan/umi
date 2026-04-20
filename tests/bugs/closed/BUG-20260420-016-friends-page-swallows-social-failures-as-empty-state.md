# BUG-20260420-016

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-016` |
| `title` | 好友页把社交链和竞猜链请求失败静默吞成空页面 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `friends/page` |
| `page` | `/friends` |
| `api` | `/api/auth/social` `/api/guesses` `/api/guesses/user/history` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-friends:social-and-guess-failures-swallowed-to-empty-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 好友页读取失败时，应暴露错误态，不应回退成“没有好友/没有请求/没有热门竞猜”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面用 `Promise.allSettled` 读取社交概览、竞猜列表、竞猜历史，失败后统一降级成空数组和 `0`。 |
| 影响范围 | 好友数、粉丝、申请、PK 数和热门竞猜都可能被误判为空。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/friends`。 |
| 2 | 让社交概览、竞猜列表或竞猜历史接口返回失败。 |
| 3 | 页面仍会显示正常框架，但内容退为空。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/friends/page.tsx:216](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:216) 到 [apps/web/src/app/friends/page.tsx:251](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:251)。 |
| 接口证据 | 页面依赖社交概览和竞猜链路装配。 |
| 日志/断言 | 失败时直接 `setFriends([])`、`setFollowing([])`、`setFans([])`、`setRequests([])`、`setHotGuesses([])`、`setPkCount(0)`。 |
| 相关文件 | [apps/web/src/app/friends/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/friends/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx) | 装配层把多接口失败统一伪装成空态。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 社交概览和竞猜链改成独立错误态；失败时不再把好友/关注/粉丝/申请和热门竞猜伪装成空内容，也不再把 PK 数降成 0。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；好友页已区分“真空态”和“接口失败”。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/friends/page.tsx:217](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:217) 到 [apps/web/src/app/friends/page.tsx:257](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:257) 的装配逻辑，以及 [apps/web/src/app/friends/page.tsx:520](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:520) 到 [apps/web/src/app/friends/page.tsx:528](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:520)、[apps/web/src/app/friends/page.tsx:575](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:575) 到 [apps/web/src/app/friends/page.tsx:593](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:575)、[apps/web/src/app/friends/page.tsx:632](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:632) 等渲染分支；社交链失败会展示统一错误卡，竞猜链失败会展示热门竞猜错误态，顶部好友/关注/粉丝/PK 计数也会在缺数据时显示 `--`，不再伪装成空内容或 `0`。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/friends/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx)、[apps/web/src/app/friends/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了好友页对社交概览、竞猜列表、竞猜历史三条读取链的 `Promise.allSettled` 处理，以及社交区/热门竞猜区的渲染分支；当前社交关系失败会统一展示“社交关系加载失败 + 重新加载”，竞猜链失败只在“好友都在猜”区展示独立错误卡，不再把失败伪装成空好友页或正常空区块。 |
