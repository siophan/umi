# BUG-20260420-052

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-052` |
| `title` | 动态详情页顶栏缺失旧页作者信息和关注入口 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `post/detail/header` |
| `scope` | `user` |
| `page` | `/post/[id]` |
| `api` | `/api/community/posts/:id` `/api/users/:id/follow` |
| `owner` | `测试猫` |
| `source_run` | `user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-post-detail:header-missing-author-follow-cta` |
| `fix_owner` |  |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 动态详情页应保留旧页顶栏里的作者头像、作者名和关注按钮，让用户在详情阅读时可以直接识别作者并完成关注。 |
| 对齐基准 | 老系统 `frontend/post-detail.html` / 当前用户端 UI 对齐规则 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 新页顶栏只有返回按钮、标题和更多按钮；作者信息和关注入口被移到了正文卡片里，且页面没有任何关注作者的交互。 |
| 影响范围 | 动态详情页失去旧页的关键社交入口，用户不能在详情顶栏直接关注作者，页面结构和交互都与老系统不一致。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开任意 `/post/[id]`。 |
| 2 | 观察页面顶部 sticky header。 |
| 3 | 新页只显示标题，没有旧页的作者头像、作者名和“关注/已关注”按钮。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 新页顶栏见 [apps/web/src/app/post/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx:583) 到 [apps/web/src/app/post/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx:592)，仅保留返回、标题、更多按钮。 |
| 接口证据 | 用户侧已有关注/取关接口 [apps/web/src/lib/api/users.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/users.ts:37) 到 [apps/web/src/lib/api/users.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/users.ts:43)，但当前详情页没有接入。 |
| 日志/断言 | 老系统在顶栏渲染作者信息与关注按钮，见 [/Users/ezreal/Downloads/joy/frontend/post-detail.html](/Users/ezreal/Downloads/joy/frontend/post-detail.html:21) 到 [/Users/ezreal/Downloads/joy/frontend/post-detail.html](/Users/ezreal/Downloads/joy/frontend/post-detail.html:44)。 |
| 相关文件 | [apps/web/src/app/post/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/post/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx) | 顶栏结构没有保留旧页作者区和关注 CTA。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `结论` | `未通过，维持 open` |
| `说明` | [apps/web/src/app/post/[id]/page.tsx:584](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx:584) 到 [apps/web/src/app/post/[id]/page.tsx:592](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx:592) 的顶栏仍只有返回、标题、更多按钮；作者头像和名称仍在正文卡片 [apps/web/src/app/post/[id]/page.tsx:595](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx:595) 到 [apps/web/src/app/post/[id]/page.tsx:616](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx:616)。同时 [apps/web/src/lib/api/users.ts:37](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/users.ts:37) 到 [apps/web/src/lib/api/users.ts:41](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/users.ts:41) 虽已有关注接口，但当前详情页没有接入关注 CTA。原问题未修复。 |
