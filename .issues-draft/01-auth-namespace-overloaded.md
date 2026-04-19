TITLE: `/api/auth/*` 命名空间被当成通用业务前缀，auth 模块承载社区/聊天/通知/好友等不相关业务

LABELS: architecture, backend, refactor

BODY:
## 现象

`apps/api/src/modules/auth/router.ts`（583 行）把下列不属于"鉴权"的路由都挂在 `/api/auth/*` 下：

- 社区：`/community/feed`、`/community/discovery`、`/community/search`、`/community/posts`、`/community/posts/:id`、`/community/posts/:id/comments`、`/community/posts/:id/like`、`/community/posts/:id/bookmark`、`/community/posts/:id/repost`、`/community/comments/:id/like`
- 聊天：`/chats`、`/chats/:userId`
- 通知：`/notifications`、`/notifications/read-all`、`/notifications/:id/read`
- 好友：`/friends/requests/:id/accept`、`/friends/requests/:id/reject`
- 社交总览：`/social`
- 用户查询：`/users/search`、`/users/:id`、`/users/:id/activity`、`/users/:id/follow`

对应的 `apps/api/src/modules/auth/store.ts` 也被拉到 **3265 行**，SMS 验证码、用户资料、社区帖子、聊天、通知、好友关系、隐私枚举全部塞在同一个 store 里。

## 为什么不合理

直接违反 `AGENTS.md` 的硬性规则：

> 后端禁止把多个业务域继续堆进一个超大 router、service、store 文件。

路径前缀 `/api/auth/*` 现在已经不表达任何鉴权语义，而是"顺手就挂在这里了"。

## 建议

按业务域拆分 router / store / 挂载路径：

- `/api/auth` → 只保留 login / register / send-code / me / change-password / logout
- `/api/community` → feed / discovery / search / posts / comments / likes / bookmarks / reposts
- `/api/chats` → 会话列表和消息
- `/api/notifications` → 通知
- `/api/friends` → 好友申请
- `/api/users` → 用户查询、资料、follow

`auth/store.ts` 同步拆成 `auth/store.ts`、`community/store.ts`、`chat/store.ts`、`notification/store.ts`、`friend/store.ts`、`user/store.ts`。拆的时候 `openapi.ts` 和 `apps/web/src/lib/api.ts` 的路径需要一起改。
