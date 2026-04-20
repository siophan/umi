# BUG-20260420-020

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-020` |
| `title` | 聊天详情页把会话读取失败静默吞成空线程 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `chat/detail` |
| `page` | `/chat/[id]` |
| `api` | `/api/auth/chats/:userId` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-chat-detail:fetch-failure-swallowed-to-empty-thread` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 聊天详情读取失败时，应显示错误态，不应回退成“好友 + 暂无消息”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `fetchChatDetail()` 失败后，页面直接把 `peer` 重置为默认值，把 `messages` 清空。 |
| 影响范围 | 用户会误判该会话本来就没有消息；真实故障被隐藏。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开任意 `/chat/[id]`。 |
| 2 | 让聊天详情接口返回失败。 |
| 3 | 页面会显示默认好友头像和“暂无消息”。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/chat/[id]/page.tsx:66](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/[id]/page.tsx:66) 到 [apps/web/src/app/chat/[id]/page.tsx:95](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/[id]/page.tsx:95)。 |
| 接口证据 | 页面主链路依赖 `/api/auth/chats/:userId`。 |
| 日志/断言 | 失败时直接设置默认 `peer` 和空 `messages`。 |
| 相关文件 | [apps/web/src/app/chat/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/[id]/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/chat/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/[id]/page.tsx) | 会话失败分支被伪装成空聊天线程。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 聊天详情失败时改成显式错误态和重试入口，输入框同时禁用；不再回退成默认好友和空线程。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；聊天详情失败不再伪装成无消息线程。 |
| Verifier 复测结果 | 通过。已复核聊天详情页引入显式错误态和重试，失败时不再渲染空线程；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
| 修复提交/变更 | [apps/web/src/app/chat/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/[id]/page.tsx)、[apps/web/src/app/chat/[id]/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/[id]/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了聊天详情页的读取失败分支、消息列表区渲染和输入区禁用逻辑；当前失败时只会展示“聊天详情加载失败 + 重新加载”，消息列表不会再回退成空线程，输入框和发送按钮也会随 `error` 一起禁用。 |
