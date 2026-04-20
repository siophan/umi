# BUG-20260420-034

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-034` |
| `title` | 竞猜历史页把历史读取失败静默吞成空记录 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `guess/history` |
| `page` | `/guess-history` |
| `api` | `/api/guesses/user/history` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-guess-history:load-failure-empty-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 竞猜历史读取失败时，页面应明确暴露错误态或重试态，不能直接渲染成“暂无记录”。 |
| 对齐基准 | 当前产品要求 / 页面错误处理一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `/api/guesses/user/history` 读取失败后，页面在 `catch` 中把 `stats / active / history / pk` 全部清空，然后展示空记录态。 |
| 影响范围 | 用户会误以为自己没有任何竞猜历史，回归时也会把接口失败误判成正常空态。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/guess-history`。 |
| 2 | 让 `/api/guesses/user/history` 返回非 `200` 或断网。 |
| 3 | 页面会显示“暂无记录”，而不是错误提示。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/guess-history/page.tsx:39](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:39) 到 [apps/web/src/app/guess-history/page.tsx:67](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:67)。 |
| 接口证据 | 竞猜历史页读取依赖 `/api/guesses/user/history`，失败后没有错误状态分支。 |
| 日志/断言 | `catch` 分支直接把 `stats / active / history / pk` 置空。 |
| 相关文件 | [apps/web/src/app/guess-history/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/guess-history/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx) | 读取失败直接回退成全空历史态。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 为竞猜历史页引入整页错误态和重试，不再在读取失败时清空数据并伪装成“暂无记录”。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/guess-history/page.tsx:39](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:39) 到 [apps/web/src/app/guess-history/page.tsx:61](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:39) 的加载逻辑，以及 [apps/web/src/app/guess-history/page.tsx:102](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:102) 到 [apps/web/src/app/guess-history/page.tsx:114](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:102) 的错误态渲染；历史接口失败时页面现在会显示“竞猜历史暂时不可用”和重试按钮，不再把失败伪装成“暂无记录”。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/guess-history/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx)、[apps/web/src/app/guess-history/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.module.css) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 历史接口失败时页面会显示显式错误态和重试，不再误导成正常空记录页。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/web/src/app/guess-history/page.tsx:38](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:38) 到 [apps/web/src/app/guess-history/page.tsx:56](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:56) 的加载逻辑，失败时只设置 `loadError`，不再把 `stats / active / history / pk` 清空成伪空态；同时 [apps/web/src/app/guess-history/page.tsx:88](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:88) 到 [apps/web/src/app/guess-history/page.tsx:103](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx:103) 已渲染“竞猜历史暂时不可用”和重试按钮。按当前“只验证代码”的口径，这张单可以重新关闭。 |
