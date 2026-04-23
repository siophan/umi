# AGENTS

## Start Here

进入这个项目的新线程，先按这个顺序建立上下文：

- [docs/db.md](docs/db.md)
- [docs/schema-reference.md](docs/schema-reference.md)
- [docs/status-codes.md](docs/status-codes.md)
- [docs/ui-spec.md](docs/ui-spec.md)
- [docs/flows.md](docs/flows.md)
- [README.md](README.md)

如果任务和数据库无关，再按对应模块继续下钻。

数据库相关任务默认禁止一上来直接查 MySQL。

只有在以下情况才允许直接查库：

- `umi/docs/db.md` 没有覆盖到目标表或目标字段
- 文档与代码、页面语义明显冲突，需要核实当前真实结构
- 任务本身就是核对索引、约束、实际列类型

## Quick Links

- 数据库结构入口：[docs/db.md](docs/db.md)
- 真实表字段速查：[docs/schema-reference.md](docs/schema-reference.md)
- 状态编码入口：[docs/status-codes.md](docs/status-codes.md)
- UI 约束入口：[docs/ui-spec.md](docs/ui-spec.md)
- 业务流程入口：[docs/flows.md](docs/flows.md)
- 当前线程接手说明：[AGENTS.md](AGENTS.md)
- 当前工作区说明：[README.md](README.md)
- 老系统后端、管理端、前端：本机另一处 clone，不在当前仓库内，默认目录名分别是 `backend/`、`admin/`、`frontend/`

## Project Layout

这个仓库是"当前工作区"。"老系统"的后端、管理端、前端静态资源、历史文档在本机另一处 clone 的 `backend/`、`admin/`、`frontend/`、`docs/` 目录下，不在当前仓库内，具体路径依本机而异。

默认把当前仓库（`umi/`）当作主要工作区。

## What Umi Is

`umi/` 是当前整理后的工作区，里面有：

- [apps](apps)：应用层代码
- [packages](packages)：共享包
- [docs](docs)：当前事实文档

新线程如果没有特别说明，优先基于 `umi/` 下的代码和文档工作。

## Current UI Rules

- UI 任务默认先读 [docs/ui-spec.md](docs/ui-spec.md)
- 用户端对齐仍以 [docs/ui-rules.md](docs/ui-rules.md) 和老系统 `frontend/` 为参考
- 不允许从页面现状反推产品要求
- 不允许因为缺说明就自行重做结构、筛选器、流程步骤

## Web Frontend Hard Rules

用户端前端后续线程也必须遵守这些硬规则：

- 不允许继续新增“兼容页/别名页/包装页”壳子。确实要保兼容路径时，必须显式处理参数并做明确跳转或明确渲染，不能只做空 `re-export` 或直接套用别的页面组件。
- 不允许静态路由页直接 import 动态路由页当组件来渲染，例如把 `/detail` 直接套到 `/guess/[id]` 上，却不显式处理 `id`。这种结构默认判定为坏设计。
- 不允许把用户端页面继续做成 `800+ / 1000+` 行的大页中心，尤其是同时承载 feed、详情弹层、发布器、筛选器、状态归一和动作处理时；后续如果继续迭代这些页，优先先拆重 UI 子块和页面 helper。
- `apps/web/src/lib/api/shared.ts` 只允许保留稳定传输层能力，例如 token、基础请求和统一 envelope；不允许再把业务请求重新吸进一个隐性总接口层。
- 允许像首页、榜单、直播列表这种“服务端薄预取 + client 页”的结构，但服务端页必须继续保持最小数据集，不允许长成新的页面聚合中心。
- 当前 `apps/web` 后续默认优先级：清理不稳的兼容壳 > 收口仍然过重的高频页 > 防止请求层重新聚合。

## Admin Frontend Hard Rules

管理后台前端有几条硬性规则，后续线程不允许再踩：

