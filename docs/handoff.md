# 当前交接状态

最后更新：2026-04-19（最新收口已同步）

本文档只保留当前阶段最小必要上下文，用于新线程快速接手，减少历史对话 token。

## 当前阶段

`apps/web` 用户端 UI 与功能行为对齐旧系统仍在继续，但高频主链路已经不再停留在 demo/mock 阶段。

当前重点：

1. 继续把首页、商城、`me`、社区、店铺、直播、新手页压到更接近旧页；
2. 保住现有对齐结果，不因为接真实接口把旧页交互打坏；
3. 持续把商品发现、商品详情、搜索等高频读链路维持在真实数据态；
4. 保持 `apps/web` 主线 `tsc` 持续通过。

## 当前硬约束

1. UI 不允许猜，必须以旧 `frontend` 为准。
2. 功能行为也要对齐，不能只做静态视觉。
3. 接真实接口时优先保住旧页交互和 fallback，不要把已经接真的链路回退成 demo。

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
- 商城 `/mall`
- 个人中心 `/me`
- 用户主页 `/user/[uid]`
- 社区 `/community`
- 社区搜索 `/community-search`
- 竞猜详情 `/guess/[id]`
- 猜单 `/guess-order`
- 商品详情 `/product/[id]`
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
- `/guess/[id]`、`/product/[id]`、`/payment` 无真实数据时继续保留旧页静态链路，不跳登录
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
- `/orders`、`/order-detail`、`/warehouse`：状态文案、物流弹层、底部按钮状态机、寄售/提货行为继续按旧页收平
- `/guess/[id]`、`/product/[id]`、`/guess-order`、`/payment`：PK 进度条、下注/支付链路、商品支付信息、价格明细与底部动作已继续对齐旧页
- `/friends`、`/notifications`、`/chat`、`/chat/[id]`、`/community-search`：社交消息流的头部、列表结构、fallback、搜索历史与提示文案已继续对齐旧页，通知已补单条已读，好友页热猜与 PK 入口已改成真实竞猜跳转
- `/brand-auth`、`/add-product`、`/create-user`、`/edit-profile`、`/test-api`：远程占位资源、开发态文案和旧页偏移结构已继续清理

9. 最近继续收口并接真的页面：
- `/mall`：主商品流已切真实 `/api/products`，并继续补回动态分类、`tab banner`、秒杀倒计时、分类选择自动收起、推荐态 `hero`、联名卡、底部 `banner`、加载更多节奏、收藏按钮和瀑布流高低差
- `/community`：推荐流 / 关注流 / 发现区 / 搜索 / 发布 / 点赞 / 收藏 / 转发 / 评论回复都已切真实接口，关注横条统一为稳定用户 ID 跳转，`mentionUsers` 补齐 ID
- `/user/[uid]`：公开主页路由已统一切到 `uid_code`，复制提示改回 `已复制优米号`
- `/live/[id]`：没有进行中的竞猜时，主按钮不再误提示成功
- `/shop/[id]`：底部主按钮会切到对应内容并带视口滚动
- `/`：模式切换时 hero 归位，“正在进行”副标题改为跟当前可见卡片数联动

## 当前正在做

1. 保持现有 UI 对齐结果，不要回退到 demo 占位实现
2. `login` 页由其他线程处理，当前不要改动
3. 在接真实接口时，优先保留旧页 fallback 和旧页交互，不要为了联调破坏 UI；`/mall` 当前主商品流依赖真实 `/api/products`
4. 若再发现零散差异，仍然先对照对应旧 `frontend/*.html` 再改

当前已知的残留说明：

- `/community`、`/post/[id]` 的转发 `prompt`
- `/my-shop` 的下架 `confirm`
- `/me` 设置抽屉中的“语言切换开发中 / 帮助中心开发中 / 意见反馈开发中”

以上都与旧静态页一致，不属于本轮未完成项。

## 当前仍在重点收口的页面

- `/`
- `/mall`
- `/me`
- `/community`
- `/shop/[id]`
- `/live/[id]`
- `/novice-guess`

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

## 常用参考文件

旧页面（位于本机老系统 clone 下的 `frontend/`，不在当前仓库内）：

- `frontend/index.html`
- `frontend/profile.html`
- `frontend/user-profile.html`
- `frontend/community.html`
- `frontend/community-search.html`
- `frontend/detail.html`
- `frontend/product-detail.html`
- `frontend/shop-detail.html`

新页面：

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/me/page.tsx`
- `apps/web/src/app/user/[uid]/page.tsx`
- `apps/web/src/app/community/page.tsx`
- `apps/web/src/app/community-search/page.tsx`

## 文档职责

这几份文档分别承担：

- [progress.md](docs/progress.md)：整体模块完成度
- [ui-rules.md](docs/ui-rules.md)：用户端 UI 对齐规则
- [handoff.md](docs/handoff.md)：当前阶段最小交接信息
