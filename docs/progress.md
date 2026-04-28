# 项目进度

最后更新：2026-04-28

本文档只记录当前仓库代码能直接确认的事实，不写无法从代码、脚本或构建结果直接证明的判断。

本次更新时间主要同步当前代码结构与模块计数；若未在本轮重新执行 `build / typecheck`，对应工程健康项继续沿用最近一次已验证结果。

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
| 用户端 `apps/web` | `进行中` | `apps/web/src/app` 下当前有 `46` 个 `page.tsx` 页面文件，且已存在 `20` 个 API client 文件；主阻塞已从“有没有接口”转到“重页面是否继续收口” |
| 管理台 `apps/admin` | `进行中` | `apps/admin/src/pages` 下当前有 `40` 个页面文件；`apps/admin/src/lib/api` 下当前有 `28` 个源码文件，已收成按业务域文件 + 薄入口 barrel，不再保留大杂烩请求文件 |
| 后端 `apps/api` | `进行中` | `apps/api/src/modules` 下当前有 `21` 个 `router.ts` 路由入口和 `130` 个 TypeScript 模块文件；`apps/api/src/modules/admin` 已从超大 router/service 拆到按业务域模块组织，但非 `admin` 域仍存在多处 `500+ / 800+ / 1000+` 行 router/store 热点 |
| 共享契约 `packages/shared` | `已完成` | 当前共享契约已拆成 `api-core / api-auth / api-admin-* / api-user-*` 等多个源码文件，`api.ts` 只保留薄导出层 |
| 数据库资产 `packages/db` | `进行中` | 当前已清理失真旧 SQL，保留 docs-first 说明，但尚未重建覆盖当前 `joy-test` 的完整 migration / schema 资产 |

## 全局统筹判断

### 项目经理口径评分

| 维度 | 当前估算 | 判断依据 |
| --- | --- | --- |
| 整体完成度 | `65%` | 页面覆盖已较完整，但“后台可运营闭环 + 测试覆盖 + 未收口链路”仍明显拖分 |
| 用户端 | `70%` | 高频主链路大多已存在真实 API 接入，但仍有 `8` 个静态/本地态页面，且 `invite`、`checkin` 链路未闭环 |
| 管理后台 | `65%` | 核心列表和权限体系已成型，内容治理与直播列表已接入真实后台接口；寄售市场已补强制下架，排行榜已补后台刷新动作；当前主要问题转为少量半闭环页和大量页面专项测试未补 |
| 后端 API | `75%` | `apps/api/src/app.ts` 已注册 `21` 个业务模块，主资源域较完整，但用户端 `invite/checkin` 仍未见独立后端承接，且部分后台业务闭环不足 |
| 测试覆盖 | `50%` | 已有一批 API integration/smoke，但绝大多数页面级测试缺失，营销和治理后台专项测试不足 |
| 部署准备 | `70%` | 工程底座、部署文档和构建链路已具备基础交付条件，但功能闭环不足仍会影响“上线后可运营程度” |

### 当前阶段判断

- 这个项目已经过了“纯壳子/纯 demo”阶段，进入“高频链路可用、低频链路和运营后台继续收口”的阶段。
- 影响整体完成度的主因不再是页面数量，而是：
  - 仍有少量后台半闭环页未形成完整运营动作
  - 前后端链路未完全闭环
  - 老系统对齐仍有不少页面未核对
  - 自动化测试仍偏 API 层，页面级覆盖不足
- `apps/admin` 当前的主问题已经不是架构失衡，而是运行质量：关键操作链路回归、页面级验证和构建包体积 warning。

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
  - 大量页面仍缺页面级专项测试，当前测试重心主要在 API integration / smoke
  - 仍有不少页面的 `老系统对齐状态` 只能保守标成 `未核对`
- 当前工程收尾规则已补充：如果本地 `3000 / 4000` 原服务本来就在跑，改完不只看 `typecheck / build`，还要顺手确认服务仍然存活
- 本地 `web` 曾出现过 `apps/web/.next/routes-manifest.json` 缺失导致 `3000` 上 `next dev` 进程存活但页面 `500` 的情况；当前恢复口径已固定为“停进程 -> 清 `apps/web/.next` -> 原地重启 `3000`”

## 用户端 Web

### 页面结构

当前 `apps/web/src/app` 下可直接确认的页面入口共 `46` 个。

其中包含：

