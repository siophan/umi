# 详细功能模块进度

最后更新：2026-04-21

本文档按当前仓库代码事实整理，分为用户端和管理后台端。

约束：

- 只写代码里能直接确认的内容
- `UI状态` 只描述页面是否存在、是否接 API、是否明显为静态/兼容/占位
- `接口状态` 只描述当前代码里是否存在对应调用和对应后端入口
- `是否测试` 只依据 `tests/` 目录中当前可见的 smoke / integration 脚本，不把“人工可能测过”写进来

## 状态说明

### UI状态

| 状态 | 含义 |
| --- | --- |
| `已落地-已接API` | 页面已存在，且页面代码已直接接入 API client 或直接请求后端 |
| `已落地-部分接API` | 页面存在，部分数据或交互接了 API，但仍混合本地构造数据 |
| `已落地-静态/本地态` | 页面存在，但未见 API client 接入，或主要依赖本地数组/演示数据 |
| `兼容页/包装页` | 页面主要用于兼容旧路径或转发旧页面结构 |

### 接口状态

| 状态 | 含义 |
| --- | --- |
| `已接-读` | 页面使用的读接口在前端和后端中都能直接找到 |
| `已接-写` | 页面主要承接写操作，当前前端调用和后端入口都能直接找到 |
| `已接-读写` | 页面使用的读写接口在前端和后端中都能直接找到 |
| `前端直连-后端存在` | 页面未走 `lib/api`，但直接 `fetch` 的后端路由在 `apps/api` 中存在 |
| `前端直连-后端未见` | 页面直接请求了接口，但当前 `apps/api/src/app.ts` 中未见对应 router |
| `部分依赖未完成` | 页面自身入口存在，但其跳转或依赖的子业务链路尚未全部完成 |
| `未接` | 当前页面未见接口调用 |

### 老系统对齐状态

| 状态 | 含义 |
| --- | --- |
| `需对齐-已对齐` | 能从 `docs/ui-rules.md`、`docs/ui-spec.md`、`docs/handoff.md` 或当前页面实现中直接确认，页面已按老系统结构/交互持续收口 |
| `需对齐-部分对齐` | 已有明确对齐动作，但 `docs/handoff.md` 仍把它列为重点继续收口页面，或当前仍保留明显过渡实现 |
| `需对齐-未核对` | 规则上应参考老系统，但当前仓库里还没有足够文档/代码事实支撑“已对齐”判断 |
| `不适用-新系统新增` | 页面主要服务新系统新增的权限、聚合或配置结构，不以老系统页面为直接对照基准 |
| `不适用-兼容/包装页` | 页面主要承担兼容旧路径、别名跳转或包装作用，不单独计算对齐完成度 |

## 用户端

