# 项目进度

最后更新：2026-04-19（持续收口中）

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
| 用户端 `apps/web` | `进行中` | 旧静态页已 `41/41` 覆盖，当前已进入最后一批高感知页面收口阶段；首页、个人中心、社区、店铺、直播、新手页仍在继续压旧系统细节，主线类型检查保持通过 |
| 管理台 `apps/admin` | `进行中` | 只有单页骨架和模块规划，尚未形成真实后台 |
| 后端 `apps/api` | `进行中` | 认证、个人资料、好友、通知、聊天、钱包、竞猜列表/详情、订单、仓库、店铺已接真实数据库，Admin 和部分商城/社区接口仍有 demo 路由 |
| 共享契约 `packages/shared` | `已完成` | 已抽出领域类型、状态枚举、API 契约基础层，并承接真实联调字段扩展（如 `uid`） |
| 数据库文档 / 结构说明 | `已完成` | 已有 [db.md](docs/db.md) |

## 基础工程

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| Workspace 结构 | `已完成` | `apps/web`、`apps/admin`、`apps/api`、`packages/*`、`docs` 已拆开 |
| TypeScript 基础配置 | `已完成` | root tsconfig / package tsconfig 已建立 |
| 开发脚本 | `已完成` | `pnpm install`、`pnpm typecheck`、`pnpm dev` 可用 |
| 共享类型包 | `已完成` | Web / Admin / API 已共用 `@joy/shared` |
| 统一数据库接入 | `进行中` | `apps/api` 已有 MySQL 连接层，认证/资料/社交/聊天/钱包/竞猜/订单/仓库/店铺已开始真实读写 |
| 权限 / 事务 / 状态机 | `进行中` | 已有基于 session token 的登录鉴权，事务/复杂状态流仍未系统化落地 |

## 用户端 Web

### 1. 页面覆盖

当前 `apps/web` 已经覆盖旧静态站的大部分页面名和主要路由。

页面覆盖补充说明：

- 旧 `frontend` 静态页面总数：`41`
- 当前 `apps/web` 已完成对应路由覆盖：`41 / 41`
- 当前缺失页面数：`0`
- 当前剩余工作重点已经从“补页面和收 UI”转成“继续替换真实接口与维护零散文案”，不是继续补页面数量

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
| 社区 / 社交 | `/community`、`/community-search`、`/post/[id]`、`/post-detail`、`/friends`、`/chat`、`/chat/[id]`、`/chat-detail`、`/user/[uid]`、`/user-profile` |
| 直播 / 创作 / 商家 | `/lives`、`/live/[id]`、`/live`、`/create`、`/create-user`、`/my-shop`、`/myshop`、`/brand-auth`、`/add-product` |
| 其他 | `/features`、`/all-features`、`/ranking`、`/search`、`/splash`、`/test-api`、`/ai-demo` |

### 2. 用户端功能状态

