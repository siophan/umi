# System Test Plan

## Plan Summary

| 维度 | 范围 | 当前状态 | 目标状态 | 优先级 |
| --- | --- | --- | --- | --- |
| `packages/shared` | 类型、状态枚举、API 契约 | 未系统化测试 | 建立单测和契约快照 | P0 |
| `apps/api` Smoke | 健康检查、OpenAPI、未登录态、CORS、404 | 已有部分本地脚本 | 扩到所有基础入口 | P0 |
| `apps/api` Integration | Auth / Guess / Order / Product / Wallet / Warehouse / Shop / Admin | 已覆盖部分核心主链路 | 覆盖所有真实数据库路由 | P0 |
| `apps/api` Contract | OpenAPI、返回结构、状态码、金额字段 | 零散依赖 smoke | 路由与契约自动比对 | P1 |
| `apps/web` Page Smoke | 路由可渲染、关键页面不崩 | 未系统化 | 建立页面冒烟矩阵 | P1 |
| `apps/web` Flow E2E | 登录、订单、仓库、竞猜、商品详情 | 未开始 | 覆盖核心用户闭环 | P1 |
| `apps/admin` Smoke | 登录壳层、Dashboard、Users、Orders、Guesses、Warehouse | 未系统化 | 建立模块冒烟矩阵 | P1 |
| `apps/admin` Flow E2E | 后台登录、统计、列表、权限控制 | 未开始 | 覆盖最小运营闭环 | P2 |
| DB Migration / Schema | SQL 变更、文档同步、关键索引约束 | 依赖人工检查 | 形成结构回归检查 | P0 |
| Non-functional | 性能、并发、幂等、容错 | 已有本地用户侧压测脚本 | 覆盖主链路压测与边界 | P2 |
| Test Hygiene | 集成测试残留、硬中断恢复 | 已有本地清理脚本 | 形成可重复回收流程 | P1 |

## Test Layers

| 层级 | 目标 | 主要对象 | 运行环境 | 通过标准 | 备注 |
| --- | --- | --- | --- | --- | --- |
| Unit | 验证纯函数、状态映射、金额换算、字段归一化 | `shared`、API 映射函数、前端格式化函数 | Node | 函数级断言稳定 | 最便宜，优先补齐 |
| Smoke | 验证应用能启动、路由存在、基础响应没坏 | `apps/api`、`apps/web`、`apps/admin` | 本地 | 关键入口全 `200/401/404` 正确 | 适合快速回归 |
| Integration | 验证真实数据库、多表聚合、登录态、过滤、状态码 | `apps/api` | 本地 `joy-test` | 真实 SQL 结果与接口契约一致 | 当前主力层 |
| Contract | 验证接口结构、OpenAPI、字段命名和包裹格式 | `apps/api` + `packages/shared` | Node | 响应结构和文档一致 | 防止前后端漂移 |
| E2E | 验证用户与后台主流程闭环 | `web`、`admin`、`api` | 浏览器 + 本地 API | 页面行为与业务结果一致 | 后续补齐 |
| Manual / Visual | 验证 UI 对齐、旧页行为一致、特殊交互 | `web`、`admin` | 浏览器 | 与旧系统一致 | 不能完全用自动化替代 |

## Coverage Strategy

| 子系统 | 主测试类型 | 次测试类型 | 核心风险 | 当前建议 |
| --- | --- | --- | --- | --- |
| `shared` | Unit | Contract | 状态枚举漂移、字段改名 | 先补单测 |
| `api/auth` | Integration | Smoke | 登录态失效、用户表字段演进 | 高优先补齐 |
| `api/guess` | Integration | Contract | 竞猜选项聚合、状态码映射、分类字段演进 | 已有基础，继续扩 |
| `api/order` | Integration | Contract | 聚合错、金额换算错、状态映射错 | 已有基础，继续扩 |
| `api/product` | Integration | Contract | 多表聚合、推荐逻辑、仓库嵌套数据 | 已有基础，继续扩 |
| `api/wallet` | Integration | Unit | 编码映射错、余额取值错 | 已有基础，继续扩 |
| `api/warehouse` | Integration | Contract | 来源文案、状态映射、用户隔离 | 已有基础，继续扩 |
| `api/shop` | Integration | Contract | 店铺授权、商品上架、品牌商品池 | 下一批重点 |
| `api/admin` | Smoke | Integration | demo 与真实 RBAC 切换时断裂 | 当前先 smoke，后补真实 |
| `web` | Page Smoke | E2E | 页面不渲染、关键入口报错 | 建立最小冒烟 |
| `admin` | Page Smoke | E2E | 模块页报错、登录壳层失效 | 建立最小冒烟 |

