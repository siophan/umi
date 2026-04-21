# BUG-20260420-088

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-088` |
| `title` | 好友竞猜页只剩摘要抽屉，缺少详情跳转和强制结算链路 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/friend-guesses/actions` |
| `scope` | `admin` |
| `page` | `#/guesses/friends` |
| `api` | `/api/admin/guesses/friends` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-friend-guesses:lacks-detail-and-force-settle` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 好友竞猜页应保留进入竞猜详情的能力，并在需要时支持强制结算或至少跳到可执行结算的详情页。 |
| 对齐基准 | 老后台好友竞猜页提供“详情”跳转和“强制结算”动作。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页唯一操作只剩“查看”摘要抽屉；后台路由里也没有 admin 侧好友竞猜详情或结算写链。 |
| 影响范围 | 好友竞猜异常时，后台无法从当前页继续进入详情或执行强制结算。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 当前页面证据 | 当前页操作列只有一个“查看”按钮，点击后只打开摘要抽屉，见 [friend-guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/friend-guesses-page.tsx:140) 到 [friend-guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/friend-guesses-page.tsx:220)。 |
| 老后台对照 | 老后台好友竞猜页提供“详情”跳转和“强制结算”动作，见 [friends.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/friends.tsx:67) 到 [friends.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/friends.tsx:123)。 |
| 路由证据 | 当前 admin router 在竞猜段只提供列表和审核接口，没有好友竞猜强制结算或详情写链入口，见 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:583) 到 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:621)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [friend-guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/friend-guesses-page.tsx) | 操作链只剩摘要抽屉。 |
| [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) | 缺少好友竞猜详情 / 结算承接接口。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 好友竞猜页已移除只读摘要抽屉，操作列恢复为真实详情跳转；活跃记录会直接跳到 `#/guesses/detail/:id` 继续处理，不再把异常处理压缩在列表页。当前工作区仍未提供 admin 侧强制结算写接口，因此没有伪造本地“强制结算成功”动作。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过：好友竞猜页操作列已改为真实详情跳转，后台类型检查和构建成功。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | [apps/admin/src/pages/friend-guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/friend-guesses-page.tsx) |