- 不允许做“全后台统一页面数据壳”。禁止再出现类似 `AdminPageData`、`loadAdminPageData()`、`admin-loader.ts` 这种把多个页面数据聚到一个总对象里的设计。
- 不允许做“单一总接口文件”。禁止把后台所有请求继续堆回一个 `api.ts` 大杂烩；接口必须按业务拆分，例如 `auth`、`users`、`catalog`、`orders`、`merchant`、`system`。
- 不允许“换个名字继续聚合”。如果本质还是中心分发器、全局数据装配、总类型兜一切，就算改名也算违规。
- 不允许页面继续依赖“业务域总数据对象”做渲染。页面必须自己拿自己的数据，自己管理 `loading / issue / pagination / filters`，而不是吃外层拼好的总 payload。
- 不允许留死代码、死目录、空目录。旧实现不用了就立即删除，不能保留 `legacy-*`、`admin-page-data` 之类残骸等后面再说。
- 不允许“半拆”。如果开始拆某一层，就要把引用、类型、构建、空目录、残留文件一起收完，至少保证 `pnpm --filter @umi/admin typecheck` 通过。
- 后台页面优先按“单页单文件”组织。不要再为了省事把多个路由长期塞进一个页面文件里；如果暂时合并，只能作为短期过渡，并且下一步要继续拆掉。
- 允许薄 barrel 入口，但不允许把 `apps/admin/src/lib/api/system.ts`、`merchant.ts`、`catalog.ts` 这类入口再次做成跨域总接口文件；真实请求函数必须继续下沉到按业务域命名的子模块。
- 后台页面只要同时承载列表、详情抽屉、表单弹窗、动作状态和转换 helper，并且文件已经明显过大，就必须优先把重 UI 子块和页面 helper 拆出去；不允许长期把这些内容继续堆在一个页面文件里。
- 当前 `apps/admin` 整体架构已经过线。后续默认不要为了把 `250` 行页面压到 `150` 行而继续机械拆分；只有命中明显职责混杂、影响后续迭代，或再次出现中心化坏味道时才继续拆。
- `apps/admin` 后续默认优先级：关键链路回归 > 构建体积治理 > 防回退约束 > 局部页面再拆。

## Admin API Hard Rules

管理后台后端也有明确约束，后续线程默认继承：

- 不允许再把多个后台业务域塞回 `apps/api/src/modules/admin` 的单个超大实现文件。
- `apps/api/src/modules/admin/router.ts` 和各域 `index/barrel` 文件可以保持薄装配或薄导出层，但真实逻辑必须下沉到按业务域命名的文件。
- 如果一个后台域已经拆到 `orders / coupons / guesses / content` 这种层级，不允许再新增跨域 helper，把多个业务重新捏回一起。
- 继续拆后台 API 时，优先拆“跨域主逻辑混堆”的文件；已经是单业务域 shared/service 的文件，不要为了拆而拆。

## User API Hard Rules

非 `admin` 用户端 API 也按同样口径约束：

- 不允许继续把用户端多个业务域堆进单个超大 `router.ts`、`store.ts` 或 `query-store.ts`。
- `apps/api/src/modules/*/router.ts` 可以保持薄路由分发，但真实查询、映射、事务和组装逻辑应继续下沉到按业务域命名的 store/service/query 文件。
- 不允许为了“复用”再造一个用户端总 store 或总 service，把 `product / search / shop / order / warehouse / community` 主逻辑重新聚回一起。
- 继续优化非 `admin` API 时，优先处理跨域主逻辑混堆和 `800+ / 1000+` 行入口文件；已经是单业务域 shared/service 的文件，不要机械继续拆。

## Review Gate

后续线程在结束前，默认必须用下面这套闸门自检。命中任一条时，不算“建议优化”，而是直接视为这轮架构不通过：

