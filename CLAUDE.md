# CLAUDE.md — 用户端已知问题清单

本文件记录 `apps/web` 用户端当前存在的不合理点，供后续开发参考。

---

## 1. Server Component 硬编码 API 地址（P0）

**文件**：`apps/web/src/app/page.tsx:11`、`apps/web/src/app/lives/page.tsx:5`、`apps/web/src/app/ranking/page.tsx:12`

三个 Server Component 自己写死了 `const apiBaseUrl = 'http://127.0.0.1:4000'`，没有走 `src/lib/env.ts` 的 `NEXT_PUBLIC_API_BASE_URL`。生产环境会直接请求失败。

**修法**：统一改为 import `apiBaseUrl` from `../../lib/env`，或用 `process.env.NEXT_PUBLIC_API_BASE_URL`。

---

## 2. 注册时选择的头像不生效（P1）

**文件**：`apps/web/src/app/register/page.tsx:33` / `130`

`selectedAvatar` state 由用户在第 3 步选中，但 `handleRegister()` 调用 `register()` 时从未传入。`RegisterPayload`（`packages/shared/src/api.ts:88`）也没有头像字段。用户选了头像完全无效。

**修法**：在 `RegisterPayload` 加 `avatar?: string`，注册时把 `avatars[selectedAvatar].src` 传进去，后端写入 `user_profile.avatar`。

---

## 3. 忘记密码仅 toast（P1）

**文件**：`apps/web/src/app/login/page.tsx:325`

点击"忘记密码？"只显示 toast "密码重置功能开发中"，没有任何密码重置流程。

**修法**：补 `/reset-password` 页面，复用已有 `sendCode` + `changePassword` 接口完成验证码重置流程。

---

## 4. 第三方登录（微信/QQ/Apple）仅 toast（P2）

**文件**：`apps/web/src/app/login/page.tsx:176`

`handleSocialLogin()` 只显示 "正在使用 X 登录..." toast，无实际 OAuth 集成。按钮渲染在登录页但完全不可用，给用户造成误导。

**修法**：短期内隐藏社交登录区，等 OAuth 对接完成后再展示；或显示"暂不支持"而非伪进度。

---

## 5. 用户协议 / 隐私政策仅 toast（P2）

**文件**：`apps/web/src/app/login/page.tsx:357-364`、`apps/web/src/app/register/page.tsx:729-736`

点击《用户协议》《隐私政策》只显示对应名字的 toast，无实际内容页面。

**修法**：补 `/terms` 和 `/privacy` 静态页，或打开外链。

---

## 6. 个人中心设置项均为"开发中"（P2）

**文件**：`apps/web/src/app/me/page.tsx:634 / 644 / 649`

语言切换、帮助中心、意见反馈三个入口点击后只 toast "xxx 开发中"。

**修法**：短期可隐藏这三项，避免用户重复点到空入口；或补最小 landing 页。

---

## 7. 购物车满减阈值 ¥200 硬编码前端（P1）

**文件**：`apps/web/src/app/cart/page.tsx:1318`

```ts
const promoGap = Math.max(0, 200 - total);
```

¥200 满减门槛直接写死在前端，无法通过后台配置调整，也无法与实际促销活动联动。

**修法**：从 `/api/cart` 或专属促销接口返回当前有效满减规则，前端按接口数据渲染。

---

## 8. 购物车店铺 logo 使用外部 dicebear API（P2）

**文件**：`apps/web/src/app/cart/page.tsx:1527`

```ts
src={`https://api.dicebear.com/7.x/initials/svg?seed=...`}
```

依赖第三方公共 API 生成店铺头像，生产/离线环境可能加载失败，且图片内容不可控。

**修法**：改用本地 SVG 占位图，或从 `shop.logo` 字段取真实图片，缺省时降级到纯文字首字母方案。

---

## 9. 购物车 `SHOP_NAME_MAP` 硬编码（P2）

**文件**：`apps/web/src/app/cart/page.tsx:1216`

8 个品牌→店铺名映射写死在前端。后台新增或修改店铺名，前端必须同步改代码。

**修法**：`CartItem` 返回结构中已有 `shop` 字段，直接使用 `item.shop` 而不走本地映射；`SHOP_NAME_MAP` 可删除。

---

## 10. 仓库寄售提交只更新本地 state，不调写接口（P0）

**文件**：`apps/web/src/app/warehouse/page.tsx:151`

`submitSell()` 只做 `setItems(...)` 的 optimistic update，显示"已寄售"toast，但从未调用任何 API。刷新页面后寄售状态消失，数据不持久。

**修法**：补 `POST /api/warehouse/physical/:id/consign` 接口，`submitSell` 先调接口成功后再更新 UI；失败时回滚本地 state。

---

## 11. 仓库批量操作未实现（P2）

**文件**：`apps/web/src/app/warehouse/page.tsx:186`

右上角批量操作按钮点击只 toast "批量操作"，无实际功能。

**修法**：明确批量操作语义（批量提货 / 批量取消寄售）后补实现，或短期隐藏按钮。

---

## 12. 订单"联系卖家"/"催发货"仅 toast（P2）

**文件**：`apps/web/src/app/orders/page.tsx:1023 / 1027`

两个行为只触发提示文案，没有接入客服系统或后端写接口。

**修法**：联系卖家可跳转到与该店铺的聊天页（`/chat/:shopUserId`）；催发货可调 `POST /api/orders/:id/urge`。

---

## 13. 订单"评价"跳商品页，无评价流程（P2）

**文件**：`apps/web/src/app/orders/page.tsx:1031`

点击"评价"只 push 到 `/product/:id`，没有评价表单或评价结果展示。

**修法**：补 `/review?orderId=&productId=` 页面或弹层，支持星级 + 文字评价。

---

## 14. 购物车→支付数据通过 sessionStorage 传递（P1）

**文件**：`apps/web/src/app/cart/page.tsx:1466`、`apps/web/src/app/payment/page.tsx:93`

购物车用 `window.sessionStorage.setItem('payCartItems', JSON.stringify(...))` 把结算数据传给支付页，支付页再 `getItem` 读回。标签页关闭、后退再进、SSR 场景均会丢失数据，且 sessionStorage 无法跨标签页共享。

**修法**：改用 URL query（`/payment?cartItemIds=...`）+ 支付页自行调 API 拉取订单明细，或通过 zustand/context 传递。

---

## 15. 支付链路整体未完成（P0）

**文件**：`apps/web/src/app/payment/page.tsx`

支付页依赖构造态数据，`progress.md` 明确标注支付为"进行中"，无真实支付接口对接。

**修法**：先对接 `POST /api/orders`（创建订单），再补对接支付网关（微信支付 / 支付宝），完成支付回调和订单状态变更闭环。

---

## 小结

| 优先级 | 数量 | 描述 |
|--------|------|------|
| P0     | 3    | Server Component 硬编码 URL / 仓库寄售无写接口 / 支付链路未完成 |
| P1     | 3    | 注册头像不生效 / 忘记密码无流程 / 购物车满减硬编码 + sessionStorage 传参 |
| P2     | 9    | 第三方登录/协议/设置入口假按钮 / dicebear 外部依赖 / SHOP_NAME_MAP / 仓库批量操作 / 订单联系-催单-评价 stub |