| 功能 | 状态 | 说明 |
| --- | --- | --- |
| 首页竞猜流 | `进行中` | 首页结构、榜单、开奖区、底部导航已按旧页持续收口；近期补了模式切换时 hero 归位、列表副标题联动、榜单/记录入口，首页访问已取消强制跳 `splash`，仍有少量旧单页联动细节未完全复刻 |
| 商城首页 | `进行中` | 主商品流、动态分类、搜索商品结果已接真实 `/api/products`；近期继续按旧页收了 tab banner、秒杀倒计时、分类面板开合/排序、推荐态 hero、联名卡、底部 banner、加载更多节奏、收藏按钮和瀑布流高低差。当前仍有少量活动文案、倒计时和展示标签属于前端按真实商品数据派生，不是独立运营配置 |
| 登录 / 注册 UI | `已完成` | 页面已完成且已接真实认证接口，支持验证码 / 密码登录、注册、登录态持久化 |
| 个人中心 UI | `进行中` | `me/profile/edit-profile` 已接真实资料、作品、收藏、点赞和消息未读数；优米号已改为后端生成的唯一 `uid_code`；设置抽屉、搜索层、开店弹窗与角标样式已多轮收口，仍在继续压高频细节 |
| 竞猜详情 UI | `进行中` | 页面主体、PK 进度条、评论、分享、下注弹层已继续对齐旧页；竞猜主数据已切到真实接口，评论/弹幕/下注闭环仍未完成 |
| 商品详情 UI | `进行中` | `product/[id]` 已接真实商品主数据、进行中竞猜、换购库存和推荐商品；假规格和假评价已去掉，仍剩部分玩法说明和购买后续链路待真实化 |
| 店铺详情 UI | `进行中` | `shop/[id]` 已接真实店铺信息、店铺商品和进行中竞猜；假券包已改成真实经营统计，底部主按钮已改成切到对应内容并带视口滚动，仍有部分奖池/参与人数口径受接口字段限制 |
| 订单列表 / 详情 UI | `进行中` | 订单列表已接真实 `/api/orders`，状态文案、物流弹层、底部按钮状态机已按旧页收口；订单详情和售后仍待真实化 |
| 仓库 UI | `进行中` | 仓库列表已接真实 `/api/warehouse/virtual|physical`，提货/寄售/取消寄售行为和提示已继续对齐旧页，写接口仍未完成 |
| 社区 / 聊天 / 用户主页 UI | `进行中` | `user/[uid]`、`friends`、`notifications`、`chat`、`chat/[id]`、`community`、`community-search`、`post/[id]` 已接真实接口且已清主要 fallback；用户主页公开路由已统一切到 `uid_code`，社区主 feed、详情、搜索、点赞、收藏、转发、评论与回复都已走真实链路 |
| 搜索 UI | `进行中` | 商品搜索结果已接真实 `/api/products?q=...`，竞猜结果已复用真实竞猜列表过滤；热门词、搜索历史和部分排序展示仍为前端层逻辑 |
| 消息 / 通知 UI | `进行中` | 已补老页 fallback，系统入口、列表结构、时间分隔、已读交互已继续对齐旧页；`chat` 已是真实会话/发消息链路，`notifications` 已支持真实单条已读和全部已读 |
| 个人店铺 / 上架商品 UI | `进行中` | `my-shop`、`brand-auth`、`add-product` 已接真实接口并按旧页继续收口；`shop-detail` 仍是静态实现 |
| 创建竞猜 UI | `进行中` | `/create`、`/create-user` 已从占位页重建为旧创建页主体结构，细节交互仍需继续收口 |
| 邀请 / 编辑资料 / 调试页 UI | `进行中` | `invite`、`edit-profile`、`test-api` 已继续清理开发态内容并对齐旧页结构；`test-api` 已恢复旧页测试项顺序 |
| 底部导航和全局视觉统一 | `已完成` | 底部导航、图标体系、toast、badge 已按旧系统完成收口 |

### 2.1 最终复查补充说明

- `apps/web` 已做过一轮全量残留扫描，当前残留的 `window.prompt / window.confirm / 开发中` 文案主要来自两类：
  1. 旧静态页本身就存在的原样交互或原样文案，例如 `/community` 的转发 prompt、`/my-shop` 的下架 confirm、`/me` 设置抽屉中的“语言切换开发中”等；
  2. `/login` 页面中的开发态文案，该页面由其他线程单独处理，本轮未改动。
- 除上述两类之外，`apps/web` 已基本清掉远程占位图、随机头像、明显 demo/token 文案和非旧页行为。

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
| `/user-profile` | `user/[uid]` 兼容页 |
| `/live` | `live/[id]` 兼容页 |
| `/detail`、`/product-detail`、`/shop-detail` | 旧页面名兼容包装页 |

### 4. 真实数据接入情况

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 页面调用 `src/lib/api.ts` | `进行中` | 登录、注册、个人中心、编辑资料、好友、通知、用户主页已真正接 API client |
| 页面调用本地 demo 数据 | `进行中` | 主要残留在 `product/[id]` 局部说明区、直播/支付、订单详情等周边页面；`/mall` 主商品流、`/search` 商品结果、社区主浏览链和 `shop/[id]`、`product/[id]` 主数据已切真实接口 |
| 页面接真实后端接口 | `进行中` | 已覆盖 auth / me / friends / notifications / user profile / chat / community / community-search / post-detail / shop / orders / warehouse / guess-history / guess-detail / product-detail / product-list / product-search 等模块 |