### 1. 首页、发现、搜索

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 首页 | `/` | Banner、竞猜列表、直播列表、榜单首屏 | `已落地-已接API` | `需对齐-部分对齐` | `GET /api/banners`、`GET /api/guesses`、`GET /api/lives`、`GET /api/rankings` | `已接-读` | `未见首页专项页面测试` | 服务端首屏数据在 [page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx:1) 直接请求，客户端二次请求在 [page-client.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page-client.tsx:1) |
| 商城首页 | `/mall` | 商品流、分类、收藏、购物车入口 | `已落地-已接API` | `需对齐-部分对齐` | `GET /api/products`、`POST /api/products/:id/favorite`、`DELETE /api/products/:id/favorite`、`GET /api/cart` | `已接-读写` | `商品详情有集成测试，商城页本身未见专项页面测试` | 页面核心逻辑主要在 [mall-home.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:1) |
| 排行榜 | `/ranking` | 多榜单切换、服务端首屏榜单 | `已落地-已接API` | `需对齐-部分对齐` | `GET /api/rankings` | `已接-读` | `未见专项测试` | 榜单页服务端直接请求接口，见 [ranking/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx:1) |
| 直播列表 | `/lives` | 直播列表首屏 | `已落地-已接API` | `需对齐-部分对齐` | `GET /api/lives` | `已接-读` | `未见专项测试` | 服务端首屏直连接口，见 [lives/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx:1) |
| 搜索 | `/search` | 全站搜索、热词、联想建议 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/search`、`GET /api/search/hot`、`GET /api/search/suggest` | `已接-读` | `未见专项测试` | 当前已用独立搜索域 API client，见 [search.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/search.ts:1) |
| 功能聚合页 | `/features` | 功能入口聚合 | `已落地-部分接API` | `不适用-新系统新增` | `GET /api/users/me`、`GET /api/notifications` | `已接-读` | `未见专项测试` | 页面本身是功能入口聚合，非完整业务页 |
| 全功能别名页 | `/all-features` | `features` 兼容入口 | `兼容页/包装页` | `不适用-兼容/包装页` | 无独立接口 | `未接` | `未见专项测试` | 兼容路径 |

### 2. 认证、个人资料、账户辅助

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 登录 | `/login` | 验证码登录、密码登录、登录态恢复 | `已落地-已接API` | `需对齐-未核对` | `POST /api/auth/send-code`、`POST /api/auth/login`、`GET /api/users/me` | `已接-读写` | `API 已有 auth smoke/integration` | 对应测试可见 `tests/integration/api-auth-*`、`tests/smoke/api-auth.smoke.ts` |
| 注册 | `/register` | 验证码注册、注册后登录 | `已落地-已接API` | `需对齐-未核对` | `POST /api/auth/send-code`、`POST /api/auth/register`、`GET /api/users/me` | `已接-读写` | `API 已有 auth integration` | 同上 |
| 重置密码 | `/reset-password` | 验证码重置密码 | `已落地-已接API` | `需对齐-未核对` | `POST /api/auth/send-code`、`POST /api/auth/reset-password` | `已接-读写` | `API 已有 auth integration` | 页面已接 [auth.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/auth.ts:1) |
| 个人中心 | `/me` | 当前用户资料、摘要、退出登录 | `已落地-已接API` | `需对齐-部分对齐` | `GET /api/users/me`、`POST /api/auth/logout`、`GET /api/users/me/activity`、`GET /api/users/me/summary` | `已接-读写` | `用户资料与 auth/activity 有 integration` | 页面聚合多个 API client |
| 编辑资料 | `/edit-profile` | 修改昵称、头像、签名等 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/users/me`、`PUT /api/users/me` | `已接-读写` | `API 已有 auth lifecycle / validation integration` | 实际通过 `auth.ts` 暴露 `updateMe()` |
| 收货地址 | `/address` | 地址列表、新增、编辑、删除 | `已落地-已接API` | `需对齐-未核对` | `GET /api/addresses`、`POST /api/addresses`、`PUT /api/addresses/:id`、`DELETE /api/addresses/:id` | `前端直连-后端存在` | `未见地址专项测试` | 页面未走 `lib/api/address.ts`，而是自己 `fetch`，见 [address/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:1) |
| 优惠券 | `/coupons` | 我的优惠券列表 | `已落地-已接API` | `需对齐-未核对` | `GET /api/coupons` | `已接-读` | `未见优惠券专项测试` | 仅列表读取 |
| 条款 | `/terms` | 静态条款页 | `已落地-静态/本地态` | `需对齐-未核对` | 无 | `未接` | `未见专项测试` | 静态文案页 |
| 隐私 | `/privacy` | 静态隐私页 | `已落地-静态/本地态` | `需对齐-未核对` | 无 | `未接` | `未见专项测试` | 静态文案页 |

