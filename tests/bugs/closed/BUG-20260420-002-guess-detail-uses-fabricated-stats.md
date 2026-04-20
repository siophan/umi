# BUG-20260420-002

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-002` |
| `title` | 竞猜详情页混入伪造统计和本地交互状态 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `guess/detail` |
| `page` | `/guess/[id]` |
| `api` | `/api/guesses/:id` `/api/guesses/:id/stats` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-guess-detail:fabricated-topic-order-count-countdown-and-local-favorite` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 竞猜详情页应以真实接口数据渲染文案、统计、倒计时和收藏状态；缺失能力应显式为空或待接，不应伪造业务数据。 |
| 对齐基准 | 当前产品要求 / `apps/api` 实际接口语义 / 老系统详情页信息结构 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面虽然调用了 `fetchGuess`，但仍硬编码话题描述、总订单数、倒计时，并用本地状态假装收藏和评论交互。 |
| 影响范围 | 竞猜详情页主内容区、用户判断、测试结论都会被污染；页面和接口数据无法一一对应。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开任意 `/guess/[id]`。 |
| 2 | 观察页面“总订单”“倒计时”“话题描述”和收藏按钮。 |
| 3 | 对比代码可见这些值并非来自接口，而是本地硬编码或本地 state。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/guess/[id]/page.tsx:132](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx:132)、[apps/web/src/app/guess/[id]/page.tsx:223](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx:223)、[apps/web/src/app/guess/[id]/page.tsx:252](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx:252)、[apps/web/src/app/guess/[id]/page.tsx:275](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx:275)。 |
| 接口证据 | 页面已走 `/api/guesses/:id`，但消费层仍伪造统计和交互结果。 |
| 日志/断言 | `topicDescription`、总订单 `21`、倒计时 `00:38:21`、收藏切换都不是服务端事实。 |
| 相关文件 | [apps/web/src/app/guess/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/guess/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx) | 页面主体混入演示数据和本地伪交互。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 竞猜详情页已删除本地伪造的总订单、固定倒计时、话题说明、参与头像、收藏状态和评论列表；页面改为只展示真实竞猜标题、商品、选项、赔率、票数、结束时间和状态。退回后又修正了话题统计文案，把错误的“人关注”改成真实语义“人参与”。缺失的收藏/评论能力显式标成“待接入”，不再用本地 state 伪装真实交互。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；`/guess/[id]` 页面不再包含 `21`、`00:38:21`、演示评论或本地收藏切换，话题统计文案也已修正为“人参与”。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/guess/[id]/page.tsx:333](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx:333) 到 [apps/web/src/app/guess/[id]/page.tsx:348](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx:348) 的统计文案，以及 [apps/web/src/app/guess/[id]/page.tsx:355](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx:355) 到 [apps/web/src/app/guess/[id]/page.tsx:367](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx:367) 的“待接入”交互占位；页面现在使用真实 `totalVotes` 展示“人参与”，不再伪造“人关注”、固定倒计时、演示评论或本地收藏状态。收藏和评论能力也已显式降成“待接入”，不再用本地 state 假装真实互动。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/guess/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx)、[apps/web/src/app/guess/[id]/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了详情页加载逻辑、`GuessSummary` 契约以及 `totalVotes` 的消费链；当前页面只基于真实 `guess.options[].voteCount` 计算参与人数和百分比，倒计时按 `guess.endTime` 实时计算，收藏/评论已明确降成“待接入”，没有看到旧的固定倒计时、本地假收藏或演示评论残留。 |