- 新增了跨域总接口文件，尤其是把多个后台业务重新堆进 `apps/admin/src/lib/api/*.ts` 单文件。
- 新增了跨域后台总实现文件，尤其是把多个后台业务重新堆进 `apps/api/src/modules/admin/*.ts` 单文件。
- 以 `shared`、`helper`、`builder`、`loader`、`registry`、`manager` 为名，实际重新做了中心分发器或总数据聚合层。
- 新增页面文件同时承载列表、详情抽屉、表单弹窗、动作状态、转换 helper，且文件已经明显过大，却没有继续拆分。
- 新增或保留了没有明确参数承接的兼容页/别名页/包装页，尤其是静态路由直接套动态路由页。
- 已经开始拆结构，但没有同轮收完引用、类型、构建、残留文件、空目录。
- 用薄 barrel 当借口，把真实业务逻辑重新塞回入口文件。
- 为了图省事，把已拆开的后台域再次聚回一起。

只要命中这些情况，就默认不能以“先跑起来”“后面再拆”“先留过渡层”为理由通过。

## Pre-Exit Checklist

后续线程在准备结束前，默认至少自检下面这些问题：

1. 这轮有没有新增跨域总接口文件或总实现文件？
2. 这轮有没有把已拆开的后台业务域重新聚合？
3. 这轮新增的 `shared/helper` 文件是不是只放稳定纯函数、稳定类型和明确复用逻辑，而不是新的总逻辑中心？
4. 如果改的是 `apps/admin` 页面，这个页面是否仍然同时堆着列表、详情抽屉、表单弹窗和大段转换逻辑？如果是，为什么这一轮没有继续拆？
5. 如果改的是 `apps/admin/src/lib/api`，真实请求函数是否已经下沉到按业务域命名的子模块？
6. 如果改的是 `apps/api/src/modules/admin`，真实逻辑是否已经下沉到领域文件，而不是停留在 router/barrel/入口文件？
7. 这轮拆分后，是否已实际跑过对应应用的 `typecheck`；如果影响到构建入口，是否也跑过 `build`？
8. 如果改的是 `apps/web`，有没有继续保留或新增没有明确参数承接的兼容壳、包装页或别名页？
9. 如果改的是非 `admin` API，是否还把多个用户端业务域继续堆在单个超大 router/store 文件里？
10. 如果本地原服务正在跑，这轮结束前有没有补看 `3000 / 4000` 是否仍然存活，而不是只看 `typecheck / build`？

如果以上任一问题答不上来，默认说明这轮还不能结束。

## Architecture Pass Rules

这些规则不只针对管理后台，而是整个 `umi/` 工作区通用。以后无论前端还是后端，只要设计本身不合理，就直接判定为不通过，不能以“先跑起来”“后面再拆”为理由糊过去：

- 不允许为了省事做总入口大杂烩。前端禁止把多个页面数据、多个路由状态、多个领域逻辑塞进一个总对象或总调度器；后端禁止把多个业务域继续堆进一个超大 router、service、store 文件。
- 不允许“换名不换药”。如果本质上还是同一个坏设计，只是改文件名、改函数名、改目录名，这种处理一律算无效。
- 不允许保留没有职责边界的中间层。凡是只是做转手聚合、路径分发、重复透传、把多个业务硬拼起来的层，如果没有清晰收益，就应该删掉，而不是继续包一层。
- 不允许用“共享”当借口扩大耦合。共享类型、共享组件、共享请求函数必须是稳定且小边界的；不能把不相关业务因为“方便复用”强行捏到一起。
- 不允许把“共享 helper”做成新的总逻辑中心。共享文件只能放稳定纯函数、稳定类型和明确复用逻辑；不能重新吸走多个业务域主逻辑。
- 不允许一个文件长期承担多个页面、多个业务、多个角色的主逻辑。单页单文件、单业务单模块优先；确实需要合并时，必须是短期过渡，并且后续要继续拆开。
- 不允许留下死代码、死目录、空目录、兼容残骸、旧命名壳。只要主链路不再使用，就应在同一轮改动中删除。
- 不允许“半拆”。开始拆结构，就必须把引用、类型、构建、残留文件、目录结构一起收口，至少保证对应应用的 typecheck / build 通过。
- 不允许前端页面依赖外部拼装好的“全局页面数据包”做渲染；页面应自行面向自己的最小数据集。也不允许后端接口为了迎合某个页面临时返回无边界的混合 payload。
- 不允许因为当前需求急，就先引入明显错误的分层。明显错误的方案宁可先不写，也不要写完再说。
- 代码评审和自检时，先看设计是否合理，再看能不能运行。只要设计本身明显不合理，就应该直接 `pass` 掉，不进入“以后再优化”的默认路径。

