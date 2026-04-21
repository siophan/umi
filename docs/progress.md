# 项目进度

最后更新：2026-04-21

本文档只记录当前仓库代码能直接确认的事实，不写无法从代码、脚本或构建结果直接证明的判断。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| `已完成` | 当前仓库中已有明确实现，且代码或脚本能直接确认 |
| `进行中` | 已有结构、页面或接口，但闭环仍不完整 |
| `未开始` | 当前仓库里未见有效实现 |
| `阻塞` | 有实现，但当前被构建、类型或关键缺口卡住 |

## 总体判断

| 模块 | 当前状态 | 代码事实 |
| --- | --- | --- |
| Monorepo 工程底座 | `已完成` | 根目录已形成 `pnpm workspace + turbo`，包含 `apps/web`、`apps/admin`、`apps/api`、`packages/shared`、`packages/db`、`packages/config` |
| 用户端 `apps/web` | `进行中` | `apps/web/src/app` 下当前有 `57` 个 `page.tsx` 页面文件，且已存在 `20` 个 API client 文件 |
| 管理台 `apps/admin` | `进行中` | `apps/admin/src/pages` 下当前有 `40` 个页面文件，`apps/admin/src/lib/api` 下有 `15` 个 API client 文件 |
| 后端 `apps/api` | `进行中` | `apps/api/src/modules` 下当前有 `20` 个 `router.ts` 路由入口和 `52` 个 TypeScript 模块文件 |
| 共享契约 `packages/shared` | `已完成` | 当前包含 `api.ts`、`domain.ts`、`status.ts`、`admin-permissions.ts`、`index.ts` 五个共享源码文件 |
| 数据库资产 `packages/db` | `进行中` | 当前已清理失真旧 SQL，保留 docs-first 说明，但尚未重建覆盖当前 `joy-test` 的完整 migration / schema 资产 |

## 全局统筹判断

### 项目经理口径评分

| 维度 | 当前估算 | 判断依据 |
| --- | --- | --- |
| 整体完成度 | `65%` | 页面覆盖已较完整，但“后台可运营闭环 + 测试覆盖 + 未收口链路”仍明显拖分 |
| 用户端 | `70%` | 高频主链路大多已存在真实 API 接入，但仍有 `8` 个静态/本地态页面，且 `invite`、`checkin` 链路未闭环 |
| 管理后台 | `65%` | 核心列表和权限体系已成型，内容治理与直播列表已接入真实后台接口；当前主要还剩 `弹幕管理` 这类边界页和大量页面专项测试未补 |
| 后端 API | `75%` | `apps/api/src/app.ts` 已注册 `20` 个业务模块，主资源域较完整，但仍有缺失路由和部分后台业务闭环不足 |
| 测试覆盖 | `50%` | 已有一批 API integration/smoke，但绝大多数页面级测试缺失，营销和治理后台专项测试不足 |
| 部署准备 | `70%` | 工程底座、部署文档和构建链路已具备基础交付条件，但功能闭环不足仍会影响“上线后可运营程度” |

### 当前阶段判断

- 这个项目已经过了“纯壳子/纯 demo”阶段，进入“高频链路可用、低频链路和运营后台继续收口”的阶段。
- 影响整体完成度的主因不再是页面数量，而是：
  - 仍有少量后台边界页未形成真实数据闭环
  - 前后端链路未完全闭环
  - 老系统对齐仍有不少页面未核对
  - 自动化测试仍偏 API 层，页面级覆盖不足

## 工程健康

### 构建与类型检查

| 项目 | 当前状态 | 代码事实 |
| --- | --- | --- |
| `pnpm build` | `已完成` | 我已实际执行，当前 workspace 构建通过；`apps/web` 完成 Next.js 生产构建，`apps/admin` 产出 `dist/` |
| `pnpm typecheck` | `已完成` | 我已实际执行，当前 workspace `typecheck` 通过；本轮已修复 `apps/admin` 角色页和 `apps/api` 订单路由的类型错误 |
| `apps/web` 构建警告 | `进行中` | Next.js 当前仍提示多 lockfile 导致 workspace root 推断警告 |
| `apps/admin` 构建警告 | `进行中` | Vite 构建产物存在大 chunk warning，主 bundle 已超过默认体积提示阈值 |

