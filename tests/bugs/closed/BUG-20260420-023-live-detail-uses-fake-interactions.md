# BUG-20260420-023

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-023` |
| `title` | 直播详情页把参与竞猜和弹幕做成本地假互动 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `live/detail` |
| `page` | `/live/[id]` |
| `api` | `/api/lives/:id` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-live-detail:fake-guess-join-and-local-danmaku` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 直播页的“参与竞猜”和“发送弹幕”要么接真实写链路，要么显式禁用，不应伪装成交互成功。 |
| 对齐基准 | 页面与接口契约一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | “参与竞猜”按钮只弹出“参与成功！”toast；弹幕发送只往本地 `messages` 里 append，没有任何接口写入。 |
| 影响范围 | 用户会误以为自己已参与直播竞猜或已发送弹幕，实际后端没有记录。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开任意 `/live/[id]`。 |
| 2 | 点击“参与竞猜”，或在弹幕输入框发送内容。 |
| 3 | 页面会本地提示成功，但没有任何真实接口写链。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/live/[id]/page.tsx:154](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/live/[id]/page.tsx:154) 到 [apps/web/src/app/live/[id]/page.tsx:161](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/live/[id]/page.tsx:161)，以及 [apps/web/src/app/live/[id]/page.tsx:213](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/live/[id]/page.tsx:213) 到 [apps/web/src/app/live/[id]/page.tsx:225](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/live/[id]/page.tsx:225)。 |
| 接口证据 | 当前页面只读取 `/api/lives/:id`，未见对应写接口调用。 |
| 日志/断言 | `setMessages([...])` 和 `setToast('参与成功！')` 都是本地行为。 |
| 相关文件 | [apps/web/src/app/live/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/live/[id]/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/live/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/live/[id]/page.tsx) | 把直播交互做成了假动作。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 直播详情页删除本地伪成功交互：参与竞猜改为禁用按钮并补充未开放说明，弹幕输入和礼物动作改为显式禁用，分享按钮改成真实复制链接，不再本地 append 弹幕或提示“参与成功”。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| 验证结果 | 通过 |
| 修复提交/变更 | [apps/web/src/app/live/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/live/[id]/page.tsx)、[apps/web/src/app/live/[id]/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/live/[id]/page.module.css) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 未接真实写链前，直播详情页不再伪装互动成功，而是明确展示“暂未开放/未接线”。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |

## Verifier

| 字段 | 值 |
| --- | --- |
| `verify_owner` | `测试猫` |
| `verify_result` | 通过。已复核竞猜、弹幕、礼物动作都改成显式禁用或真实复制链接，不再伪装交互成功；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了直播详情页的竞猜参与区、弹幕输入区和底部动作栏；当前“参与竞猜”按钮已显式禁用并展示未开放说明，弹幕输入和礼物按钮同样禁用，分享按钮改为真实复制链接，没有看到旧的本地 `setToast('参与成功')` 或本地 append 弹幕残留。 |
