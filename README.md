# umi

`umi` 是新的主线工程目录，负责承接重构后的前端、管理台和后端。

## Start Here

新线程进入 `umi/` 后，涉及数据库和结构判断时，先读：

- [AGENTS.md](/Users/ezreal/Downloads/joy/umi/AGENTS.md)
- [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md)
- [docs/status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md)

## 目标

- 以当前新数据库结构为基线重建系统
- 用 monorepo 承载 `web / admin / api / shared / db`
- 先打通登录、竞猜、订单、仓库闭环
- 在此基础上继续把社区、社交、店铺等高频页面接成真实链路
- 暂缓 AI、直播、营销等非核心模块

## 目录

| 目录              | 说明                           |
| ----------------- | ------------------------------ |
| `apps/web`        | 用户端应用，Next.js App Router |
| `apps/admin`      | 管理台应用，React + Vite       |
| `apps/api`        | 后端服务，Express + TypeScript |
| `packages/shared` | 共享类型、状态枚举、API 契约   |
| `packages/db`     | 数据库相关资产和结构说明       |
| `packages/config` | 共享工程配置                   |
| `docs`            | 路线图和架构文档               |

## 技术栈

- Workspace: `pnpm workspace` + `turbo`
- Web: `Next.js` + `React` + `TypeScript`
- Admin: `Vite` + `React` + `TypeScript`
- API: `Express` + `TypeScript`
- Shared: workspace package 方式共享类型和状态字典

## 当前状态

- workspace 已完成初始化并通过 `pnpm typecheck`
- `apps/api` 已从最小骨架推进到多模块真实读写，Swagger 入口为 `/docs`
- `apps/web` 已覆盖旧静态页主要用户路径，`mall / me / community / user / friends / notifications / chat / shop / guess / product` 等高频页已多轮收口
- `apps/admin` 已有管理台壳层和模块面板骨架
- `packages/shared` 已抽出领域类型、状态枚举和 API 契约

## 已落地模块

### API

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `POST /api/auth/send-code`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `GET /api/auth/me/activity`
- `GET /api/auth/me/summary`
- `GET /api/auth/users/search`
- `GET /api/auth/users/:id`
- `GET /api/auth/users/:id/activity`
- `POST /api/auth/users/:id/follow`
- `DELETE /api/auth/users/:id/follow`
- `GET /api/auth/notifications`
- `POST /api/auth/notifications/read-all`
- `POST /api/auth/notifications/:id/read`
- `GET /api/auth/social`
- `GET /api/auth/chats`
- `GET /api/auth/chats/:userId`
- `POST /api/auth/chats/:userId`
- `GET /api/auth/community/feed`
- `GET /api/auth/community/discovery`
- `GET /api/auth/community/search`
- `POST /api/auth/community/posts`
- `POST /api/auth/community/posts/:id/repost`
- `GET /api/auth/community/posts/:id`
- `POST /api/auth/community/posts/:id/comments`
- `POST /api/auth/community/posts/:id/like`
- `DELETE /api/auth/community/posts/:id/like`
- `POST /api/auth/community/posts/:id/bookmark`
- `DELETE /api/auth/community/posts/:id/bookmark`
- `GET /api/guesses`
- `GET /api/guesses/:id`
- `GET /api/guesses/user/history`
- `GET /api/guesses/:id/stats`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/shops/me`
- `GET /api/shops/me/status`
- `POST /api/shops/apply`
- `GET /api/shops/brand-auth`
- `POST /api/shops/brand-auth`
- `GET /api/shops/brand-products`
- `POST /api/shops/products`
- `GET /api/wallet/ledger`
- `GET /api/warehouse/virtual`
- `GET /api/warehouse/physical`
- `GET /api/warehouse/admin/stats`
- `GET /api/admin/dashboard/stats`
- `GET /api/admin/users`
- `GET /api/admin/guesses`
- `GET /api/admin/orders`

当前状态不是“接口全是 demo”。用户端高频链路里，认证、个人资料、通知、聊天、社交、社区、竞猜列表/详情、商品列表/搜索/详情、订单列表、仓库、店铺申请与品牌授权都已经有真实接口承接；仍然偏 demo 的主要是 Admin、订单详情和部分次级业务页。

### Web

- `/`
- `/mall`
- `/login`
- `/me`
- `/edit-profile`
- `/user/[uid]`
- `/friends`
- `/notifications`
- `/chat`
- `/chat/[id]`
- `/community`
- `/community-search`
- `/post/[id]`
- `/guess/[id]`
- `/guess-history`
- `/product/[id]`
- `/search`
- `/shop/[id]`
- `/my-shop`
- `/orders`
- `/warehouse`

### Admin

- Dashboard
- Users
- Products
- Guesses
- Orders
- Warehouse

## 开发命令

```bash
pnpm install
pnpm typecheck
pnpm dev
```

单独启动：

```bash
pnpm --filter @joy/api dev
pnpm --filter @joy/web dev
pnpm --filter @joy/admin dev
```

## 当前约束

- 新代码只认当前数据库新结构
- 不再使用旧静态前端目录作为正式实现
- 不在数据库层依赖外键，引用关系由应用层维护
- 资金、订单、竞猜、仓库链路优先于次要功能
- `apps/api` 的在线调试入口统一使用 `/docs`
- 新增或修改 API 时，同步更新 `apps/api/src/routes/openapi.ts`

## 下一阶段

1. 继续把剩余次级页面从 demo / fallback 收到真实接口
2. 在 `apps/api` 继续补事务、权限、状态校验和写操作闭环
3. 清理社区、商城活动位、订单详情等页面的残留占位交互或前端派生展示
4. 在 `apps/admin` 接竞猜审核、开奖、订单履约
5. 继续补文档，保证新线程不按旧状态误判
