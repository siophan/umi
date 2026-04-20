# BUG-20260420-019

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-019` |
| `title` | 会话列表页把聊天读取失败静默吞成空列表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `chat/list` |
| `page` | `/chat` |
| `api` | `/api/auth/chats` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-chat-list:fetch-failure-swallowed-to-empty-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 会话列表读取失败时，应显示错误态，而不是“暂无聊天消息”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `fetchChats()` 失败后，页面直接 `setItems([])` 并进入 ready。 |
| 影响范围 | 用户会误判聊天为空；消息链路故障被掩盖。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/chat`。 |
| 2 | 让会话列表接口返回失败。 |
| 3 | 页面显示“暂无聊天消息”。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/chat/page.tsx:49](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/page.tsx:49) 到 [apps/web/src/app/chat/page.tsx:65](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/page.tsx:49)。 |
| 接口证据 | 页面主链路依赖 `/api/auth/chats`。 |
| 日志/断言 | 失败时直接 `setItems([])`。 |
| 相关文件 | [apps/web/src/app/chat/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/chat/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/page.tsx) | 会话列表失败分支被伪装成空列表。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 会话列表读取失败时改成显式错误态和重试入口，不再回退成“暂无聊天消息”。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；会话列表失败不再伪装成空列表。 |
| Verifier 复测结果 | 通过。已复核会话列表页引入显式错误态和重试，不再把读取失败伪装成空消息页；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
| 修复提交/变更 | [apps/web/src/app/chat/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/page.tsx)、[apps/web/src/app/chat/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了会话列表页的读取异常分支和 `ready/error/items` 三态渲染；当前会话读取失败会展示“消息列表加载失败 + 重新加载”，只有在真实成功且 `items.length === 0` 时才显示“暂无聊天消息”。 |