一句话：`apps/web` 当前是“旧静态页面已 41/41 全覆盖，高频页面 UI/交互已经过多轮对齐，认证、商品发现、社区主浏览、订单列表、仓库、店铺等主读链路已接真实接口，但支付、订单详情、直播和商品详情局部说明区仍有不少构造态”。 

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
| Auth | `POST /api/auth/send-code` | `已完成` | 写入 `sms_verification_code`，生产存验证码哈希，开发环境返回 `devCode` |
| Auth | `POST /api/auth/register` | `已完成` | 校验验证码，真实写入 `user + user_profile`，并生成唯一 `uid_code` |
| Auth | `POST /api/auth/login` | `已完成` | 支持验证码 / 密码登录，验证码登录可自动注册用户 |
| Auth | `GET /api/auth/me` | `已完成` | 基于 `auth_session` 返回当前用户 |
| Auth | `PUT /api/auth/me` | `已完成` | 更新昵称、头像、签名、性别、地区等资料 |
| Auth | `POST /api/auth/logout` | `已完成` | 删除当前 `auth_session` |
| Auth | `GET /api/auth/me/activity` | `已完成` | 返回我的作品、收藏、点赞、未读消息数 |
| Auth | `GET /api/auth/users/:id` | `已完成` | 返回公开用户资料 |
| Auth | `GET /api/auth/notifications` | `已完成` | 读取通知列表 |
| Auth | `POST /api/auth/notifications/read-all` | `已完成` | 全部通知标记已读 |
| Auth | `POST /api/auth/notifications/:id/read` | `已完成` | 单条通知标记已读 |
| Auth | `GET /api/auth/social` | `已完成` | 返回好友、关注、粉丝、申请列表 |
| Auth | `GET /api/auth/chats` | `已完成` | 读取真实会话列表，基于 `chat_conversation` |
| Auth | `GET /api/auth/chats/:userId` | `已完成` | 读取真实聊天明细，并自动清未读 |
| Auth | `POST /api/auth/chats/:userId` | `已完成` | 写入真实 `chat_message`，同步更新 `chat_conversation` |
| Auth | `GET /api/auth/community/feed` | `已完成` | 读取真实社区推荐流和关注流 |
| Auth | `GET /api/auth/community/discovery` | `已完成` | 聚合社区头图与热门话题 |
| Auth | `GET /api/auth/community/search` | `已完成` | 搜索真实动态与用户结果 |
| Auth | `POST /api/auth/community/posts` | `已完成` | 发布真实动态，支持图片和可见范围 |
| Auth | `POST /api/auth/community/posts/:id/repost` | `已完成` | 真实转发动态，写入 `post.repost_id` |
| Auth | `GET /api/auth/community/posts/:id` | `已完成` | 读取动态详情、评论与相关推荐 |
| Auth | `POST /api/auth/community/posts/:id/comments` | `已完成` | 发表评论 / 回复评论 |
| Auth | `POST /api/auth/community/posts/:id/like` | `已完成` | 点赞动态 |
| Auth | `DELETE /api/auth/community/posts/:id/like` | `已完成` | 取消点赞 |
| Auth | `POST /api/auth/community/posts/:id/bookmark` | `已完成` | 收藏动态 |
| Auth | `DELETE /api/auth/community/posts/:id/bookmark` | `已完成` | 取消收藏 |
| Guesses | `GET /api/guesses` | `已完成` | 竞猜列表，真实读 `guess / guess_product / product / brand_product / guess_option / guess_bet` |
| Guesses | `GET /api/guesses/:id` | `已完成` | 竞猜详情，真实读竞猜主表、商品信息、选项和票数 |
| Guesses | `GET /api/guesses/:id/stats` | `已完成` | 竞猜统计，真实按下注聚合 |
| Orders | `GET /api/orders` | `已完成` | 订单列表，真实读 `order / order_item / fulfillment_order / product / brand_product` |
| Orders | `GET /api/orders/:id` | `Demo` | 订单详情 |
| Orders | `GET /api/orders/admin/stats/overview` | `已完成` | 订单概览，真实聚合订单表 |
| Products | `GET /api/products/:id` | `已完成` | 商品详情，真实聚合商品主信息、所属店铺、进行中竞猜、仓库库存和推荐商品 |
| Products | `GET /api/products` | `已完成` | 商品列表 / 搜索，支持首页商品流和关键词搜索 |
| Wallet | `GET /api/wallet/ledger` | `已完成` | 余额读 `user_stats.coins`，流水读 `coin_ledger` |
| Warehouse | `GET /api/warehouse/virtual` | `已完成` | 虚拟仓，真实读 `virtual_warehouse` |
| Warehouse | `GET /api/warehouse/physical` | `已完成` | 实体仓，真实读 `physical_warehouse + fulfillment_order` |
| Warehouse | `GET /api/warehouse/admin/stats` | `已完成` | 仓库概览，真实聚合仓库表 |
| Shops | `GET /api/shops/me` | `已完成` | 读取当前店铺、授权和上架商品 |
| Shops | `GET /api/shops/brand-auth` | `已完成` | 读取授权记录和可申请品牌 |
| Shops | `POST /api/shops/brand-auth` | `已完成` | 提交品牌授权申请 |
| Shops | `GET /api/shops/brand-products` | `已完成` | 读取品牌商品池 |
| Shops | `POST /api/shops/products` | `已完成` | 将品牌商品上架到店铺商品表 |
| Admin | `GET /api/admin/dashboard/stats` | `Demo` | 运营概览 |
| Admin | `GET /api/admin/users` | `Demo` | 用户列表 |
| Admin | `GET /api/admin/guesses` | `Demo` | 竞猜列表 |
| Admin | `GET /api/admin/orders` | `Demo` | 订单列表 |