## Shared Test Matrix

| 模块 | 用例 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `packages/shared/src/status.ts` | 状态枚举完整性 | `guessStatuses`、`orderStatuses`、`warehouseStatuses` 不被误删 | Unit | P0 | Planned |
| `packages/shared/src/status.ts` | 状态枚举唯一性 | 同一数组无重复值 | Unit | P1 | Planned |
| `packages/shared/src/api.ts` | API 契约字段存在性 | `ApiEnvelope<T>` 关键字段约束不变 | Contract | P0 | Planned |
| `packages/shared/src/domain.ts` | 领域对象关键字段 | `OrderSummary`、`GuessSummary`、`WarehouseItem` 关键字段稳定 | Contract | P1 | Planned |

## API Smoke Matrix

| 路由 | 用例 | 断言重点 | 环境 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `GET /health` | 服务可用 | `200`、返回 `ok/service/timestamp` | Local | P0 | Covered |
| `GET /openapi.json` | 文档入口可用 | `200`、`openapi=3.0.3` | Local | P0 | Covered |
| `GET /docs` | 在线文档入口可用 | 页面能打开 | Local | P1 | Planned |
| Missing route | 404 行为 | `404`、统一 `success=false` | Local | P0 | Covered |
| Any protected route | 未登录态 | `401`、统一提示 | Local | P0 | Covered |
| `OPTIONS` | CORS 预检 | `204`、允许方法/头存在 | Local | P0 | Covered |

## API Auth Matrix

| 路由 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `POST /api/auth/send-code` | 正常手机号 | 写入 `sms_verification_code`，开发环境返回 `devCode` | Integration | P0 | Covered |
| `POST /api/auth/send-code` | 非法手机号 | `400`、错误文案正确 | Integration | P0 | Covered |
| `POST /api/auth/register` | 正常注册 | 写入 `user + user_profile + auth_session` | Integration | P0 | Covered |
| `POST /api/auth/register` | 重复手机号 | `400`、不新增用户 | Integration | P0 | Covered |
| `POST /api/auth/login` | 密码登录 | 返回 token、创建会话 | Integration | P0 | Covered |
| `POST /api/auth/login` | 验证码登录自动注册 | 不存在用户时自动建档 | Integration | P1 | Covered |
| `GET /api/auth/me` | 已登录读取 | 返回当前用户资料 | Integration | P0 | Covered |
| `PUT /api/auth/me` | 更新资料 | `user_profile` 被更新 | Integration | P1 | Covered |
| `POST /api/auth/logout` | 登出 | 删除 `auth_session` | Integration | P0 | Covered |
| `GET /api/auth/notifications` | 通知列表 | 只返回当前用户通知 | Integration | P1 | Covered |
| `POST /api/auth/notifications/read-all` | 全部已读 | `notification.is_read` 更新 | Integration | P1 | Covered |
| `GET /api/auth/chats` | 会话列表 | 只返回当前用户会话，未读数正确 | Integration | P1 | Covered |
| `GET /api/auth/chats/:userId` | 聊天详情 | 消息顺序、已读更新正确 | Integration | P1 | Covered |
| `POST /api/auth/chats/:userId` | 发消息 | `chat_message`、`chat_conversation` 同步更新 | Integration | P1 | Covered |
| `GET /api/auth/social` | 好友/关注/粉丝/申请 | 四类列表拼装正确 | Integration | P2 | Covered |
| `GET /api/auth/me/activity` | 我的作品/收藏/点赞 | 多表聚合正确 | Integration | P2 | Covered |

## API Guess Matrix

