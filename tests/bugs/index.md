# Bug Index

最后更新：2026-04-20

当前活跃 Bug 已开始录入，修复线程默认从 `status = new / triaged / in_progress` 的单据里认领。

## Open Bugs

| bug_id | severity | area | page_or_api | title | status | owner | source_run | last_seen_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BUG-20260420-003` | `P1` | `product/detail` | `/product/[id]` | 商品详情页伪造徽标和换购价格表达 | `fixed_pending_verify` | `用户端全栈一` | `tests/reports/user-page-parity-round1-2026-04-20.md` | `2026-04-21` |
| `BUG-20260420-042` | `P1` | `shop/detail` | `/shop/[id]` | 店铺详情成功态仍用本地推导伪造评分和开店时间 | `fixed_pending_verify` | `用户端全栈一` | `manual-review-2026-04-20` | `2026-04-21` |
| `BUG-20260420-052` | `P2` | `post/detail/header` | `/post/[id]` | 动态详情页顶栏缺失旧页作者信息和关注入口 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-066` | `P1` | `admin/rbac/api-authz` | `#/users/permissions` | 后台受保护接口只校验登录态，不校验权限码，隐藏模块仍可被直接调用 | `fixed_pending_verify` | `用户端全栈一` | `admin-permissions-system-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-067` | `P2` | `admin/dashboard/order-distribution` | `#/dashboard` | 仪表盘订单状态分布遗漏“已关闭”订单，分布图口径不完整 | `fixed_pending_verify` | `用户端全栈一` | `admin-dashboard-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-068` | `P2` | `admin/dashboard/hot-guesses` | `#/dashboard` | 仪表盘热门竞猜只按审核通过取数，已结算竞猜也会混入榜单 | `fixed_pending_verify` | `用户端全栈一` | `admin-dashboard-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-069` | `P2` | `admin/brands/load` | `#/brands/list` | 品牌列表页把类目接口失败误当成整页失败，辅助字典异常会清空主表 | `triaged` | `测试狗` | `admin-brands-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-070` | `P2` | `admin/brands/category-filter` | `#/brands/list` | 品牌列表筛选器和编辑表单都隐藏停用类目，现存品牌无法按原类目定位或原样编辑 | `triaged` | `测试狗` | `admin-brands-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-071` | `P2` | `admin/brands/category-status` | `#/brands/list` | 品牌创建和编辑接口允许直接挂到停用类目，前后端语义不一致 | `triaged` | `测试狗` | `admin-brands-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-072` | `P2` | `admin/brands/search` | `#/brands/list` | 品牌列表搜索范围退化为只搜品牌名，无法再按联系人定位品牌 | `triaged` | `测试狗` | `admin-brands-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-073` | `P2` | `admin/brands/category-filter-precision` | `#/brands/list` | 品牌列表类目筛选只用类目名称，不足以区分树形分类里的同名节点 | `triaged` | `测试狗` | `admin-brands-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-074` | `P1` | `admin/brand-library/pagination` | `#/products/brands` | 品牌商品库只预取前 100 条并在本地筛选分页，100 条后的记录无法被检索或翻页看到 | `triaged` | `测试狗` | `admin-brand-library-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-075` | `P2` | `admin/brand-library/load` | `#/products/brands` | 品牌商品库把品牌/分类字典失败误当成整页失败，辅助字典异常会清空主表 | `triaged` | `测试狗` | `admin-brand-library-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-076` | `P2` | `admin/brand-library/dictionaries` | `#/products/brands` | 品牌商品库筛选器和编辑表单都隐藏停用品牌/停用分类，现存商品无法按原绑定定位或原样编辑 | `triaged` | `测试狗` | `admin-brand-library-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-077` | `P2` | `admin/brand-library/category-filter-precision` | `#/products/brands` | 品牌商品库分类筛选只用类目名称，不足以区分树形商品分类里的同名节点 | `triaged` | `测试狗` | `admin-brand-library-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-078` | `P2` | `admin/brand-library/status-semantic` | `#/products/brands` | 品牌商品创建和编辑接口允许直接挂到停用品牌或停用分类，前后端语义不一致 | `triaged` | `测试狗` | `admin-brand-library-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-079` | `P2` | `admin/brand-auth/load` | `#/shops/brand-auth` | 品牌授权页把审核列表和授权记录绑成同一失败面，一条请求失败会清空两页数据 | `triaged` | `测试狗` | `admin-brand-auth-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-080` | `P2` | `admin/brand-auth/record-detail` | `#/shops/brand-auth` | 品牌授权记录抽屉不展示具体授权对象，指定类目/商品授权无法复核 | `triaged` | `测试狗` | `admin-brand-auth-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-081` | `P1` | `admin/brand-auth/revoke-scope` | `#/shops/brand-auth` | 撤销指定类目/指定商品授权时，后端会把该品牌全部在售商品一起下架 | `triaged` | `测试狗` | `admin-brand-auth-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-082` | `P2` | `admin/guesses/load` | `#/guesses/list` | 竞猜列表把分类接口失败误当成整页失败，辅助字典异常会清空主表 | `triaged` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-083` | `P1` | `admin/guesses/detail` | `#/guesses/list` | 竞猜列表“查看”只有摘要抽屉，缺少真实详情、审核上下文和开奖链路 | `triaged` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-084` | `P1` | `admin/guesses/create` | `#/guesses/create` | 创建竞猜入口跳到空壳页面，没有表单和创建写链路 | `triaged` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-085` | `P2` | `admin/guesses/category-filter` | `#/guesses/list` | 竞猜分类筛选只显示启用分类，现存停用分类下的竞猜无法被筛出 | `triaged` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-086` | `P2` | `admin/guesses/category-filter-precision` | `#/guesses/list` | 竞猜分类筛选只用分类名称，不足以区分树形分类里的同名节点 | `triaged` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-087` | `P1` | `admin/guesses/detail-price` | `#/guesses/list` | 竞猜详情抽屉把商品价格再次按分格式化，奖品价值和竞猜成本会缩小 100 倍 | `triaged` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-088` | `P1` | `admin/friend-guesses/actions` | `#/guesses/friends` | 好友竞猜页只剩摘要抽屉，缺少详情跳转和强制结算链路 | `triaged` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-089` | `P2` | `admin/friend-guesses/status` | `#/guesses/friends` | 好友竞猜状态被压扁成“待开赛/进行中/已结束”，丢失“待确认”阶段 | `triaged` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-090` | `P2` | `admin/pk/stats` | `#/pk` | PK 对战页缺少旧页统计概览和 stats 链路 | `triaged` | `测试狗` | `admin-guesses-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-092` | `P1` | `admin/orders/detail-actions` | `#/orders/list` | 订单列表只剩摘要抽屉，丢失统计、真实详情、发货和退款审核链路 | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-093` | `P1` | `admin/orders/amount-format` | `#/orders/list` `#/orders/transactions` | 订单列表和交易流水把已转元金额再次按分格式化，金额会缩小 100 倍 | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-094` | `P2` | `admin/orders/status-tabs` | `#/orders/list` | 订单列表缺少“已送达”状态 tab，`delivered` 订单无法被单独筛出 | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-095` | `P1` | `admin/orders/status-semantic` | `#/orders/list` | 订单状态映射把“退款拒绝”直接打成“已关闭” | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-096` | `P1` | `admin/orders/transactions-semantic` | `#/orders/transactions` | 交易流水把未支付和已关闭订单也算成“支付流水” | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-097` | `P2` | `admin/orders/refund-status` | `#/orders/transactions` | 交易流水把所有退款状态都压成“退款链路” | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-098` | `P2` | `admin/logistics/shipping-type-filter` | `#/orders/logistics` | 物流管理“物流方式”筛选值和返回文案不一致，大部分选项永远筛不出来 | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-099` | `P1` | `admin/logistics/actions` | `#/orders/logistics` | 物流管理页只剩只读列表，缺少发货和标记签收链路 | `triaged` | `测试狗` | `admin-orders-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-100` | `P2` | `admin/warehouse/stats` | `#/warehouse/virtual` `#/warehouse/physical` | 仓库主页面没有接入 admin stats，虚拟仓和实体仓统计概览整体缺失 | `triaged` | `测试狗` | `admin-warehouse-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-101` | `P1` | `admin/warehouse/physical-visibility` | `#/warehouse/physical` | 实体仓页面把后端返回的 `completed` 记录直接过滤掉 | `triaged` | `测试狗` | `admin-warehouse-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-102` | `P1` | `admin/warehouse/consign-amount-format` | `#/warehouse/consign` | 寄售市场把已转元金额再次按分格式化，挂单价和成交价会缩小 100 倍 | `triaged` | `测试狗` | `admin-warehouse-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-103` | `P1` | `admin/warehouse/consign-actions` | `#/warehouse/consign` | 寄售市场页只剩查看抽屉，缺少审核和强制下架链路 | `triaged` | `测试狗` | `admin-warehouse-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-104` | `P2` | `admin/marketing/checkin-tabs` | `#/marketing/checkin` | 管理后台签到配置页状态 tab 只统计当前筛选结果，筛选口径会冒充全局数量 | `triaged` | `测试狗` | `admin-marketing-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-105` | `P2` | `admin/marketing/checkin-stats` | `#/marketing/checkin` | 管理后台签到配置页丢失签到统计概览和 stats 链路 | `triaged` | `测试狗` | `admin-marketing-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-106` | `P1` | `admin/marketing/invite-reward-context` | `#/marketing/invite` | 管理后台邀请模块丢失奖励发放统计和记录状态上下文 | `triaged` | `测试狗` | `admin-marketing-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-107` | `P2` | `admin/marketing/coupons-stats` | `#/marketing/coupons` | 管理后台优惠券页缺少发放使用统计概览和 stats 链路 | `triaged` | `测试狗` | `admin-marketing-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-108` | `P2` | `admin/marketing/banners-link-type` | `#/marketing/banners` | 管理后台轮播配置不再支持站内页面跳转 | `triaged` | `测试狗` | `admin-marketing-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-109` | `P1` | `admin/community/comments-mock` | `#/community/comments` | 管理后台评论管理页仍是本地假数据壳，缺少真实审核与删除链路 | `triaged` | `测试狗` | `admin-community-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-110` | `P1` | `admin/community/posts-mock` | `#/community/posts` | 管理后台社区动态页仍是本地假数据壳，缺少真实内容治理链路 | `triaged` | `测试狗` | `admin-community-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-111` | `P1` | `admin/community/reports-mock` | `#/community/reports` | 管理后台举报处理页仍是本地假数据壳，缺少通过/驳回/封禁处理链路 | `triaged` | `测试狗` | `admin-community-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-112` | `P1` | `admin/live/list-mock` | `#/live/list` | 管理后台直播列表页仍是本地假数据壳，缺少真实直播统计和强制下播链路 | `triaged` | `测试狗` | `admin-live-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-113` | `P1` | `admin/live/danmaku-shell` | `#/live/danmaku` | 管理后台弹幕管理页是伪造样例壳，当前没有真实承接链却仍展示可用页面 | `triaged` | `测试狗` | `admin-live-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-114` | `P1` | `admin/shops/products-local-filtering` | `#/shops/products` | 店铺商品页一次性拉全量商品再做本地筛选和分页 | `triaged` | `测试狗` | `admin-shop-products-applies-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-115` | `P2` | `admin/shops/apply-load` | `#/shops/apply` | 开店审核页把类目字典失败误当成整页失败 | `triaged` | `测试狗` | `admin-shop-products-applies-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-116` | `P2` | `admin/shops/apply-category-filter` | `#/shops/apply` | 开店审核页主营类目筛选会漏掉停用类目下的现存申请 | `triaged` | `测试狗` | `admin-shop-products-applies-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-117` | `P1` | `admin/system-chats-detail` | `#/system/chats` | 聊天管理页只有会话摘要，缺少消息明细审查链路 | `triaged` | `测试狗` | `admin-chat-equity-rankings-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-118` | `P2` | `admin/system-chats-stats` | `#/system/chats` | 聊天管理页丢失统计概览，只把后端 summary 闲置在接口里 | `triaged` | `测试狗` | `admin-chat-equity-rankings-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-119` | `P2` | `admin/equity-summary` | `#/equity` | 权益管理页丢失总览统计展示，列表接口返回的 summary 没有被消费 | `triaged` | `测试狗` | `admin-chat-equity-rankings-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-120` | `P2` | `admin/rankings-refresh` | `#/system/rankings` | 排行榜管理页丢失“刷新排行榜”管理动作和 refresh 链路 | `triaged` | `测试狗` | `admin-chat-equity-rankings-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-121` | `P1` | `admin/products-local-filtering` | `#/products/list` | 商品列表页只拉前 100 条并在前端做搜索、筛选和分页 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-122` | `P2` | `admin/products-load` | `#/products/list` | 商品列表页把分类字典失败误当成整页失败 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-123` | `P1` | `admin/products-actions` | `#/products/list` | 商品列表页退化成只读摘要页，丢失新增、编辑、上下架和删除链路 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-124` | `P2` | `admin/products-category-filter` | `#/products/list` | 商品列表页类目筛选会漏掉停用类目下的现存商品 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-125` | `P2` | `admin/products-category-filter-precision` | `#/products/list` | 商品列表页类目筛选只用类目名称，无法区分树形同名类目 | `triaged` | `测试狗` | `admin-products-list-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-126` | `P2` | `admin/login-openapi` | `#/login` | 后台登录 OpenAPI 没有声明真实的 401/403 错误契约 | `triaged` | `测试狗` | `admin-login-qa-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-063` | `P1` | `shop/brand-auth-data` | `/brand-auth` | 品牌授权页成功态仍用本地映射伪造保证金和品牌经营指标 | `fixed_pending_verify` | `用户端全栈一` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-064` | `P1` | `shop/my-shop-actions` | `/my-shop` | 我的店铺页暴露了未承接的店铺设置和商品管理操作 | `fixed_pending_verify` | `用户端全栈一` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-066` | `P2` | `address/manage-mode` | `/address` | 收货地址页“管理/完成”切换只是空状态切换，没有实际管理模式 | `fixed_pending_verify` | `用户端全栈一` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-067` | `P2` | `coupon/use-cta` | `/coupons` | 优惠券页“使用”按钮只是 toast，没有真实去使用链路 | `fixed_pending_verify` | `用户端全栈一` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-068` | `P2` | `review/context` | `/review` | 评价页缺少订单上下文校验，缺参时仍渲染完整评价表单 | `fixed_pending_verify` | `用户端全栈一` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-069` | `P1` | `shop/detail-actions` | `/shop/[id]` | 店铺详情页把关注、收藏、客服保留成本地假互动 | `fixed_pending_verify` | `用户端全栈一` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |
| `BUG-20260420-091` | `P2` | `coupon/summary-count` | `/coupons` | 优惠券页在读取失败时仍把可用券数量显示成真实 `0` | `fixed_pending_verify` | `用户端全栈一` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |

## Rules

| 规则 | 说明 |
| --- | --- |
| 一行一个 Bug | 不在总表写长段说明 |
| 详情放单文件 | `tests/bugs/open/BUG-xxxx.md` |
| 状态变更同步总表 | 包括 owner、last_seen_at |
| 修复后不删记录 | 移到 `closed/` 继续保留历史 |