### 3. 社交、通知、聊天、用户主页

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 好友页 | `/friends` | 好友、关注、粉丝、申请列表；接受/拒绝申请；关注/取关 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/social`、`POST /api/social/requests/:id/accept`、`POST /api/social/requests/:id/reject`、`GET /api/guesses/user/history`、`GET /api/guesses`、`POST /api/users/:id/follow`、`DELETE /api/users/:id/follow` | `已接-读写` | `社交与 activity 有 integration` | 页面功能点较多，但未见独立前端页面测试 |
| 通知 | `/notifications` | 通知列表、单条已读、全部已读 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/notifications`、`POST /api/notifications/:id/read`、`POST /api/notifications/read-all` | `已接-读写` | `通知/聊天有 integration` | 对应测试：`api-auth-notification-chat.db.ts` |
| 会话列表 | `/chat` | 会话列表读取 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/chats` | `已接-读` | `通知/聊天有 integration` |  |
| 聊天详情 | `/chat/[id]` | 消息列表、发送消息 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/chats/:userId`、`POST /api/chats/:userId` | `已接-读写` | `通知/聊天有 integration` |  |
| 用户主页 | `/user/[uid]` | 公开资料、动态、竞猜、关注/取关、私信 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/users/:id`、`GET /api/users/:id/activity`、`POST /api/users/:id/follow`、`DELETE /api/users/:id/follow`、`GET /api/chats/:userId`、`POST /api/chats/:userId` | `已接-读写` | `用户 activity / 聊天部分有 integration` | 路由参数是 `uid`，但 API 仍走用户资料接口 |
| 用户主页兼容页 | `/user-profile` | `user/[uid]` 兼容入口 | `兼容页/包装页` | `不适用-兼容/包装页` | 无独立接口 | `未接` | `未见专项测试` | 兼容路径 |

### 4. 社区内容

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 社区主页 | `/community` | 推荐/关注 feed、发布、点赞、收藏、转发、评论 | `已落地-已接API` | `需对齐-部分对齐` | `GET /api/community/feed`、`GET /api/community/discovery`、`POST /api/community/posts`、`POST /api/community/posts/:id/repost`、`POST /api/community/posts/:id/like`、`DELETE /api/community/posts/:id/like`、`POST /api/community/posts/:id/bookmark`、`DELETE /api/community/posts/:id/bookmark`、`POST /api/community/posts/:id/comments` | `已接-读写` | `社区未见专项 integration 测试` | 页面接入广，但当前 `tests/` 里未见 community 专项脚本 |
| 社区搜索 | `/community-search` | 搜社区内容、搜用户、关注/取关推荐用户 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/community/search`、`GET /api/community/discovery`、`GET /api/users/search`、`POST /api/users/:id/follow`、`DELETE /api/users/:id/follow` | `已接-读写` | `未见专项测试` |  |
| 动态详情 | `/post/[id]` | 动态详情、评论、点赞、收藏、转发、举报 | `已落地-已接API` | `需对齐-未核对` | `GET /api/community/posts/:id`、`POST /api/community/posts/:id/comments`、`POST /api/community/comments/:id/like`、`DELETE /api/community/comments/:id/like`、`POST /api/community/posts/:id/like`、`DELETE /api/community/posts/:id/like`、`POST /api/community/posts/:id/bookmark`、`DELETE /api/community/posts/:id/bookmark`、`POST /api/community/posts/:id/report` | `已接-读写` | `未见专项测试` | 举报接口已在前后端与 OpenAPI 中存在，但当前未见专项自动化测试 |
| 动态详情兼容页 | `/post-detail` | `post/[id]` 兼容入口 | `兼容页/包装页` | `不适用-兼容/包装页` | 无独立接口 | `未接` | `未见专项测试` | 兼容路径 |

