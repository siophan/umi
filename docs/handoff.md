# 当前交接状态

最后更新：2026-04-22（admin 架构已过线，继续清理 web 和非 admin API 剩余架构点）

本文档只保留当前阶段最小必要上下文，用于新线程快速接手，减少历史对话 token。

## 当前阶段

当前仓库的重点已经不只是在 `apps/web` 对齐旧页，也在保证后台架构不要回退，并开始转向运行质量。

当前并行重点：

1. `apps/web` 高频页继续保住旧页 UI 和真实链路；
2. `apps/web` 不再保留旧路径兼容壳，后续直接维护正式路由；
3. `apps/admin` 保持现有分层，不再回退到“大文件中心”；
4. `apps/api/src/modules/admin` 继续保持按业务域模块组织，不回退到后台总域大文件；
5. 开始关注 `apps/api` 非 `admin` 域的超大 router/store；
6. 保持 `@umi/web / @umi/admin / @umi/api` 的 typecheck / build 持续通过。

## 当前硬约束

1. UI 不允许猜，必须以旧 `frontend` 为准。
2. 功能行为也要对齐，不能只做静态视觉。
3. 接真实接口时优先保住旧页交互和 fallback，不要把已经接真的链路回退成 demo。
4. `apps/admin/src/lib/api` 不允许再长成跨域总接口文件；薄 barrel 可以保留，真实请求函数必须按业务域拆开。
5. `apps/admin` 页面如果已经同时承载列表、详情抽屉、表单弹窗和动作状态，开始拆就要在同轮收口，不留过渡壳；但当前已过架构收口基线，后续不要再为了把 `250` 行页面压到 `150` 行而机械拆分。
6. `apps/api/src/modules/admin` 允许薄导出层，但不允许再把多个后台业务域堆回单个超大实现文件。
7. `apps/web` 不允许继续新增没有明确参数承接的兼容壳、别名页和包装页；尤其不能让静态路由直接 import 动态路由页。
8. `apps/web/src/lib/api/shared.ts` 只保留传输层，不允许重新长成用户端总接口文件。
9. 非 `admin` API 后续如果继续演进，优先先打 `800+ / 1000+` 行的大 router/store，不要再造新的用户端总 service。

详细规则见：

- [ui-rules.md](docs/ui-rules.md)

## 已完成的关键事项

1. `umi` monorepo 已建立：
- `apps/web`
- `apps/admin`
- `apps/api`
- `packages/shared`
- `packages/db`
- `packages/config`

2. 用户端旧静态页路由已全部覆盖，`41 / 41` 无缺页。

3. 已持续对齐并接通高频真实链路的一批页面：
- 首页 `/`
- 排行榜 `/ranking`
- 直播列表 `/lives`
- 商城 `/mall`
- 个人中心 `/me`
- 用户主页 `/user/[uid]`
- 社区 `/community`
- 社区搜索 `/community-search`
- 竞猜详情 `/guess/[id]`
- 猜单 `/guess-order`
- 商品详情 `/product/[id]`
- 搜索 `/search`
- 支付 `/payment`
- 店铺详情 `/shop/[id]`
- 订单 `/orders`
- 订单详情 `/order-detail`
- 仓库 `/warehouse`
- 消息 `/chat`、`/chat/[id]`
- 通知 `/notifications`
- 我的店铺 `/my-shop`
- 好友 `/friends`
- 品牌授权 `/brand-auth`
- 上架商品 `/add-product`
- 发起好友竞猜 `/create-user`
- 创建竞猜 `/create`
- 邀请 `/invite`
- 编辑资料 `/edit-profile`
- 调试页 `/test-api`

