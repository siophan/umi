# Bug Index

最后更新：2026-04-21

当前活跃 Bug 已开始录入，修复线程默认从 `status = new / triaged / in_progress` 的单据里认领。

## Open Bugs

| bug_id | severity | area | page_or_api | title | status | owner | source_run | last_seen_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BUG-20260420-052` | `P2` | `post/detail/header` | `/post/[id]` | 动态详情页顶栏缺失旧页作者信息和关注入口 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-083` | `P1` | `admin/guesses/detail` | `#/guesses/list` | 竞猜列表“查看”只有摘要抽屉，缺少真实详情、审核上下文和开奖链路 | `fixed_pending_verify` | `用户端全栈一` | `admin-guesses-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-084` | `P1` | `admin/guesses/create` | `#/guesses/create` | 创建竞猜入口跳到空壳页面，没有表单和创建写链路 | `fixed_pending_verify` | `用户端全栈一` | `admin-guesses-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-085` | `P2` | `admin/guesses/category-filter` | `#/guesses/list` | 竞猜分类筛选只显示启用分类，现存停用分类下的竞猜无法被筛出 | `fixed_pending_verify` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-086` | `P2` | `admin/guesses/category-filter-precision` | `#/guesses/list` | 竞猜分类筛选只用分类名称，不足以区分树形分类里的同名节点 | `fixed_pending_verify` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-087` | `P1` | `admin/guesses/detail-price` | `#/guesses/list` | 竞猜详情抽屉把商品价格再次按分格式化，奖品价值和竞猜成本会缩小 100 倍 | `fixed_pending_verify` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-088` | `P1` | `admin/friend-guesses/actions` | `#/guesses/friends` | 好友竞猜页只剩摘要抽屉，缺少详情跳转和强制结算链路 | `fixed_pending_verify` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-089` | `P2` | `admin/friend-guesses/status` | `#/guesses/friends` | 好友竞猜状态被压扁成“待开赛/进行中/已结束”，丢失“待确认”阶段 | `fixed_pending_verify` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-092` | `P1` | `admin/orders/detail-actions` | `#/orders/list` | 订单列表只剩摘要抽屉，丢失统计、真实详情、发货和退款审核链路 | `fixed_pending_verify` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-093` | `P1` | `admin/orders/amount-format` | `#/orders/list` `#/orders/transactions` | 订单列表和交易流水把已转元金额再次按分格式化，金额会缩小 100 倍 | `fixed_pending_verify` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-094` | `P2` | `admin/orders/status-tabs` | `#/orders/list` | 订单列表缺少“已送达”状态 tab，`delivered` 订单无法被单独筛出 | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-095` | `P1` | `admin/orders/status-semantic` | `#/orders/list` | 订单状态映射把“退款拒绝”直接打成“已关闭” | `fixed_pending_verify` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-096` | `P1` | `admin/orders/transactions-semantic` | `#/orders/transactions` | 交易流水把未支付和已关闭订单也算成“支付流水” | `fixed_pending_verify` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-097` | `P2` | `admin/orders/refund-status` | `#/orders/transactions` | 交易流水把所有退款状态都压成“退款链路” | `fixed_pending_verify` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-098` | `P2` | `admin/logistics/shipping-type-filter` | `#/orders/logistics` | 物流管理“物流方式”筛选值和返回文案不一致，大部分选项永远筛不出来 | `fixed_pending_verify` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-099` | `P1` | `admin/logistics/actions` | `#/orders/logistics` | 物流管理页只剩只读列表，缺少发货和标记签收链路 | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-101` | `P1` | `admin/warehouse/physical-visibility` | `#/warehouse/physical` | 实体仓页面把后端返回的 `completed` 记录直接过滤掉 | `fixed_pending_verify` | `测试狗` | `admin-warehouse-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-102` | `P1` | `admin/warehouse/consign-amount-format` | `#/warehouse/consign` | 寄售市场把已转元金额再次按分格式化，挂单价和成交价会缩小 100 倍 | `fixed_pending_verify` | `测试狗` | `admin-warehouse-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-103` | `P1` | `admin/warehouse/consign-actions` | `#/warehouse/consign` | 寄售市场页只剩查看抽屉，缺少审核和强制下架链路 | `triaged` | `测试狗` | `admin-warehouse-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-104` | `P2` | `admin/marketing/checkin-tabs` | `#/marketing/checkin` | 管理后台签到配置页状态 tab 只统计当前筛选结果，筛选口径会冒充全局数量 | `triaged` | `测试狗` | `admin-marketing-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-106` | `P1` | `admin/marketing/invite-reward-context` | `#/marketing/invite` | 管理后台邀请模块丢失奖励发放统计和记录状态上下文 | `triaged` | `测试狗` | `admin-marketing-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-108` | `P2` | `admin/marketing/banners-link-type` | `#/marketing/banners` | 管理后台轮播配置不再支持站内页面跳转 | `triaged` | `测试狗` | `admin-marketing-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-109` | `P1` | `admin/community/comments-mock` | `#/community/comments` | 管理后台评论管理页仍是本地假数据壳，缺少真实审核与删除链路 | `triaged` | `测试狗` | `admin-community-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-110` | `P1` | `admin/community/posts-mock` | `#/community/posts` | 管理后台社区动态页仍是本地假数据壳，缺少真实内容治理链路 | `triaged` | `测试狗` | `admin-community-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-111` | `P1` | `admin/community/reports-mock` | `#/community/reports` | 管理后台举报处理页仍是本地假数据壳，缺少通过/驳回/封禁处理链路 | `triaged` | `测试狗` | `admin-community-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-112` | `P1` | `admin/live/list-mock` | `#/live/list` | 管理后台直播列表页仍是本地假数据壳，缺少真实直播统计和强制下播链路 | `triaged` | `测试狗` | `admin-live-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-114` | `P1` | `admin/shops/products-local-filtering` | `#/shops/products` | 店铺商品页一次性拉全量商品再做本地筛选和分页 | `triaged` | `测试狗` | `admin-shop-products-applies-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-115` | `P2` | `admin/shops/apply-load` | `#/shops/apply` | 开店审核页把类目字典失败误当成整页失败 | `triaged` | `测试狗` | `admin-shop-products-applies-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-116` | `P2` | `admin/shops/apply-category-filter` | `#/shops/apply` | 开店审核页主营类目筛选会漏掉停用类目下的现存申请 | `triaged` | `测试狗` | `admin-shop-products-applies-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-117` | `P1` | `admin/system-chats-detail` | `#/system/chats` | 聊天管理页只有会话摘要，缺少消息明细审查链路 | `fixed_pending_verify` | `测试狗` | `admin-chat-equity-rankings-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-120` | `P2` | `admin/rankings-refresh` | `#/system/rankings` | 排行榜管理页丢失“刷新排行榜”管理动作和 refresh 链路 | `triaged` | `测试狗` | `admin-chat-equity-rankings-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-121` | `P1` | `admin/products-local-filtering` | `#/products/list` | 商品列表页只拉前 100 条并在前端做搜索、筛选和分页 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-122` | `P2` | `admin/products-load` | `#/products/list` | 商品列表页把分类字典失败误当成整页失败 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-123` | `P1` | `admin/products-actions` | `#/products/list` | 商品列表页退化成只读摘要页，丢失新增、编辑、上下架和删除链路 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-124` | `P2` | `admin/products-category-filter` | `#/products/list` | 商品列表页类目筛选会漏掉停用类目下的现存商品 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-125` | `P2` | `admin/products-category-filter-precision` | `#/products/list` | 商品列表页类目筛选只用类目名称，无法区分树形同名类目 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-126` | `P2` | `admin/login-openapi` | `#/login` | 后台登录 OpenAPI 没有声明真实的 401/403 错误契约 | `triaged` | `测试狗` | `admin-login-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-127` | `P2` | `admin/change-password-openapi` | `后台壳层` | 后台改密 OpenAPI 没有声明真实的 403/404 错误契约 | `triaged` | `测试狗` | `admin-login-qa-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-128` | `P1` | `admin/notifications-local-window` | `#/system/notifications` | 系统通知页只覆盖最近 100 个批次，搜索和分页都退化成本地截断结果 | `fixed_pending_verify` | `测试狗` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-21` |

## Rules

| 规则 | 说明 |
| --- | --- |
| 一行一个 Bug | 不在总表写长段说明 |
| 详情放单文件 | `tests/bugs/open/BUG-xxxx.md` |
| 状态变更同步总表 | 包括 owner、last_seen_at |
| 修复后不删记录 | 移到 `closed/` 继续保留历史 |