### 2. API 当前状态

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| Express 应用骨架 | `已完成` | 路由挂载已经齐了 |
| 真实数据库接入 | `进行中` | 认证、用户资料、好友、通知、聊天、钱包、竞猜、订单列表、仓库、店铺、商品列表/搜索/详情已接当前 MySQL；Admin 与部分订单详情/支付接口仍未切库 |
| Service 层 | `进行中` | `auth`、`wallet`、`guess`、`order`、`warehouse`、`shop`、`product` 已形成真实查询逻辑，Admin 和部分商城/社区模块仍多为 demo router 直返 |
| 权限控制 | `进行中` | 已有基于 `auth_session` 的 Bearer token 鉴权，RBAC 仍未落地 |
| 事务 / 状态流 / 幂等 | `未开始` | 新后端里还没有系统化落地 |
| 写操作接口 | `进行中` | 已有注册、登录、登出、更新资料、通知已读、聊天发送等写接口，核心业务写接口仍未开始 |

一句话：`apps/api` 当前是“认证、商品发现、社区主浏览、竞猜、订单列表、仓库、店铺等主读链路已形成最小真实后端，但 Admin、订单详情、支付和核心写操作仍未补齐”。

## Shared / DB

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| `packages/shared` 类型与状态枚举 | `已完成` | 已供 Web / Admin / API 共用 |
| `packages/db` 结构承接 | `进行中` | 已补 `sms_verification_code`、`auth_session`、`chat_conversation`、`user_profile/user_stats/user_shop_profile`、`brand_product`、`shop_brand_auth`、`uid_code` 等 SQL，运行期仍在逐步接入 |
| 数据库结构说明文档 | `已完成` | 见 [db.md](docs/db.md) |

## 当前最大缺口

| 优先级 | 缺口 | 说明 |
| --- | --- | --- |
| P0 | 商品发现链路仍未完全业务化 | `/mall` 主商品流已经接真实接口，但活动位文案、倒计时、标签和联名展示仍有一部分是前端按真实商品数据派生；`product/[id]` 的玩法说明和购买后续链路仍待清理 |
| P0 | 社区 / 支付 / 订单详情等周边页仍未接数据库 | 社区、直播、支付、订单详情仍明显依赖本地构造数据 |
| P1 | Admin 只有壳层 | 还没有运营闭环页面 |
| P1 | 权限 / 事务 / 状态机未落地 | 新主线工程尚未进入真实业务阶段 |
| P1 | 拆表后的余额 / 用户链路仍需继续扩散 | 目前已切 auth / chat / wallet / shop，其他模块仍要逐步统一到新表 |
| P2 | 文案 / UI / 页面行为仍在持续对齐旧系统 | 当前主要剩首页、`me`、社区、店铺、直播、新手页这一批高感知页面的最后收口 |

## 当前高感知页面收口清单

以下页面仍在持续按旧 `frontend` 对齐，是当前 UI 收口的重点：

| 页面 | 当前状态 | 最近补回的代表性细节 |
| --- | --- | --- |
| `/` | `进行中` | 模式切换时 hero 归位、记录/榜单入口、副标题联动；首页访问已取消强制首访 `splash` |
| `/mall` | `进行中` | 动态分类、tab banner、秒杀倒计时、分类选择自动收起、推荐态 hero、联名卡、底部 banner、加载更多节奏、收藏按钮和瀑布流错落 |
| `/me` | `进行中` | 菜单抽屉、搜索层、开店弹窗、仓库角标、设置项旧页文案 |
| `/community` | `进行中` | 推荐流 / 关注流 / 发现区 / 发布 / 搜索 / 转发 / 评论回复都已走真实接口，仍剩少量运营位和次级交互细节待继续收口 |
| `/shop/[id]` | `进行中` | 底部主按钮切内容并滚动、店铺卡片/竞猜卡结构、券区和经营统计 |
| `/live/[id]` | `进行中` | 空竞猜时主按钮语义、错误态、弹幕输入栏、直播主操作 |
| `/novice-guess` | `进行中` | 结果页、奖励区、连胜弹层、复活区、贴底 CTA 结构 |

## 下一阶段建议

1. 继续把商城活动位、倒计时、联名文案从前端派生收口成更稳定的配置或真实业务字段，并清理 `product/[id]` 剩余静态展示区。
2. 把竞猜详情页的评论、弹幕、下注闭环补成真实接口。
3. 把 `friends` 页上的同意 / 拒绝 / 回关 / 关注补成真实写接口。
4. 把社区 / 支付 / 订单详情这些周边页继续从本地构造切到真实数据。
5. 最后补 `apps/admin` 的 `Dashboard / Guesses / Orders / Warehouse` 最小后台闭环。

## 更新规则

后续每次推进功能时，至少同步更新以下三项：

1. 新增了什么模块或页面。
2. 该功能属于 `已完成 / 进行中 / 未开始 / Demo` 哪一类。
3. 是否已经接入真实接口、真实数据库，还是仍然依赖 mock / demo 数据。