4. 当前仍保留的一批旧页 fallback：
- `/notifications` 接口失败不再跳登录，直接回退到旧通知列表形态
- `/friends` 接口失败不再跳登录，直接回退到旧好友/关注/粉丝/申请形态
- `/chat` 接口失败不再跳登录，直接回退到旧消息列表形态
- `/me` 接口失败不再整页空白，直接回退到旧个人主页内容形态
- `/guess/[id]` 无真实数据时继续保留旧页静态链路，不跳登录
- `/brand-auth`、`/add-product`、`/create-user` 已清掉远程占位图和 demo 默认选中，改回旧页本地素材与空态

5. 底部导航已按旧系统持续收口，字号和布局已单独调过。

6. `/me` 页已修正的重要点：
- 顶栏菜单改回抽屉，不再跳转
- 仓库角标样式按旧系统修过
- 角标颜色问题本质是 CSS 覆盖，不是简单色值问题

7. `/user/[uid]` 页已修正的重要点：
- 顶栏支持滚动变白底
- 顶栏右侧第一个按钮改回分享主页
- 关注按钮补回未关注 / 已关注两种态
- 私信浮层发送按钮补回输入联动态

8. 近几轮新收口的高频页：
- `/orders`、`/order-detail`、`/warehouse`：状态文案、物流弹层、底部按钮状态机、寄售/提货行为继续按旧页收平；订单详情和确认收货已切真实链路
- `/guess/[id]`、`/product/[id]`、`/guess-order`、`/payment`：PK 进度条、下注/支付链路、商品支付信息、价格明细与底部动作已继续对齐旧页；`/payment` 已切真实地址、优惠券和下单接口
- `/friends`、`/notifications`、`/chat`、`/chat/[id]`、`/community-search`：社交消息流的头部、列表结构、fallback、搜索历史与提示文案已继续对齐旧页，通知已补单条已读，好友页热猜与 PK 入口已改成真实竞猜跳转
- `/search`：已切独立搜索域，统一走 `/api/search`、`/api/search/hot`、`/api/search/suggest`；商品与竞猜结果、热搜和联想建议都不再由页面本地拼装
- `/brand-auth`、`/add-product`、`/create-user`、`/edit-profile`、`/test-api`：远程占位资源、开发态文案和旧页偏移结构已继续清理

9. 最近继续收口并接真的页面：
- `/`：首页首屏已改成服务端直接带真实 `/api/banners /api/guesses /api/rankings /api/lives`，不再先吐前端 loading 壳；Banner 为空时按真实空态展示
- `/ranking`：已按旧页结构收成 podium + 列表 + 我的排名，首屏已接真实 `/api/rankings`
- `/lives`：已按旧页结构收成热门直播 + 更多直播，首屏已接真实 `/api/lives`；当前页面空态来自库里没有直播数据，不是假数据回退
- `/mall`：主商品流已切真实 `/api/products`，商品收藏已接真实 `product_interaction`，并继续补回动态分类、分类选择自动收起、推荐态 `hero`、联名卡、底部 `banner`、加载更多节奏和瀑布流高低差；当前 `tag / miniTag / isNew / height` 仍是派生字段，`秒杀 / 新品 / 特卖`、hero、联名卡和底部 `banner` 仍是基于商品流的页面规则
- `/cart`：已切真实 `cart_item` 读写，支持读取购物车、勾选、改数量、删除、批量删除和从推荐商品加入购物车；结算会带真实购物车项进入支付页
- `/payment`：已切真实地址 `/api/addresses`、优惠券 `/api/coupons` 和下单 `/api/orders`
- `/order-detail`：已切真实订单详情 `/api/orders/:id`
- `/coupons`：已切真实 `/api/coupons`，不再回退本地 `fallbackCoupons`
- `/product/[id]`：收藏、加入购物车、立即购买已切真实链路
- `/product/[id]`：页面结构已开始从大页本体往“协调层 + 子组件”收口，头图、摘要区、内容区、换购弹层已拆到 `product-detail-*`
- `/community`：推荐流 / 关注流 / 发现区 / 搜索 / 发布 / 点赞 / 收藏 / 转发 / 评论回复都已切真实接口，关注横条统一为稳定用户 ID 跳转，`mentionUsers` 补齐 ID
- `/community`：页面结构已进一步收成“协调层 + 子组件 + 页面状态 hook”，`follow bar / recommend highlights / feed list / composer overlays / use-community-page-state / page helpers` 已从主文件拆出
- `/post/[id]`：页面结构已进一步收成“协调层 + 子组件 + 页面状态 hook”，正文卡片、评论区、分享/举报弹层、相关推荐和详情状态机已拆到 `post-detail-* / use-post-detail-state`
- `/friends`：页面结构已进一步收成“协调层 + 子组件 + 页面状态 hook”，顶部统计/快捷入口/热门竞猜和详情状态机已拆到 `friends-overview-sections / use-friends-page-state / friends-*`
- `/me`：页面结构已开始从大页本体往“协调层 + 子组件”收口，主页摘要、内容分区和设置/搜索/开店弹层已拆到 `me-*`
- `/user/[uid]`：公开主页路由已统一切到 `uid_code`，复制提示改回 `已复制优米号`
- `/live/[id]`：没有进行中的竞猜时，主按钮不再误提示成功
- `/shop/[id]`：底部主按钮会切到对应内容并带视口滚动
- `/`：模式切换时 hero 归位，“正在进行”副标题改为跟当前可见卡片数联动

