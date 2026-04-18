# 用户端 UI 对齐规则

最后更新：2026-04-18

本文档用于约束 `apps/web` 的 UI 重构方式，减少在对话历史中重复解释规则。后续所有用户端页面改动，都应以本文件为准。

## 核心原则

1. 用户端 UI 必须以旧系统 `frontend` 为唯一视觉基准。
2. 不允许凭感觉猜颜色、字号、间距、圆角、图标、按钮行为。
3. 如果旧页面没有某个元素，不要自行补设计。
4. 如果旧页面有行为，不要只还原静态样式，交互也要对齐。

## 参考来源

所有页面都先查旧文件，再改新页面：

- 旧前端目录：`/Users/ezreal/Downloads/joy/frontend`
- 新用户端目录：`/Users/ezreal/Downloads/joy/umi/apps/web`

常用对照页：

| 新页面 | 旧页面参考 |
| --- | --- |
| `/` | `frontend/index.html` |
| `/mall` | `frontend/index.html` 中商城态 |
| `/me` | `frontend/profile.html` |
| `/user/[id]` | `frontend/user-profile.html` |
| `/community` | `frontend/community.html` |
| `/community-search` | `frontend/community-search.html` |
| `/guess/[id]` | `frontend/detail.html` |
| `/product/[id]` | `frontend/product-detail.html` |
| `/shop/[id]` | `frontend/shop-detail.html` |

## 对齐范围

每次页面修改，至少检查这些项：

1. 结构层级
- 顶栏
- 主内容区
- 卡片层次
- 底部导航

2. 视觉样式
- 背景色
- 字体大小和字重
- 图标类型
- 间距、圆角、阴影
- 按钮颜色和状态

3. 功能行为
- 顶栏按钮是跳转、弹层、抽屉还是 toast
- tab 是否切换内容
- 按钮是否有 active / following / disabled 状态
- 输入框和发送按钮是否有联动

## 字体与图标

1. 字体以老系统现有加载方式为准。
2. 图标统一使用老系统同套字体图标，优先 `Font Awesome`。
3. 不要混用 emoji、纯字符箭头、省略号来替代旧系统图标。

## 素材规则

1. 优先复用老系统已有本地素材。
2. 若新页面仍使用占位图，应尽快替换成 `legacy` 目录素材。
3. 不要用随机图作为最终 UI 对齐结果。

## 路由与别名

1. 旧静态页页面名需要在 `apps/web/src/app` 中保留兼容路由。
2. 兼容路由可以包装真实页面，但 UI 仍需与旧页一致。

## 修改流程

每次改 UI 按这个顺序：

1. 打开旧 HTML / CSS / JS
2. 找出旧页面的真实结构和行为
3. 改新页面
4. 跑类型检查
5. 更新 `progress.md` 或 `handoff.md`（如果状态发生变化）

## 禁止事项

1. 不要“接近老系统”，要“按老系统改”。
2. 不要在没有旧依据时自行优化 UI。
3. 不要只改页面外观，不补旧行为。
4. 不要把临时决策只留在聊天里，不落文档。
