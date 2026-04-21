# BUG-20260420-089

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-089` |
| `title` | 好友竞猜状态被压扁成“待开赛/进行中/已结束”，丢失“待确认”阶段 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/friend-guesses/status` |
| `scope` | `admin` |
| `page` | `#/guesses/friends` |
| `api` | `/api/admin/guesses/friends` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-friend-guesses:pending-confirm-state-collapsed` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 好友竞猜应能区分“进行中”“待确认”“已结算/已取消”等不同阶段，方便后台跟进结果确认。 |
| 对齐基准 | 老后台显式暴露 `pending_confirm` 状态和筛选项。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 新后台把好友竞猜状态压成 `pending / active / ended` 三档，状态计算也只看 `guess.status + review_status`，完全不看 `friend_guess_confirm` 的确认进度。 |
| 影响范围 | 后台无法从好友竞猜列表识别“结果待双方确认”的房间，会把待确认和其他结束态混成一类。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 后端证据 | `mapFriendGuessStatus()` 只根据竞猜状态和审核状态返回 `pending/active/ended`，而 `confirmedResults` / `rejectedResults` 只是附带统计，没有进入状态机，见 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:282) 到 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:312) 和 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:686) 到 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:723)。 |
| 当前页面证据 | 页面状态栏和筛选只有“待开赛 / 进行中 / 已结束”三档，见 [friend-guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/friend-guesses-page.tsx:175) 到 [friend-guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/friend-guesses-page.tsx:183)。 |
| 老后台对照 | 老后台状态选项明确包含 `pending_confirm`，见 [friends.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/friends.tsx:24) 到 [friends.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/friends.tsx:36)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts) | 好友竞猜状态机丢掉了“待确认”阶段。 |
| [friend-guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/friend-guesses-page.tsx) | 状态筛选和标签被压成三档。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 结合 `friend_guess_confirm` 进度恢复“待确认”这类可运营状态，不要再把确认中房间并入泛化的 `ended`。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