| 路由 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `GET /api/guesses` | 列表读取 | 只返回审核通过且状态合法的竞猜 | Integration | P0 | Covered |
| `GET /api/guesses` | 分类映射 | `category_id -> category.name` 成功 | Integration | P0 | Covered |
| `GET /api/guesses` | 选项票数聚合 | `guess_option + guess_bet` 聚合正确 | Integration | P0 | Covered |
| `GET /api/guesses/:id` | 详情读取 | 商品、品牌、分类、选项完整 | Integration | P0 | Covered |
| `GET /api/guesses/:id` | 不存在竞猜 | `404` 行为正确 | Integration | P1 | Covered |
| `GET /api/guesses/:id/stats` | 统计读取 | `totalVotes`、`optionCount` 正确 | Integration | P0 | Covered |
| `GET /api/guesses/user/history` | 未登录 | `401` | Smoke | P0 | Covered |
| `GET /api/guesses/user/history` | 已登录历史 | `active/history/pk/stats` 拼装正确 | Integration | P1 | Covered |
| `GET /api/guesses/my-bets` | 与 `user/history` 等价 | 结果结构与主入口一致 | Integration | P1 | Covered |

## API Order Matrix

| 路由 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `GET /api/orders` | 当前用户订单列表 | 只返回当前用户订单 | Integration | P0 | Covered |
| `GET /api/orders` | 订单项聚合 | 多条 `order_item` 合并为一个订单 | Integration | P0 | Covered |
| `GET /api/orders` | 金额换算 | 分转元正确 | Integration | P0 | Covered |
| `GET /api/orders` | 履约状态映射 | `paid + shipped -> shipping` 等映射正确 | Integration | P0 | Covered |
| `GET /api/orders/:id` | 当前用户订单详情 | 单个订单详情读取正确 | Integration | P0 | Covered |
| `GET /api/orders/:id` | 非本人订单 | `404` 或隔离正确 | Integration | P0 | Covered |
| `GET /api/orders/admin/stats/overview` | 管理端聚合 | `totalOrders`、`paidOrders` 聚合正确 | Integration | P0 | Covered |
| `GET /api/orders/admin/stats/overview` | 管理员未授权 | `401/403` 正确 | Integration | P1 | Covered |

## API Product Matrix

| 路由 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `GET /api/products/:id` | 商品主数据 | 品牌、分类、店铺、图片、标签完整 | Integration | P0 | Covered |
| `GET /api/products/:id` | 进行中竞猜 | 只挂当前商品的生效竞猜 | Integration | P0 | Covered |
| `GET /api/products/:id` | 推荐商品 | 同品牌或同店铺推荐逻辑正确 | Integration | P1 | Covered |
| `GET /api/products/:id` | 登录用户仓库聚合 | 当前用户相关仓库数据嵌入正确 | Integration | P1 | Covered |
| `GET /api/products/:id` | 未登录访问 | 主体可访问，仓库项为空 | Integration | P1 | Covered |
| `GET /api/products/:id` | 商品不存在 | `404` 正确 | Integration | P1 | Covered |

## API Wallet Matrix

| 路由 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `GET /api/wallet/ledger` | 当前用户流水 | 只返回当前用户 | Integration | P0 | Covered |
| `GET /api/wallet/ledger` | 排序 | 最新记录在前 | Integration | P0 | Covered |
| `GET /api/wallet/ledger` | 编码映射 | `10/20/30/40/50/60` 正确映射 | Integration | P0 | Covered |
| `GET /api/wallet/ledger` | 余额取值 | `balance = latest.balance_after` | Integration | P0 | Covered |
| `GET /api/wallet/ledger` | 未知编码兜底 | 回退为 `adjust` | Integration | P1 | Covered |

## API Warehouse Matrix

| 路由 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `GET /api/warehouse/virtual` | 当前用户虚拟仓 | 只返回当前用户记录 | Integration | P0 | Covered |
| `GET /api/warehouse/virtual` | 状态映射 | `10 -> stored`、`20 -> locked`、`30 -> converted` | Integration | P0 | Partial |
| `GET /api/warehouse/virtual` | 来源文案映射 | `10/20/30` 来源文案正确 | Integration | P0 | Covered |
| `GET /api/warehouse/physical` | 履约商品聚合 | `fulfillment_order + order_item` 合并正确 | Integration | P0 | Covered |
| `GET /api/warehouse/physical` | 实体仓记录聚合 | `physical_warehouse` 记录映射正确 | Integration | P0 | Covered |
| `GET /api/warehouse/physical` | 寄售价和天数 | `consign_price`、`estimate_days` 正确 | Integration | P1 | Covered |
| `GET /api/warehouse/admin/stats` | 管理端仓库聚合 | 总数统计正确 | Integration | P1 | Covered |

