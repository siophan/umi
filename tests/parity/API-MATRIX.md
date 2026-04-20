# API Parity Matrix

最后更新：2026-04-20

这份文档用来把“页面 -> 接口 -> 数据正确性”串起来，避免只看 UI 不看数据，或者只看 API 不看页面消费。

## Status

| 状态 | 含义 |
| --- | --- |
| `covered` | 已有自动化测试覆盖关键主链路 |
| `partial` | 已覆盖部分主链路，但缺页面消费或异常分支 |
| `missing` | 当前未见专项自动化或接口未接 |
| `blocked` | 页面在请求，但后端当前未见对应 router |

## User API Matrix

| 业务域 | 页面 | 核心接口 | 数据风险 | 当前自动化 | 当前状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| Home | `/` | `/api/banners` `/api/guesses` `/api/lives` `/api/rankings` | 首屏装配、区块降级、空态与异常态混淆 | 无页面专项自动化 | `partial` | 页面层已发现 `BUG-20260420-007`，首页把分区失败吞成正常空区块 |
| Search | `/search` | `/api/search` `/api/search/hot` `/api/search/suggest` | 结果映射、热词、联想、评分展示 | 无页面专项自动化 | `partial` | 页面层已发现 `BUG-20260420-014`，搜索结果会伪造评分 |
| Auth | `/login` `/register` `/reset-password` `/me` `/edit-profile` | `/api/auth/send-code` `/api/auth/login` `/api/auth/register` `/api/auth/logout` `/api/auth/me` | 登录态、重复注册、资料字段、幂等、编辑页能力边界 | `api-auth-lifecycle.db.ts` `api-auth-code-login.db.ts` `api-auth-code-errors.db.ts` `api-auth-validation.db.ts` | `partial` | 页面层已发现 `BUG-20260420-001` `BUG-20260420-036` `BUG-20260420-037`，分别涉及登录页失败分支伪装成功、编辑页暴露未承接的封面配置，以及重置密码页把未验证验证码伪装成已通过 |
| Address | `/address` | `/api/addresses` `/api/addresses/:id` | 列表读取、默认地址切换、编辑删除错误态 | 无页面专项自动化 | `partial` | 页面层已发现 `BUG-20260420-025`，地址读取失败会被伪装成空地址列表 |
| Coupon | `/coupons` | `/api/coupons` | 列表读取、状态分栏、空态与异常态混淆 | 无页面专项自动化 | `partial` | 页面层已发现 `BUG-20260420-026`，优惠券读取失败会被伪装成空券列表 |
| Notifications / Chat | `/notifications` `/chat` `/chat/[id]` `/chat-detail` | `/api/auth/notifications` `/api/auth/notifications/read-all` `/api/auth/chats` `/api/auth/chats/:userId` | 会话已读、未读数、消息顺序、兼容路由透传 | `api-auth-notification-chat.db.ts` | `partial` | 页面层已发现 `BUG-20260420-017` `BUG-20260420-018` `BUG-20260420-019` `BUG-20260420-020` `BUG-20260420-035`，涉及吞失败、假成功已读，以及兼容入口把用户硬编码到固定会话 |
| Social / Activity | `/friends` `/user/[uid]` `/me` | `/api/auth/social` `/api/auth/me/activity` `/api/users/:id` `/api/users/:id/activity` | 四象限聚合、关注关系、动态聚合 | `api-auth-social-activity.db.ts` | `partial` | 页面层已发现 `BUG-20260420-006` `BUG-20260420-015` `BUG-20260420-016`，涉及 `/me` 错路由、`/user/[uid]` 假主页回退、`/friends` 吞失败 |
| Community | `/community` `/community-search` `/post/[id]` | `/api/community/feed` `/api/community/discovery` `/api/community/search` `/api/community/posts` `/api/community/posts/:id` | feed 排序、互动计数、评论和举报、发帖 payload 与 UI 是否一致 | 无 | `partial` | 页面层已发现 `BUG-20260420-024` 和 `BUG-20260420-029`，分别涉及搜索吞失败，以及发帖面板展示超出真实 payload 的本地配置 |
| Guess | `/guess/[id]` `/guess-history` `/friends` | `/api/guesses` `/api/guesses/:id` `/api/guesses/:id/stats` `/api/guesses/user/history` `/api/guesses/my-bets` | 选项聚合、票数统计、状态映射、历史页异常态 | `api-guess.db.ts` `api-guess-404.db.ts` `api-guess-user-history.db.ts` | `partial` | 页面层已发现 `BUG-20260420-002` 和 `BUG-20260420-034`，分别涉及详情页硬编码统计/伪交互，以及历史页吞失败后伪装成空记录 |
| Ranking | `/ranking` | `/api/rankings` | 榜单装配、分榜错误态 | 无页面专项自动化 | `partial` | 页面层已发现 `BUG-20260420-021`，榜单失败会被伪装成空榜 |
| Live | `/lives` `/live/[id]` | `/api/lives` `/api/lives/:id` | 列表装配、详情互动、真实直播写链 | 无页面专项自动化 | `partial` | 页面层已发现 `BUG-20260420-022` 和 `BUG-20260420-023`，列表吞失败，详情存在假互动 |
| Product | `/mall` `/product/[id]` | `/api/products` `/api/products/:id` `/api/products/:id/favorite` | 商品主数据、推荐、收藏、仓库嵌套数据 | `api-product-detail.db.ts` `api-product-guest-404.db.ts` | `partial` | 页面层已发现 `BUG-20260420-003`、`BUG-20260420-009` 和 `BUG-20260420-062`，详情页自造价格/标签，商城首页吞首屏商品流失败，分类分支还会把分类请求失败伪装成空类目 |
| Cart | `/cart` | `/api/cart` `/api/cart/items/:id` | 勾选、数量、删除、价格汇总 | 无 | `partial` | 页面层已发现 `BUG-20260420-010`，购物车页吞请求失败；仍缺专项自动化 |
| Order | `/orders` `/order-detail` `/payment` `/review` | `/api/orders` `/api/orders/:id` `/api/orders` `POST /api/orders/:id/review` | 状态映射、金额换算、详情隔离、下单正确性、评价入口路由一致性 | `api-order-list.db.ts` `api-order-detail.db.ts` | `partial` | 页面层已发现 `BUG-20260420-004` `BUG-20260420-011` `BUG-20260420-031` `BUG-20260420-065`，分别涉及列表页吞失败、支付页把地址/优惠券失败伪装成无数据、订单详情页评价入口跳错路由，以及支付页发票控件不进入真实下单链路 |
| Warehouse | `/warehouse` | `/api/warehouse/virtual` `/api/warehouse/physical` | 来源文案、状态映射、寄售字段 | `api-warehouse.db.ts` | `partial` | 页面层已发现 `BUG-20260420-005`，仓库页把请求失败伪装成空态 |
| Wallet | 个人资产相关页面 | `/api/wallet/ledger` | 编码映射、余额取值 | `api-wallet-ledger.db.ts` | `covered` | 当前缺专门的钱包页面对齐卡 |
| Shop | `/my-shop` `/brand-auth` `/add-product` `/shop/[id]` | `/api/shops/me` `/api/shops/brand-auth` `/api/shops/brand-products` `/api/shops/products` `/api/shops/:id` | 授权状态、商品池、公开店铺聚合、详情页错误态 | `api-shop.db.ts` `api-shop-empty.db.ts` `api-shop-guards.db.ts` `api-shop-public.db.ts` | `partial` | 页面层已发现 `BUG-20260420-008` `BUG-20260420-012` `BUG-20260420-013` `BUG-20260420-032` `BUG-20260420-063` `BUG-20260420-064`，分别涉及状态读取失败伪装、授权概览吞失败、上架页假配置 UI、店铺详情失败回退成合成页面、品牌授权成功态混入本地写死经营数据，以及我的店铺成功态暴露未承接经营操作 |
| Invite | `/invite` | `/api/invite/my` `/api/invite/generate` `/api/invite/records` | 邀请码、邀请记录、未承接链路被伪装成正常页面 | 无 | `blocked` | 页面层已发现 `BUG-20260420-027`，当前前端直连但后端未见 router，页面却用静态奖励和“请先登录”回退掩盖问题 |
| Checkin | `/checkin` | `/api/checkin/status` `/api/checkin` | 签到状态、执行签到、未承接链路被伪装成真实进度 | 无 | `blocked` | 页面层已发现 `BUG-20260420-028`，当前前端直连但后端未见 router，页面却展示固定签到进度和任务 |