### 当前阻塞点

- 当前没有 workspace 级 `typecheck` 阻塞，工程健康的主问题已从“编不过”转向“业务闭环不完整”。
- 当前最影响交付的阻塞点是：
  - 用户端 `invite`、`checkin` 页面已直连接口，但当前 `apps/api/src/app.ts` 中未见对应 router 注册
  - 管理后台 `弹幕管理` 仍未承接真实存储链路
  - 大量页面仍缺页面级专项测试，当前测试重心主要在 API integration / smoke
  - 仍有不少页面的 `老系统对齐状态` 只能保守标成 `未核对`

## 用户端 Web

### 页面结构

当前 `apps/web/src/app` 下可直接确认的页面入口共 `57` 个。

其中包含：

- 首页与聚合页：`/`、`/ranking`、`/lives`、`/mall`
- 登录注册相关：`/login`、`/register`、`/reset-password`
- 用户相关：`/me`、`/edit-profile`、`/user/[uid]`、`/friends`、`/notifications`
- 社区相关：`/community`、`/community-search`、`/post/[id]`
- 商品与店铺：`/product/[id]`、`/shop/[id]`、`/cart`、`/payment`
- 订单与仓库：`/orders`、`/order-detail`、`/review`、`/warehouse`
- 兼容或静态页：如 `/detail`、`/product-detail`、`/shop-detail`、`/profile`、`/myshop`、`/splash`、`/terms`、`/privacy`

### 数据接入现状

从代码可直接确认，`apps/web` 已有 `20` 个 API client 文件：

- `auth`
- `address`
- `banners`
- `cart`
- `chat`
- `community`
- `coupons`
- `friends`
- `guesses`
- `lives`
- `notifications`
- `orders`
- `products`
- `rankings`
- `search`
- `shops`
- `users`
- `wallet`
- `warehouse`
- `shared`

从页面代码中的直接 import 可以确认，下列页面或组件已接入 API client：

- 首页客户端层：[page-client.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page-client.tsx:1)
- 首页服务端首屏数据：[page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx:1)
- 榜单页：[ranking/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx:1)
- 直播列表页：[lives/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx:1)
- 登录、注册、重置密码
- `me`、`edit-profile`
- `friends`、`notifications`、`chat`、`chat/[id]`
- `community`、`community-search`、`post/[id]`
- `search`
- `product/[id]`、`shop/[id]`
- `cart`、`payment`
- `orders`、`order-detail`、`review`
- `warehouse`
- `my-shop`、`brand-auth`、`add-product`

这说明当前用户端不是“只有页面壳”，而是已经存在较广的 API 接入面。

### 可直接确认的实现方式

- 首页 [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx:1) 在服务端直接请求：
  - `/api/banners`
  - `/api/guesses`
  - `/api/lives`
  - `/api/rankings`
- 榜单页 [ranking/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx:1) 在服务端直接请求 `/api/rankings`
- 直播列表页 [lives/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx:1) 在服务端直接请求 `/api/lives`
- 通用请求封装位于 [apps/web/src/lib/api/shared.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/shared.ts:1)，当前统一走 `ApiEnvelope` 和 Bearer token

### 当前判断

| 子项 | 当前状态 | 代码事实 |
| --- | --- | --- |
| 页面覆盖 | `已完成` | 页面文件数量和路由骨架已较完整 |
| 主读链路 API 接入 | `进行中` | 多数高频页面已直接引入 API client，但并非所有页面都直接接入数据层 |
| 兼容页与静态页清理 | `进行中` | 仍保留多组兼容页和明显的包装页 |

## 管理台 Admin

### 页面与导航结构

当前 `apps/admin` 仍是单壳层应用，但不是“只剩一个占位页”。

代码事实：

- 页面入口共 `40` 个
- 主壳层位于 [apps/admin/src/App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:1)
- 菜单定义位于 [apps/admin/src/lib/admin-navigation.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-navigation.tsx:1)
- 当前使用 hash 路由路径分发
- 页面访问与菜单显示已接入权限过滤逻辑

从 `PAGE_COMPONENTS` 和菜单树可直接确认，当前已有这些页面分组：

- Dashboard
- 用户与商家
- 商品与竞猜
- 订单与履约
- 营销中心
- 内容与风控
- 系统配置