10. 最近完成的后台架构收口：
- `apps/api/src/modules/admin` 的 `system / merchant / products / coupons / guesses / orders / content` 已拆成薄入口 + 领域文件
- `apps/admin/src/lib/api/system.ts`、`merchant.ts`、`catalog.ts` 已拆成按业务域子模块 + 薄 barrel
- `apps/admin/src/pages/users-page.tsx`、`system-users-page.tsx`、`roles-page.tsx`、`warehouse-page.tsx`、`marketing-coupons-page.tsx`、`dashboard-page.tsx`、`system-rankings-page.tsx` 已收成薄协调层
- 上述收口后，`@umi/admin typecheck/build`、`@umi/api typecheck/build` 已实际通过

11. 当前后台架构判断：
- `apps/admin` 整体架构已通过，不再是当前主阻塞
- 当前 `apps/admin/src/pages` 共 `35` 个页面文件
- 当前最大的后台页已降到 `286` 行，不再有 `300+ / 500+ / 800+` 的中心文件

12. 这轮新增确认的用户端架构事实：
- `apps/web/src/app` 当前共有 `46` 个页面入口
- 旧的兼容路由壳已经删除：`/detail`、`/product-detail`、`/post-detail`、`/live`、`/profile`、`/user-profile`、`/my-orders`、`/all-features`、`/myshop`、`/shop-detail`、`/chat-detail`
- 后续不要再把旧路径兼容页重新加回工作区；如果没有正式需求，就直接维护主路由
- `apps/web/src/lib/api` 当前还是按业务域拆分；`shared.ts` 仍只承担 token 和基础请求，暂未回退成总接口文件
- `apps/web/src/app/community/page.tsx` 已从 `1122` 行降到 `179` 行，关注横条、推荐高亮区、feed 列表、四个弹层和页面状态机已拆到 `community-* / use-community-page-state`
- `apps/web/src/app/product/[id]/page.tsx` 已从 `1028` 行降到 `396` 行
- `apps/web/src/app/post/[id]/page.tsx` 已从 `942` 行降到 `169` 行，正文卡片、评论区、分享/举报弹层、相关推荐和详情状态机已拆到 `post-detail-* / use-post-detail-state`
- `apps/web/src/app/friends/page.tsx` 已从 `889` 行降到 `120` 行，顶部统计/快捷入口/热门竞猜和详情状态机已拆到 `friends-overview-sections / use-friends-page-state / friends-*`
- `apps/web/src/app/me/page.tsx` 已从 `827` 行降到 `333` 行
- `apps/web/src/app/payment/page.tsx` 已从 `676` 行降到 `319` 行，订单主体和弹层已拆到 `payment-order-sections / payment-overlays / payment-helpers`
- `apps/web/src/app/community-search/page.tsx` 已从 `691` 行降到 `421` 行，默认态、结果态和 helper 已拆到 `default-view / results-view / page-helpers`
- `apps/web/src/app/my-shop/page.tsx` 已从 `626` 行降到 `257` 行，开店申请态和已开店态内容已拆到 `shop-status-content / active-shop-content / my-shop-helpers`
- `apps/web/src/app/create-user/page.tsx` 已从 `761` 行降到 `266` 行，主体区块和弹层已拆到 `create-user-form / create-user-overlays / create-user-helpers`
- `apps/web/src/app/novice-guess/page.tsx` 已从 `685` 行降到 `301` 行，启动页、游戏页和结果页已拆到 `novice-guess-*`
- `apps/web/src/app/search/page.tsx` 已从 `620` 行降到 `367` 行，搜索前态和结果态已拆到 `search-before-view / search-results-view / search-helpers`
- `apps/web/src/app/user/[uid]/page.tsx` 已从 `602` 行降到 `385` 行，主页主体和私信浮层已拆到 `user-profile-sections / user-profile-chat-overlay`
- `apps/web/src/app/shop/[id]/page.tsx` 已从 `601` 行降到 `258` 行，店铺主体内容已拆到 `shop-detail-content`
- `apps/web/src/app/guess/[id]/page.tsx` 已从 `553` 行降到 `239` 行，主视觉、对战区和分享/下注弹层已拆到 `guess-hero / guess-battle-panel / guess-detail-overlays / guess-detail-helpers`
- `apps/web/src/app/cart/page.tsx` 已从 `551` 行降到 `389` 行，店铺分组、推荐流和底部结算栏已拆到 `cart-shop-groups / cart-recommend / cart-footer-bar / cart-helpers`
- `apps/web/src/app/edit-profile/page.tsx` 已从 `534` 行降到 `300` 行，资料主体区块和等级/资料弹层已拆到 `edit-profile-main-sections / edit-profile-overlays / edit-profile-helpers`
- `apps/web/src/app/warehouse/page.tsx` 已从 `492` 行降到 `214` 行，仓库摘要、页签、列表和寄售弹层已拆到 `warehouse-summary / warehouse-tabs / warehouse-list / warehouse-consign-modal / warehouse-helpers`
- `apps/web/src/app/address/page.tsx` 已从 `473` 行降到 `264` 行，请求已回到 `lib/api/address.ts`，地址列表和表单弹层已拆到 `address-list / address-form-modal / address-helpers`
- `apps/web/src/app/orders/page.tsx` 已从 `439` 行降到 `189` 行，订单统计、tabs 和列表已拆到 `orders-summary / orders-list / order-helpers`
- `apps/api/src/modules/search/router.ts` 已从 `680` 行降到 `76` 行，商品搜索、竞猜搜索、热搜和联想词已拆到 `search-products / search-guesses / search-discovery / search-shared`
- `apps/api/src/modules/order/router.ts` 已从 `1109` 行降到 `102` 行，订单读取、详情、后台概览和写链路已拆到 `order-read / order-write / order-shared`
- `apps/api/src/modules/shop/router.ts` 已从 `942` 行降到 `152` 行，店铺状态、我的店铺、公开店铺、品牌授权已拆到 `shop-my / shop-public / shop-brand-auth / shop-shared`
- `apps/api/src/modules/product/router.ts` 已从 `888` 行降到 `78` 行，商品详情、商品流和收藏动作已拆到 `product-detail / product-feed / product-favorite / product-shared`
- `apps/api/src/modules/warehouse/router.ts` 已从 `558` 行降到 `95` 行，用户仓库读链、寄售写链、后台仓库视图已拆到 `warehouse-user / warehouse-consign / warehouse-admin / warehouse-shared`
- `apps/api/src/modules/guess/router.ts` 已从 `500` 行降到 `49` 行，竞猜读链和个人历史已拆到 `guess-read / guess-history / guess-shared`
- `apps/api/src/modules/community/store.ts` 已从 `900` 行降到 `19` 行，社区读链和写链已拆到 `community-read / community-write`
- `packages/shared/src/api.ts` 当前只剩薄导出层，`packages/shared` 不是当前主阻塞
- `apps/api` 非 `admin` 域当前已经没有明显的超大入口文件；后续如果还要继续做架构，优先只盯单业务域内部是否再次膨胀，不再按入口层继续机械拆分

