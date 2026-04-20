# Testing Handbook

这个目录是本地测试工作区，默认不提交到 Git，用来快速验证 `apps/api` 的真实行为。

如果测试目标升级到“页面 UI 对齐 + 接口正确性 + Bug 流转”，额外看：

- [parity/PAGE-MATRIX.md](/Users/ezreal/Downloads/joy/umi/tests/parity/PAGE-MATRIX.md)
- [parity/API-MATRIX.md](/Users/ezreal/Downloads/joy/umi/tests/parity/API-MATRIX.md)
- [bugs/BUG-WORKFLOW.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/BUG-WORKFLOW.md)
- [bugs/index.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/index.md)

## 目标

当前这套测试分四层：

- `smoke/`
  轻量接口冒烟，主要检查应用能启动、基础路由可用、未登录返回正确状态码、OpenAPI/CORS 没被改坏。
- `integration/`
  连本地 `joy-test` 的真实集成测试，验证 SQL 聚合、登录态、状态码映射、金额换算、列表过滤和多表拼装。

- `perf/`
  本地压测脚本，验证接口在固定并发和固定时长下的吞吐、延迟和失败率。
- `cleanup/`
  本地残留扫描和清理脚本，用来处理集成测试被硬中断后可能留下的测试数据。

## 当前已有用例

### Smoke

- `smoke/api-auth.smoke.ts`
  检查 `/health`、`/openapi.json`、`/api/auth/me`、404 行为。
- `smoke/api-order.smoke.ts`
  检查订单接口未登录态和 `OPTIONS` / CORS。
- `smoke/api-admin.smoke.ts`
  检查 demo admin 路由、列表结构、统计值和跨接口引用关系。

### Integration

- `integration/api-order-admin-overview.db.ts`
  验证 `/api/orders/admin/stats/overview` 的真实订单聚合。
- `integration/api-order-list.db.ts`
  验证 `/api/orders` 的登录态、订单过滤、订单项聚合、金额换算和状态映射。
- `integration/api-warehouse.db.ts`
  验证 `/api/warehouse/virtual` 和 `/api/warehouse/physical` 的仓库聚合、来源文案和状态映射。
- `integration/api-warehouse-admin.db.ts`
  验证后台仓库统计、虚拟仓列表、实体仓列表和管理员鉴权。
- `integration/api-wallet-ledger.db.ts`
  验证 `/api/wallet/ledger` 的流水排序、余额取值和数字编码映射。
- `integration/api-product-detail.db.ts`
  验证 `/api/products/:id` 的商品主数据、进行中竞猜、推荐商品和用户仓库聚合。
- `integration/api-product-guest-404.db.ts`
  验证游客访问商品详情时的空仓库态，以及商品不存在时的 `404`。
- `integration/api-guess.db.ts`
  验证 `/api/guesses`、`/api/guesses/:id`、`/api/guesses/:id/stats` 的竞猜列表、详情和投票统计。
- `integration/api-guess-404.db.ts`
  验证 `/api/guesses/:id` 和 `/api/guesses/:id/stats` 不存在时的 `404`。
- `integration/api-guess-user-history.db.ts`
  验证 `/api/guesses/user/history` 和 `/api/guesses/my-bets` 的活跃竞猜、历史记录、PK 记录和统计。
- `integration/api-auth-lifecycle.db.ts`
  验证 `send-code/register/login/me/update/logout` 的用户侧认证闭环。
- `integration/api-auth-code-login.db.ts`
  验证验证码登录时，不存在用户会自动建档并创建会话。
- `integration/api-auth-code-errors.db.ts`
  验证验证码为空、错误码、过期码等认证异常分支。
- `integration/api-auth-validation.db.ts`
  验证手机号校验、重复注册、资料非法值和登出幂等。
- `integration/api-admin-auth.db.ts`
  验证后台登录、读取当前管理员、Dashboard 鉴权、改密和重新登录。
- `integration/api-admin-guards.db.ts`
  验证后台保护路由、非法 token 和停用管理员账号。
- `integration/api-shop.db.ts`
  验证 `/api/shops/me`、`/brand-auth`、`/brand-products`、`/products` 的店铺链路。
- `integration/api-shop-empty.db.ts`
  验证已登录但未开店用户的店铺空态和相关操作拦截。
- `integration/api-shop-guards.db.ts`
  验证重复品牌申请、无店铺用户访问品牌商品、未登录访问店铺入口等 guard 分支。
- `integration/api-order-detail.db.ts`
  验证 `/api/orders/:id` 的本人详情和他人订单隔离。
- `integration/api-auth-notification-chat.db.ts`
  验证通知列表、全部已读、会话列表、聊天详情和发送消息链路。
- `integration/api-auth-social-activity.db.ts`
  验证 `/api/auth/social` 和 `/api/auth/me/activity` 的社交四象限、动态聚合和未读消息统计。
- `integration/api-shop-public.db.ts`
  验证公开店铺详情页的商品和竞猜聚合。

### Perf