## API Shop Matrix

| 路由 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `GET /api/shops/me` | 当前店铺读取 | 店铺、授权、商品列表拼装正确 | Integration | P0 | Covered |
| `GET /api/shops/me` | 无店铺用户 | 返回空态而非报错 | Integration | P1 | Covered |
| `GET /api/shops/brand-auth` | 授权概览 | 已授权、待申请、可申请品牌分组正确 | Integration | P1 | Covered |
| `POST /api/shops/brand-auth` | 提交授权申请 | 写入 `shop_brand_auth_apply` | Integration | P0 | Covered |
| `GET /api/shops/brand-products` | 品牌商品池 | 按授权条件返回品牌商品 | Integration | P1 | Covered |
| `POST /api/shops/products` | 上架品牌商品 | 写入 `product` | Integration | P0 | Covered |
| `GET /api/shops/:id` | 店铺详情 | 店铺信息、商品列表、竞猜入口正确 | Integration | P1 | Covered |

## API Admin Matrix

| 路由 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `POST /api/admin/login` | 管理员登录 | `admin_user` 鉴权、角色/权限返回正确 | Integration | P1 | Covered |
| `GET /api/admin/me` | 当前管理员资料 | token 解析、角色/权限拼装正确 | Integration | P1 | Covered |
| `POST /api/admin/change-password` | 修改密码 | 哈希更新正确 | Integration | P2 | Covered |
| `GET /api/admin/dashboard/stats` | 当前 demo 路由 | 结构稳定、统计一致 | Smoke | P1 | Covered |
| `GET /api/admin/users` | 当前 demo 路由 | 列表结构、角色字段稳定 | Smoke | P1 | Covered |
| `GET /api/admin/guesses` | 当前 demo 路由 | 列表结构稳定 | Smoke | P1 | Covered |
| `GET /api/admin/orders` | 当前 demo 路由 | 列表结构稳定 | Smoke | P1 | Covered |
| Admin RBAC | 非法 token / 无权限 | `401/403` 行为正确 | Integration | P1 | Covered |

## API Contract Matrix

| 对象 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `/openapi.json` | 路由存在性 | 已落地路由都在文档里 | Contract | P0 | Planned |
| `/openapi.json` | 请求参数 | 实际参数与文档一致 | Contract | P1 | Planned |
| `/openapi.json` | 响应结构 | 实际字段与文档一致 | Contract | P1 | Planned |
| `@umi/shared` vs API | 字段命名 | 共享类型字段与实际响应一致 | Contract | P0 | Planned |

## Web Smoke Matrix

| 页面 / 路由 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `/` | 首页渲染 | 页面可打开、无运行时报错 | Smoke | P1 | Planned |
| `/login` | 登录页渲染 | 表单和提交入口存在 | Smoke | P1 | Planned |
| `/orders` | 订单页渲染 | 页面不崩、能消费订单列表数据 | Smoke | P1 | Planned |
| `/warehouse` | 仓库页渲染 | 页面不崩、能消费仓库列表数据 | Smoke | P1 | Planned |
| `/guess/[id]` | 竞猜详情渲染 | 详情主体、选项、底部动作存在 | Smoke | P1 | Planned |
| `/product/[id]` | 商品详情渲染 | 商品主数据、推荐、竞猜入口存在 | Smoke | P1 | Planned |
| `/chat` | 会话页渲染 | 列表区域、fallback 不崩 | Smoke | P2 | Planned |
| `/notifications` | 通知页渲染 | fallback 不崩 | Smoke | P2 | Planned |

## Web E2E Matrix

