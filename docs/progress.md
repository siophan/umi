# 项目进度

最后更新：2026-04-17

本文档用于记录 `umi` 当前的整体功能进度。后续每次功能新增、页面接入真实接口、管理台补模块、API 从 demo 切到数据库后，都应同步更新本文件。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| `已完成` | 已有可见实现，且当前仓库中已经落地 |
| `进行中` | 已有页面或接口骨架，但仍未形成真实业务闭环 |
| `未开始` | 仅有规划，当前仓库没有有效实现 |
| `Demo` | 目前依赖 mock / demo 数据，未接真实接口或数据库 |

## 总体判断

| 模块 | 当前状态 | 备注 |
| --- | --- | --- |
| Monorepo 工程底座 | `已完成` | `pnpm workspace + turbo + shared/db/config` 已就位 |
| 用户端 `apps/web` | `进行中` | 页面覆盖很完整，UI 还原已铺开，但大多仍是静态 / Demo |
| 管理台 `apps/admin` | `进行中` | 只有单页骨架和模块规划，尚未形成真实后台 |
| 后端 `apps/api` | `进行中` | 已有最小路由骨架，但全部返回 demo 数据 |
| 共享契约 `packages/shared` | `已完成` | 已抽出领域类型、状态枚举、API 契约基础层 |
| 数据库文档 / 结构说明 | `已完成` | 已有 [db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md) |

## 基础工程

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| Workspace 结构 | `已完成` | `apps/web`、`apps/admin`、`apps/api`、`packages/*`、`docs` 已拆开 |
| TypeScript 基础配置 | `已完成` | root tsconfig / package tsconfig 已建立 |
| 开发脚本 | `已完成` | `pnpm install`、`pnpm typecheck`、`pnpm dev` 可用 |
| 共享类型包 | `已完成` | Web / Admin / API 已共用 `@joy/shared` |
| 统一数据库接入 | `未开始` | API 还没有真实数据库访问层 |
| 权限 / 事务 / 状态机 | `未开始` | 目标已明确，但还没在 `umi` 新代码里落地 |

## 用户端 Web

### 1. 页面覆盖

当前 `apps/web` 已经覆盖旧静态站的大部分页面名和主要路由。

| 分类 | 已落地页面 |
| --- | --- |
| 首页 / 商城 | `/`、`/mall` |
| 登录注册 | `/login`、`/register` |
| 个人中心 | `/me`、`/profile`、`/edit-profile` |
| 用户资料辅助 | `/address`、`/coupons`、`/notifications`、`/checkin`、`/invite` |
| 竞猜相关 | `/guess/[id]`、`/detail`、`/guess-history`、`/guess-order`、`/novice-guess` |
| 商品 / 店铺 | `/product/[id]`、`/product-detail`、`/shop/[id]`、`/shop-detail`、`/cart` |
| 订单 / 支付 | `/orders`、`/my-orders`、`/order-detail`、`/payment` |
| 仓库 | `/warehouse` |
| 社区 / 社交 | `/community`、`/community-search`、`/post/[id]`、`/post-detail`、`/friends`、`/chat`、`/chat/[id]`、`/chat-detail`、`/user/[id]`、`/user-profile` |
| 直播 / 创作 / 商家 | `/lives`、`/live/[id]`、`/live`、`/create`、`/create-user`、`/my-shop`、`/myshop`、`/brand-auth`、`/add-product` |
| 其他 | `/features`、`/all-features`、`/ranking`、`/search`、`/splash`、`/test-api`、`/ai-demo` |

### 2. 用户端功能状态

| 功能 | 状态 | 说明 |
| --- | --- | --- |
| 首页竞猜流 | `进行中` | 已有首页结构、榜单、开奖区、底部导航，仍以静态展示为主 |
| 商城首页 | `进行中` | 已有页面和旧 UI 结构，但未接真实商品流 |
| 登录 / 注册 UI | `进行中` | 页面已完成，认证仍未接真实后端 |
| 个人中心 UI | `进行中` | `me/profile/edit-profile` 已重建，数据仍以 demo 为主 |
| 竞猜详情 UI | `进行中` | 页面已完成，下注/评论/分享主要是静态交互 |
| 商品详情 UI | `进行中` | 直购 / 竞猜 / 换购结构已在，未接真实数据和库存逻辑 |
| 店铺详情 UI | `进行中` | 店铺 Hero、活动、商品卡、竞猜入口已做，仍是静态 |
| 订单列表 / 详情 UI | `进行中` | 页面已完成，物流、售后、状态流仍是 demo |
| 仓库 UI | `进行中` | 页面已完成，虚拟仓 / 实体仓仍未接真实仓库数据 |
| 社区 / 聊天 / 用户主页 UI | `进行中` | 页面已完成，仍是 mock 内容流 |
| 搜索 UI | `进行中` | 结果页已做，搜索数据仍为本地构造 |
| 底部导航和全局视觉统一 | `进行中` | 已持续对齐旧系统，但仍在细节打磨中 |

### 3. 兼容别名路由

这些页面主要用于兼容旧静态页路径，本质上不是新的独立功能：

| 兼容路径 | 实际功能 |
| --- | --- |
| `/all-features` | `features` 别名 |
| `/my-orders` | `orders` 别名 |
| `/chat-detail` | `chat/[id]` 兼容页 |
| `/profile` | `me` 兼容页 |
| `/myshop` | `my-shop` 兼容页 |
| `/post-detail` | `post/[id]` 兼容页 |
| `/user-profile` | `user/[id]` 兼容页 |
| `/live` | `live/[id]` 兼容页 |
| `/detail`、`/product-detail`、`/shop-detail` | 旧页面名兼容包装页 |