## 当前正在做

1. 保持现有 UI 对齐结果，不要回退到 demo 占位实现
2. `login` 页由其他线程处理，当前不要改动
3. 在接真实接口时，优先保留旧页 fallback 和旧页交互，不要为了联调破坏 UI；`/` 当前首屏依赖真实 `/api/banners /api/guesses /api/rankings /api/lives`，`/mall` 当前主商品流依赖真实 `/api/products`，`/cart` 依赖真实 `/api/cart`，`/payment` 依赖真实 `/api/addresses + /api/coupons + /api/orders`
4. `apps/admin` 当前默认不再机械拆页面；只保留防回退约束
5. `apps/web` 后续除 `/create` 外已基本过线；不要重新把已拆开的状态机、弹层和区块塞回主页面，也不要重新引入包装页模式
6. 若再发现零散差异，仍然先对照对应旧 `frontend/*.html` 再改

当前已知的残留说明：

- `/community` 的转发 `prompt`
- `/my-shop` 的下架 `confirm`
- `/me` 设置抽屉中的“语言切换开发中 / 帮助中心开发中 / 意见反馈开发中”

以上都与旧静态页一致，不属于本轮未完成项。

## 当前仍在重点收口的页面

- `/`
- `/ranking`
- `/lives`
- `/mall`
- `/me`
- `/product/[id]`
- `/friends`
- `/shop/[id]`
- `/live/[id]`
- `/novice-guess`
- `apps/web` 高频页继续对齐旧 `frontend`

