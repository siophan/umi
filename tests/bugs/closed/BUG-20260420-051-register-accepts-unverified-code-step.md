# BUG-20260420-051

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-051` |
| `title` | 注册页把本地长度判断伪装成已完成手机验证步骤 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `register/step` |
| `scope` | `user` |
| `page` | `/register` |
| `api` | `/api/auth/send-code` `POST /api/auth/register` |
| `owner` | `用户端全栈一` |
| `source_run` | `user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-register:unverified-code-step-advances` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | “手机验证”步骤应只在验证码被真实校验后才允许进入下一步；至少不能把本地长度判断伪装成“已验证完成”。 |
| 对齐基准 | 当前产品要求 / 页面流程语义 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 第一步 `step1Ready` 只要求手机号合法且验证码长度大于等于 4，就允许进入“设置密码”；验证码真实校验被拖到最终 `register(...)` 提交时才发生。 |
| 影响范围 | 用户会被“手机验证”步骤误导，以为验证码已经通过校验，结果在填完密码、昵称、头像后才在最终提交时失败，流程反馈滞后。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/register`。 |
| 2 | 输入任意合法手机号，再输入任意 4 位数字验证码，不必保证验证码真实有效。 |
| 3 | 点击“下一步”，页面会直接进入“设置密码”。 |
| 4 | 直到最后点击“完成注册”，后端才会真正校验验证码并返回失败。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:39) 到 [apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:41) 里，`step1Ready` 只看手机号和验证码长度；[apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:230) 到 [apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:233) 点击后直接 `setStep(2)`。 |
| 接口证据 | [apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:130) 到 [apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:145) 里，验证码只在最终 `register(...)` 提交时才交给后端校验。 |
| 日志/断言 | 页面第一步标题明确写“手机验证”，但实现没有单独的校验请求或成功确认态。 |
| 相关文件 | [apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx) | 多步注册流程把验证码长度当成“已验证完成”。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已补 `/api/auth/verify-code` 真实验证码预校验接口；注册页第一步“下一步”会先调用后端校验，只有校验成功才进入“设置密码”，不再用本地长度判断冒充“手机验证完成”。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm typecheck` in `apps/web`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。后端类型检查通过，前端类型检查和构建通过；注册第一步已改成真实验证码校验门槛。 |
| Verifier 复测结果 | 通过。测试猫复核 [apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx) 当前实现后确认，第一步“下一步”已改成先调用 `verifyCode(...)`，只有真实校验成功才会 `setStep(2)`；旧的“任意 4 位验证码可直接进入下一步”复现路径已消失。 |
| 修复提交/变更 | `packages/shared/src/api.ts`；`apps/api/src/modules/auth/store.ts`；`apps/api/src/modules/auth/router.ts`；`apps/api/src/routes/openapi/schemas/auth.ts`；`apps/api/src/routes/openapi/paths/auth.ts`；`apps/web/src/lib/api/auth.ts`；`apps/web/src/app/register/page.tsx` |

## Fixer

- 已新增验证码预校验接口 `POST /api/auth/verify-code`。
- 注册页第一步现在会先真实校验验证码，成功后才允许进第二步。
- 如果用户回改手机号或验证码，会自动撤销已校验状态。

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/web/src/app/register/page.tsx:39](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:39) 到 [apps/web/src/app/register/page.tsx:42](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:39)、[apps/web/src/app/register/page.tsx:154](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:154) 到 [apps/web/src/app/register/page.tsx:181](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx:154) 以及 [apps/web/src/lib/api/auth.ts:25](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/auth.ts:25) 到 [apps/web/src/lib/api/auth.ts:26](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/auth.ts:25)，第一步“下一步”已改成先调用 `verifyCode(...)`，只有真实校验成功才会 `setStep(2)`；回改手机号或验证码也会撤销 `codeVerified`。 |