## Current Architecture Status

当前工作区的架构状态先按下面这组事实理解：

- `apps/admin` 整体架构已经过线；后续默认不要再为了把 `250` 行页面拆到 `150` 行而机械扩散文件数量。
- `apps/web` 当前已没有 `800+ / 1000+` 的高频大页中心；`/create` 也已从 `1324` 行降到 `298` 行，当前用户端高频页已基本收成“协调层 + 子组件/区块 + 页面状态 hook”的结构
- `apps/web` 已开始收口的页面：`/community`、`/product/[id]`、`/post/[id]`、`/friends`；后续优先在现有“协调层 + 子组件 + 页面状态 hook”边界上继续收，不要再把这些子块重新塞回主文件
- `apps/web` 已开始收口的页面还包括：`/me`；主页摘要、活动分区和弹层边界已经拆出，后续不要重新堆回单文件
- `apps/web` 已开始收口的页面还包括：`/payment`；订单区块、价格区块和弹层边界已经拆出，后续不要重新堆回单文件
- `apps/web` 已开始收口的页面还包括：`/community-search`、`/my-shop`；默认态 / 结果态 / 开店申请态 / 已开店态等区块边界已经拆出，后续不要重新堆回单文件
- `apps/web` 已开始收口的页面还包括：`/create-user`、`/novice-guess`、`/search`、`/user/[uid]`、`/shop/[id]`；启动态 / 主体区块 / 结果态 / 私信浮层 / 店铺主体内容等边界已经拆出，后续不要重新堆回单文件
- `apps/web` 已开始收口的页面还包括：`/guess/[id]`、`/cart`、`/edit-profile`；竞猜主视觉 / 对战区 / 弹层、购物车店铺分组 / 推荐流 / 底栏、资料主体区块 / 资料弹层都已经拆出，后续不要重新堆回单文件
- `apps/web` 已开始收口的页面还包括：`/warehouse`、`/address`、`/orders`；仓库摘要 / 列表 / 寄售弹层、地址列表 / 地址表单弹层、订单统计 / tabs / 列表都已经拆出，后续不要重新堆回单文件
- `apps/web` 已开始收口的页面还包括：首页 `/`；首页客户端层已从 `1049` 行降到 `130` 行，二次拉数、派生映射和 guess/live 两套视图已拆到 `use-home-page-state / home-page-helpers / home-guess-view / home-live-view`，后续不要重新把这些内容塞回 `page-client.tsx`
- `apps/web` 已开始收口的页面还包括：`/create`；静态配置、页面状态、基本信息、竞猜选项、好友 PK、开奖设置和整组预览/商品选择/分享/发布/成功弹层已拆到 `create-helpers / use-create-page-state / create-basic-info-section / create-options-section / create-pk-section / create-settings-section / create-overlays`，后续不要重新回退成大页中心
- `apps/admin` 当前自维护导航层已拆成 `admin-menu-config / admin-route-meta / admin-navigation`；后续不要把菜单配置、路径别名、详情路由元数据重新堆回单个导航文件
- 老的兼容路由壳已经删除，不要再重新加回 `/detail`、`/product-detail`、`/post-detail`、`/live`、`/profile`、`/user-profile`、`/my-orders`、`/all-features`、`/myshop`、`/shop-detail`、`/chat-detail`
- `packages/shared` 当前已经过线：`api.ts` 只剩薄导出层，不要再把页面级 DTO、临时后台字段或局部 UI 需求塞回共享层。
- 非 `admin` API 当前已基本收平超大入口：`search / order / shop / product / warehouse / guess` 的 `router.ts` 都已是薄路由层，`community/store.ts` 也已收成薄 barrel；后续更适合只盯单业务域内部是否再次膨胀，不再按入口层继续机械拆分
- 本地服务校验当前固定按 `3000=web`、`4000=api` 处理；改完如果原服务本来就在跑，结束前要补看这两个端口是否还活着
- `apps/web` 的 `next dev` 如果出现 `ENOENT: ... .next/routes-manifest.json`，按“停掉当前 `3000` 进程 -> 删除 `apps/web/.next` -> 仅在 `3000` 原地重启”的顺序恢复，不要再起其他端口绕过去
- 后续如果继续做架构工作，默认顺序是：`apps/web` 兼容壳和大页边界 > `apps/api` 非 admin 大 router/store > 防止 `packages/shared` 重新膨胀