### 4. 真实数据接入情况

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 页面调用 `src/lib/api.ts` | `未开始` | 当前页面层基本还没真正接 API client |
| 页面调用本地 demo 数据 | `已完成` | `me`、`guess/[id]`、`product/[id]` 等明确依赖本地 demo |
| 页面接真实后端接口 | `未开始` | 尚未进入真实联调阶段 |

一句话：`apps/web` 当前是“页面覆盖完整、UI 还原推进中、业务数据层未真正接线”。

## 管理台 Admin

### 1. 已落地内容

| 功能 | 状态 | 说明 |
| --- | --- | --- |
| 管理台壳层 | `已完成` | 单页壳层、侧边导航、模块卡片已落地 |
| 模块规划列表 | `已完成` | 已定义 `Dashboard / Users / Products / Guesses / Orders / Warehouse` |
| 管理台 API client | `已完成` | 已有 dashboard / users / guesses / orders 的请求封装 |

### 2. 尚未完成

| 功能 | 状态 | 说明 |
| --- | --- | --- |
| 登录页 | `未开始` | 还没有独立后台登录流程 |
| 路由体系 | `未开始` | 当前只有 `src/App.tsx` 单页 |
| 列表页 / 详情页 / 表单页 | `未开始` | 还没有真实 CRUD 页面 |
| 竞猜审核 / 开奖 | `未开始` | 还没有运营闭环页面 |
| 订单履约 / 退款审核 | `未开始` | 只有规划描述，没有真实功能 |
| 仓库管理页面 | `未开始` | 只有模块卡片，没有数据视图 |

一句话：`apps/admin` 当前是“功能规划 + 单页骨架”，不是可用管理后台。

## 后端 API

### 1. 已落地路由

| 模块 | 路由 | 状态 | 说明 |
| --- | --- | --- | --- |
| Health | `GET /health` | `已完成` | 健康检查 |
| Auth | `POST /api/auth/login` | `Demo` | 返回 demo token |
| Auth | `GET /api/auth/me` | `Demo` | 直接返回 demo admin |
| Guesses | `GET /api/guesses` | `Demo` | 竞猜列表 |
| Guesses | `GET /api/guesses/:id` | `Demo` | 竞猜详情 |
| Guesses | `GET /api/guesses/:id/stats` | `Demo` | 竞猜统计 |
| Orders | `GET /api/orders` | `Demo` | 订单列表 |
| Orders | `GET /api/orders/:id` | `Demo` | 订单详情 |
| Orders | `GET /api/orders/admin/stats/overview` | `Demo` | 订单概览 |
| Wallet | `GET /api/wallet/ledger` | `Demo` | 余额流水 |
| Warehouse | `GET /api/warehouse/virtual` | `Demo` | 虚拟仓 |
| Warehouse | `GET /api/warehouse/physical` | `Demo` | 实体仓 |
| Warehouse | `GET /api/warehouse/admin/stats` | `Demo` | 仓库概览 |
| Admin | `GET /api/admin/dashboard/stats` | `Demo` | 运营概览 |
| Admin | `GET /api/admin/users` | `Demo` | 用户列表 |
| Admin | `GET /api/admin/guesses` | `Demo` | 竞猜列表 |
| Admin | `GET /api/admin/orders` | `Demo` | 订单列表 |

### 2. API 当前状态

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| Express 应用骨架 | `已完成` | 路由挂载已经齐了 |
| 真实数据库接入 | `未开始` | 仍未接当前新库结构 |
| Service 层 | `未开始` | 目前还是 demo router 直返 |
| 权限控制 | `未开始` | 尚未实现真实 auth / RBAC |
| 事务 / 状态流 / 幂等 | `未开始` | 新后端里还没有落地 |
| 写操作接口 | `未开始` | 当前几乎全是读取接口 |

一句话：`apps/api` 当前是“接口骨架 + 演示数据返回”，不是实际业务后端。

## Shared / DB

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| `packages/shared` 类型与状态枚举 | `已完成` | 已供 Web / Admin / API 共用 |
| `packages/db` 结构承接 | `进行中` | 目录已建立，但运行期接入还没开始 |
| 数据库结构说明文档 | `已完成` | 见 [db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md) |

## 当前最大缺口

| 优先级 | 缺口 | 说明 |
| --- | --- | --- |
| P0 | Web 未接真实 API | 目前绝大多数还是静态页面 |
| P0 | API 未接数据库 | 所有核心模块仍走 `demo-data.ts` |
| P1 | Admin 只有壳层 | 还没有运营闭环页面 |
| P1 | 权限 / 事务 / 状态机未落地 | 新主线工程尚未进入真实业务阶段 |
| P2 | 文案 / UI 仍在持续对齐旧系统 | 页面多，细节仍需继续压平 |

## 下一阶段建议

1. 先把 `apps/api` 从 `demo-data.ts` 切到真实数据库读取。
2. 优先打通 `auth / guess / order / warehouse / wallet` 五条核心链路。
3. 再让 `apps/web` 先接首页竞猜流、竞猜详情、订单、仓库这四类页面。
4. 最后补 `apps/admin` 的 `Dashboard / Guesses / Orders / Warehouse` 最小后台闭环。

## 更新规则

后续每次推进功能时，至少同步更新以下三项：

1. 新增了什么模块或页面。
2. 该功能属于 `已完成 / 进行中 / 未开始 / Demo` 哪一类。
3. 是否已经接入真实接口、真实数据库，还是仍然依赖 mock / demo 数据。