### 5. 竞猜、直播

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 竞猜详情 | `/guess/[id]` | 竞猜详情主体、选项、统计展示 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/guesses/:id` | `已接-读` | `竞猜列表/详情/stats/history 有 integration` | 页面未见下注写接口接入 |
| 竞猜历史 | `/guess-history` | 当前用户竞猜历史 | `已落地-已接API` | `需对齐-未核对` | `GET /api/guesses/user/history` | `已接-读` | `有 integration` |  |
| 猜单页 | `/guess-order` | 竞猜订单展示页 | `已落地-静态/本地态` | `需对齐-已对齐` | 无直接 API import | `未接` | `未见专项测试` | 页面未见 API client 接入 |
| 直播详情 | `/live/[id]` | 直播详情读取 | `已落地-部分接API` | `需对齐-部分对齐` | `GET /api/lives/:id` | `前端直连-后端存在` | `未见专项测试` | 页面未走 `lib/api/lives.ts`，而是自己 `fetch` |
| 直播兼容页 | `/live` | `live/[id]` 兼容入口 | `兼容页/包装页` | `不适用-兼容/包装页` | 无独立接口 | `未接` | `未见专项测试` | 兼容路径 |
| 新手竞猜 | `/novice-guess` | 新手竞猜引导/结果页 | `已落地-静态/本地态` | `需对齐-部分对齐` | 无直接 API import | `未接` | `未见专项测试` | 当前未见接口接入 |
| 创建竞猜 | `/create` | 模板选择、选项填写、预览、发布流程 UI | `已落地-静态/本地态` | `需对齐-已对齐` | 无 | `未接` | `未见专项测试` | 页面以本地模板、好友、商品数据驱动，未见发布接口 |
| 创建好友竞猜 | `/create-user` | 话题模板、邀请好友、预览、发布弹层 | `已落地-静态/本地态` | `需对齐-已对齐` | 无 | `未接` | `未见专项测试` | 当前完全本地态 |

### 6. 商品、购物车、订单、仓库

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 商品详情 | `/product/[id]` | 商品主数据、收藏、加入购物车、立即购买 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/products/:id`、`POST /api/products/:id/favorite`、`DELETE /api/products/:id/favorite`、`POST /api/cart/items` | `已接-读写` | `商品详情有 integration` | 对应测试：`api-product-detail.db.ts`、`api-product-guest-404.db.ts` |
| 商品详情兼容页 | `/product-detail` | 兼容入口 | `兼容页/包装页` | `不适用-兼容/包装页` | 无独立接口 | `未接` | `未见专项测试` | 兼容路径 |
| 店铺详情 | `/shop/[id]` | 店铺详情、店铺商品、关联竞猜 | `已落地-已接API` | `需对齐-部分对齐` | `GET /api/shops/:id` | `已接-读` | `公开店铺有 integration` | 对应测试：`api-shop-public.db.ts` |
| 店铺详情兼容页 | `/shop-detail` | 兼容入口 | `兼容页/包装页` | `不适用-兼容/包装页` | 无独立接口 | `未接` | `未见专项测试` | 兼容路径 |
| 购物车 | `/cart` | 列表、勾选、数量修改、删除、批量删除 | `已落地-已接API` | `需对齐-部分对齐` | `GET /api/cart`、`PUT /api/cart/items/:id`、`DELETE /api/cart/items/:id`、`GET /api/products` | `已接-读写` | `未见购物车专项测试` | 依赖商品列表补推荐流 |
| 支付页 | `/payment` | 地址、优惠券、购物车项或商品购买、下单 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/addresses`、`GET /api/cart`、`GET /api/coupons`、`POST /api/orders`、`GET /api/products/:id` | `已接-读写` | `订单列表/详情有 integration；下单未见专项测试` |  |
| 订单列表 | `/orders` | 当前用户订单列表、催发货、确认收货 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/orders`、`POST /api/orders/:id/confirm`、`POST /api/orders/:id/urge` | `已接-读写` | `订单列表有 integration` | 对应测试：`api-order-list.db.ts` |
| 订单详情 | `/order-detail` | 订单详情、确认收货 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/orders/:id`、`POST /api/orders/:id/confirm` | `已接-读写` | `订单详情有 integration` | 对应测试：`api-order-detail.db.ts` |
| 订单兼容页 | `/my-orders` | `orders` 兼容入口 | `兼容页/包装页` | `不适用-兼容/包装页` | 无独立接口 | `未接` | `未见专项测试` | 兼容路径 |
| 评价页 | `/review` | 提交订单商品评价 | `已落地-已接API` | `需对齐-未核对` | `POST /api/orders/:id/review` | `已接-写` | `未见评价专项测试` | 页面只承接提交评价 |
| 仓库 | `/warehouse` | 虚拟仓、实体仓、寄售、取消寄售 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/warehouse/virtual`、`GET /api/warehouse/physical`、`POST /api/warehouse/physical/:id/consign`、`POST /api/warehouse/physical/:id/cancel-consign` | `已接-读写` | `仓库与后台仓库有 integration` | 对应测试：`api-warehouse.db.ts`、`api-warehouse-admin.db.ts` |