| 业务链 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| 登录 | 验证码 / 密码登录 | 登录成功、状态持久化、跳转正确 | E2E | P1 | Planned |
| 个人资料 | 编辑资料 | 保存成功、页面回显正确 | E2E | P2 | Planned |
| 竞猜详情 | 查看竞猜 | 详情信息、选项统计、评论区 fallback 正确 | E2E | P1 | Planned |
| 商品详情 | 查看商品 | 商品、进行中竞猜、推荐列表正确 | E2E | P1 | Planned |
| 订单列表 | 查看订单 | 状态文案、金额、按钮态正确 | E2E | P1 | Planned |
| 仓库 | 查看虚拟仓 / 实体仓 | 状态、来源、寄售字段正确 | E2E | P1 | Planned |
| 聊天 | 发送消息 | 列表更新、会话未读变化 | E2E | P2 | Planned |

## Admin Smoke Matrix

| 页面 / 模块 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `App` | 壳层渲染 | 页面可加载、无运行时报错 | Smoke | P1 | Planned |
| Login Screen | 登录壳层 | 输入框、提交入口存在 | Smoke | P1 | Planned |
| Dashboard | 统计页 | 统计卡片可渲染 | Smoke | P1 | Planned |
| Users | 用户列表页 | 表格和筛选存在 | Smoke | P2 | Planned |
| Orders | 订单页 | 表格和状态筛选存在 | Smoke | P2 | Planned |
| Guesses | 竞猜页 | 列表可渲染 | Smoke | P2 | Planned |
| Warehouse | 仓库页 | 列表可渲染 | Smoke | P2 | Planned |

## Admin E2E Matrix

| 业务链 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| 后台登录 | 管理员登录 | token、角色、权限加载正确 | E2E | P2 | Planned |
| Dashboard | 打开后台首页 | 统计值加载正确 | E2E | P2 | Planned |
| Users | 查看用户列表 | 用户列表、角色标签正确 | E2E | P2 | Planned |
| Orders | 查看订单列表 | 订单数量、状态标签正确 | E2E | P2 | Planned |
| Guesses | 查看竞猜列表 | 竞猜状态、审核态展示正确 | E2E | P2 | Planned |

## DB / Schema Matrix

| 对象 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| `docs/db.md` | 表结构一致性 | 当前文档与本地 `joy-test` 结构一致 | Schema | P0 | Manual |
| `docs/status-codes.md` | 编码一致性 | 当前文档与代码映射一致 | Schema | P0 | Manual |
| `packages/db/sql/*` | SQL 变更可执行 | 新 SQL 在本地可运行 | Schema | P0 | Manual |
| 关键表 | 唯一键/索引 | 关键唯一约束存在 | Schema | P1 | Manual |
| 字段长度 | 业务号长度 | `uid_code/order_sn/fulfillment_sn` 限制被遵守 | Schema | P1 | Partial |

## Non-functional Matrix

| 主题 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| 性能 | 高频列表接口 | `orders/guesses/warehouse` 响应时间可接受 | Performance | P2 | Partial |
| 并发 | 登录和发消息 | 并发写入不产生脏数据 | Performance | P2 | Planned |
| 幂等 | 通知已读 / 登出 | 重复调用结果稳定 | Reliability | P2 | Planned |
| 容错 | 空数据 / 缺关联 | 接口返回空态而不是 500 | Reliability | P1 | Planned |

## Test Hygiene Matrix

| 主题 | 场景 | 断言重点 | 类型 | 优先级 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| 集成测试清理 | 正常结束 | 每支脚本都在 `finally` 做自清理 | Hygiene | P0 | Partial |
| 集成测试清理 | 硬中断残留 | 可通过 `cleanup/db-test-residue.ts` 扫描并回收 | Hygiene | P1 | Covered |
| 清理边界 | 保守删除 | 默认只按测试前缀和测试命名模式处理 | Hygiene | P1 | Covered |
| 清理盲区 | 无稳定前缀孤儿数据 | 仍需脚本自清理，不依赖全局回收 | Hygiene | P1 | Known Gap |

## Existing Coverage Map

