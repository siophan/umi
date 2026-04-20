# User API Test Report

## Summary

| 项 | 结果 |
| --- | --- |
| 日期 | `2026-04-19` |
| 范围 | 用户端 API，本地 `joy-test` |
| 执行方式 | `tests/smoke` + `tests/integration` + `pnpm --filter @umi/api typecheck` |
| 通过 | `22` |
| 失败 | `0` |
| 阻塞 | `0` |
| 总体结论 | 用户端 API 已覆盖主链路和一批高价值异常分支，当前执行范围内表现稳定 |

## Scope

本轮只覆盖用户端，不包含后台管理端 `/api/admin/*` 相关测试。

覆盖模块：

- `auth`
- `guess`
- `order`
- `product`
- `shop`
- `wallet`
- `warehouse`
- `@umi/api typecheck`

## Results

| 脚本 | 覆盖范围 | 结果 |
| --- | --- | --- |
| `tests/smoke/api-auth.smoke.ts` | `/health`、`/openapi.json`、`/api/auth/me`、404 | Pass |
| `tests/integration/api-auth-lifecycle.db.ts` | 注册、登录、资料更新、登出 | Pass |
| `tests/integration/api-auth-code-login.db.ts` | 验证码登录自动建档 | Pass |
| `tests/integration/api-auth-code-errors.db.ts` | 验证码为空、错误码、过期码 | Pass |
| `tests/integration/api-auth-validation.db.ts` | 非法手机号、重复注册、非法资料值、幂等登出 | Pass |
| `tests/integration/api-auth-notification-chat.db.ts` | 通知列表、全部已读、会话、聊天详情、发送消息 | Pass |
| `tests/integration/api-auth-social-activity.db.ts` | 社交概览、我的动态、未读消息统计 | Pass |
| `tests/integration/api-guess.db.ts` | 竞猜列表、详情、统计 | Pass |
| `tests/integration/api-guess-404.db.ts` | 竞猜详情/统计 404 | Pass |
| `tests/integration/api-guess-user-history.db.ts` | 用户竞猜历史、我的下注、PK 聚合 | Pass |
| `tests/smoke/api-order.smoke.ts` | 订单未登录态、CORS | Pass |
| `tests/integration/api-order-list.db.ts` | 订单列表、金额换算、状态映射 | Pass |
| `tests/integration/api-order-detail.db.ts` | 订单详情、用户隔离 | Pass |
| `tests/integration/api-product-detail.db.ts` | 商品详情、进行中竞猜、推荐、登录态仓库 | Pass |
| `tests/integration/api-product-guest-404.db.ts` | 游客商品详情、空仓库态、商品 404 | Pass |
| `tests/integration/api-shop.db.ts` | 我的店铺、品牌授权、品牌商品、上架 | Pass |
| `tests/integration/api-shop-empty.db.ts` | 无店铺空态 | Pass |
| `tests/integration/api-shop-guards.db.ts` | 重复申请、无店铺 guard、未登录入口 | Pass |
| `tests/integration/api-shop-public.db.ts` | 公开店铺详情、商品、竞猜入口 | Pass |
| `tests/integration/api-wallet-ledger.db.ts` | 钱包流水、余额、编码映射 | Pass |
| `tests/integration/api-warehouse.db.ts` | 虚拟仓、实体仓、来源文案、状态映射 | Pass |
| `pnpm --filter @umi/api typecheck` | API TypeScript 编译检查 | Pass |

## Key Findings

| 方向 | 结论 |
| --- | --- |
| 认证主链路 | 注册、密码登录、验证码登录、会话读取、登出正常 |
| 认证异常分支 | 非法手机号、错误验证码、过期验证码、重复注册、非法资料更新都能正确拦截 |
| 竞猜链路 | 列表、详情、统计、历史、PK 聚合、404 都正常 |
| 订单链路 | 未登录 guard、列表聚合、详情读取、金额换算、状态映射正常 |
| 商品链路 | 详情聚合、游客访问、进行中竞猜、推荐逻辑、404 正常 |
| 店铺链路 | 我的店铺、公开店铺、空态、重复申请和 guard 分支正常 |
| 钱包仓库 | 用户隔离、余额取值、来源文案、状态映射正常 |

## Issues

本轮用户端执行范围内未发现失败用例。

## Residual Risks

| 风险点 | 说明 |
| --- | --- |
| `web` 页面层未执行 | 这轮只覆盖 API 和 typecheck，未覆盖 `apps/web` 页面渲染和用户交互 |
| `shop` 更细粒度越权仍可继续补 | 已覆盖部分 guard，但还没细化到更多品牌、更多账号组合 |
| `warehouse/product` 空数据组合还不够全 | 已覆盖部分空态，但缺少更多“缺关联记录”的组合测试 |
| OpenAPI 契约自动比对未建立 | 当前主要靠 smoke 和 integration 间接兜底 |

## Recommended Next Steps

1. 给 `apps/web` 增加页面级 smoke，先覆盖 `/login`、`/orders`、`/warehouse`、`/guess/[id]`、`/product/[id]`。
2. 继续补 `shop` 和 `warehouse` 的更细粒度越权和空数据分支。
3. 给 `/openapi.json` 增加契约对照测试，减少接口文档漂移风险。

## References

- [tests/README.md](/Users/ezreal/Downloads/joy/umi/tests/README.md)
- [tests/TESTING.md](/Users/ezreal/Downloads/joy/umi/tests/TESTING.md)
- [tests/TEST-PLAN.md](/Users/ezreal/Downloads/joy/umi/tests/TEST-PLAN.md)