- 首页与聚合页：`/`、`/ranking`、`/lives`、`/mall`
- 登录注册相关：`/login`、`/register`、`/reset-password`
- 用户相关：`/me`、`/edit-profile`、`/user/[uid]`、`/friends`、`/notifications`
- 社区相关：`/community`、`/community-search`、`/post/[id]`
- 商品与店铺：`/product/[id]`、`/shop/[id]`、`/cart`、`/payment`
- 订单与仓库：`/orders`、`/order-detail`、`/review`、`/warehouse`
- 静态或本地态页面：如 `/splash`、`/terms`、`/privacy`

### 当前架构热点

当前 `apps/web` 已没有 `800+ / 1000+` 的高频大页中心；首页客户端层和 `/create` 这两个原本还偏重的点也已继续收口，前者从 `1049` 行降到 `130` 行，后者从 `1324` 行降到 `298` 行，其余高频页也都已基本收成“协调层 + 子组件/区块 + 页面状态 hook”的结构。

其中 `/community` 已进一步收口：

- [apps/web/src/app/community/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx:1) 已从 `1122` 行降到 `179` 行
- 关注横条、推荐高亮区、feed 列表、四个发布/转发/权限/表情弹层和页面状态机已拆到：
  - [apps/web/src/app/community/community-follow-bar.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/community-follow-bar.tsx:1)
  - [apps/web/src/app/community/community-recommend-highlights.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/community-recommend-highlights.tsx:1)
  - [apps/web/src/app/community/community-feed-list.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/community-feed-list.tsx:1)
  - [apps/web/src/app/community/community-composer-overlays.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/community-composer-overlays.tsx:1)
  - [apps/web/src/app/community/use-community-page-state.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/use-community-page-state.ts:1)
  - [apps/web/src/app/community/page-helpers.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page-helpers.ts:1)
- 推荐流和发现区当前已支持匿名访问；未登录时“为您推荐”可直接浏览，“你的关注”页签只保留普通空态，不再显示“动态加载失败”
- 社区推荐流和发现区当前已支持匿名访问；未登录时“为您推荐”可以直接浏览，“你的关注”页签只保留普通空态，不再显示“动态加载失败”

`/product/[id]`、`/post/[id]`、`/friends` 这轮也已经开始收口：

- [apps/web/src/app/product/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:1) 已从 `1028` 行降到 `396` 行，头图、摘要区、内容区、换购弹层已拆到 `product-detail-*` 子文件
- [apps/web/src/app/post/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx:1) 已从 `942` 行降到 `169` 行，正文卡片、评论区、分享/举报弹层、相关推荐和详情状态机已拆到 `post-detail-* / use-post-detail-state`
- [apps/web/src/app/friends/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx:1) 已从 `889` 行降到 `120` 行，顶部统计/快捷入口/热门竞猜和详情状态机已拆到 `friends-overview-sections / use-friends-page-state / friends-*`

`/me` 这轮也已经开始收口：

- [apps/web/src/app/me/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/page.tsx:1) 已从 `827` 行降到 `333` 行
- 主页摘要、作品/收藏/喜欢分区、设置/搜索/开店弹层已拆到：
  - [apps/web/src/app/me/me-profile-summary.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/me-profile-summary.tsx:1)
  - [apps/web/src/app/me/me-activity-sections.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/me-activity-sections.tsx:1)
  - [apps/web/src/app/me/me-overlays.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/me-overlays.tsx:1)
  - [apps/web/src/app/me/me-helpers.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/me-helpers.ts:1)

`/payment` 这轮也已经开始收口：

- [apps/web/src/app/payment/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:1) 已从 `676` 行降到 `319` 行
- 订单主体区块、价格区块和弹层区块已拆到：
  - [apps/web/src/app/payment/payment-order-sections.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/payment-order-sections.tsx:1)
  - [apps/web/src/app/payment/payment-overlays.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/payment-overlays.tsx:1)
  - [apps/web/src/app/payment/payment-helpers.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/payment-helpers.ts:1)

`/community-search` 这轮也已经开始收口：

- [apps/web/src/app/community-search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx:1) 已从 `691` 行降到 `421` 行
- 默认态、结果态和展示 helper 已拆到：
  - [apps/web/src/app/community-search/default-view.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/default-view.tsx:1)
  - [apps/web/src/app/community-search/results-view.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/results-view.tsx:1)
  - [apps/web/src/app/community-search/page-helpers.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page-helpers.tsx:1)

`/my-shop` 这轮也已经开始收口：

