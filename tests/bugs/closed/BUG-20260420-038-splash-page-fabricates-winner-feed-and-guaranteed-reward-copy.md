# BUG-20260420-038

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-038` |
| `title` | Splash 启动页用静态中奖跑马灯和“稳赚不亏/体验金”文案伪装真实业务承诺 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `splash/page` |
| `scope` | `user` |
| `page` | `/splash` |
| `api` | 无 |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-splash:static-winner-feed-and-guaranteed-reward-copy` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 启动引导页可以做品牌展示，但不应把本地静态素材伪装成实时中奖动态，也不应使用“稳赚不亏”“体验金不扣真实费用”这类未经真实链路承接的业务承诺。 |
| 对齐基准 | 当前产品要求 / 当前代码事实 / [docs/feature-progress.md](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:104) |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面完全由本地常量驱动，却用静态 `tickerItems` 在跑马灯里展示“刚赢了”，并在主标语和规则区写“猜错补券 · 稳赚不亏”“系统赠送的体验金不扣真实费用”。 |
| 影响范围 | 新用户会把启动页误读为真实实时中奖流和平台收益承诺，放大对实际竞猜奖励、补偿和新手体验链路的错误预期。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/splash`。 |
| 2 | 等待进入启动页主视觉和规则弹层。 |
| 3 | 页面会展示静态中奖跑马灯，并用“稳赚不亏”“体验金不扣真实费用”等文案描述未被代码承接的业务承诺。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 静态跑马灯数据定义在 [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:8)，实际展示“刚赢了”在 [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:185)；“稳赚不亏”主标语在 [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:208)；“体验金不扣真实费用”提示在 [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:254)。 |
| 接口证据 | 页面没有任何 API import，只是本地常量驱动；同时 [docs/feature-progress.md](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:104) 已明确 `/novice-guess` 仍是“静态/本地态”。 |
| 日志/断言 | 该页无法证明存在实时获奖流、收益兜底或体验金扣费链路，但文案已经把这些表达成既成事实。 |
| 相关文件 | [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx) | 启动页把本地宣传素材写成了真实业务承诺。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 启动页的跑马灯改成品牌/体验信息，不再冒充“刚赢了”的实时中奖流；同时移除“稳赚不亏”“体验金不扣真实费用”等承诺式文案。本轮又继续收掉顶部标签里残留的“猜中即赚”口径，统一改成中性的玩法体验表述。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。`/splash` 已不再出现“猜中即赚”这类承诺式口径，页面整体保持品牌/体验引导语义。 |
| Verifier 复测结果 | 待复测。上一版已通过，但本轮又发现并收掉了残留承诺文案。 |
| 修复提交/变更 | [apps/web/src/app/splash/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | Splash 页现在只做品牌和玩法引导，不再把静态素材写成实时中奖动态、收益承诺或“猜中即赚”式业务口径。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/web/src/app/splash/page.tsx:8](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:8) 到 [apps/web/src/app/splash/page.tsx:14](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:14) 和 [apps/web/src/app/splash/page.tsx:185](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:185) 到 [apps/web/src/app/splash/page.tsx:193](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:193)，跑马灯内容已改成品牌/体验信息，不再冒充“刚赢了”的实时中奖流；同时 [apps/web/src/app/splash/page.tsx:204](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:204) 到 [apps/web/src/app/splash/page.tsx:212](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:212)、[apps/web/src/app/splash/page.tsx:242](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:242) 到 [apps/web/src/app/splash/page.tsx:254](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx:254) 也已改为中性体验表述，没有“稳赚不亏”“体验金不扣真实费用”“猜中即赚”等承诺式文案。 |
