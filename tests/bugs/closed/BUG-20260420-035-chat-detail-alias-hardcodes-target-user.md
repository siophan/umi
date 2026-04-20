# BUG-20260420-035

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-035` |
| `title` | 聊天详情兼容入口把所有访问都硬编码跳到 `/chat/u123` |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `chat/alias` |
| `page` | `/chat-detail` |
| `api` | `/api/chats/:userId` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-chat-detail:hardcoded-alias-target` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 兼容入口应根据真实会话参数转发，或者明确下线；不能把所有访问一律导向固定用户。 |
| 对齐基准 | 路由兼容一致性 / 真实聊天链路 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `/chat-detail` 挂载后立即执行 `router.replace('/chat/u123')`，完全不透传任何参数。 |
| 影响范围 | 只要命中旧入口，用户都会被带到固定会话，既不对应原始目标，也可能暴露错误聊天对象。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/chat-detail`。 |
| 2 | 观察页面跳转目标。 |
| 3 | 页面总是跳到 `/chat/u123`，和实际目标用户无关。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/chat-detail/page.tsx:6](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx:6) 到 [apps/web/src/app/chat-detail/page.tsx:11](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx:11)。 |
| 接口证据 | 聊天详情真实路由是 `/chat/[id]`，兼容入口没有任何参数解析或透传。 |
| 日志/断言 | `useEffect` 中固定执行 `router.replace('/chat/u123')`。 |
| 相关文件 | [apps/web/src/app/chat-detail/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/chat-detail/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx) | 兼容入口目标用户被硬编码。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 去掉硬编码 `/chat/u123`，兼容入口现在只按真实 query 参数透传到 `/chat/[id]`，缺参数时回到 `/chat` 列表。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/chat-detail/page.tsx:8](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx:8) 到 [apps/web/src/app/chat-detail/page.tsx:18](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx:8) 的兼容跳转逻辑；页面已不再硬编码 `/chat/u123`，而是按真实 query 参数透传到 `/chat/[id]`，缺少参数时回到 `/chat` 列表。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/chat-detail/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | `/chat-detail` 不再把所有访问都错误导向固定用户，而是按真实参数透传或回到聊天列表。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/web/src/app/chat-detail/page.tsx:8](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx:8) 到 [apps/web/src/app/chat-detail/page.tsx:17](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx:17)，兼容入口现在只读取 `id / uid / userId / target` 并跳转到 `/chat/[id]`，缺参数时回 `/chat`；代码里已经没有原问题的固定 `/chat/u123`。按当前“只验证代码”的口径，这张单可以重新关闭。 |
