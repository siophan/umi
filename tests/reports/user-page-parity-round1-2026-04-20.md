# User Page Parity Report Round 1

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 用户端首轮页面/API 对齐检查 |
| 本轮重点 | `/` `/login` `/reset-password` `/me` `/search` `/mall` `/ranking` `/lives` `/live/[id]` `/community` `/community-search` `/guess/[id]` `/guess-history` `/product/[id]` `/cart` `/payment` `/orders` `/order-detail` `/warehouse` `/my-shop` `/brand-auth` `/add-product` `/shop/[id]` `/user/[uid]` `/friends` `/notifications` `/chat` `/chat/[id]` `/chat-detail` `/address` `/coupons` `/invite` `/checkin` `/features` `/edit-profile` `/novice-guess` `/splash` |
| 已确认 Bug | `41` |
| 阻塞项 | `0` |
| 结论 | 已发现 41 个页面缺陷，问题集中在“页面仍混入伪造数据”“失败被伪装成正常空态/默认态”“导航入口与真实路由不一致”“页面展示的配置与真实接口契约脱节”，以及“后端未承接却被页面伪装成可用功能”。 |

## Reviewed Pages

| 页面 | 当前结论 | 说明 |
| --- | --- | --- |
| `/` | `parity_gap` | 分区接口失败会被伪装成正常空首页。 |
| `/login` | `parity_gap` | 发送验证码失败时仍提示成功并回填假验证码。 |
| `/register` | `verified` | `BUG-20260420-051` 已验证修复：第一步现在会先调用真实验证码校验，再进入设置密码。 |
| `/reset-password` | `verified` | `BUG-20260420-037` 已关闭：页面现已明确提示验证码不会在这一步单独校验，不再把本地长度判断伪装成“已验证通过”。 |
| `/me` | `parity_gap` | 快捷入口里存在错误路由。 |
| `/edit-profile` | `parity_gap` | 页面暴露了未承接的封面上传入口。 |
| `/search` | `parity_gap` | 搜索结果在缺少评分时会伪造 4.x 评分。 |
| `/mall` | `verified` | `BUG-20260420-009` 与 `BUG-20260420-062` 已关闭：首屏商品流/购物车失败和分类分支失败都已改成显式错误态，不再伪装成空内容。 |
| `/ranking` | `parity_gap` | 榜单读取失败会被伪装成空榜。 |
| `/lives` | `parity_gap` | 直播列表读取失败会被伪装成空列表。 |
| `/live/[id]` | `parity_gap` | 直播详情存在本地假竞猜和假弹幕互动。 |
| `/community-search` | `parity_gap` | 推荐和搜索失败会被伪装成空内容。 |
| `/post/[id]` | `parity_gap` | 顶栏没有保留旧页作者信息和关注入口。 |
| `/guess/[id]` | `parity_gap` | 页面混入硬编码统计、倒计时、收藏和评论演示态。 |
| `/product/[id]` | `verified` | `BUG-20260420-003` 已验证修复：固定徽标、硬编码换购价和伪造服务卖点已移除，换购表达已回到真实库存抵扣结果。 |
| `/cart` | `parity_gap` | 购物车和推荐流请求失败会被伪装成空内容。 |
| `/payment` | `verified` | `BUG-20260420-011` 与 `BUG-20260420-065` 已关闭：地址/优惠券失败已改成显式错误态，发票假开关也已移除，页面能力与下单契约一致。 |
| `/orders` | `parity_gap` | 接口失败会被伪装成空订单页。 |
| `/warehouse` | `parity_gap` | 接口失败会被伪装成空仓库页。 |
| `/my-shop` | `verified` | `BUG-20260420-008` 已关闭，`BUG-20260420-064` 已验证修复；当前未再发现这页遗留的用户端假操作问题。 |
| `/brand-auth` | `verified` | `BUG-20260420-012` 已关闭，`BUG-20260420-063` 已验证修复；当前这页失败态和成功态伪数据问题都已收口。 |
| `/add-product` | `verified` | `BUG-20260420-013` 已关闭：第 3 步已改成真实提交确认页，不再展示不会真实提交的配置 UI。 |
| `/user/[uid]` | `parity_gap` | 接口失败会回退成伪造的默认主页。 |
| `/friends` | `parity_gap` | 社交链和竞猜链失败会被伪装成空好友页。 |
| `/notifications` | `parity_gap` | 读取失败会被伪装成空列表，全部已读还会假成功。 |
| `/chat` | `parity_gap` | 会话列表失败会被伪装成空消息页。 |
| `/chat/[id]` | `parity_gap` | 会话详情失败会被伪装成空聊天线程。 |
| `/chat-detail` | `parity_gap` | 兼容入口会把所有访问硬编码跳到 `/chat/u123`。 |
| `/address` | `parity_gap` | 地址读取失败仍会被伪装成空地址页；`BUG-20260420-066` 已验证修复，空壳“管理/完成”切换已移除。 |
| `/coupons` | `verified` | `BUG-20260420-026` 已关闭，`BUG-20260420-067` 与 `BUG-20260420-091` 已验证修复；列表失败、主 CTA 和顶部统计口径问题都已收口。 |
| `/invite` | `parity_gap` | 后端未承接时，页面仍展示静态奖励和“请先登录”假态。 |
| `/checkin` | `parity_gap` | 后端未承接时，页面仍展示固定签到进度和静态任务。 |
| `/community` | `parity_gap` | 发帖面板展示了超出真实 payload 的本地发布配置。 |
| `/features` | `parity_gap` | 入口页仍把未闭环的邀请/签到能力当成正常福利入口。 |
| `/order-detail` | `parity_gap` | 已完成订单的“评价”按钮跳错到商品详情。 |
| `/review` | `verified` | `BUG-20260420-053` 与 `BUG-20260420-068` 都已验证修复：图片上传占位已补齐，缺参时也已改成页级错误态。 |
| `/shop/[id]` | `verified` | `BUG-20260420-032` 已关闭，`BUG-20260420-042` 与 `BUG-20260420-069` 已验证修复；当前这页失败态、成功态伪评分和本地假互动都已收口。 |
| `/guess-history` | `parity_gap` | 历史读取失败会被伪装成“暂无记录”。 |
| `/novice-guess` | `parity_gap` | 静态引导页把演示奖励描述成真实入仓结果。 |
| `/splash` | `parity_gap` | 启动页用静态中奖跑马灯和承诺式文案伪装真实业务状态。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-001` | `P1` | `/login` | 登录页发送验证码失败时仍提示成功并回填假验证码 | [tests/bugs/open/BUG-20260420-001-login-send-code-false-success.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-001-login-send-code-false-success.md) |
| `BUG-20260420-002` | `P1` | `/guess/[id]` | 竞猜详情页混入伪造统计和本地交互状态 | [tests/bugs/open/BUG-20260420-002-guess-detail-uses-fabricated-stats.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-002-guess-detail-uses-fabricated-stats.md) |
| `BUG-20260420-003` | `P1` | `/product/[id]` | 商品详情页伪造徽标和换购价格表达 | [tests/bugs/open/BUG-20260420-003-product-detail-fabricates-badges-and-exchange-price.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-003-product-detail-fabricates-badges-and-exchange-price.md) |
| `BUG-20260420-004` | `P2` | `/orders` | 订单页把接口失败静默吞成空列表 | [tests/bugs/open/BUG-20260420-004-orders-page-swallows-api-errors-as-empty-state.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-004-orders-page-swallows-api-errors-as-empty-state.md) |
| `BUG-20260420-005` | `P2` | `/warehouse` | 仓库页把接口失败静默吞成空列表 | [tests/bugs/open/BUG-20260420-005-warehouse-page-swallows-api-errors-as-empty-state.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-005-warehouse-page-swallows-api-errors-as-empty-state.md) |
| `BUG-20260420-006` | `P1` | `/me` | 个人中心快捷入口使用了错误路由 | [tests/bugs/open/BUG-20260420-006-me-shortcuts-use-wrong-routes.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-006-me-shortcuts-use-wrong-routes.md) |
| `BUG-20260420-007` | `P2` | `/` | 首页把多个接口失败静默吞成正常空区块 | [tests/bugs/open/BUG-20260420-007-home-page-swallows-section-fetch-failures.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-007-home-page-swallows-section-fetch-failures.md) |
| `BUG-20260420-008` | `P1` | `/my-shop` | 我的店铺页读取失败后错误回退为“申请开店”状态 | [tests/bugs/open/BUG-20260420-008-my-shop-failure-falls-back-to-application-state.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-008-my-shop-failure-falls-back-to-application-state.md) |
| `BUG-20260420-009` | `P2` | `/mall` | 商城首页把商品和购物车请求失败静默吞成空内容 | [tests/bugs/closed/BUG-20260420-009-mall-home-swallows-fetch-failures-as-empty-feed.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/closed/BUG-20260420-009-mall-home-swallows-fetch-failures-as-empty-feed.md) |
| `BUG-20260420-010` | `P2` | `/cart` | 购物车页把购物车和推荐流请求失败静默吞成空内容 | [tests/bugs/open/BUG-20260420-010-cart-page-swallows-fetch-failures-as-empty-state.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-010-cart-page-swallows-fetch-failures-as-empty-state.md) |
| `BUG-20260420-011` | `P2` | `/payment` | 支付页把地址和优惠券请求失败伪装成“无数据” | [tests/bugs/closed/BUG-20260420-011-payment-page-masks-address-and-coupon-fetch-errors.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/closed/BUG-20260420-011-payment-page-masks-address-and-coupon-fetch-errors.md) |
| `BUG-20260420-012` | `P2` | `/brand-auth` | 品牌授权页把概览请求失败静默吞成空页面 | [tests/bugs/closed/BUG-20260420-012-brand-auth-page-swallows-overview-failures.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/closed/BUG-20260420-012-brand-auth-page-swallows-overview-failures.md) |
| `BUG-20260420-013` | `P1` | `/add-product` | 上架商品页展示了一整套不会落库的配置 UI | [tests/bugs/closed/BUG-20260420-013-add-product-page-shows-non-persisted-config-ui.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/closed/BUG-20260420-013-add-product-page-shows-non-persisted-config-ui.md) |
| `BUG-20260420-014` | `P2` | `/search` | 搜索页在缺少评分时伪造商品评分 | [tests/bugs/open/BUG-20260420-014-search-page-fabricates-product-ratings.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-014-search-page-fabricates-product-ratings.md) |
| `BUG-20260420-015` | `P1` | `/user/[uid]` | 用户主页读取失败后回退成伪造的默认主页数据 | [tests/bugs/open/BUG-20260420-015-user-profile-falls-back-to-fake-profile-data.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-015-user-profile-falls-back-to-fake-profile-data.md) |
| `BUG-20260420-016` | `P2` | `/friends` | 好友页把社交链和竞猜链请求失败静默吞成空页面 | [tests/bugs/open/BUG-20260420-016-friends-page-swallows-social-failures-as-empty-state.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-016-friends-page-swallows-social-failures-as-empty-state.md) |
| `BUG-20260420-017` | `P2` | `/notifications` | 通知页把通知读取失败静默吞成空列表 | [tests/bugs/open/BUG-20260420-017-notifications-page-swallows-fetch-failure-as-empty.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-017-notifications-page-swallows-fetch-failure-as-empty.md) |
| `BUG-20260420-018` | `P1` | `/notifications` | 通知页“全部已读”在接口失败时仍本地标记成功 | [tests/bugs/open/BUG-20260420-018-notifications-mark-all-read-ignores-api-failure.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-018-notifications-mark-all-read-ignores-api-failure.md) |
| `BUG-20260420-019` | `P2` | `/chat` | 会话列表页把聊天读取失败静默吞成空列表 | [tests/bugs/open/BUG-20260420-019-chat-list-swallows-fetch-failure-as-empty.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-019-chat-list-swallows-fetch-failure-as-empty.md) |
| `BUG-20260420-020` | `P2` | `/chat/[id]` | 聊天详情页把会话读取失败静默吞成空线程 | [tests/bugs/open/BUG-20260420-020-chat-detail-swallows-fetch-failure-as-empty-thread.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-020-chat-detail-swallows-fetch-failure-as-empty-thread.md) |
| `BUG-20260420-021` | `P2` | `/ranking` | 排行榜页把各榜单读取失败静默吞成空榜单 | [tests/bugs/open/BUG-20260420-021-ranking-page-swallows-fetch-failures-as-empty.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-021-ranking-page-swallows-fetch-failures-as-empty.md) |
| `BUG-20260420-022` | `P2` | `/lives` | 直播列表页把直播读取失败静默吞成空列表 | [tests/bugs/open/BUG-20260420-022-lives-page-swallows-fetch-failure-as-empty.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-022-lives-page-swallows-fetch-failure-as-empty.md) |
| `BUG-20260420-023` | `P1` | `/live/[id]` | 直播详情页把参与竞猜和弹幕做成本地假互动 | [tests/bugs/open/BUG-20260420-023-live-detail-uses-fake-interactions.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-023-live-detail-uses-fake-interactions.md) |
| `BUG-20260420-024` | `P2` | `/community-search` | 社区搜索页把推荐和搜索请求失败静默吞成空内容 | [tests/bugs/open/BUG-20260420-024-community-search-swallows-fetch-failures-as-empty.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-024-community-search-swallows-fetch-failures-as-empty.md) |
| `BUG-20260420-025` | `P2` | `/address` | 收货地址页把地址读取失败静默吞成空地址列表 | [tests/bugs/open/BUG-20260420-025-address-page-swallows-fetch-failure-as-empty.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-025-address-page-swallows-fetch-failure-as-empty.md) |
| `BUG-20260420-026` | `P2` | `/coupons` | 优惠券页把优惠券读取失败静默吞成空列表 | [tests/bugs/closed/BUG-20260420-026-coupons-page-swallows-fetch-failure-as-empty.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/closed/BUG-20260420-026-coupons-page-swallows-fetch-failure-as-empty.md) |
| `BUG-20260420-027` | `P1` | `/invite` | 邀请页把未承接后端链路伪装成“请先登录 + 静态奖励”的正常页面 | [tests/bugs/open/BUG-20260420-027-invite-page-masks-missing-backend-with-fallback-ui.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-027-invite-page-masks-missing-backend-with-fallback-ui.md) |
| `BUG-20260420-028` | `P1` | `/checkin` | 签到页在后端未承接时回退成固定签到数据和静态任务 | [tests/bugs/open/BUG-20260420-028-checkin-page-fabricates-streak-and-task-data.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-028-checkin-page-fabricates-streak-and-task-data.md) |
| `BUG-20260420-029` | `P1` | `/community` | 社区发帖面板把多项本地选择伪装成真实发布配置 | [tests/bugs/open/BUG-20260420-029-community-publisher-exposes-non-persisted-controls.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-029-community-publisher-exposes-non-persisted-controls.md) |
| `BUG-20260420-030` | `P2` | `/features` | 功能聚合页把未闭环的邀请/签到能力当成正常入口暴露 | [tests/bugs/open/BUG-20260420-030-features-page-exposes-unready-invite-checkin-entry.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-030-features-page-exposes-unready-invite-checkin-entry.md) |
| `BUG-20260420-031` | `P1` | `/order-detail` | 订单详情页“评价”主按钮跳到了商品详情而不是评价页 | [tests/bugs/open/BUG-20260420-031-order-detail-review-action-routes-to-product.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-031-order-detail-review-action-routes-to-product.md) |
| `BUG-20260420-032` | `P1` | `/shop/[id]` | 店铺详情页在读取失败后回退成一张合成店铺页 | [tests/bugs/closed/BUG-20260420-032-shop-detail-masks-fetch-failure-with-synthetic-shop.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/closed/BUG-20260420-032-shop-detail-masks-fetch-failure-with-synthetic-shop.md) |
| `BUG-20260420-042` | `P1` | `/shop/[id]` | 店铺详情成功态仍用本地推导伪造评分和开店时间 | [tests/bugs/open/BUG-20260420-042-shop-detail-synthesizes-rating-and-opened-year.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-042-shop-detail-synthesizes-rating-and-opened-year.md) |
| `BUG-20260420-033` | `P2` | `/novice-guess` | 新手竞猜页把本地演示奖励描述成真实入仓结果 | [tests/bugs/open/BUG-20260420-033-novice-guess-fakes-warehouse-rewards.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-033-novice-guess-fakes-warehouse-rewards.md) |
| `BUG-20260420-034` | `P2` | `/guess-history` | 竞猜历史页把历史读取失败静默吞成空记录 | [tests/bugs/open/BUG-20260420-034-guess-history-swallows-fetch-failure-as-empty.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-034-guess-history-swallows-fetch-failure-as-empty.md) |
| `BUG-20260420-035` | `P2` | `/chat-detail` | 聊天详情兼容入口把所有访问都硬编码跳到 `/chat/u123` | [tests/bugs/open/BUG-20260420-035-chat-detail-alias-hardcodes-target-user.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-035-chat-detail-alias-hardcodes-target-user.md) |
| `BUG-20260420-036` | `P2` | `/edit-profile` | 编辑主页页暴露了未承接的封面上传入口 | [tests/bugs/open/BUG-20260420-036-edit-profile-exposes-non-persisted-cover-upload.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-036-edit-profile-exposes-non-persisted-cover-upload.md) |
| `BUG-20260420-037` | `P2` | `/reset-password` | 重置密码页在未校验验证码的情况下直接进入“设置新密码”步骤 | [tests/bugs/open/BUG-20260420-037-reset-password-accepts-unverified-code-step.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-037-reset-password-accepts-unverified-code-step.md) |
| `BUG-20260420-038` | `P2` | `/splash` | Splash 启动页用静态中奖跑马灯和“稳赚不亏/体验金”文案伪装真实业务承诺 | [tests/bugs/open/BUG-20260420-038-splash-page-fabricates-winner-feed-and-guaranteed-reward-copy.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-038-splash-page-fabricates-winner-feed-and-guaranteed-reward-copy.md) |
| `BUG-20260420-051` | `P2` | `/register` | 注册页把本地长度判断伪装成已完成手机验证步骤 | [tests/bugs/open/BUG-20260420-051-register-accepts-unverified-code-step.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-051-register-accepts-unverified-code-step.md) |
| `BUG-20260420-052` | `P2` | `/post/[id]` | 动态详情页顶栏缺失旧页作者信息和关注入口 | [tests/bugs/open/BUG-20260420-052-post-detail-header-missing-author-follow-cta.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-052-post-detail-header-missing-author-follow-cta.md) |
| `BUG-20260420-062` | `P2` | `/mall` | 商城分类页把分类请求失败静默吞成“当前分类暂无商品” | [tests/bugs/closed/BUG-20260420-062-mall-category-fetch-failure-masked-as-empty-category.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/closed/BUG-20260420-062-mall-category-fetch-failure-masked-as-empty-category.md) |
| `BUG-20260420-063` | `P1` | `/brand-auth` | 品牌授权页成功态仍用本地映射伪造保证金和品牌经营指标 | [tests/bugs/open/BUG-20260420-063-brand-auth-page-fabricates-brand-metrics-and-deposit.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-063-brand-auth-page-fabricates-brand-metrics-and-deposit.md) |
| `BUG-20260420-064` | `P1` | `/my-shop` | 我的店铺页暴露了未承接的店铺设置和商品管理操作 | [tests/bugs/open/BUG-20260420-064-my-shop-page-exposes-non-functional-management-actions.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-064-my-shop-page-exposes-non-functional-management-actions.md) |
| `BUG-20260420-065` | `P2` | `/payment` | 支付页暴露了不会进入下单 payload 的发票开关 | [tests/bugs/closed/BUG-20260420-065-payment-page-exposes-non-persisted-invoice-toggle.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/closed/BUG-20260420-065-payment-page-exposes-non-persisted-invoice-toggle.md) |
| `BUG-20260420-066` | `P2` | `/address` | 收货地址页“管理/完成”切换只是空状态切换，没有实际管理模式 | [tests/bugs/open/BUG-20260420-066-address-page-manage-mode-is-a-dead-toggle.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-066-address-page-manage-mode-is-a-dead-toggle.md) |
| `BUG-20260420-067` | `P2` | `/coupons` | 优惠券页“使用”按钮只是 toast，没有真实去使用链路 | [tests/bugs/open/BUG-20260420-067-coupons-page-use-cta-is-a-toast-only-action.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-067-coupons-page-use-cta-is-a-toast-only-action.md) |
| `BUG-20260420-091` | `P2` | `/coupons` | 优惠券页在读取失败时仍把可用券数量显示成真实 `0` | [tests/bugs/open/BUG-20260420-091-coupons-summary-shows-zero-on-load-failure.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-091-coupons-summary-shows-zero-on-load-failure.md) |
| `BUG-20260420-068` | `P2` | `/review` | 评价页缺少订单上下文校验，缺参时仍渲染完整评价表单 | [tests/bugs/open/BUG-20260420-068-review-page-allows-entry-without-required-order-context.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-068-review-page-allows-entry-without-required-order-context.md) |
| `BUG-20260420-069` | `P1` | `/shop/[id]` | 店铺详情页把关注、收藏、客服保留成本地假互动 | [tests/bugs/open/BUG-20260420-069-shop-detail-exposes-local-follow-favorite-and-chat-actions.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-069-shop-detail-exposes-local-follow-favorite-and-chat-actions.md) |
| `BUG-20260420-053` | `P2` | `/review` | 评价页缺少图片上传占位，页面能力和矩阵要求不一致 | [tests/bugs/open/BUG-20260420-053-review-page-missing-image-upload-placeholder.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-053-review-page-missing-image-upload-placeholder.md) |

## Common Pattern

| 模式 | 说明 |
| --- | --- |
| 接口已接但页面仍带演示态 | 页面不是纯消费真实接口，而是混入本地硬编码业务值。 |
| 失败被伪装成成功 | 错误分支没有明确暴露，导致 UI 呈现和真实链路脱节。 |
| 失败被伪装成空态 | 页面把请求失败渲染成“暂无数据”，会直接误导用户和回归判断。 |
| 失败被伪装成默认业务态 | 页面把读取失败回退成“未开店”“无地址”等看似合理但错误的业务状态。 |
| 页面导航未跟随真实路由 | 页面入口看起来可点，但会把用户送到错误地址。 |
| 页面层私自拼业务规则 | 价格、标签、统计由页面自行计算或写死，和契约边界不清。 |
| 页面配置和接口契约脱节 | 页面让用户填写配置，但提交 payload 完全不包含这些字段。 |
| 缺失值被伪装成高质量业务数据 | 没有评分、没有主页数据时，页面会凭空补出更“好看”的数值或内容。 |
| 写操作失败仍被当成功处理 | 例如“全部已读”接口失败后，页面仍显示成功结果。 |
| 页面提供了未接线的假互动 | 页面允许用户点击参与，但没有任何真实写链。 |
| 后端未承接被伪装成可用功能 | 页面直接请求不存在的链路，再用默认文案、固定奖励、空记录或假进度掩盖真实状态。 |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 先修 `/login` 的假成功验证码逻辑。 |
| `P1` | 修正 `/me` 的错误快捷入口路由。 |
| `P1` | 清理 `/guess/[id]` 的硬编码统计和本地伪交互。 |
| `P1` | 继续处理 `/orders`、`/warehouse` 这些仍会把失败伪装成空内容或默认态的页面。 |
| `P1` | 去掉 `/user/[uid]` 的假主页回退，失败时显示真实错误态。 |
| `P1` | 修正 `/notifications` 的“全部已读”假成功逻辑。 |
| `P1` | 清理 `/live/[id]` 的假竞猜和假弹幕互动，未接线前至少禁用并明确提示。 |
| `P1` | 修正 `/invite` 和 `/checkin` 的伪正常页面，未接线前不要展示静态奖励、固定进度和假空态。 |
| `P1` | 收敛 `/community` 发帖面板到真实 payload，移除未承接的本地发布配置。 |
| `P1` | 修正 `/order-detail` 的“评价”按钮路由，进入真实 `/review` 提交流程。 |
| `P1` | 修正 `/shop/[id]` 的错误态，不再在读取失败后渲染合成店铺页。 |
| `P2` | 修正 `/mall`、`/cart`、`/orders`、`/warehouse`、`/payment` 的错误态，不再把失败伪装成空内容或默认态。 |
| `P2` | 修正 `/address`、`/coupons` 的错误态，不再把失败伪装成空列表。 |
| `P2` | 修正 `/guess-history` 的错误态，不再把历史读取失败伪装成“暂无记录”。 |
| `P2` | 修正 `/chat-detail` 兼容入口，不再把所有访问写死到固定会话。 |
| `P2` | 移除 `/edit-profile` 未承接的封面上传入口，或先让接口真实承接。 |
| `P2` | 补齐 `/post/[id]` 顶栏作者信息和关注入口，和旧页结构与交互对齐。 |
| `P2` | 收敛 `/splash` 的中奖跑马灯和承诺式文案，不再把静态宣传素材冒充真实业务承诺。 |
| `P2` | 修正 `/features` 的能力入口状态，不再把未闭环的邀请/签到当正常入口。 |
| `P2` | 调整 `/novice-guess` 文案，让静态引导页不再冒充真实入仓奖励链路。 |
| `P2` | 修正首页分区级错误态，不再把失败伪装成空内容。 |
| `P2` | 去掉 `/search` 的伪评分展示，只显示真实评分。 |
| `P2` | 修正 `/friends`、`/notifications`、`/chat`、`/chat/[id]` 的错误态，不再把失败伪装成空页。 |
| `P2` | 修正 `/ranking`、`/lives`、`/community-search` 的错误态，不再把失败伪装成空内容。 |
