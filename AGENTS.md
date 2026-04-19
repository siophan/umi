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

## Admin Frontend Hard Rules

管理后台前端有几条硬性规则，后续线程不允许再踩：

- 不允许做“全后台统一页面数据壳”。禁止再出现类似 `AdminPageData`、`loadAdminPageData()`、`admin-loader.ts` 这种把多个页面数据聚到一个总对象里的设计。
- 不允许做“单一总接口文件”。禁止把后台所有请求继续堆回一个 `api.ts` 大杂烩；接口必须按业务拆分，例如 `auth`、`users`、`catalog`、`orders`、`merchant`、`system`。
- 不允许“换个名字继续聚合”。如果本质还是中心分发器、全局数据装配、总类型兜一切，就算改名也算违规。
- 不允许页面继续依赖“业务域总数据对象”做渲染。页面必须自己拿自己的数据，自己管理 `loading / issue / pagination / filters`，而不是吃外层拼好的总 payload。
- 不允许留死代码、死目录、空目录。旧实现不用了就立即删除，不能保留 `legacy-*`、`admin-page-data` 之类残骸等后面再说。
- 不允许“半拆”。如果开始拆某一层，就要把引用、类型、构建、空目录、残留文件一起收完，至少保证 `pnpm --filter @joy/admin typecheck` 通过。
- 后台页面优先按“单页单文件”组织。不要再为了省事把多个路由长期塞进一个页面文件里；如果暂时合并，只能作为短期过渡，并且下一步要继续拆掉。

## Architecture Pass Rules

这些规则不只针对管理后台，而是整个 `umi/` 工作区通用。以后无论前端还是后端，只要设计本身不合理，就直接判定为不通过，不能以“先跑起来”“后面再拆”为理由糊过去：

- 不允许为了省事做总入口大杂烩。前端禁止把多个页面数据、多个路由状态、多个领域逻辑塞进一个总对象或总调度器；后端禁止把多个业务域继续堆进一个超大 router、service、store 文件。
- 不允许“换名不换药”。如果本质上还是同一个坏设计，只是改文件名、改函数名、改目录名，这种处理一律算无效。
- 不允许保留没有职责边界的中间层。凡是只是做转手聚合、路径分发、重复透传、把多个业务硬拼起来的层，如果没有清晰收益，就应该删掉，而不是继续包一层。
- 不允许用“共享”当借口扩大耦合。共享类型、共享组件、共享请求函数必须是稳定且小边界的；不能把不相关业务因为“方便复用”强行捏到一起。
- 不允许一个文件长期承担多个页面、多个业务、多个角色的主逻辑。单页单文件、单业务单模块优先；确实需要合并时，必须是短期过渡，并且后续要继续拆开。
- 不允许留下死代码、死目录、空目录、兼容残骸、旧命名壳。只要主链路不再使用，就应在同一轮改动中删除。
- 不允许“半拆”。开始拆结构，就必须把引用、类型、构建、残留文件、目录结构一起收口，至少保证对应应用的 typecheck / build 通过。
- 不允许前端页面依赖外部拼装好的“全局页面数据包”做渲染；页面应自行面向自己的最小数据集。也不允许后端接口为了迎合某个页面临时返回无边界的混合 payload。
- 不允许因为当前需求急，就先引入明显错误的分层。明显错误的方案宁可先不写，也不要写完再说。
- 代码评审和自检时，先看设计是否合理，再看能不能运行。只要设计本身明显不合理，就应该直接 `pass` 掉，不进入“以后再优化”的默认路径。

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
7. 改完库结构后，只同步 `umi/docs/` 下文档，不同步根目录 `docs/`。

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
- 接口文档实现位置是 `apps/api/src/routes/openapi.ts`
- 后续线程如果新增或修改 `apps/api` 路由、请求参数、返回结构，必须同步更新 `openapi.ts`
- 不单独维护其他零散接口表，默认以 Swagger 为当前 API 测试入口
- 改完 API 后至少跑一次 `pnpm --filter @joy/api typecheck`

## How To Work

新线程接到任务后，默认这样开展：

1. 先判断任务是不是 `umi/` 当前工作区任务。
2. 如果涉及数据库，先读 `umi/docs/db.md` 和 `umi/docs/status-codes.md`。
3. 如果需要对照老实现，再去看根目录 `backend/`、`admin/`、`frontend/`。
4. 如果任务涉及 `apps/api` 接口，顺手检查 `/docs` 对应的 `openapi.ts` 是否需要同步更新。
5. 没有明确要求时，不要把根目录旧文档当作当前事实来源。
