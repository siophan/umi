# Page Parity Matrix

最后更新：2026-04-20

这份文档用于统一管理“新系统页面是否和老系统对齐”。

使用规则：

- 当前事实只看 `umi/` 代码和 `umi/docs/`
- 老系统只作为页面结构、交互、文案、信息层级参考
- 不把老系统数据库字段当当前事实来源
- 每个页面最终只落到一个状态：`not_started / in_progress / parity_gap / verified / not_applicable`

状态说明：

| 状态 | 含义 |
| --- | --- |
| `not_started` | 还没开始逐页比对 |
| `in_progress` | 已开始比对，但还没出结论 |
| `parity_gap` | 已确认和老系统或当前业务要求不一致 |
| `verified` | 已完成页面、交互、接口、空态核对 |
| `not_applicable` | 兼容页、调试页、纯静态页，不纳入严格对齐 |

UI 对齐项：

| 项目 | 检查点 |
| --- | --- |
| 布局 | 区块层级、信息顺序、主次关系是否一致 |
| 视觉 | 颜色、卡片、间距、按钮、图标、字体层级是否接近 |
| 交互 | 返回、切换、筛选、弹层、空态、加载态是否一致 |
| 文案 | 标题、按钮、标签、状态文案是否一致 |
| 数据 | 页面依赖的接口字段、状态映射、金额换算是否正确 |

## User Pages

