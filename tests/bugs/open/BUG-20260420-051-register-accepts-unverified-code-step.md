# BUG-20260420-051

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-051` |
| `title` | 注册页把本地长度判断伪装成已完成手机验证步骤 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `register/step` |
| `scope` | `user` |
| `page` | `/register` |
| `api` | `/api/auth/send-code` `POST /api/auth/register` |
| `owner` | `测试猫` |
| `source_run` | `user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-register:unverified-code-step-advances` |
| `fix_owner` |  |
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
| 修复说明 | 待补 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