## 下一步建议顺序

1. 优先按上面这些高感知页面逐页对旧 `frontend`
2. 每次改动前先打开旧页面
3. 改完跑：

```bash
pnpm --dir apps/web exec tsc -p tsconfig.json --pretty false
```

4. 如果某页状态发生明显变化，再更新：
- [progress.md](docs/progress.md)
- [handoff.md](docs/handoff.md)

如果继续做架构：

1. 先打 `apps/web` 仍然最重的页面，优先 `create`
2. 保持当前“只留正式路由”的状态，不再重建旧路径兼容页
3. 然后继续只盯 `apps/web` 剩余重页面和 `apps/api` 单业务域内部是否再次膨胀，不再按入口层继续机械拆分
4. `apps/admin` 只做防回退，不再默认继续机械拆页

## 常用参考文件

旧页面（位于本机老系统 clone 下的 `frontend/`，不在当前仓库内）：

- `frontend/index.html`
- `frontend/profile.html`
- `frontend/user-profile.html`
- `frontend/community.html`
- `frontend/community-search.html`
- `frontend/detail.html`
- `frontend/product-detail.html`
- `frontend/search.html`
- `frontend/shop-detail.html`

新页面：

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/me/page.tsx`
- `apps/web/src/app/user/[uid]/page.tsx`
- `apps/web/src/app/community/page.tsx`
- `apps/web/src/app/community-search/page.tsx`
- `apps/web/src/app/search/page.tsx`
- `apps/api/src/modules/search/router.ts`

## 文档职责

这几份文档分别承担：

- [progress.md](docs/progress.md)：整体模块完成度
- [ui-rules.md](docs/ui-rules.md)：用户端 UI 对齐规则
- [handoff.md](docs/handoff.md)：当前阶段最小交接信息