### 7. 店铺经营、邀请、签到及其他

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 我的店铺 | `/my-shop` | 开店状态、开店申请、我的店铺信息 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/shops/me`、`GET /api/shops/me/status`、`POST /api/shops/apply` | `已接-读写` | `店铺链路有 integration` | 对应测试：`api-shop.db.ts`、`api-shop-empty.db.ts`、`api-shop-guards.db.ts` |
| 我的店铺兼容页 | `/myshop` | `my-shop` 兼容入口 | `兼容页/包装页` | `不适用-兼容/包装页` | 无独立接口 | `未接` | `未见专项测试` | 兼容路径 |
| 品牌授权 | `/brand-auth` | 授权概览、提交品牌授权申请 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/shops/brand-auth`、`POST /api/shops/brand-auth` | `已接-读写` | `店铺链路有 integration` |  |
| 上架商品 | `/add-product` | 品牌商品池、批量上架到店铺 | `已落地-已接API` | `需对齐-已对齐` | `GET /api/shops/brand-auth`、`GET /api/shops/brand-products`、`POST /api/shops/products` | `已接-读写` | `店铺链路有 integration` |  |
| 邀请页 | `/invite` | 邀请码、邀请链接、邀请记录 | `已落地-部分接API` | `需对齐-已对齐` | `GET /api/invite/my`、`POST /api/invite/generate`、`GET /api/invite/records` | `前端直连-后端未见` | `未见专项测试` | 当前页面直接 `fetch`，但 `apps/api/src/app.ts` 中未见 `invite` router |
| 签到页 | `/checkin` | 签到状态、执行签到 | `已落地-部分接API` | `需对齐-未核对` | `GET /api/checkin/status`、`POST /api/checkin` | `前端直连-后端未见` | `未见专项测试` | 当前页面直接 `fetch`，但 `apps/api/src/app.ts` 中未见 `checkin` router |
| 邀请/签到入口聚合 | `/features` | 邀请、签到入口跳转 | `已落地-部分接API` | `不适用-新系统新增` | 见对应业务页 | `部分依赖未完成` | `未见专项测试` | 入口存在不代表后端链路完整 |
| 调试页 | `/test-api` | 手工调试 auth / guess 等接口 | `已落地-已接API` | `需对齐-已对齐` | `POST /api/auth/send-code`、`POST /api/auth/login`、`GET /api/users/me`、`GET /api/guesses` | `已接-读写` | `无正式测试意义` | 主要用于手工调试，不算正式业务页 |
| AI Demo | `/ai-demo` | 视觉展示页 | `已落地-静态/本地态` | `不适用-新系统新增` | 无 | `未接` | `未见专项测试` | Demo 页面 |
| Splash | `/splash` | 启动画面 | `已落地-静态/本地态` | `需对齐-未核对` | 无 | `未接` | `未见专项测试` | 静态页 |

## 管理后台端

### 1. 登录、壳层、权限

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 后台登录壳层 | `# /dashboard` 前置登录 | 登录、读取当前管理员、退出、修改密码 | `已落地-已接API` | `需对齐-未核对` | `POST /api/admin/auth/login`、`GET /api/admin/auth/me`、`POST /api/admin/auth/logout`、`POST /api/admin/auth/change-password` | `已接-读写` | `admin auth/guards 有 integration；admin smoke 已有` | 对应测试：`api-admin-auth.db.ts`、`api-admin-guards.db.ts`、`api-admin.smoke.ts` |
| 菜单与权限过滤 | 全局壳层 | 路径权限过滤、首个可访问页回退 | `已落地-已接API` | `不适用-新系统新增` | 依赖 `fetchMe()` 返回的权限数据 | `已接-读` | `无前端专项测试` | 权限定义集中在 [packages/shared/src/admin-permissions.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/admin-permissions.ts:1) |

### 2. 仪表盘与系统配置

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 仪表盘 | `#/dashboard` | 统计卡片、趋势、热榜、待处理队列 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/dashboard/stats` | `已接-读` | `admin auth/smoke 覆盖部分；未见 dashboard 专项 integration` | 后端实现已直连 MySQL，见 [dashboard.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/dashboard.ts:1) |
| 系统用户 | `#/system/users` | 列表、新增、编辑、重置密码、启停 | `已落地-已接API` | `不适用-新系统新增` | `GET /api/admin/system-users`、`POST /api/admin/system-users`、`PUT /api/admin/system-users/:id`、`POST /api/admin/system-users/:id/reset-password`、`PUT /api/admin/system-users/:id/status` | `已接-读写` | `未见系统用户专项测试` | 页面已接 API，但当前未见专项自动化测试 |
| 角色管理 | `#/system/roles` | 角色列表、创建、编辑、改状态、分配权限 | `已落地-已接API` | `不适用-新系统新增` | `GET /api/admin/roles`、`POST /api/admin/roles`、`PUT /api/admin/roles/:id`、`PUT /api/admin/roles/:id/status`、`PUT /api/admin/roles/:id/permissions` | `已接-读写` | `未见角色专项测试` | 当前 workspace `typecheck` 已通过；当前页已支持非系统角色编辑 |
| 权限管理 | `#/users/permissions` | 权限列表、权限矩阵、新增、编辑、改状态 | `已落地-已接API` | `不适用-新系统新增` | `GET /api/admin/permissions`、`GET /api/admin/permissions/matrix`、`POST /api/admin/permissions`、`PUT /api/admin/permissions/:id`、`PUT /api/admin/permissions/:id/status` | `已接-读写` | `未见权限专项测试` |  |
| 分类管理 | `#/system/categories` | 分类列表、新增、编辑、改状态 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/categories`、`POST /api/admin/categories`、`PUT /api/admin/categories/:id`、`PUT /api/admin/categories/:id/status` | `已接-读写` | `未见分类专项测试` |  |
| 系统通知 | `#/system/notifications` | 通知列表、发送通知 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/notifications`、`POST /api/admin/notifications` | `已接-读写` | `未见专项测试` | 当前页已支持按人群发送通知并直接回写 `notification` 真表 |
| 系统聊天 | `#/system/chats` | 风险会话列表 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/chats` | `已接-读` | `未见专项测试` |  |
| 系统排行榜 | `#/system/rankings` | 榜单结果列表、按榜单/周期筛选、查看当期明细 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/rankings`、`GET /api/admin/rankings/:boardType/:periodType/:periodValue` | `已接-读` | `未见专项测试` | 当前已按 `leaderboard_entry` 真实结果表接入后台查看页，不再使用静态数组 |

