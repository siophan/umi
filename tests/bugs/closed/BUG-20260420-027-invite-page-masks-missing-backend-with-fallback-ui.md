# BUG-20260420-027

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-027` |
| `title` | 邀请页把未承接后端链路伪装成“请先登录 + 静态奖励”的正常页面 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `invite/page` |
| `page` | `/invite` |
| `api` | `/api/invite/my` `/api/invite/generate` `/api/invite/records` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-invite:missing-backend-masked-by-fallback-ui` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 邀请链路未承接后端时，页面应明确标注能力未开通或错误态；奖励、邀请码、记录都不应靠前端硬编码伪装成可用功能。 |
| 对齐基准 | [docs/feature-progress.md](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:132) / 当前产品要求 / 页面与接口契约一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面请求当前未承接的 `/api/invite/*`，失败后把邀请码显示成“请先登录”、记录显示为空，还始终渲染固定奖励梯度；复制失败也仍提示“链接已复制”。 |
| 影响范围 | 用户会把“后端未接”误以为“自己没登录/暂无数据”，同时会被静态奖励文案误导成链路已可用。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/invite`。 |
| 2 | 查看 [docs/feature-progress.md:132](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:132) 和 [docs/feature-progress.md:258](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:258)，当前已明确后端未见 `invite` router。 |
| 3 | 页面失败后仍展示“请先登录”、固定奖励和空邀请记录。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/invite/page.tsx:16](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:16) 到 [apps/web/src/app/invite/page.tsx:20](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:20)，[apps/web/src/app/invite/page.tsx:60](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:60) 到 [apps/web/src/app/invite/page.tsx:100](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:100)，[apps/web/src/app/invite/page.tsx:127](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:127) 到 [apps/web/src/app/invite/page.tsx:132](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:127)。 |
| 接口证据 | [docs/feature-progress.md:132](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:132) 与 [docs/feature-progress.md:258](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:258) 已写明 `invite` 页面前端直连、后端未见 router。 |
| 日志/断言 | 失败时 `setInviteCode('请先登录')`、`setRecords([])`；奖励区始终使用 `fallbackRewards`。 |
| 相关文件 | [apps/web/src/app/invite/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/invite/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx) | 用回退文案和静态奖励掩盖了未承接后端。 |
| [docs/feature-progress.md](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:132) | 已明确标注当前链路未闭环。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 未接后端前，页面应显式展示“功能未开通/接口未承接”，并移除或禁用静态邀请奖励和伪成功分享链路。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/invite/page.tsx:7](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:7) 到 [apps/web/src/app/invite/page.tsx:11](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:11) 的 readiness 文案，以及 [apps/web/src/app/invite/page.tsx:35](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:35) 到 [apps/web/src/app/invite/page.tsx:79](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx:35) 的整体渲染；页面已经显式声明“邀请功能建设中/未开放”，邀请码、奖励规则、邀请记录都降成占位说明和禁用入口，不再伪装成“请先登录”“暂无记录”或静态奖励链路可用。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/invite/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx)、[apps/web/src/app/invite/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了邀请页当前渲染内容和交互动作；页面已明确声明邀请后端链路未接入，邀请码/奖励规则/邀请记录都降成占位说明，主按钮显式禁用，不再出现“请先登录”“暂无记录”或静态奖励链路可用的伪正常语义。 |