## Known Anti-Patterns

下面这些都是已经发生过、或者非常容易再次发生的反模式。后续线程看到类似做法，默认直接否掉：

- 不允许登录后一次性预加载整后台数据。首屏只拿当前页面需要的数据和必要登录态；禁止“进入后台顺手把所有列表页一起请求完”。
- 不允许把接口失败静默吞掉再回退成假数据、空数据、默认 0 值，让页面看起来像真的。错误要明确暴露，不能伪装成正常业务结果。
- 不允许把用户端接口拿到管理后台直接复用，或者把管理后台接口拿给用户端乱用。鉴权边界必须明确，后台走后台链路，用户端走用户链路。
- 不允许一个搜索框代表多个字段，也不允许一个 `Input` / `Select` 混合承载多个业务条件。一个控件只对应一个明确字段。
- 不允许把 `Select` 选项建立在“当前列表里刚好出现过哪些值”之上，尤其是状态、分类、作用域、渠道这类稳定枚举。应优先使用全量枚举、字典表或分类表。
- 不允许页面顶部堆说明卡、hero 卡、迁移说明、研发状态说明来凑页面。正式页面优先真实业务信息，不保留“已规划 / 待接线 / Legacy Menu / Ant Design Pro”这类施工文案。
- 不允许把 demo 数据、mock 数据、fallback 数据和真实接口结果混在一起长期存在。需要临时 mock 时必须边界清晰，并且后续要及时删掉。
- 不允许把搜索样式、表格样式、菜单样式“调得差不多”。有明确参考项目时，优先直接对齐结构、控件、间距、状态，不要自行发挥。
- 不允许路径结构和菜单选中逻辑互相打架，例如靠前缀命中造成多个菜单同时高亮。路由 key、菜单 key、选中逻辑必须一一对应。
- 不允许通过全局样式粗暴覆盖组件库默认样式，导致局部页面或组件被误伤。需要改主题时优先局部 token、局部容器、明确 class 边界。
- 不允许保留“过渡壳”超过当前改动周期，例如总 dispatch、通用页 builder、legacy 命名、兼容分支、路径别名壳。只要主链路切走，就同轮删除。
- 不允许把页面分组文件长期当页面本身使用。业务分组可以做导航元数据，但不能长期代替真实页面文件。
- 不允许后端为了图省事返回无语义的杂糅字段，或者把多个业务表强拼成一个“给页面凑数据”的接口。接口返回应围绕清晰业务对象组织。
- 不允许前端为了省事把分页、筛选、统计口径做成本地假逻辑，导致“当前页数量”冒充“总量”、“筛选结果”冒充“全局统计”。口径必须准确。
- 不允许明知道当前结构不合理，还继续在上面打补丁。只要已经判断根因在架构层，就应该直接拆根因，不要继续叠补丁。

## Current Flow Rules

- 流程判断默认先读 [docs/flows.md](docs/flows.md)
- 不允许从单个页面文案反推完整业务流程
- 不允许把老系统局部实现当新系统最终流程

## Current DB Rules