### 权限体系

当前管理台权限不是临时字符串散落在页面里。

代码事实：

- 权限定义集中在 [packages/shared/src/admin-permissions.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/admin-permissions.ts:1)
- `admin-navigation.tsx` 通过 `findAdminMenuPermissionByPath()` 将菜单路径与权限码关联
- `App.tsx` 使用：
  - `filterAdminMenuTreeByAccess`
  - `findFirstAccessibleAdminPath`
  - `isAdminPathAccessible`

这说明后台菜单和页面权限已经抽到共享层，而不是页面里自行硬编码。

### 数据接入现状

当前 `apps/admin/src/lib/api` 下共有 `13` 个 API client 文件：

- `auth`
- `catalog`
- `categories`
- `checkin`
- `dashboard`
- `equity`
- `invite`
- `marketing`
- `merchant`
- `orders`
- `shared`
- `system`
- `users`

从页面 import 可直接确认，当前已接入后台接口的数据页包括：

- 仪表盘
- 用户页
- 店铺页、开店审核页（店铺列表已支持启用/暂停/关闭，且已关闭店铺可重新启用；开店审核已支持通过/拒绝审核）
- 品牌管理页（已支持直接新增/编辑品牌，不再保留品牌入驻审核页）
- 轮播管理页（已支持列表、详情、新增、编辑、启停、删除）
- 品牌授权页（已支持申请审核、授权记录查看、撤销授权）
- 品牌商品、商品列表
- 竞猜列表、好友竞猜、PK 对战、创建竞猜（竞猜列表已支持通过/拒绝审核）
- 订单列表、交易流水、物流、寄售（交易流水已补流水号/订单号/用户/渠道搜索和详情查看）
- 权益金管理（已直连 `equity_account / equity_log`，支持账户详情与后台调账）
- 仓库页、寄售页（虚拟仓已补状态 Tabs、商品/用户/来源搜索与详情展示；实体仓已按单页边界去掉寄售状态；寄售市场已补交易单号/卖家/订单号搜索和结算信息）
- 系统通知、系统聊天、系统用户
- 角色、权限、分类、系统通知（角色已支持新增/编辑/改状态/分配权限；系统通知已支持发送通知）

### 当前判断

| 子项 | 当前状态 | 代码事实 |
| --- | --- | --- |
| 页面骨架 | `已完成` | 页面、导航、权限路径映射都已存在 |
| 数据读取链路 | `进行中` | 多数页面已接入后台 API client |
| 后台工程健康 | `进行中` | 当前 workspace `typecheck` 已通过，但后台关键模块仍在持续补完整操作闭环 |

## 后端 API

### 模块结构

当前 `apps/api/src/app.ts` 注册了这些业务模块：

- `auth`
- `banner`
- `ranking`
- `live`
- `users`
- `social`
- `notifications`
- `community`
- `chat`
- `cart`
- `address`
- `coupon`
- `guess`
- `order`
- `product`
- `search`
- `shop`
- `wallet`
- `warehouse`
- `admin`

这意味着当前 API 不是少数几个演示路由，而是已经拆成 `20` 个路由入口模块。

### 用户侧与通用接口

从模块目录和 OpenAPI path 文件可直接确认，当前已存在以下资源域：

- 认证与密码相关
- 用户资料与搜索
- 社交
- 通知
- 社区
- 聊天
- 购物车
- 地址
- 优惠券
- 竞猜
- 订单
- 商品
- 搜索
- 店铺
- 钱包
- 仓库
- 首页 Banner / 排行榜 / 直播

### 后台接口

从 [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:1) 可直接确认，后台接口当前已不止登录和几条列表：

- 后台认证：登录、当前管理员、退出、修改密码
- 仪表盘统计
- 用户列表、用户详情、用户竞猜、用户订单、封禁
- 系统用户：新增、更新、改状态、重置密码
- 角色：列表、创建、改状态、更新权限
- 权限：列表、矩阵、创建、更新、改状态
- 分类：列表、创建、更新、改状态
- 商品、品牌商品
- 竞猜、好友竞猜、PK
- 订单、交易流水、物流、寄售
- 店铺、开店申请、品牌、品牌申请、品牌授权
- 店铺商品
- 系统通知、系统聊天

