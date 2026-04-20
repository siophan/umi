# BUG-20260420-001

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-001` |
| `title` | 登录页发送验证码失败时仍提示成功并回填假验证码 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `auth/login` |
| `page` | `/login` |
| `api` | `/api/auth/send-code` |
| `owner` | `codex` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-login:/api/auth/send-code:false-success-toast-and-fake-code` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 发送验证码失败时，页面应展示错误提示，不应展示成功 toast，也不应自动填入假验证码。 |
| 对齐基准 | 当前产品要求 / `apps/api` 实际接口语义 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `handleSendCode` 在 `catch` 分支里仍执行成功提示，并把验证码输入框填成 `8888`。 |
| 影响范围 | 登录页验证码登录流；会误导测试、用户和修复线程，以为短信链路可用。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/login`，切到验证码登录模式。 |
| 2 | 让 `/api/auth/send-code` 返回失败，或在本地让请求抛异常。 |
| 3 | 点击“发送验证码”，观察页面仍提示“验证码已发送 📱”，并自动回填 `8888`。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/login/page.tsx:96](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/login/page.tsx:96) 到 [apps/web/src/app/login/page.tsx:111](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/login/page.tsx:111) 的 `handleSendCode`。 |
| 接口证据 | `/api/auth/send-code` 是真实接口，失败时前端不应伪装为成功。 |
| 日志/断言 | 当前 `catch` 分支直接执行 `setCode("8888")` 和成功提示。 |
| 相关文件 | [apps/web/src/app/login/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/login/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/login/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/login/page.tsx) | 发送验证码错误分支写反，混入了开发态假反馈。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | `handleSendCode` 改成仅在 `sendCode` 成功后才启动倒计时和“已发送”态；失败分支删除 `8888` 假验证码和成功 toast，改为展示真实错误信息。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`） |
| Fixer 自测结果 | 通过。`apps/web` TypeScript 校验通过，登录页失败分支不再写入假验证码，也不再伪装成成功。 |
| Verifier 复测结果 | 通过。已复核 `handleSendCode` 成功/失败分支，失败时只保留错误提示，不再写入假验证码；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
| 修复提交/变更 | [apps/web/src/app/login/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/login/page.tsx) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了登录页 `handleSendCode` 的成功/失败分支、API client 的非 2xx 抛错路径，以及后端 `sendCode` 成功返回结构；当前代码下失败分支只会清倒计时、清 `codeSent` 并展示错误提示，不再出现假成功 toast 或假验证码回填。 |