- 当前数据库事实来源只看 `umi/docs/`
- 真实表和字段优先查 [docs/schema-reference.md](docs/schema-reference.md)
- 当前测试库以 [umi/.env](.env) 为准，当前使用本地 `joy-test`
- 当前不再操作远程测试库，数据库调整默认只落本地测试库
- 默认先读文档，不直接连库；只有文档找不到对应表/字段，或需要核实真实列类型、索引、约束时，才查本地 MySQL
- 当前不要把 `packages/db/sql/` 当成本地库的完整恢复源；当前数据库事实仍以 `umi/docs/` 为准
- 主键和主链路关联 ID 已整型化，不再使用字符串 ID
- 主业务金额统一按“分”存储
- 高频枚举字段统一使用数字编码
- 业务编号独立于主键，例如 `order_sn`、`refund_no`、`coupon_no`、`apply_no`
- 新系统后台账号体系独立建模，不再以 `user.role='admin'` 作为长期方案

## Recent Additions

这轮数据库补的重点承接层，别的线程如果看到对应页面或后台功能，优先先想到这些表：

- 排行榜结果：`leaderboard_entry`
- 寄售成交：`consign_trade`
- 发券批次：`coupon_grant_batch`
- 签到奖励配置：`checkin_reward_config`
- 邀请奖励配置：`invite_reward_config`
- 成就配置：`achievement_config`
- 举报记录：`report_item`
- 后台 RBAC：`admin_user -> admin_user_role -> admin_role -> admin_role_permission -> admin_permission`

当前本地测试库还已经补了较完整的测试数据：

- `uid_code = DOACgEkT` 的用户下，已经有较多订单、竞猜、仓库、动态、通知、聊天数据
- `category` 表已经补入按老系统语义整理过的标准分类池

这轮补强过的关键字段：

- `category` 体系：统一改成 `category_id`，且 `category` 自身已支持 `biz_type`
- `order`：已补 `coupon_id`
- `order_item`：已补 `specs`
- `coupon`：已补 `grant_batch_id`、`claimed_at`、`used_at`
- `chat_conversation`：已补 `last_message_id`
- `physical_warehouse`：已补 `source_type`、`source_id`
- `consign_trade`：已补 `settlement_status`、`settled_at`
- `user.invited_by`：已改成 `bigint`

## Common Pitfalls

- 根目录 `docs/` 有历史内容，不代表当前数据库事实
- 根目录 `backend/`、`admin/`、`frontend/` 是老系统位置，只有在明确需要对照旧实现时再看
- `packages/db/sql/` 当前不是完整 schema / migration 来源，不能按目录里残留 SQL 反推当前真实结构
- `post_interaction` 已替代旧的 `content_interaction`
- `brand_auth` 已删除
- 枚举字段不再按字符串理解，要先看 `status-codes.md`
- 金额字段默认按“分”理解，除非字段明确是比例或概率

## Main Chains

别的线程如果要快速判断一条业务链是不是已经有表承接，先按这些主链路看：

- 优惠券链：`coupon_template -> coupon_grant_batch -> coupon`
- 排行榜链：`leaderboard_entry`
- 签到链：`checkin_reward_config -> checkin`
- 邀请链：`user.invite_code / user.invited_by + invite_reward_config`
- 仓库寄售链：`virtual_warehouse / physical_warehouse -> consign_trade -> fulfillment_order / order`
- 社区治理链：`report_item`
- 字段速查链：先看 `docs/schema-reference.md`

## DB Workflow

如果任务涉及数据库，默认按这个顺序做：

1. 先读 [docs/db.md](docs/db.md)、[docs/schema-reference.md](docs/schema-reference.md) 和 [docs/status-codes.md](docs/status-codes.md)。
2. 在文档里定位目标表、目标字段、当前链路。
3. 只有文档没有覆盖，或者需要确认真实列类型 / 索引 / 约束时，才连接本地 MySQL。
4. 再确认当前连接只以 [umi/.env](.env) 为准。
5. 先判断是“缺配置层 / 缺结果层 / 缺关系字段 / 缺索引约束”，不要先上来讨论代码。
6. 如果要对照旧实现，再去看根目录 `backend/`、`admin/`、`frontend/`，只把它们当需求线索，不当当前事实来源。
7. 当前不要把 `packages/db/sql/` 当作“已经覆盖当前库”的迁移集合；若要补 SQL，先以 `umi/docs/` 为准重建。
8. 改完库结构后，只同步 `umi/docs/` 下文档，不同步根目录 `docs/`。