### 3. 用户与商家、品牌、授权

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户列表 | `#/users/list` | 用户列表、详情、竞猜、订单、封禁 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/users`、`GET /api/admin/users/:id`、`GET /api/admin/users/:id/guesses`、`GET /api/admin/users/:id/orders`、`PUT /api/admin/users/:id/ban` | `已接-读写` | `admin smoke / auth 有部分覆盖；未见用户列表专项 integration` |  |
| 店铺列表 | `#/shops/list` | 店铺列表、分类过滤、店主搜索、启用/暂停/关闭 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/shops`、`GET /api/admin/categories`、`PUT /api/admin/shops/:id/status` | `已接-读写` | `未见专项测试` | 当前页面已支持启用/暂停/关闭店铺；关闭后会自动下架该店铺在售商品，但重新启用不会自动恢复商品上架 |
| 开店审核 | `#/shops/apply` | 开店申请列表、状态筛选、通过/拒绝 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/shops/applies`、`GET /api/admin/categories`、`PUT /api/admin/shops/applies/:id/review` | `已接-读写` | `未见专项测试` | 当前页面已支持通过/拒绝审核 |
| 品牌管理 | `#/brands/list` | 品牌列表、分类过滤、新增/编辑品牌 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/brands`、`GET /api/admin/categories`、`POST /api/admin/brands`、`PUT /api/admin/brands/:id` | `已接-读写` | `未见专项测试` | 当前后台已改成直接在品牌管理页新增/编辑品牌，不再保留品牌入驻审核流程 |
| 品牌授权 | `#/shops/brand-auth` | 授权审核、授权记录、撤销授权 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/brands/auth-applies`、`PUT /api/admin/brands/auth-applies/:id/review`、`GET /api/admin/brands/auth-records`、`PUT /api/admin/brands/auth-records/:id/revoke` | `已接-读写` | `未见专项测试` | 当前页面已支持审核申请、查看生效授权、撤销生效授权；撤销后会自动下架该店铺当前品牌在售商品 |
| 店铺商品 | `#/shops/products` | 店铺商品列表 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/shops/products` | `已接-读` | `未见专项测试` |  |