- [apps/web/src/app/my-shop/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:1) 已从 `626` 行降到 `257` 行
- 开店申请态、已开店内容区和 shared helper 已拆到：
  - [apps/web/src/app/my-shop/shop-status-content.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/shop-status-content.tsx:1)
  - [apps/web/src/app/my-shop/active-shop-content.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/active-shop-content.tsx:1)
  - [apps/web/src/app/my-shop/my-shop-helpers.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/my-shop-helpers.ts:1)

`/create-user`、`/novice-guess`、`/search`、`/user/[uid]`、`/shop/[id]` 这轮也已经开始收口：

- [apps/web/src/app/create-user/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/create-user/page.tsx:1) 已从 `761` 行降到 `266` 行，主页面只保留状态和发布动作；主体区块与弹层已拆到 `create-user-form / create-user-overlays / create-user-helpers`
- [apps/web/src/app/novice-guess/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx:1) 已从 `685` 行降到 `301` 行，启动页、游戏页、结果页已拆到 `novice-guess-splash / novice-guess-game / novice-guess-result / novice-guess-helpers`
- [apps/web/src/app/search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx:1) 已从 `620` 行降到 `367` 行，搜索前态和结果态已拆到 `search-before-view / search-results-view / search-helpers`
- [apps/web/src/app/user/[uid]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.tsx:1) 已从 `602` 行降到 `385` 行，主页主体和私信浮层已拆到 `user-profile-sections / user-profile-chat-overlay`
- [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:1) 已从 `601` 行降到 `258` 行，店铺主体内容已拆到 `shop-detail-content`

`/create` 这轮也已经继续收口：

- [apps/web/src/app/create/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/create/page.tsx:1) 已从 `1324` 行降到 `298` 行，主页面现在主要只保留模板选择、页面拼装和底部动作；静态配置、页面状态、基本信息、竞猜选项、好友 PK、开奖设置和整组预览/商品选择/分享/发布/成功弹层已拆到：
  - [apps/web/src/app/create/create-helpers.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/create/create-helpers.ts:1)
  - [apps/web/src/app/create/use-create-page-state.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/create/use-create-page-state.ts:1)
  - [apps/web/src/app/create/create-basic-info-section.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/create/create-basic-info-section.tsx:1)
  - [apps/web/src/app/create/create-options-section.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/create/create-options-section.tsx:1)
  - [apps/web/src/app/create/create-pk-section.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/create/create-pk-section.tsx:1)
  - [apps/web/src/app/create/create-settings-section.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/create/create-settings-section.tsx:1)
  - [apps/web/src/app/create/create-overlays.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/create/create-overlays.tsx:1)

`/guess/[id]`、`/cart`、`/edit-profile` 这轮也已经开始收口：

- [apps/web/src/app/guess/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx:1) 已从 `553` 行降到 `239` 行，主视觉、对战区和分享/下注弹层已拆到 `guess-hero / guess-battle-panel / guess-detail-overlays / guess-detail-helpers`
- [apps/web/src/app/cart/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx:1) 已从 `551` 行降到 `389` 行，店铺分组、推荐流和底部结算栏已拆到 `cart-shop-groups / cart-recommend / cart-footer-bar / cart-helpers`
- [apps/web/src/app/edit-profile/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:1) 已从 `534` 行降到 `300` 行，资料主体区块和等级/资料弹层已拆到 `edit-profile-main-sections / edit-profile-overlays / edit-profile-helpers`

`/warehouse`、`/address`、`/orders` 这轮也已经开始收口：

- [apps/web/src/app/warehouse/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx:1) 已从 `492` 行降到 `214` 行，仓库摘要、页签、列表和寄售弹层已拆到 `warehouse-summary / warehouse-tabs / warehouse-list / warehouse-consign-modal / warehouse-helpers`
- [apps/web/src/app/address/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:1) 已从 `473` 行降到 `264` 行，地址请求已回到 `lib/api/address.ts`，地址列表和表单弹层已拆到 `address-list / address-form-modal / address-helpers`
- [apps/web/src/app/orders/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx:1) 已从 `439` 行降到 `189` 行，订单统计、tabs 和列表已拆到 `orders-summary / orders-list / order-helpers`