## When To Edit Docs

- 改了表：更新 [docs/db.md](docs/db.md)
- 改了真实字段：更新 [docs/schema-reference.md](docs/schema-reference.md)
- 改了编码字段：更新 [docs/status-codes.md](docs/status-codes.md)
- 改了接手规则、边界、当前事实：更新 [AGENTS.md](AGENTS.md)
- 改了 `apps/api` 路由、请求参数或响应结构：同时检查 Swagger 入口

## What Good Looks Like

数据库相关方案默认追求这几个目标：

- 主数据、配置层、结果层分开
- 金额统一按“分”
- 枚举统一数字编码
- 分类统一走 `category_id`
- 业务编号独立于主键
- 不保留没有承接价值的快照字段
- 不把页面文案直接当数据库结构

## Decision Guide

看到一个页面或后台功能时，先用下面这套判断：

- 如果后台在“配置”某种奖励、规则、阈值，优先想是不是缺配置表
- 如果前台在展示“排行榜 / 统计结果 / 批次结果”，优先想是不是缺结果表
- 如果已有主表字段明显只表达当前状态，后台又需要追溯一次动作，优先想是不是缺动作表或日志表
- 如果多个表都在用同一种来源表达，优先统一成 `source_type + source_id`
- 如果某个页面文案里出现“名称 / 图标 / 标签 / 奖励说明”，先判断它是不是运营配置，而不是直接塞进业务主表
- 如果旧系统只是页面有这个概念，但数据库没有成型，不要默认照搬旧页面结构

## Preferred Change Types

当前这套库，优先接受这几类补充：

- 补配置层
- 补结果层
- 补动作承接层
- 补关键关系字段
- 补关键索引和唯一约束

当前不优先做这几类：

- 为了抽象而抽象的大一统表
- 纯为页面展示加快照字段
- 没有后台或业务入口支撑的预埋大表
- 和老系统不一致、但短期没有收益的重模型拆分

## Frequent Tasks

新线程最常见的数据库任务，通常落在这些类型：

- 看某个后台配置页，判断是否缺配置表
- 看某个前台结果页，判断是否缺结果表
- 看某条业务链，判断是不是少一个关系字段或来源字段
- 看某张表里的字段，判断是不是还有冗余、弱表达或类型不一致
- 看某个枚举域，判断是否要补进 [docs/status-codes.md](docs/status-codes.md)

## Recent Decisions

这些是已经拍板的决定，后续线程默认继承：

- 本地测试库使用 `umi/.env` 指向的 `joy-test`
- 远程库不再作为当前调整目标
- 分类统一使用 `category_id`
- 金额默认统一按“分”
- 枚举默认统一数字编码
- 订单可直接关联 `coupon_id`
- 购物车和订单项继续保留轻规格模型，不拆 SKU
- 聊天保留现有模型，只补关键承接字段
- 邀请、签到、成就、举报都已补到“配置层/记录层”
- 新系统后台按独立 RBAC 设计，已补管理员、角色、权限及关联表

## Common End States

新线程做完数据库任务后，至少要确认这些结果：

- 本地测试库结构已变更
- `umi/docs/db.md` 已同步
- 如果涉及编码，`umi/docs/status-codes.md` 已同步
- 如果改动影响接手判断，`umi/AGENTS.md` 已同步
- 如果补的是新表或关键字段，文档里已经能直接查到，不需要别的线程再先连库确认

## Scope

- 只在 `umi/` 范围内维护数据库文档
- 不把根目录 `docs/` 当作当前数据库结构事实来源

## Deferred Items

这些点当前是明确“先不做”或“后做”，新线程不要默认重开讨论：