### 4. 商品、竞猜、订单、仓库

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 商品列表 | `#/products/list` | 商品列表、状态筛选、分类筛选 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/products`、`GET /api/admin/categories` | `已接-读` | `未见专项测试` |  |
| 品牌商品 | `#/products/brands` | 品牌商品列表 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/products/brand-library`、`GET /api/admin/categories` | `已接-读` | `未见专项测试` |  |
| 竞猜列表 | `#/guesses/list` | 竞猜列表、状态筛选、分类筛选、通过/拒绝审核 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/guesses`、`GET /api/admin/categories`、`PUT /api/admin/guesses/:id/review` | `已接-读写` | `未见专项测试` | 当前列表已支持直接审核待审核竞猜，拒绝时需填写原因 |
| 创建竞猜 | `#/guesses/create` | 分类、商品、好友竞猜候选读取 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/categories`、`GET /api/admin/products`、`GET /api/admin/guesses/friends` | `已接-读` | `未见专项测试` | 当前未见创建竞猜写接口 |
| 好友竞猜 | `#/guesses/friends` | 好友竞猜列表、状态筛选、邀请统计、结果确认统计、详情查看 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/guesses/friends` | `已接-读` | `未见专项测试` | 当前已补房间/发起人/奖励搜索与详情统计，但未接写操作 |
| PK 对战 | `#/pk` | PK 列表、状态筛选、发起人/对手搜索、详情查看 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/pk` | `已接-读` | `未见专项测试` | 当前已补对战双方、选择、结算时间与奖励信息展示，未接写操作 |
| 订单列表 | `#/orders/list` | 订单列表、状态筛选、订单号/买家/商品搜索、详情查看 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/orders` | `已接-读` | `有 admin 订单 overview / smoke，但非页面专项测试` | 当前已补订单号、买家、商品、物流单号与详情信息展示；后端已直连 MySQL，见 [admin/orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:1) |
| 交易流水 | `#/orders/transactions` | 交易流水列表、方向筛选、流水号/订单号/用户搜索、详情查看 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/orders/transactions` | `已接-读` | `未见专项测试` | 当前已补流水号、订单号、用户、渠道搜索与详情信息展示 |
| 物流管理 | `#/orders/logistics` | 履约物流列表 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/orders/logistics` | `已接-读` | `未见专项测试` |  |
| 虚拟仓/实体仓 | `#/warehouse/virtual`、`#/warehouse/physical` | 仓库列表、状态筛选、商品/用户/来源搜索、详情查看 | `已落地-已接API` | `需对齐-未核对` | `GET /api/warehouse/admin/virtual`、`GET /api/warehouse/admin/physical` | `已接-读` | `后台仓库有 integration` | 当前虚拟仓已补状态 Tabs、单价/总价值与来源展示；实体仓已聚焦在库/配送中/已送达，不再混寄售状态。对应测试：`api-warehouse-admin.db.ts` |
| 寄售市场 | `#/warehouse/consign` | 寄售成交列表、状态筛选、交易单号/商品/卖家/订单号搜索、详情查看 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/orders/consign` | `已接-读` | `未见专项测试` | 当前已补交易单号、卖家/买家、卖家到账、结算状态和成交时间展示 |

### 5. 营销、内容、风控

| 功能页面 | 路由 | 具体功能点 | UI状态 | 老系统对齐状态 | 接口列表 | 接口状态 | 是否测试 | 问题备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 权益金管理 | `#/equity` | 权益金账户列表、详情、调账、日志查看 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/equity`、`GET /api/admin/equity/:id`、`POST /api/admin/equity/adjust` | `已接-读写` | `未见专项测试` | 当前已直连 `equity_account / equity_log`，支持后台调账 |
| 营销-轮播管理 | `#/marketing/banners` | 轮播列表、详情、新增、编辑、启停、删除 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/banners`、`POST /api/admin/banners`、`PUT /api/admin/banners/:id`、`PUT /api/admin/banners/:id/status`、`DELETE /api/admin/banners/:id` | `已接-读写` | `未见专项测试` | 当前已直连 `banner` 真表，状态按启停 + 时间窗派生显示 |
| 营销-签到管理 | `#/marketing/checkin` | 签到奖励配置列表、新增、编辑、启停 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/checkin/rewards`、`POST /api/admin/checkin/rewards`、`PUT /api/admin/checkin/rewards/:id`、`PUT /api/admin/checkin/rewards/:id/status` | `已接-读写` | `未见专项测试` | 当前已直连 `checkin_reward_config` 真表，支持按签到天数、奖励类型、奖励标题筛选，并维护奖励配置 |
| 营销-优惠券管理 | `#/marketing/coupons` | 优惠券模板列表、详情、新增、编辑、发券、启停 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/coupons`、`GET /api/admin/coupons/:id/batches`、`POST /api/admin/coupons`、`PUT /api/admin/coupons/:id`、`PUT /api/admin/coupons/:id/status`、`POST /api/admin/coupons/:id/grants` | `已接-读写` | `未见专项测试` | 当前已直连 `coupon_template / coupon_grant_batch / coupon` 真表，模板与发券批次已闭环 |
| 营销-邀请管理 | `#/marketing/invite` | 邀请奖励配置、邀请记录列表、配置编辑 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/invites/config`、`PUT /api/admin/invites/config`、`GET /api/admin/invites/records` | `已接-读写` | `未见专项测试` | 当前已直连 `invite_reward_config` 和 `user.invited_by` 关系，支持维护邀请奖励配置并查看邀请记录 |
| 社区评论管理 | `#/community/comments` | 评论管理表、查看、删除 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/community/comments`、`DELETE /api/admin/community/comments/:id` | `已接-读写` | `未见专项测试` | 当前已接真实评论治理链路 |
| 社区动态管理 | `#/community/posts` | 动态管理表、查看、删除 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/community/posts`、`DELETE /api/admin/community/posts/:id` | `已接-读写` | `未见专项测试` | 当前已接真实动态治理链路 |
| 举报管理 | `#/community/reports` | 举报记录管理、处理中/采纳/驳回/封禁 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/community/reports`、`PUT /api/admin/community/reports/:id` | `已接-读写` | `未见专项测试` | 当前已直连 `report_item` 真表和处理动作 |
| 直播管理 | `#/live/list` | 直播列表管理、详情查看 | `已落地-已接API` | `需对齐-未核对` | `GET /api/admin/lives` | `已接-读` | `未见专项测试` | 当前已按真实 `live` 主表接入后台列表 |
| 弹幕管理 | `#/live/danmaku` | 弹幕管理边界页 | `已落地-静态/本地态` | `需对齐-未核对` | 无 | `未接` | `未见专项测试` | 当前系统未承接直播弹幕持久化表，页面明确展示为待真实链路补齐 |

