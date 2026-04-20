# BUG-20260420-028

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-028` |
| `title` | 签到页在后端未承接时回退成固定签到数据和静态任务 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `checkin/page` |
| `page` | `/checkin` |
| `api` | `/api/checkin/status` `/api/checkin` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-checkin:missing-backend-fabricated-progress` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 签到后端未承接时，页面应明确展示能力未开通或错误态；签到进度、奖励和任务不应靠固定数字伪装成真实用户数据。 |
| 对齐基准 | [docs/feature-progress.md](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:133) / 当前产品要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面初始就写死 `streak = 7`、`total = 45`，接口失败时继续回退到这组数字；奖励时间线和每日任务也完全来自本地常量。 |
| 影响范围 | 用户会看到看似真实的签到天数、累计天数和任务完成度，误以为功能已接通。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/checkin`。 |
| 2 | 查看 [docs/feature-progress.md:133](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:133) 和 [docs/feature-progress.md:258](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:258)，当前后端未见 `checkin` router。 |
| 3 | 页面仍展示固定的连续签到、累计签到、奖励和每日任务。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/checkin/page.tsx:9](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx:9) 到 [apps/web/src/app/checkin/page.tsx:24](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx:24)，[apps/web/src/app/checkin/page.tsx:53](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx:53) 到 [apps/web/src/app/checkin/page.tsx:74](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx:53)。 |
| 接口证据 | [docs/feature-progress.md:133](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:133) 与 [docs/feature-progress.md:258](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:258) 已写明 `checkin` 页面前端直连、后端未见 router。 |
| 日志/断言 | `catch` 分支把进度回退成 `7 / 45 / false`；任务与奖励完全来自 `tasks`、`rewards` 常量。 |
| 相关文件 | [apps/web/src/app/checkin/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/checkin/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx) | 用固定进度和任务伪装未承接链路。 |
| [docs/feature-progress.md](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:133) | 已明确标注当前接口未闭环。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 未接线前去掉固定签到结果和任务完成态，改成明确的未开通/错误提示；接线后再展示真实进度。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/checkin/page.tsx:7](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx:7) 到 [apps/web/src/app/checkin/page.tsx:11](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx:11) 的 readiness 文案，以及 [apps/web/src/app/checkin/page.tsx:35](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx:35) 到 [apps/web/src/app/checkin/page.tsx:81](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx:35) 的整体渲染；页面已明确标注“签到功能建设中/暂未开放”，不再展示固定连续签到、累计签到、奖励和任务完成度，只保留中性说明和占位提示。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/checkin/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了签到页的当前渲染内容；页面已明确标注签到链路未接入、按钮禁用，并把原先固定的连续签到、累计签到、奖励和每日任务全部收掉，只保留中性说明和占位提示，不再伪装真实签到数据。 |