旧的兼容路由壳已经删除；后续线程不应把 `/detail`、`/product-detail`、`/post-detail`、`/live`、`/profile`、`/user-profile`、`/my-orders`、`/all-features`、`/myshop`、`/shop-detail`、`/chat-detail` 这类旧路径重新加回工作区。

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
- 首页客户端状态与映射：[use-home-page-state.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/use-home-page-state.ts:1)、[home-page-helpers.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/home-page-helpers.ts:1)
- 首页客户端视图：[home-guess-view.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/home-guess-view.tsx:1)、[home-live-view.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/home-live-view.tsx:1)
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
- 首页客户端 [use-home-page-state.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/use-home-page-state.ts:1) 当前不再重复请求首屏 `Banner / 竞猜 / 直播 / 榜单`，只补历史区和发现区；未登录访问时也不再请求 `fetchGuessHistory()`
- 首页 [page-client.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page-client.tsx:1) 当前已移除固定通知红点；通知入口未登录时直接跳 `/login`
- 榜单页 [ranking/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx:1) 在服务端直接请求 `/api/rankings`
- 直播列表页 [lives/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx:1) 在服务端直接请求 `/api/lives`
- 通用请求封装位于 [apps/web/src/lib/api/shared.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/shared.ts:1)，当前统一走 `ApiEnvelope` 和 Bearer token

### 当前判断

| 子项 | 当前状态 | 代码事实 |
| --- | --- | --- |
| 页面覆盖 | `已完成` | 页面文件数量和路由骨架已较完整 |
| 主读链路 API 接入 | `进行中` | 多数高频页面已直接引入 API client，但并非所有页面都直接接入数据层 |
| 兼容页与静态页清理 | `进行中` | 旧兼容路由壳已删除，但仍有多页保持本地态或高耦合页面结构 |

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

当前 `apps/admin/src/lib/api` 下共有 `28` 个源码文件；对外仍保持按业务域薄入口，对内已继续拆成子模块。

其中主入口域包括：

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

当前这层的结构已经不是“总接口文件”：

- `system.ts` 已收成薄入口，真实实现拆到 `system-notifications / system-users / system-rbac / system-shared`
- `merchant.ts` 已收成薄入口，真实实现拆到 `merchant-shops / merchant-brands / merchant-shared`
- `catalog.ts` 已收成薄入口，真实实现拆到 `catalog-products / catalog-guesses / catalog-warehouse / catalog-shared`

这说明后台前端请求层当前已经按业务域边界重组，而不是继续把所有请求堆回单文件。

从页面 import 可直接确认，当前已接入后台接口的数据页包括：

- 仪表盘
- 用户页
- 店铺页、开店审核页（店铺列表已支持启用/暂停/关闭，且已关闭店铺可重新启用；开店审核已支持通过/拒绝审核）
- 品牌管理页（已支持直接新增/编辑品牌，不再保留品牌入驻审核页）
- 轮播管理页（已支持列表、详情、新增、编辑、启停、删除，并恢复站内页面跳转类型）
- 品牌授权页（已统一为单列表状态流，支持待审核/已授权/已拒绝/已过期/已撤销筛选、查看、通过/拒绝、撤销授权）
- 品牌商品（已支持新增/编辑；后台已不再保留独立“商品列表”菜单页）
- 竞猜列表、好友竞猜、PK 对战、创建竞猜（竞猜列表已支持通过/拒绝审核，创建竞猜已支持后台直接创建并发布）
- 店铺商品已支持后台上架 / 下架，并改成服务端分页/筛选
- 订单列表、交易流水、物流、寄售（订单列表状态 Tabs 已补回 `已送达`；订单详情已改成独立子页，并在详情页内支持发货、退款审核、完成退款；退款信息区按实际退款记录显示，不再对所有订单固定展示；详情页结构已统一成分区块；物流详情与寄售详情也已改成独立子页；物流列表和详情页都支持 `发货 / 标记签收`；物流管理已从左侧菜单移除，作为订单管理下的非菜单页保留；交易流水已补流水号/订单号/用户/渠道搜索和详情查看）
- 权益金管理（已直连 `equity_account / equity_log`，支持账户详情与后台调账）
- 仓库页、寄售页（虚拟仓已补状态 Tabs、商品/用户/来源搜索与详情子页；实体仓已按单页边界去掉寄售状态并改成独立详情子页；寄售市场已补交易单号/卖家/订单号搜索、结算信息和强制下架动作）
- 系统通知、系统聊天、系统用户（系统通知已改成服务端分页/筛选；系统聊天已支持详情子页和真实消息时间线）
- 角色、权限、分类、系统通知（角色已支持新增/编辑/改状态/分配权限；系统通知已支持发送通知）

### 当前判断

