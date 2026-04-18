# 当前交接状态

最后更新：2026-04-18

本文档只保留当前阶段最小必要上下文，用于新线程快速接手，减少历史对话 token。

## 当前阶段

`apps/web` 用户端 UI 与功能行为对齐旧系统。

当前重点不是接真实接口，而是先把用户端静态页面与旧 `frontend` 对齐。

## 当前硬约束

1. UI 不允许猜，必须以旧 `frontend` 为准。
2. 功能行为也要对齐，不能只做静态视觉。
3. 真实接口联调放后面，当前可以继续使用 demo / mock 数据。

详细规则见：

- [ui-rules.md](/Users/ezreal/Downloads/joy/umi/docs/ui-rules.md)

## 已完成的关键事项

1. `umi` monorepo 已建立：
- `apps/web`
- `apps/admin`
- `apps/api`
- `packages/shared`
- `packages/db`
- `packages/config`

2. 用户端旧静态页路由已基本覆盖。

3. 已持续对齐的一批页面：
- 首页 `/`
- 商城 `/mall`
- 个人中心 `/me`
- 用户主页 `/user/[id]`
- 社区 `/community`
- 社区搜索 `/community-search`
- 竞猜详情 `/guess/[id]`
- 商品详情 `/product/[id]`
- 店铺详情 `/shop/[id]`
- 订单 `/orders`
- 仓库 `/warehouse`
- 消息 `/chat`、`/chat/[id]`
- 通知 `/notifications`
- 我的店铺 `/my-shop`
- 上架商品 `/add-product`
- 邀请 `/invite`
- 编辑资料 `/edit-profile`
- 调试页 `/test-api`

4. 底部导航已按旧系统持续收口，字号和布局已单独调过。

5. `/me` 页已修正的重要点：
- 顶栏菜单改回抽屉，不再跳转
- 仓库角标样式按旧系统修过
- 角标颜色问题本质是 CSS 覆盖，不是简单色值问题

6. `/user/[id]` 页已修正的重要点：
- 顶栏支持滚动变白底
- 顶栏右侧第一个按钮改回分享主页
- 关注按钮补回未关注 / 已关注两种态
- 私信浮层发送按钮补回输入联动态

## 当前正在做

继续逐页清用户端页面，重点检查：

1. 还有没有字符图标、emoji 图标残留
2. 还有没有与旧系统不一致的跳转/抽屉/弹层行为
3. 还有没有随机占位图未替换成本地 legacy 素材
4. 每改一页先对照对应旧 `frontend/*.html`，不要自行发挥
5. `login` 页由其他线程处理，当前不要改动

## 下一步建议顺序

1. 继续逐页检查 `apps/web`
2. 每次改动前先打开旧页面
3. 改完跑：

```bash
pnpm --dir /Users/ezreal/Downloads/joy/umi/apps/web exec tsc -p tsconfig.json --pretty false
```

4. 如果某页状态发生明显变化，再更新：
- [progress.md](/Users/ezreal/Downloads/joy/umi/docs/progress.md)
- [handoff.md](/Users/ezreal/Downloads/joy/umi/docs/handoff.md)

## 常用参考文件

旧页面：

- `/Users/ezreal/Downloads/joy/frontend/index.html`
- `/Users/ezreal/Downloads/joy/frontend/profile.html`
- `/Users/ezreal/Downloads/joy/frontend/user-profile.html`
- `/Users/ezreal/Downloads/joy/frontend/community.html`
- `/Users/ezreal/Downloads/joy/frontend/community-search.html`
- `/Users/ezreal/Downloads/joy/frontend/detail.html`
- `/Users/ezreal/Downloads/joy/frontend/product-detail.html`
- `/Users/ezreal/Downloads/joy/frontend/shop-detail.html`

新页面：

- `/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx`
- `/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/page.tsx`
- `/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[id]/page.tsx`
- `/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx`
- `/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx`

## 文档职责

这几份文档分别承担：

- [progress.md](/Users/ezreal/Downloads/joy/umi/docs/progress.md)：整体模块完成度
- [ui-rules.md](/Users/ezreal/Downloads/joy/umi/docs/ui-rules.md)：用户端 UI 对齐规则
- [handoff.md](/Users/ezreal/Downloads/joy/umi/docs/handoff.md)：当前阶段最小交接信息