| 脚本 | 覆盖范围 | 层级 | 当前价值 |
| --- | --- | --- | --- |
| `smoke/api-auth.smoke.ts` | `/health`、`/openapi.json`、`/api/auth/me`、404 | Smoke | 保基础入口不坏 |
| `smoke/api-order.smoke.ts` | 订单未登录态、`OPTIONS` | Smoke | 保订单入口和 CORS 不坏 |
| `smoke/api-admin.smoke.ts` | demo admin 路由 | Smoke | 保 demo 后台结构不坏 |
| `integration/api-order-admin-overview.db.ts` | 订单管理概览聚合 | Integration | 保订单统计 SQL 不坏 |
| `integration/api-order-list.db.ts` | 用户订单列表 | Integration | 保登录态、聚合、金额映射 |
| `integration/api-order-detail.db.ts` | 用户订单详情 | Integration | 保详情读取和用户隔离 |
| `integration/api-warehouse.db.ts` | 虚拟仓 / 实体仓 | Integration | 保来源文案、状态映射、用户隔离 |
| `integration/api-warehouse-admin.db.ts` | 后台仓库统计 / 列表 | Integration | 保后台仓库聚合和管理员鉴权 |
| `integration/api-wallet-ledger.db.ts` | 钱包流水 | Integration | 保编码映射、余额取值 |
| `integration/api-product-detail.db.ts` | 商品详情 | Integration | 保多表聚合、推荐、进行中竞猜 |
| `integration/api-product-guest-404.db.ts` | 游客商品详情 / 404 | Integration | 保未登录空仓库态和不存在商品返回 |
| `integration/api-guess.db.ts` | 竞猜列表 / 详情 / 统计 | Integration | 保竞猜聚合、分类映射、票数统计 |
| `integration/api-guess-404.db.ts` | 竞猜详情 / 统计 404 | Integration | 保不存在竞猜时的稳定返回 |
| `integration/api-guess-user-history.db.ts` | 用户竞猜历史 / 我的下注 | Integration | 保用户态竞猜统计、PK、历史聚合 |
| `integration/api-auth-lifecycle.db.ts` | 登录注册资料闭环 | Integration | 保验证码、注册、登录、登出、资料更新 |
| `integration/api-auth-code-login.db.ts` | 验证码登录自动建档 | Integration | 保验证码登录补建用户和会话 |
| `integration/api-auth-validation.db.ts` | 用户认证异常分支 | Integration | 保校验失败、重复注册、幂等登出 |
| `integration/api-auth-notification-chat.db.ts` | 通知和私聊链路 | Integration | 保通知已读、会话聚合、发消息 |
| `integration/api-auth-social-activity.db.ts` | 社交概览和我的动态 | Integration | 保社交四象限和动态聚合 |
| `integration/api-admin-auth.db.ts` | 后台登录和改密 | Integration | 保后台账号体系和权限装配 |
| `integration/api-admin-guards.db.ts` | 后台保护路由 | Integration | 保未登录、非法 token、停用管理员拦截 |
| `integration/api-shop.db.ts` | 我的店铺和品牌授权 | Integration | 保店铺后台链路 |
| `integration/api-shop-empty.db.ts` | 空店铺用户态 | Integration | 保无店铺空态和相关操作拦截 |
| `integration/api-shop-public.db.ts` | 公开店铺详情 | Integration | 保店铺对外详情和竞猜入口 |
| `perf/api-user-load.ts` | 用户侧接口压测 | Performance | 保公开/登录态接口吞吐和延迟基线 |
| `cleanup/db-test-residue.ts` | 本地测试残留扫描与清理 | Hygiene | 保集成测试硬中断后可回收 |

## Execution Order

| 阶段 | 目标 | 主要内容 | 退出标准 |
| --- | --- | --- | --- |
| Phase 1 | 守住 API 主链路 | 继续补齐 `auth / shop / admin auth` Integration | 所有真实数据库主链路都有至少 1 条集成测试 |
| Phase 2 | 守住前端渲染 | 建立 `web / admin` Page Smoke | 高频页面可渲染且无运行时报错 |
| Phase 3 | 守住业务闭环 | 建立 `web / admin` E2E | 登录、订单、仓库、竞猜、后台登录完成闭环 |
| Phase 4 | 守住契约和结构 | OpenAPI / Shared / Schema Contract | 文档、代码、数据库三方一致 |
| Phase 5 | 守住稳定性 | 性能 / 并发 / 幂等 / 测试残留回收 | 主链路在高频场景下稳定且本地可重复回归 |
