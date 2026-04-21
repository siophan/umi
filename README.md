# umi

`umi` 是新的主线工程目录，负责承接重构后的前端、管理台和后端。

## Start Here

新线程进入 `umi/` 后，涉及数据库和结构判断时，先读：

- [AGENTS.md](AGENTS.md)
- [docs/db.md](docs/db.md)
- [docs/schema-reference.md](docs/schema-reference.md)
- [docs/status-codes.md](docs/status-codes.md)

## 目标

- 以当前新数据库结构为基线重建系统
- 用 monorepo 承载 `web / admin / api / shared / db`
- 先打通登录、竞猜、订单、仓库闭环
- 在此基础上继续把社区、社交、店铺等高频页面接成真实链路
- 暂缓 AI 等非核心模块，直播与首页高频读链路已开始接真实接口

## 目录

| 目录              | 说明                           |
| ----------------- | ------------------------------ |
| `apps/web`        | 用户端应用，Next.js App Router |
| `apps/admin`      | 管理台应用，React + Vite       |
| `apps/api`        | 后端服务，Express + TypeScript |
| `packages/shared` | 共享类型、状态枚举、API 契约   |
| `packages/db`     | 数据库 docs-first 说明与待重建资产 |
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
- `apps/web` 已覆盖旧静态页主要用户路径，`/`、`/ranking`、`/lives`、`mall / cart / me / community / user / friends / notifications / chat / shop / guess / product` 等高频页已多轮收口
- `/search` 已切到独立搜索域，统一走 `/api/search`、`/api/search/hot`、`/api/search/suggest`，不再由页面自行拼商品和竞猜接口
- `apps/admin` 已完成路由拆分、单页单文件收口和按业务 API 拆分，具备 `dashboard / users / products / guesses / orders / warehouse / system / marketing` 等页面骨架
- `apps/admin` 当前菜单权限已按真实 `admin_permission.code` 做页面级控制，不再使用登录后整后台预加载或模块级粗粒度权限猜测
- 后台权限目录当前采用“模块根权限 + 菜单叶子页权限”模型，叶子页权限与实际后台菜单页一一对应
- 共享权限目录由 `packages/shared/src/admin-permissions.ts` 维护，应用层会同步到 `admin_permission`
- `packages/shared` 已抽出领域类型、状态枚举和 API 契约

## 已落地模块

### API

- `GET /health`
- `GET /openapi.json`
- `GET /docs`
- `POST /api/auth/send-code`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/me/activity`
- `GET /api/users/me/summary`
- `GET /api/users/search`
- `GET /api/users/:id`
- `GET /api/users/:id/activity`
- `POST /api/users/:id/follow`
- `DELETE /api/users/:id/follow`
- `GET /api/notifications`
- `POST /api/notifications/read-all`
- `POST /api/notifications/:id/read`
- `GET /api/social`
- `POST /api/social/requests/:id/accept`
- `POST /api/social/requests/:id/reject`
- `GET /api/chats`
- `GET /api/chats/:userId`
- `POST /api/chats/:userId`
- `GET /api/community/feed`
- `GET /api/community/discovery`
- `GET /api/community/search`
- `POST /api/community/posts`
- `POST /api/community/posts/:id/repost`
- `GET /api/community/posts/:id`
- `POST /api/community/posts/:id/comments`
- `POST /api/community/comments/:id/like`
- `DELETE /api/community/comments/:id/like`
- `POST /api/community/posts/:id/like`
- `DELETE /api/community/posts/:id/like`
- `POST /api/community/posts/:id/bookmark`
- `DELETE /api/community/posts/:id/bookmark`
- `GET /api/search`
- `GET /api/search/hot`
- `GET /api/search/suggest`
- `GET /api/banners`
- `GET /api/guesses`
- `GET /api/guesses/:id`
- `GET /api/guesses/user/history`
- `GET /api/guesses/:id/stats`
- `GET /api/rankings`
- `GET /api/lives`
- `GET /api/lives/:id`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products/:id/favorite`
- `DELETE /api/products/:id/favorite`
- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/:id`
- `DELETE /api/cart/items/:id`
- `GET /api/addresses`
- `POST /api/addresses`
- `PUT /api/addresses/:id`
- `DELETE /api/addresses/:id`
- `GET /api/coupons`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders/:id/confirm`
- `POST /api/orders/:id/urge`
- `POST /api/orders/:id/review`
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
- `POST /api/warehouse/physical/:id/consign`
- `POST /api/warehouse/physical/:id/cancel-consign`
- `GET /api/warehouse/admin/stats`
- `GET /api/admin/dashboard/stats`
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `POST /api/admin/auth/logout`
- `POST /api/admin/auth/change-password`
- `GET /api/admin/users`
- `GET /api/admin/guesses`
- `GET /api/admin/orders`
- `GET /api/admin/roles`
- `POST /api/admin/roles`

当前状态不是“接口全是 demo”。用户端高频链路里，认证、找回密码、首页 Banner/榜单/直播列表、个人资料、通知、聊天、社交、社区、竞猜列表/详情、商品列表/搜索/详情、商品收藏、购物车、地址、优惠券、支付下单、订单列表/详情、催发货、商品评价、仓库寄售、店铺申请与品牌授权都已经有真实接口承接；仍然偏 demo 的主要是 Admin 和部分次级业务页。

## API 契约约定

- OpenAPI 装配入口是 `apps/api/src/routes/openapi.ts`，业务 `paths / schemas` 已拆到 `apps/api/src/routes/openapi/`
- monorepo workspace 包名统一使用 `@umi/*`
- JSON 主键统一按 `@umi/shared` 的 `EntityId` 传输，语义是 `bigint-as-string`
- 错误响应统一走 `ApiErrorEnvelope`
- 受保护用户接口优先使用 `requireUser`，后台接口优先使用 `requireAdmin`

### Web

- `/`
- `/mall`
- `/login`
- `/reset-password`
- `/me`
- `/edit-profile`
- `/terms`
- `/privacy`
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
- `/review`
- `/warehouse`

### Admin

- Dashboard
- Users
- Products
- Guesses
- Orders
- Warehouse
- System Users
- Roles
- Permissions
- Categories

当前权限模型：

- 后台登录账号基于独立 `admin_user / admin_role / admin_permission` RBAC 体系
- 模块根权限通常使用 `*.manage`
- 菜单叶子页权限通常使用 `*.view`
- 前端菜单显示和页面访问以权限码为主；仅拥有父权限时，菜单对子页面做兼容显示

## 开发命令

```bash
pnpm install
pnpm typecheck
pnpm dev
```

单独启动：

```bash
pnpm --filter @umi/api dev
pnpm --filter @umi/web dev
pnpm --filter @umi/admin dev
```

## 当前约束

- 新代码只认当前数据库新结构
- 不再使用旧静态前端目录作为正式实现
- 不在数据库层依赖外键，引用关系由应用层维护
- 资金、订单、竞猜、仓库链路优先于次要功能
- `apps/api` 的在线调试入口统一使用 `/docs`
- 新增或修改 API 时，同步更新 `apps/api/src/routes/openapi/` 对应模块和装配入口

## 下一阶段

1. 继续把剩余次级页面从 demo / fallback 收到真实接口
2. 在 `apps/api` 继续补事务、权限、状态校验和写操作闭环
3. 清理社区、商城活动位等页面的残留占位交互或前端派生展示，继续把 `mall` 的活动位/标签派生收口成更稳定的数据源
4. 在 `apps/admin` 接竞猜审核、开奖、订单履约
5. 继续补文档，保证新线程不按旧状态误判