- 不拆 SKU 体系，先保持和老系统一致的轻规格模型
- 直播互动子表暂缓，不优先补 `live_message` / `live_danmaku`
- 不恢复 `brand_auth`
- 不补用户成就发放表，当前先只保留 `achievement_config`
- 不把根目录 `docs/` 继续更新为当前数据库事实

## Do Not Assume

- 不要把老系统页面上出现的字符串状态，当成当前数据库真实字段类型
- 不要把 `category` 当自由文本理解，当前主业务表统一走 `category_id`
- 不要默认订单只记录优惠金额，当前 `order` 已能挂 `coupon_id`
- 不要默认购物车同商品只能有一条，当前 `cart_item` 唯一键已经包含 `specs`
- 不要默认 `content_interaction` 还存在，当前是 `post_interaction`
- 不要把老系统“普通用户登录后靠 `user.role=admin` 进入后台”当成新系统事实
- 不要默认数据库任务第一步就是查 MySQL；先查 `umi/docs/`
- 不要把用户一句明确要求，自己扩展成一串“你以为更合理”的子任务
- 当用户要的结果很明确、但实现路径或范围不明确时，不要自己脑补复杂方案；先按最直接实现落地，存在风险或歧义再和用户确认
- 不要因为自己觉得“顺手一起改更完整”就擅自扩大改动范围；超出用户当前要求的扩展项必须先确认
- 不要把简单问题想复杂；先检查是不是一处明确配置、一个开关、一个条件判断就能解决

## DB Access Policy

数据库查询策略固定如下：

1. 先查 [docs/db.md](docs/db.md)
2. 再查 [docs/schema-reference.md](docs/schema-reference.md)
3. 再查 [docs/status-codes.md](docs/status-codes.md)
4. 文档里找不到目标表或目标字段时，才允许查本地 `joy-test`
5. 只有以下任务默认允许直接查库：
   - 看真实列类型
   - 看真实索引和唯一约束
   - 看当前数据样本是否存在
   - 验证迁移是否成功
6. 查完库后，如果发现文档缺失，必须先补文档，再结束任务

## API Docs

- `apps/api` 的在线调试入口是 `/docs`
- OpenAPI 原始文档是 `/openapi.json`
- OpenAPI 装配入口是 `apps/api/src/routes/openapi.ts`
- 业务域 `paths / schemas / tags / shared helpers` 已拆到 `apps/api/src/routes/openapi/`
- monorepo workspace 包名统一使用 `@umi/*`
- 后续线程如果新增或修改 `apps/api` 路由、请求参数、返回结构，必须同步更新对应 `openapi/` 模块；涉及装配时再改 `openapi.ts`
- 不单独维护其他零散接口表，默认以 Swagger 为当前 API 测试入口
- 改完 API 后至少跑一次 `pnpm --filter @umi/api typecheck`
- JSON 主键契约统一按 `@umi/shared` 的 `EntityId` 处理，语义是 `bigint-as-string`
- 错误响应统一走 `ApiErrorEnvelope`，后端优先抛 `HttpError`
- 受保护用户接口优先使用 `requireUser`，后台接口优先使用 `requireAdmin`

## How To Work

新线程接到任务后，默认这样开展：

1. 先判断任务是不是 `umi/` 当前工作区任务。
2. 如果涉及数据库，先读 `umi/docs/db.md` 和 `umi/docs/status-codes.md`。
3. 如果需要对照老实现，再去看根目录 `backend/`、`admin/`、`frontend/`。
4. 如果任务涉及 `apps/api` 接口，顺手检查 `/docs` 对应的 `openapi/` 业务模块和装配入口是否需要同步更新。
5. 没有明确要求时，不要把根目录旧文档当作当前事实来源。
6. 如果用户目标已经很明确，优先直接完成目标本身，不要先去做“你认为相关”的外围重构或风格统一。
7. 如果改动方案存在多种合理解释，且结果会明显影响用户预期，先用一句话确认，不要自行猜测。