## Admin API Matrix

| 业务域 | 页面 | 核心接口 | 数据风险 | 当前自动化 | 当前状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| Admin Auth | 登录壳层 | `/api/admin/auth/login` `/api/admin/auth/me` `/api/admin/auth/logout` `/api/admin/auth/change-password` | 权限装配、token 失效、改密 | `api-admin-auth.db.ts` `api-admin-guards.db.ts` | `covered` | 页面层还没专项 smoke |
| Dashboard | `#/dashboard` | `/api/admin/dashboard/stats` | 统计口径、汇总 SQL | `api-admin.smoke.ts` | `partial` | 还没 dashboard 专项 integration |
| Users | `#/users/list` | `/api/admin/users` `/api/admin/users/:id` `/api/admin/users/:id/orders` `/api/admin/users/:id/guesses` | 子表聚合、封禁、筛选 | 无专项 | `missing` | 静态审查已发现 `BUG-20260420-039` `BUG-20260420-040` `BUG-20260420-043`：页面暴露的手机号/店铺名称筛选未进入后端查询，“店主”统计口径与实际过滤不一致，且详情抽屉会把子表失败伪装成 0 条记录和空态 |
| Shops | `#/shops/list` | `/api/admin/shops` `/api/admin/shops/{id}/status` | 详情承接、类目筛选、状态操作 | 无专项 | `missing` | 静态审查已发现 `BUG-20260420-044` `BUG-20260420-045`：当前只有列表摘要和状态更新，没有真实店铺详情链路，且主营类目筛选会漏掉停用类目下的现存店铺 |
| System Users | `#/system/users` | `/api/admin/system-users` `/api/admin/system-users/{id}` `/api/admin/system-users/{id}/status` `/api/admin/system-users/{id}/reset-password` | 账号状态、角色绑定、危险动作 | 无专项 | `missing` | 静态审查已发现 `BUG-20260420-046` `BUG-20260420-047` `BUG-20260420-057`：页面仍暴露“停用当前登录账号”的必然失败动作，角色筛选只覆盖启用角色，且 `/api/admin/roles` 一旦失败会把整张系统用户表一起清空 |
| Roles / Permissions | `#/system/roles` `#/users/permissions` | `/api/admin/roles` `/api/admin/roles/{id}/permissions` `/api/admin/permissions` `/api/admin/permissions/{id}` `/api/admin/permissions/matrix` | 权限树、状态切换、分配关系 | 无专项 | `missing` | 静态审查已发现 `BUG-20260420-048` `BUG-20260420-058` `BUG-20260420-059` `BUG-20260420-061` `BUG-20260420-066`：权限更新缺少防循环校验，角色统计会高估停用权限，内置权限编辑会被目录同步覆盖或导致重复权限，停用父权限不会撤销已展开的子权限生效，而且后台受保护接口当前只校验登录态，不校验权限码 |
| Categories | `#/system/categories` | `/api/admin/categories` | 树结构和状态 | 无专项 | `missing` | 静态审查已发现 `BUG-20260420-060`：新增分类弹层仍暴露停用父分类选项，提交后才被后端拒绝 |
| Notifications | `#/system/notifications` | `/api/admin/notifications` | 批次边界、正文追溯、发送统计 | 无专项 | `missing` | 静态审查已发现 `BUG-20260420-049` `BUG-20260420-050`：通知详情不返回正文，且列表会把重复发送的同内容消息误合并成一条批次 |
| Products / Brands | `#/products/*` `#/brands/*` `#/product-auth/*` | `/api/admin/products*` `/api/admin/brands*` `/api/admin/product-auth*` | 商品库、品牌库、授权关系 | 无专项 | `missing` |  |
| Guesses / PK | `#/guesses/*` `#/pk` | `/api/admin/guesses*` `/api/admin/pk` | 状态筛选、创建页读链路 | 无专项 | `missing` |  |
| Orders | `#/orders/*` | `/api/admin/orders*` | 列表、交易、物流 | `api-order-admin-overview.db.ts` `api-admin.smoke.ts` | `partial` | 页面级还没专项测 |
| Warehouse | `#/warehouse/*` | `/api/warehouse/admin/stats` `/api/warehouse/admin/virtual` `/api/warehouse/admin/physical` | 仓库统计、两类仓列表 | `api-warehouse-admin.db.ts` | `covered` | 页面层还没专项测 |
| Marketing / Governance / Live | `#/marketing/*` `#/community/*` `#/live/*` | 多数当前未见真实 API | 页面已存在但仍是本地态 | 无 | `missing` | 先不要假设闭环已完成 |

## Acceptance Rules

| 层级 | 必须满足 |
| --- | --- |
| UI 对齐 | 页面结构、文案、按钮、空态、异常态和老系统一致或有明确差异说明 |
| API 正确 | 页面消费的字段、状态码映射、金额换算、过滤逻辑正确 |
| Automation | 至少有 smoke / integration / manual parity 中的一种证据 |
| Bug 管理 | 发现问题后必须落到 `tests/bugs/open/`，不能只写在聊天记录里 |