| 子项 | 当前状态 | 代码事实 |
| --- | --- | --- |
| 页面骨架 | `已完成` | 页面、导航、权限路径映射都已存在 |
| 数据读取链路 | `进行中` | 多数页面已接入后台 API client |
| 后台工程健康 | `进行中` | 当前 workspace `typecheck` 已通过；本轮 `@umi/admin typecheck/build` 和 `@umi/api typecheck/build` 已实际执行通过 |

### 后台架构收口

最近几轮已可直接确认的结构收口：

- `apps/admin/src/App.tsx` 已拆出 `admin-navigation`、`admin-page-registry`、`admin-shell-layout`、`use-admin-session`、`use-admin-hash-navigation`
- `apps/admin/src/lib/api` 已按业务域继续拆分，不再保留跨域总接口文件
- `apps/admin` 热点页面已继续拆成页面协调层 + 子组件 + 页面状态/纯 helper；当前已确认：
  - `users-page.tsx`
  - `system-users-page.tsx`
  - `roles-page.tsx`
  - `warehouse-page.tsx`
  - `marketing-coupons-page.tsx`
  - `dashboard-page.tsx`
  - `system-rankings-page.tsx`
  - `guess-create-page.tsx`
  - `community-reports-page.tsx`
  - `shop-applies-page.tsx`

这意味着后台当前的主要问题已经从“总入口/总接口文件”转成“局部页面运行质量与回归验证”。

### 后台当前热点页

当前 `apps/admin/src/pages` 最大的页面已经不再超过 `300` 行，当前前几项是：

- `brand-library-page.tsx` `286`
- `equity-page.tsx` `280`
- `community-posts-page.tsx` `280`
- `shop-brand-auth-applies-page.tsx` `265`
- `marketing-banners-page.tsx` `258`
- `products-page.tsx` `257`

这些属于局部仍可继续优化的页面，不再是架构层阻塞。

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
- `upload`
- `wallet`
- `warehouse`
- `admin`

这意味着当前 API 不是少数几个演示路由，而是已经拆成 `21` 个路由入口模块。

### Admin 模块结构

`apps/api/src/modules/admin` 最近几轮已经从“超大后台总域文件”继续拆开。当前代码里可直接确认：

- `router.ts` 已收成薄装配层，营销、订单、内容、系统、商家、RBAC 等路由都已拆到 `routes/`
- `system.ts`、`merchant.ts`、`products.ts`、`coupons.ts`、`guesses.ts`、`orders.ts`、`content.ts` 当前都已收成薄导出层
- 真实逻辑已下沉到按业务域命名的领域文件，例如：
  - `system-users / system-notifications / system-roles / system-permissions`
  - `merchant-shops / merchant-brands / merchant-brand-auth`
  - `coupon-templates / coupon-grant-batches`
  - `guess-management / friend-guesses / pk-matches`
  - `order-records / order-transactions / order-logistics / order-consign`
  - `content-community / content-reports / content-live`

这说明当前后台 API 的主要结构风险，已经从“跨域超大文件”下降到“单业务域 shared/service 文件仍偏大”。

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
- 系统通知、系统聊天（系统通知已改成服务端分页；系统聊天已补详情子页）

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
| 路由拆分 | `已完成` | 业务模块已拆成 `21` 个 router |
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

当前进一步可确认的是：

- [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts) 只剩薄导出层
- 共享契约主体已经分到：
  - [api-admin-system.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api-admin-system.ts)
  - [api-admin-merchant.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api-admin-merchant.ts)
  - [api-admin-ops.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api-admin-ops.ts)
  - [api-admin-governance.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api-admin-governance.ts)
  - [api-user-social.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api-user-social.ts)
  - [api-user-commerce.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api-user-commerce.ts)

这说明 `packages/shared` 当前不是主阻塞，后续重点是防止重新膨胀，而不是继续机械拆分。

## 非 Admin API 架构热点

这一轮继续推进后，`apps/api` 非 `admin` 域的超大入口已经基本收平；`search / order / shop / product / warehouse / guess` 的 `router.ts` 都已经变成薄路由层，`community/store.ts` 也已经收成薄 barrel。

这轮已经收掉一块：

- [apps/api/src/modules/search/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/search/router.ts) 已从 `680` 行降到 `76` 行
- 商品搜索、竞猜搜索、热搜、联想词分别下沉到：
  - [apps/api/src/modules/search/search-products.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/search/search-products.ts)
  - [apps/api/src/modules/search/search-guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/search/search-guesses.ts)
  - [apps/api/src/modules/search/search-discovery.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/search/search-discovery.ts)
  - [apps/api/src/modules/search/search-shared.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/search/search-shared.ts)