## 测试现状汇总

### 已能从 `tests/` 目录直接确认的自动化测试覆盖

- 用户认证：
  - `tests/integration/api-auth-lifecycle.db.ts`
  - `tests/integration/api-auth-code-login.db.ts`
  - `tests/integration/api-auth-code-errors.db.ts`
  - `tests/integration/api-auth-validation.db.ts`
  - `tests/smoke/api-auth.smoke.ts`
- 通知 / 聊天：
  - `tests/integration/api-auth-notification-chat.db.ts`
- 社交 / 活动聚合：
  - `tests/integration/api-auth-social-activity.db.ts`
- 商品详情：
  - `tests/integration/api-product-detail.db.ts`
  - `tests/integration/api-product-guest-404.db.ts`
- 竞猜：
  - `tests/integration/api-guess.db.ts`
  - `tests/integration/api-guess-404.db.ts`
  - `tests/integration/api-guess-user-history.db.ts`
- 订单：
  - `tests/integration/api-order-list.db.ts`
  - `tests/integration/api-order-detail.db.ts`
  - `tests/integration/api-order-admin-overview.db.ts`
  - `tests/smoke/api-order.smoke.ts`
- 店铺：
  - `tests/integration/api-shop.db.ts`
  - `tests/integration/api-shop-empty.db.ts`
  - `tests/integration/api-shop-guards.db.ts`
  - `tests/integration/api-shop-public.db.ts`
- 钱包：
  - `tests/integration/api-wallet-ledger.db.ts`
- 仓库：
  - `tests/integration/api-warehouse.db.ts`
  - `tests/integration/api-warehouse-admin.db.ts`
- 后台认证与守卫：
  - `tests/integration/api-admin-auth.db.ts`
  - `tests/integration/api-admin-guards.db.ts`
  - `tests/smoke/api-admin.smoke.ts`

### 当前仍未从仓库中直接确认到专项自动化测试的部分

- 大多数 `apps/web` 页面级渲染测试
- 大多数 `apps/admin` 页面级渲染测试
- 搜索、Banner、排行榜、直播列表的专项接口测试
- Admin 角色 / 权限 / 分类 / 营销页专项测试
- `invite`、`checkin` 前后端闭环测试

## 当前重点问题

1. 用户端 `checkin`、`invite` 页面已直接请求接口，但当前 `apps/api/src/app.ts` 中未见对应 router 注册，链路状态不应判定为“已承接后端”。
2. 管理后台营销和内容治理主列表页已大面积接入真实接口，但弹幕管理仍缺真实持久化链路，页面级专项测试也仍不足。
3. 当前 workspace `typecheck` 已通过；本轮已收掉 `apps/admin` 角色页和 `apps/api` 订单路由的类型错误。