| 页面 | 新路由 | 新页面文件 | 老系统参考 | 页面类型 | API 现状 | 自动化现状 | 当前状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 首页 | `/` | [apps/web/src/app/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/page.tsx) | `/Users/ezreal/Downloads/joy/frontend/index.html` | 核心页 | 已接 API | 无页面专项测试 | `parity_gap` | `BUG-20260420-007`：分区接口失败被伪装成正常空首页 |
| 商城首页 | `/mall` | [apps/web/src/app/mall/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/mall/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无页面专项测试 | `parity_gap` | `BUG-20260420-009`：商品流和购物车请求失败被伪装成空内容；`BUG-20260420-062`：分类分支请求失败会被伪装成“当前分类暂无商品” |
| 排行榜 | `/ranking` | [apps/web/src/app/ranking/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ranking/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无页面专项测试 | `parity_gap` | `BUG-20260420-021`：榜单读取失败被伪装成空榜 |
| 直播列表 | `/lives` | [apps/web/src/app/lives/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/lives/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无页面专项测试 | `parity_gap` | `BUG-20260420-022`：直播读取失败被伪装成空列表 |
| 搜索 | `/search` | [apps/web/src/app/search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无页面专项测试 | `parity_gap` | `BUG-20260420-014`：无评分商品会被伪造 4.x 评分 |
| 登录 | `/login` | [apps/web/src/app/login/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/login/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-001`：失败时仍提示验证码发送成功并回填假验证码 |
| 注册 | `/register` | [apps/web/src/app/register/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/register/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `verified` | `BUG-20260420-051` 已验证修复：第一步现在会先调用真实验证码校验，再进入设置密码 |
| 重置密码 | `/reset-password` | [apps/web/src/app/reset-password/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/reset-password/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `verified` | `BUG-20260420-037` 已关闭：页面现已明确提示验证码不会在这一步单独校验，不再把本地长度判断伪装成“已验证通过” |
| 个人中心 | `/me` | [apps/web/src/app/me/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-006`：快捷入口路由和真实页面不一致 |
| 编辑资料 | `/edit-profile` | [apps/web/src/app/edit-profile/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-036`：页面暴露了未承接的封面上传入口 |
| 收货地址 | `/address` | [apps/web/src/app/address/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无页面专项测试 | `parity_gap` | `BUG-20260420-025`：地址读取失败被伪装成空地址列表；`BUG-20260420-066`：“管理/完成”切换没有实际管理态 |
| 优惠券 | `/coupons` | [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无页面专项测试 | `parity_gap` | `BUG-20260420-026` 已关闭：列表失败已改成显式错误态；`BUG-20260420-067`：“使用”按钮没有真实去使用链路；`BUG-20260420-091`：读取失败时顶部统计仍显示成真实 `0` |
| 好友 | `/friends` | [apps/web/src/app/friends/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/friends/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-016`：社交链和竞猜链请求失败被伪装成空页面 |
| 通知 | `/notifications` | [apps/web/src/app/notifications/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/notifications/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-017` `BUG-20260420-018`：读取失败被伪装成空列表，全部已读还会假成功 |
| 会话列表 | `/chat` | [apps/web/src/app/chat/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-019`：读取失败被伪装成空会话列表 |
| 聊天详情 | `/chat/[id]` | [apps/web/src/app/chat/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat/[id]/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-020`：会话失败被伪装成空聊天线程 |
| 聊天详情兼容入口 | `/chat-detail` | [apps/web/src/app/chat-detail/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/chat-detail/page.tsx) | `frontend/index.html` | 兼容页 | 路由别名 | 无专项自动化 | `parity_gap` | `BUG-20260420-035`：兼容入口把所有访问都写死到 `/chat/u123` |
| 用户主页 | `/user/[uid]` | [apps/web/src/app/user/[uid]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 部分 API 已测 | `parity_gap` | `BUG-20260420-015`：接口失败会回退成伪造的默认主页 |
| 社区首页 | `/community` | [apps/web/src/app/community/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-029`：发帖面板展示了超出真实 payload 的本地发布配置 |
| 社区搜索 | `/community-search` | [apps/web/src/app/community-search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/community-search/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-024`：推荐和搜索失败被伪装成空内容 |
| 动态详情 | `/post/[id]` | [apps/web/src/app/post/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/post/[id]/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-052`：顶栏缺失旧页作者信息和关注入口 |
| 竞猜详情 | `/guess/[id]` | [apps/web/src/app/guess/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess/[id]/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-002`：详情页仍混入硬编码统计和本地伪交互 |
| 竞猜历史 | `/guess-history` | [apps/web/src/app/guess-history/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/guess-history/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-034`：历史读取失败被伪装成“暂无记录” |
| 直播详情 | `/live/[id]` | [apps/web/src/app/live/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/live/[id]/page.tsx) | `frontend/index.html` | 核心页 | 部分接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-023`：互动区存在本地假竞猜和假弹幕 |
| 商品详情 | `/product/[id]` | [apps/web/src/app/product/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-003`：页面自造价格、固定标签和换购表达 |
| 店铺详情 | `/shop/[id]` | [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-032` 已关闭：读取失败已改成显式错误态；`BUG-20260420-042`：成功态“商品均分”仍会在无真实评分时回退本地 `4.8`；`BUG-20260420-069`：成功态仍暴露关注/收藏/客服的本地假互动 |
| 购物车 | `/cart` | [apps/web/src/app/cart/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/cart/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-010`：购物车和推荐流请求失败被伪装成空内容 |
| 支付页 | `/payment` | [apps/web/src/app/payment/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 部分 API 已测 | `parity_gap` | `BUG-20260420-011`：地址和优惠券请求失败被伪装成无数据；`BUG-20260420-065`：发票开关不会进入真实下单 payload |
| 订单列表 | `/orders` | [apps/web/src/app/orders/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/orders/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-004`：请求失败被伪装成空订单页 |
| 订单详情 | `/order-detail` | [apps/web/src/app/order-detail/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/order-detail/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-031`：已完成订单的“评价”主按钮跳错到商品详情 |
| 评价页 | `/review` | [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-053` 已验证修复：图片上传占位已补齐；`BUG-20260420-068`：缺少 `orderId/productId` 时仍允许进入完整表单 |
| 仓库 | `/warehouse` | [apps/web/src/app/warehouse/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-005`：请求失败被伪装成空仓库页 |
| 我的店铺 | `/my-shop` | [apps/web/src/app/my-shop/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-008`：状态读取失败会错误回退成开店申请页；`BUG-20260420-064`：成功态仍暴露未承接的店铺设置/商品编辑/下架操作 |
| 品牌授权 | `/brand-auth` | [apps/web/src/app/brand-auth/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/brand-auth/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-012`：授权概览请求失败被伪装成空页面；`BUG-20260420-063`：成功态仍混入本地写死的保证金和品牌经营数字 |
| 上架商品 | `/add-product` | [apps/web/src/app/add-product/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/add-product/page.tsx) | `frontend/index.html` | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-013`：展示了不会提交到接口的假配置 UI |
| 邀请 | `/invite` | [apps/web/src/app/invite/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/invite/page.tsx) | `frontend/index.html` | 核心页 | 前端直连后端未见 | 无专项自动化 | `parity_gap` | `BUG-20260420-027`：后端未承接时仍展示静态奖励和“请先登录”假态 |
| 签到 | `/checkin` | [apps/web/src/app/checkin/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/checkin/page.tsx) | `frontend/index.html` | 核心页 | 前端直连后端未见 | 无专项自动化 | `parity_gap` | `BUG-20260420-028`：后端未承接时仍展示固定签到进度和任务 |
| 功能聚合 | `/features` | [apps/web/src/app/features/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx) | `frontend/index.html` | 入口页 | 部分接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-030`：继续把未闭环的邀请/签到能力当正常入口暴露 |
| 新手竞猜 | `/novice-guess` | [apps/web/src/app/novice-guess/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/novice-guess/page.tsx) | `frontend/index.html` | 引导页 | 本地态 | 无专项自动化 | `parity_gap` | `BUG-20260420-033`：静态演示奖励被描述成真实入仓结果 |
| 调试页 | `/test-api` | [apps/web/src/app/test-api/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/test-api/page.tsx) | 无 | 调试页 | 已接 API | 不纳入正式验收 | `not_applicable` | 手工联调工具 |
| AI Demo | `/ai-demo` | [apps/web/src/app/ai-demo/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/ai-demo/page.tsx) | 无 | Demo 页 | 本地态 | 不纳入正式验收 | `not_applicable` | 非业务页 |
| Splash | `/splash` | [apps/web/src/app/splash/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/splash/page.tsx) | `frontend/index.html` | 引导页 | 本地态 | 无专项自动化 | `parity_gap` | `BUG-20260420-038`：启动页用静态中奖跑马灯和承诺式文案伪装真实业务状态 |

## Admin Pages

| 页面 | 新路由 | 新页面文件 | 老系统参考 | 页面类型 | API 现状 | 自动化现状 | 当前状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 后台登录 | `#/login` | [apps/admin/src/components/login-screen.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/components/login-screen.tsx) | [admin/src/pages/login/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/login/index.tsx) | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-126`：登录接口 OpenAPI 没有声明真实的 `401/403` 错误契约 |
| 仪表盘 | `#/dashboard` | [apps/admin/src/pages/dashboard-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/dashboard-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 核心页 | 已接 API | smoke 覆盖 | `parity_gap` | `BUG-20260420-067`：订单状态分布遗漏 `closed`；`BUG-20260420-068`：热门竞猜会混入非进行中竞猜 |
| 用户列表 | `#/users/list` | [apps/admin/src/pages/users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) | [admin/src/pages/users/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/users/index.tsx) | 核心页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-039`：手机号/店铺名称筛选只过滤当前页；`BUG-20260420-040`：店主标签计数和实际过滤口径不一致；`BUG-20260420-043`：详情抽屉子表失败会被伪装成 0 条记录和空态 |
| 权限管理 | `#/users/permissions` | [apps/admin/src/pages/permissions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/permissions-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 核心页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-048`：父权限选择和后端写入都没有防循环校验；`BUG-20260420-059`：内置权限允许编辑，但目录同步会覆盖编辑结果，改码后还会长出重复权限；`BUG-20260420-061`：停用父权限不会撤销已展开的子权限生效；`BUG-20260420-066`：后台权限当前主要只控制菜单和页面，受保护 admin API 没有按权限码拦截 |
| 角色管理 | `#/system/roles` | [apps/admin/src/pages/roles-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/roles-page.tsx) | 无明确旧页文件 | 核心页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-058`：权限数和权限模块会把已停用权限继续算进去，与实际生效权限不一致 |
| 分类管理 | `#/system/categories` | [apps/admin/src/pages/categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx) | 无明确旧页文件 | 核心页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-060`：新增弹层仍把停用父分类当成可选项，提交后才被后端拒绝 |
| 系统用户 | `#/system/users` | [apps/admin/src/pages/system-users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-users-page.tsx) | 无明确旧页文件 | 核心页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-046`：当前登录账号仍暴露必然失败的停用动作；`BUG-20260420-047`：角色筛选不能覆盖停用角色绑定；`BUG-20260420-057`：角色接口失败会把整张系统用户表清空 |
| 系统通知 | `#/system/notifications` | [apps/admin/src/pages/system-notifications-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-notifications-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-049`：查看抽屉不展示通知正文；`BUG-20260420-050`：重复发送同内容消息会被误合并成一条批次 |
| 系统聊天 | `#/system/chats` | [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx) | [admin/src/pages/chats/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/chats/index.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-117`：只有会话摘要，缺少消息明细审查链路；`BUG-20260420-118`：接口 summary 已返回，但页面没有展示聊天统计概览 |
| 权益管理 | `#/equity` | [apps/admin/src/pages/equity-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/equity-page.tsx) | [admin/src/pages/equity/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/equity/index.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-119`：列表接口已返回 summary，但页面没有展示权益总览统计 |
| 系统排行榜 | `#/system/rankings` | [apps/admin/src/pages/system-rankings-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-rankings-page.tsx) | [admin/src/pages/rankings/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/rankings/index.tsx) | 业务页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-120`：当前只剩榜单读取，缺少刷新排行榜管理动作和 refresh 链路 |
| 商品列表 | `#/products/list` | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) | [admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx) | 核心页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-121`：页面只读取前 100 条并在前端做搜索、筛选和分页；`BUG-20260420-122`：分类字典失败会把商品主表一起清空；`BUG-20260420-123`：商品管理页退化成只读摘要页，丢失新增、编辑、上下架和删除链路；`BUG-20260420-124`：类目筛选会漏掉停用类目下的现存商品；`BUG-20260420-125`：类目筛选只按名称匹配，无法区分树形同名类目 |
| 品牌商品库 | `#/products/brands` | [apps/admin/src/pages/brand-library-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-library-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-074`：只加载前 100 条并在本地筛选分页；`BUG-20260420-075`：品牌/分类字典失败会把主表一起清空；`BUG-20260420-076`：筛选器和编辑表单都隐藏停用品牌/停用分类绑定；`BUG-20260420-077`：分类筛选只用名称，无法精确区分树形同名分类；`BUG-20260420-078`：后台创建/编辑品牌商品仍允许直接挂到停用品牌/停用分类 |
| 品牌方列表 | `#/brands/list` | [apps/admin/src/pages/brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-069`：类目接口失败会把品牌主表一起清空；`BUG-20260420-070`：筛选器和编辑表单都隐藏停用类目；`BUG-20260420-071`：后台创建/编辑品牌仍允许直接挂到停用类目；`BUG-20260420-072`：搜索能力退化成只搜品牌名；`BUG-20260420-073`：类目筛选只用名称，无法精确区分树形同名分类 |
| 品牌入驻审核 | `#/brands/apply` | [apps/admin/src/pages/brand-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brand-applies-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `not_started` | 对齐审核状态和详情 |
| 商品授权 | `#/product-auth/list` | [apps/admin/src/pages/product-auth-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/product-auth-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `not_started` | 对齐授权状态和筛选 |
| 授权记录 | `#/product-auth/records` | [apps/admin/src/pages/product-auth-records-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/product-auth-records-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `not_started` | 对齐记录表结构 |
| 店铺列表 | `#/shops/list` | [apps/admin/src/pages/shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx) | [admin/src/pages/shops/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/shops/index.tsx) | 核心页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-044`：查看动作只有摘要抽屉，缺少真实详情链路；`BUG-20260420-045`：主营类目筛选会漏掉停用类目下的现存店铺 |
| 开店审核 | `#/shops/apply` | [apps/admin/src/pages/shop-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-applies-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-115`：类目字典失败会把审核主表一起清空；`BUG-20260420-116`：主营类目筛选会漏掉停用类目下的现存申请 |
| 品牌授权申请 | `#/shops/brand-auth` | [apps/admin/src/pages/shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-079`：审核列表和授权记录一条失败会一起被清空；`BUG-20260420-080`：记录抽屉不展示 scoped 授权对象；`BUG-20260420-081`：撤销 scoped 授权会把整品牌商品一起下架 |
| 品牌授权记录 | `#/shops/brand-auth/records` | [apps/admin/src/pages/shop-brand-auth-records-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-records-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `not_started` | 对齐记录表 |
| 店铺商品 | `#/shops/products` | [apps/admin/src/pages/shop-products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-products-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-114`：当前整表拉取商品并在前端做筛选和分页 |
| 竞猜列表 | `#/guesses/list` | [apps/admin/src/pages/guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx) | [admin/src/pages/guesses/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/index.tsx) | 核心页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-082`：分类字典失败会把竞猜主表一起清空；`BUG-20260420-083`：查看动作只有摘要抽屉，缺少真实详情与开奖链路；`BUG-20260420-085`：分类筛选会漏掉停用分类下的现存竞猜；`BUG-20260420-086`：分类筛选只用名称，无法精确区分树形同名分类；`BUG-20260420-087`：详情抽屉把金额再次按分格式化 |
| 创建竞猜 | `#/guesses/create` | [apps/admin/src/pages/guess-create-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guess-create-page.tsx) | [admin/src/pages/guesses/create.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/create.tsx) | 业务页 | 已接部分 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-084`：创建竞猜入口跳到空壳页面，没有表单和创建写链路 |
| 好友竞猜 | `#/guesses/friends` | [apps/admin/src/pages/friend-guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/friend-guesses-page.tsx) | [admin/src/pages/guesses/friends.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/friends.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-088`：只剩摘要抽屉，缺少详情与强制结算链路；`BUG-20260420-089`：状态被压扁成三档，丢失“待确认”阶段 |
| PK 对战 | `#/pk` | [apps/admin/src/pages/pk-matches-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/pk-matches-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-090`：缺少旧页统计概览和 stats 链路 |
| 订单列表 | `#/orders/list` | [apps/admin/src/pages/orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx) | [admin/src/pages/orders/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/index.tsx) | 核心页 | 已接 API | smoke 有覆盖 | `parity_gap` | `BUG-20260420-092`：当前只剩摘要抽屉，缺少 stats / 详情 / 发货 / 退款审核链路；`BUG-20260420-093`：订单金额再次按分格式化；`BUG-20260420-094`：缺少 `delivered` 状态 tab；`BUG-20260420-095`：退款拒绝被映射成“已关闭” |
| 交易流水 | `#/orders/transactions` | [apps/admin/src/pages/order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-093`：流水金额再次按分格式化；`BUG-20260420-096`：未支付和已关闭订单被混入支付流水；`BUG-20260420-097`：退款状态被压成“退款链路” |
| 物流管理 | `#/orders/logistics` | [apps/admin/src/pages/order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx) | [admin/src/pages/orders/logistics.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/logistics.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-098`：物流方式筛选值和返回文案不一致；`BUG-20260420-099`：页面只剩只读列表，缺少发货和签收动作 |
| 仓库列表 | `#/warehouse/virtual` / `#/warehouse/physical` | [apps/admin/src/pages/warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx) | [admin/src/pages/warehouse/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/index.tsx) | 核心页 | 已接 API | API 已测 | `parity_gap` | `BUG-20260420-100`：仓库主页面没有接入 admin stats；`BUG-20260420-101`：实体仓会把后端返回的 `completed` 记录直接过滤掉 |
| 寄售市场 | `#/warehouse/consign` | [apps/admin/src/pages/warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx) | [admin/src/pages/warehouse/consign.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/consign.tsx) | 业务页 | 已接 API | 无页面专项自动化 | `parity_gap` | `BUG-20260420-102`：寄售金额再次按分格式化；`BUG-20260420-103`：只剩查看抽屉，缺少审核和强制下架动作 |
| 营销轮播 | `#/marketing/banners` | [apps/admin/src/pages/marketing-banners-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-banners-page.tsx) | [admin/src/pages/marketing/banners.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/banners.tsx) | 运营页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-108`：轮播配置不再支持站内页面跳转 |
| 营销签到 | `#/marketing/checkin` | [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx) | [admin/src/pages/marketing/checkin.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/checkin.tsx) | 运营页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-104`：状态 tab 只统计当前筛选结果；`BUG-20260420-105`：签到统计概览和 stats 链路缺失 |
| 营销优惠券 | `#/marketing/coupons` | [apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx) | [admin/src/pages/marketing/coupons.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/coupons.tsx) | 运营页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-107`：缺少发放/使用统计概览和 stats 链路 |
| 营销邀请 | `#/marketing/invite` | [apps/admin/src/pages/marketing-invite-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-invite-page.tsx) | [admin/src/pages/marketing/invite.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/invite.tsx) | 运营页 | 已接 API | 无专项自动化 | `parity_gap` | `BUG-20260420-106`：奖励金额、奖励状态和奖励总额统计上下文已丢失 |
| 社区评论管理 | `#/community/comments` | [apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx) | [admin/src/pages/community/comments.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/comments.tsx) | 治理页 | 本地态 | 无专项自动化 | `parity_gap` | `BUG-20260420-109`：仍是本地评论样例页，缺少真实审核和删除链路 |
| 社区动态管理 | `#/community/posts` | [apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx) | [admin/src/pages/community/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/index.tsx) | 治理页 | 本地态 | 无专项自动化 | `parity_gap` | `BUG-20260420-110`：仍是本地帖子样例页，缺少真实内容治理链路 |
| 举报管理 | `#/community/reports` | [apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx) | [admin/src/pages/community/reports.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/reports.tsx) | 治理页 | 本地态 | 无专项自动化 | `parity_gap` | `BUG-20260420-111`：仍是本地举报样例页，缺少通过/驳回/封禁处理链路 |
| 直播管理 | `#/live/list` | [apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx) | [admin/src/pages/live/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/live/index.tsx) | 业务页 | 本地态 | 无专项自动化 | `parity_gap` | `BUG-20260420-112`：仍是本地直播间样例页，缺少真实列表、统计概览和强制下播链路 |
| 弹幕管理 | `#/live/danmaku` | [apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx) | [admin/src/App.tsx](/Users/ezreal/Downloads/joy/admin/src/App.tsx) | 业务页 | 本地态 | 无专项自动化 | `parity_gap` | `BUG-20260420-113`：仍是伪造弹幕样例页，当前没有真实承接链却展示成可用模块 |

## Working Rules

| 规则 | 说明 |
| --- | --- |
| 一页一结论 | 每个页面最终都要能落到 `verified` 或 `parity_gap` |
| 先页面后接口 | 先确认信息架构和交互，再核对数据和状态 |
| 兼容页不做重设计 | 兼容路由只校验跳转和参数传递 |
| Demo 页不纳入业务对齐 | `ai-demo`、`test-api` 这类只标用途，不做强制一致 |
| 差异必须挂 Bug | 确认不一致后，不在矩阵里写长说明，转到 `tests/bugs/open/` |