### 数据是否直连数据库

从代码可直接确认，API 中大量模块已经接 MySQL 查询实现，而不是只返回常量。

明确证据：

- [apps/api/src/lib/db.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/lib/db.ts:1) 提供 MySQL 连接池
- [apps/api/src/modules/admin/dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:1) 直接查询 `user`、`product`、`guess`、`order`、`order_refund`、`report_item`
- [apps/api/src/modules/admin/orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:1) 直接查询订单、履约、退款、寄售相关表
- `users`、`auth`、`community`、`chat`、`shop`、`warehouse`、`cart`、`coupon`、`address` 等模块目录下都存在对应的 store/query/router 实现

因此，当前 API 更准确的描述是：

- 用户侧主资源域已较完整
- 后台侧已铺开多资源域读取和部分写接口
- 但整体仍未完成完整事务、状态机和后台业务闭环

### 当前判断

| 子项 | 当前状态 | 代码事实 |
| --- | --- | --- |
| 路由拆分 | `已完成` | 业务模块已拆成 `20` 个 router |
| 用户侧资源域 | `进行中` | 主资源域都已有 router 与 OpenAPI 路径定义，但不能据此直接判定所有链路已完整闭环 |
| 后台资源域 | `进行中` | 已覆盖大量后台资源域，但还不能说明所有业务闭环已完成 |
| 事务与状态机 | `进行中` | 代码中已见大量写接口，但还未看到统一事务框架或系统化状态机层 |

## Shared / DB

### `packages/shared`

当前可直接确认：

- 已导出共享 API 类型
- 已导出领域类型
- 已导出状态枚举
- 已导出后台权限目录

这说明 `packages/shared` 当前已经是实际在用的共享层，而不是空目录。

### `packages/db`

当前可直接确认：

- 旧 SQL 资产已经清理，避免继续误导后续线程按旧模型恢复数据库
- 当前 `packages/db/sql/` 只保留说明文件
- 当前数据库事实仍以 `docs/db.md`、`docs/schema-reference.md`、`docs/status-codes.md` 为准
- 还没有重建出覆盖当前 `joy-test` 事实的完整 schema / migration / seed 资产

这说明 `packages/db` 当前已经从“失真 SQL 集合”回退成安全状态，但仍不是统一 migration 系统。

## 当前最大缺口

| 优先级 | 缺口 | 代码事实 |
| --- | --- | --- |
| P0 | 用户端 `invite` / `checkin` 链路未闭环 | 前端页面已直接请求接口，但当前 `apps/api/src/app.ts` 中未见对应 router 注册 |
| P1 | 管理后台 `#/live/danmaku` 仍是明确边界页 | 当前系统未承接直播弹幕持久化表，无法做真实后台管理 |
| P1 | 用户端仍有 `8` 个静态/本地态页面 | 主要包括 `/terms`、`/privacy`、`/guess-order`、`/novice-guess`、`/create`、`/create-user`、`/ai-demo`、`/splash` |
| P1 | 页面级自动化测试覆盖不足 | 当前强项仍是 API integration / smoke，大多数 `apps/web`、`apps/admin` 页面未见专项测试 |
| P1 | `packages/db` 仍不是统一迁移体系 | 当前已清理失真 SQL，但仍未重建覆盖当前 `joy-test` 的完整 migration runner / schema 资产 |
| P1 | 构建警告仍未清理 | Next 多 lockfile warning 与 Admin 大 chunk warning 仍存在 |

## 下一步建议

1. 优先补齐 `invite`、`checkin` 的后端承接或明确下线页面入口，先收掉“前端已接、后端未见”的伪闭环。
2. 优先补 `apps/admin` 剩余边界页和页面级专项测试，尤其是直播弹幕真实链路缺口。
3. 继续按页面重要性清理 `apps/web` 中的静态页、兼容页和仅本地态页面，先收口 `/novice-guess`、`/create`、`/create-user` 等高感知页面。
4. 给已成型的高频页补页面级或链路级自动化测试，至少优先覆盖首页、商城、订单、后台审核和通知发送。
5. 由 DBA 先基于 `umi/docs/` 重建一套和当前 `joy-test` 对齐的 schema / migration / seed 资产，再决定是否推进统一 migration runner。
