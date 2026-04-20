# BUG-20260420-037

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-037` |
| `title` | 重置密码页在未校验验证码的情况下直接进入“设置新密码”步骤 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `auth/reset-password` |
| `scope` | `user` |
| `page` | `/reset-password` |
| `api` | `/api/auth/send-code` / `/api/auth/reset-password` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-reset-password:code-step-accepts-unverified-code` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | “输入验证码”这一步应只在验证码被真实校验通过后进入“设置新密码”；至少不应把“长度够了”伪装成“验证码已通过”。 |
| 对齐基准 | 当前产品要求 / 用户认证流程常规约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面在 [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:58) 只判断 `codeReady`，然后直接 `setStep("password")`，没有任何接口校验。 |
| 影响范围 | 任何 4 位以上的任意验证码都能被页面接受并进入下一步，用户会误以为验证码已经验证通过，直到最终提交时才看到失败。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/reset-password` 并输入任意手机号。 |
| 2 | 获取验证码后，在验证码框里输入任意 4 位或以上数字。 |
| 3 | 点击“下一步”，页面会直接进入“设置新密码”，即使该验证码从未被校验。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 发送验证码后进入验证码步骤的逻辑在 [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:43)；下一步直接放行在 [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:58)。 |
| 接口证据 | 当前页面只调用了 [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/auth.ts:17) 的 `sendCode()` 和 [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/auth.ts:33) 的 `resetPassword()`，没有单独的验证码校验调用。 |
| 日志/断言 | 页面展示了三步流程，但第二步“输入验证码”本质只是本地长度判断，不是实际验证通过。 |
| 相关文件 | [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx) | `handleVerifyCode()` 只做本地长度判断。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 保留三步 UI，但明确说明验证码不会在第二步单独校验，只会在最终提交重置时一起验证，避免页面提前制造“已验证通过”的错觉。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/reset-password/page.tsx:58](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:58) 到 [apps/web/src/app/reset-password/page.tsx:61](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:58) 的第二步跳转逻辑，以及 [apps/web/src/app/reset-password/page.tsx:139](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:139) 到 [apps/web/src/app/reset-password/page.tsx:166](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:139) 的验证码步骤 UI；页面现在明确提示“验证码不会在这一步单独校验，提交重置时会和新密码一起验证”，不再把本地长度判断伪装成“验证码已验证通过”。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/reset-password/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx)、[apps/web/src/app/reset-password/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.module.css) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 重置密码页不再把“验证码长度够了”包装成“验证码已验证”，第二步已明确提示真正校验发生在最终提交。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/web/src/app/reset-password/page.tsx:56](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:56) 到 [apps/web/src/app/reset-password/page.tsx:61](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:61) 以及 [apps/web/src/app/reset-password/page.tsx:139](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:139) 到 [apps/web/src/app/reset-password/page.tsx:166](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx:166)，第二步虽然仍按 `codeReady` 进入下一步，但页面文案和 toast 已明确说明“不会在这一步单独校验，提交重置时会和新密码一起验证”，不再把长度判断伪装成验证码已验证通过。按这张单当前修复口径，可以重新关闭。 |
