# umi

`umi` 是新的主线工程目录，负责承接重构后的前端、管理台和后端。

## 目标

- 以当前新数据库结构为基线重建系统
- 用 monorepo 承载 `web / admin / api / shared / db`
- 先打通登录、竞猜、订单、仓库闭环
- 暂缓 AI、社区、直播、营销等非核心模块

## 目录

| 目录 | 说明 |
| --- | --- |
| `apps/web` | 用户端应用，Next.js App Router |
| `apps/admin` | 管理台应用，React + Vite |
| `apps/api` | 后端服务，Express + TypeScript |
| `packages/shared` | 共享类型、状态枚举、API 契约 |
| `packages/db` | 数据库相关资产和结构说明 |
| `packages/config` | 共享工程配置 |
| `docs` | 路线图和架构文档 |

## 技术栈

- Workspace: `pnpm workspace` + `turbo`
- Web: `Next.js` + `React` + `TypeScript`
- Admin: `Vite` + `React` + `TypeScript`
- API: `Express` + `TypeScript`
- Shared: workspace package 方式共享类型和状态字典

## 当前状态

- workspace 已完成初始化并通过 `pnpm typecheck`
- `apps/api` 已有最小可编译服务骨架，并挂上首批业务路由
- `apps/web` 已有首页、登录、竞猜详情、订单、仓库页面骨架
- `apps/admin` 已有管理台壳层和模块面板骨架
- `packages/shared` 已抽出领域类型、状态枚举和 API 契约

## 已落地模块

### API

- `GET /health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/guesses`
- `GET /api/guesses/:id`
- `GET /api/guesses/:id/stats`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/wallet/ledger`
- `GET /api/warehouse/virtual`
- `GET /api/warehouse/physical`
- `GET /api/warehouse/admin/stats`
- `GET /api/admin/dashboard/stats`
- `GET /api/admin/users`
- `GET /api/admin/guesses`
- `GET /api/admin/orders`

当前这些接口先用演示数据返回，目的是先把新系统的接口形状固定下来。

### Web

- `/`
- `/login`
- `/guess/[id]`
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

## 下一阶段

1. 用真实数据库替换 API 演示数据
2. 在 `apps/api` 建立 `auth / guess / order / wallet / warehouse` service 层
3. 给关键链路补事务、权限和状态校验
4. 在 `apps/web` 接登录、竞猜列表、下注流
5. 在 `apps/admin` 接竞猜审核、开奖、订单履约
