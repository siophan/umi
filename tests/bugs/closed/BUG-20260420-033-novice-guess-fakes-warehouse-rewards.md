# BUG-20260420-033

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-033` |
| `title` | 新手竞猜页把本地演示奖励描述成真实入仓结果 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `novice-guess/page` |
| `page` | `/novice-guess` |
| `api` | 无 |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-novice-guess:static-demo-pretends-real-warehouse-reward` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 既然 [docs/feature-progress.md:104](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:104) 已明确 `/novice-guess` 是“静态/本地态”，页面就不应把奖励、入仓、复活、分享等演示行为描述成真实业务结果。 |
| 对齐基准 | [docs/feature-progress.md:104](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:104) / 当前产品要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面使用本地题库、本地奖品、本地在线人数和本地连胜逻辑，但文案反复宣称“战利品已入库”“可在我的仓库中查看”“完成后自动入仓”“奖励已锁定，完成注册后自动入仓”，并直接提供跳去 `/warehouse` 的按钮。 |
| 影响范围 | 新用户会把这条静态引导页误认为真实的奖励发放链路，误判自己已获得可落库商品。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/novice-guess` 并完成任意一轮。 |
| 2 | 观察弹层和结果页文案。 |
| 3 | 页面会把本地演示奖励描述成真实入仓结果，并引导进入 `/warehouse`。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/novice-guess/page.tsx:28](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:28) 到 [apps/web/src/app/novice-guess/page.tsx:121](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:28)，[apps/web/src/app/novice-guess/page.tsx:310](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:310) 到 [apps/web/src/app/novice-guess/page.tsx:320](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:310)，[apps/web/src/app/novice-guess/page.tsx:595](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:595) 到 [apps/web/src/app/novice-guess/page.tsx:677](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:595)。 |
| 接口证据 | [docs/feature-progress.md:104](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:104) 已写明当前页面“静态/本地态”，无直接 API import。 |
| 日志/断言 | 题库、奖品、滚动获奖用户、在线人数全来自本地常量；`handleShare()` 只弹 toast，但文案仍宣称可获得复活机会。 |
| 相关文件 | [apps/web/src/app/novice-guess/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/novice-guess/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx) | 静态引导页的文案和行为过度冒充真实奖励链路。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 把新手竞猜页的奖励文案改成演示/体验语义，移除“已入库/自动入仓/奖励锁定/我的仓库”等真实业务表达和跳转。本轮又继续收掉开屏、题中、连胜弹层和结果页里残留的“猜对了就是你的”“免费拿”“已解锁奖励”“刚拿到”“可把奖励全部拿下”等真奖励口径，统一改成体验模式/演示展示表述。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。`/novice-guess` 从开屏、题中到结果页的关键文案都已统一成体验模式口径，不再把本地题库和演示奖励描述成真实发放链路。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/novice-guess/page.tsx:255](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:255) 到 [apps/web/src/app/novice-guess/page.tsx:255](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:255) 的分享提示，以及 [apps/web/src/app/novice-guess/page.tsx:310](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:310) 到 [apps/web/src/app/novice-guess/page.tsx:320](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:320)、[apps/web/src/app/novice-guess/page.tsx:552](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:552) 到 [apps/web/src/app/novice-guess/page.tsx:563](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:563)、[apps/web/src/app/novice-guess/page.tsx:595](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:595) 到 [apps/web/src/app/novice-guess/page.tsx:658](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:658) 的演示文案；页面已明确声明“体验模式/静态体验页/不会真实入仓”，不再把演示奖励描述成真实仓库结果。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/novice-guess/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 页面现在从开屏、题中到结果页都明确把奖励结果描述为体验模式展示，不再暗示真实入仓、真实奖励发放或真实仓库链路。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了新手竞猜页从开屏、答题中、连胜弹层到结果页的关键文案；当前页面持续强调“体验模式/静态演示/不会发放真实奖励”，并把点亮结果描述成演示展示，不再出现“已入库”“自动入仓”“仓库查看”等真实奖励发放语义。 |