- `perf/api-user-load.ts`
  本地用户端接口压测。默认压公开接口；传 `LOAD_SCENARIO=user` 和 `LOAD_AUTH_TOKEN` 后会压登录态接口。

### Cleanup

- `cleanup/db-test-residue.ts`
  扫描本地 `joy-test` 中由 `tests/integration` 留下的测试残留。默认只扫描；传 `CLEANUP_APPLY=1` 后按测试前缀和测试命名模式执行删除。

## 运行方式

从仓库根目录执行：

```bash
pnpm --filter @umi/api exec node --import tsx ../../tests/smoke/api-auth.smoke.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/smoke/api-order.smoke.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/smoke/api-admin.smoke.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-order-admin-overview.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-order-list.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-warehouse.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-warehouse-admin.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-wallet-ledger.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-product-detail.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-product-guest-404.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-guess.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-guess-404.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-guess-user-history.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-lifecycle.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-code-login.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-code-errors.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-validation.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-social-activity.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-admin-auth.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-admin-guards.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-shop.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-shop-empty.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-shop-guards.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-order-detail.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-notification-chat.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-shop-public.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/perf/api-user-load.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/cleanup/db-test-residue.ts
```

执行上下文固定走 `@umi/api`，原因有两个：

- 复用 `apps/api` 的 TypeScript 解析和依赖树
- 复用 `apps/api/src/env.ts` 的环境加载逻辑

压测脚本常用参数：

- `LOAD_DURATION_MS`
  压测时长，默认 `15000`
- `LOAD_CONCURRENCY`
  并发数，默认 `20`
- `LOAD_TIMEOUT_MS`
  单请求超时，默认 `10000`
- `LOAD_SCENARIO`
  `public` 或 `user`，默认 `public`
- `LOAD_BASE_URL`
  如果要压外部已启动服务，可以直接传 base URL；不传则脚本自己起本地服务
- `LOAD_AUTH_TOKEN`
  `LOAD_SCENARIO=user` 时必填

清理脚本常用参数：

- `CLEANUP_APPLY`
  传 `1` 时真正删除；不传时只做扫描
- `CLEANUP_SCOPE`
  `user` 或 `all`，默认 `user`

## 环境前提

- 本地 MySQL 可访问
- `umi/.env` 指向本地 `joy-test`
- 允许临时启动本地 HTTP server

当前默认使用：

- `DATABASE_URL=mysql://root:123456@127.0.0.1:3306/joy-test`

## 写用例规则

### 1. 优先测真实链路

新用例优先覆盖这些接口：

- 已接真实数据库
- 有明显状态码映射
- 有金额换算
- 有多表聚合
- 容易因 schema 演进而回归

### 2. 必须自清理

每个 `integration` 脚本都必须：

- 自己插入测试数据
- 自己删除测试数据
- 即使断言失败也在 `finally` 里清理

不要依赖手工清库。

如果脚本被强杀、终端被关掉或者 Node 进程异常退出，`finally` 里的清理可能来不及执行。这时统一用 `cleanup/db-test-residue.ts` 做兜底，不要手写散乱的删库命令。

当前清理脚本是“保守兜底”而不是“完美回收”：

- 优先根据测试 token、测试业务号、测试命名模式反查并清理
- 默认只处理用户侧残留；后台要显式传 `CLEANUP_SCOPE=all`
- 对“验证码登录自动建档”这类没有稳定前缀的孤儿数据，脚本不会做激进删除
- 所以新测试仍然必须优先自己在 `finally` 里清理，不能把 `cleanup/` 当主路径

### 3. ID 和业务号要短

数据库里有长度限制：

- `uid_code` 只有 8 位
- `order_sn` 只有 32 位
- `fulfillment_sn` 只有 32 位

临时测试值不要写成长前缀。

### 4. 断言要测“业务意义”

不要只断言 `200`。

更应该断言：

- 当前用户数据不会串给其他用户
- 列表聚合是否正确
- 状态是否映射成前端契约值
- 金额是否按“分 -> 元”转换
- 文案来源是否符合当前实现

### 5. 用文档做事实源

写数据库相关测试时，先看：

- [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md)
- [docs/status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md)

不要把旧代码里的字段假设当成当前事实。

## 这套测试的定位

这不是正式 CI 测试体系，当前定位是：

- 本地快速回归
- 帮助发现 schema 演进造成的断裂
- 帮助把 demo 路由逐步替换成真实接口时兜住主链路

它现在最适合抓三类问题：

- SQL 查询字段和当前库结构不一致
- API 返回结构和前端契约不一致
- 状态码 / 金额 / 聚合逻辑被改坏

## 后续建议

下一批值得补的方向：

- `shops/brand-auth`、`shops/products` 的重复申请和越权分支
- `admin` 真实权限码差异，而不只是登录态
- `warehouse` 和 `product` 的更多空数据兜底

如果后面要把这套升级成正式测试体系，再考虑：

- 抽公共 seed / cleanup helper
- 抽断言 helper
- 接入 `vitest`
- 接入单独的测试数据库生命周期