这轮也已经继续收掉一块：

- [apps/api/src/modules/order/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/order/router.ts) 已从 `1109` 行降到 `102` 行
- 订单读取、详情、后台概览和写链路分别下沉到：
  - [apps/api/src/modules/order/order-read.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/order/order-read.ts)
  - [apps/api/src/modules/order/order-write.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/order/order-write.ts)
  - [apps/api/src/modules/order/order-shared.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/order/order-shared.ts)

这轮继续收掉两块：

- [apps/api/src/modules/shop/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/shop/router.ts) 已从 `942` 行降到 `152` 行
- 店铺状态、我的店铺、公开店铺、品牌授权分别下沉到：
  - [apps/api/src/modules/shop/shop-my.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/shop/shop-my.ts)
  - [apps/api/src/modules/shop/shop-public.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/shop/shop-public.ts)
  - [apps/api/src/modules/shop/shop-brand-auth.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/shop/shop-brand-auth.ts)
  - [apps/api/src/modules/shop/shop-shared.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/shop/shop-shared.ts)
- [apps/api/src/modules/product/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/product/router.ts) 已从 `888` 行降到 `78` 行
- 商品详情、商品流和收藏动作分别下沉到：
  - [apps/api/src/modules/product/product-detail.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/product/product-detail.ts)
  - [apps/api/src/modules/product/product-feed.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/product/product-feed.ts)
  - [apps/api/src/modules/product/product-favorite.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/product/product-favorite.ts)
  - [apps/api/src/modules/product/product-shared.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/product/product-shared.ts)
- [apps/api/src/modules/warehouse/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/router.ts) 已从 `558` 行降到 `95` 行
- 用户仓库读链、寄售写链、后台仓库视图分别下沉到：
  - [apps/api/src/modules/warehouse/warehouse-user.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/warehouse-user.ts)
  - [apps/api/src/modules/warehouse/warehouse-consign.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/warehouse-consign.ts)
  - [apps/api/src/modules/warehouse/warehouse-admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/warehouse-admin.ts)
  - [apps/api/src/modules/warehouse/warehouse-shared.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/warehouse-shared.ts)
- [apps/api/src/modules/guess/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/guess/router.ts) 已从 `500` 行降到 `49` 行
- 竞猜读链和个人历史分别下沉到：
  - [apps/api/src/modules/guess/guess-read.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/guess/guess-read.ts)
  - [apps/api/src/modules/guess/guess-history.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/guess/guess-history.ts)
  - [apps/api/src/modules/guess/guess-shared.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/guess/guess-shared.ts)
- [apps/api/src/modules/community/store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/community/store.ts) 已从 `900` 行降到 `19` 行
- 社区读链和写链分别下沉到：
  - [apps/api/src/modules/community/community-read.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/community/community-read.ts)
  - [apps/api/src/modules/community/community-write.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/community/community-write.ts)

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
| P1 | 用户端仍有 `8` 个静态/本地态页面 | 主要包括 `/terms`、`/privacy`、`/guess-order`、`/novice-guess`、`/create`、`/create-user`、`/ai-demo`、`/splash` |
| P1 | 页面级自动化测试覆盖不足 | 当前强项仍是 API integration / smoke，大多数 `apps/web`、`apps/admin` 页面未见专项测试 |
| P1 | `packages/db` 仍不是统一迁移体系 | 当前已清理失真 SQL，但仍未重建覆盖当前 `joy-test` 的完整 migration runner / schema 资产 |
| P1 | 构建警告仍未清理 | Next 多 lockfile warning 与 Admin 大 chunk warning 仍存在 |

## 下一步建议

1. 优先补齐 `invite`、`checkin` 的后端承接或明确下线页面入口，先收掉“前端已接、后端未见”的伪闭环。
2. 如果继续做架构工作，优先收口 `apps/web` 仍然过重的高频页，保持当前不再保留旧路径兼容壳的状态。
3. 再处理 `apps/api` 非 `admin` 域的超大 router/store，优先 `shop / product / warehouse / guess`。
4. 给已成型的高频页补页面级或链路级自动化测试，至少优先覆盖首页、商城、订单、后台审核和通知发送。
5. 由 DBA 先基于 `umi/docs/` 重建一套和当前 `joy-test` 对齐的 schema / migration / seed 资产，再决定是否推进统一 migration runner。
