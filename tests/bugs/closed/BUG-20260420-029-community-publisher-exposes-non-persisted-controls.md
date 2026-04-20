# BUG-20260420-029

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-029` |
| `title` | 社区发帖面板把多项本地选择伪装成真实发布配置 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `community/publish` |
| `page` | `/community` |
| `api` | `/api/community/posts` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-community:publisher-controls-not-persisted` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 发帖面板里能选的可见范围、话题、位置、@好友、关联竞猜，都应与真实 payload 和后端承接能力一致；未承接的能力不应伪装成已发布成功。 |
| 对齐基准 | 页面与接口契约一致性 / [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:339) |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面允许选择 `friends` / `fans` 多选可见范围、多个话题、`@好友`、静态位置和静态竞猜，但提交时只发 `content/tag/scope/guessId/location/images`；其中 `friends` 会被折叠成 `public`，多个话题只保留第一个，`@好友` 完全不进 payload，位置和竞猜选择也来自本地静态列表。 |
| 影响范围 | 用户会误以为这些发布配置已经真正生效，实际服务端根本没有对应承接或语义已经被改写。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/community` 并点击“发布动态”。 |
| 2 | 选择多个话题、`@好友`、位置、关联竞猜，再把可见范围改成 `friends` 或多选。 |
| 3 | 查看提交逻辑可见只发送了 `content/tag/scope/guessId/location/images`，很多 UI 选择完全没有落到接口。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/community/page.tsx:671](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:671) 到 [apps/web/src/app/community/page.tsx:685](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:685)，[apps/web/src/app/community/page.tsx:1041](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:1041) 到 [apps/web/src/app/community/page.tsx:1108](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:1108)，[apps/web/src/app/community/page.tsx:1187](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:1187) 到 [apps/web/src/app/community/page.tsx:1384](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:1384)。 |
| 接口证据 | [packages/shared/src/api.ts:339](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:339) 到 [packages/shared/src/api.ts:344](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:344) 的 `CreateCommunityPostPayload` 只支持 `content/tag/scope/guessId/location/images`。 |
| 日志/断言 | `friends` 被映射成 `public`，`fans` 被映射成 `followers`；`mentions`、额外话题选择完全未提交。 |
| 相关文件 | [apps/web/src/app/community/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/community/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx) | UI 提供的发布配置明显大于真实 payload。 |
| [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:339) | 当前契约并不支持页面展示的全部能力。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 收敛 UI 到当前真实 payload，或先扩展后端契约再保留这些控制项；不能继续让本地选择伪装成真实发布能力。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/community/page.tsx:24](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:24) 到 [apps/web/src/app/community/page.tsx:25](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:25) 的 scope 定义、[apps/web/src/app/community/page.tsx:583](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:583) 到 [apps/web/src/app/community/page.tsx:622](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:583) 的发布 payload，以及 [apps/web/src/app/community/page.tsx:885](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:885) 到 [apps/web/src/app/community/page.tsx:1065](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:885) 的发布面板；UI 已收敛到当前真实 payload 支持的 `scope/tag/images/content`，不再展示 @好友、位置、关联竞猜、多选范围等未承接配置，也不再把这些本地选择伪装成可发布能力。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/community/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx)、[apps/web/src/app/community/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了社区发布面板的可见项和 `createCommunityPost` 提交 payload；当前 UI 已收敛到 `content/tag/scope/images` 这组真实承接字段，`scope` 也只保留当前契约支持的 `public/followers/private`，没有看到旧的 @好友、位置、关联竞猜、多选可见范围等未承接配置残留。 |
