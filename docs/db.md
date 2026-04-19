# 数据库结构说明

## 概览

当前文档对应本地测试库 `joy-test` 在 2026-04-19 的最新结构。

## TL;DR

- 当前主工作区是 `umi/`
- 数据库枚举字段已经统一成数字编码
- 主业务金额默认单位是“分”
- 当前数据库事实来源只看 `umi/docs/`

阅读这份文档时，先记住 4 个全局原则：

1. 主键和主链路关联 ID 已去掉字符串方案，核心主键以 `BIGINT` 为主。
2. 主业务金额统一按“分”存储，除非字段明确是比例或概率。
3. 高频枚举字段统一使用数字编码，编码表见 [status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md)。
4. 数据库不依赖外键，关系由应用层维护，但关键唯一约束和索引已经补齐。

这一版数据库已经完成这些收口：

- 删除快照字段、冗余字段、缓存统计字段
- 删除重复或空壳表：`guess_history`、`ranking`、`user_shop_profile`、`user_stats`、`brand_auth`
- 增加业务编号：`order_sn`、`refund_no`、`auth_no`、`fulfillment_sn`、`coupon_no`、`apply_no`
- 补齐履约、优惠券模板、分类、仓库冻结等结构
- 恢复排行榜结果承载表：`leaderboard_entry`
- 补齐寄售成交事实表：`consign_trade`
- 补齐发券动作层：`coupon_grant_batch`

## 全局约定

### ID

- 主表主键：`BIGINT`
- 轻量关系表：`INT` 或 `BIGINT`
- 关联字段：与被引用主键保持整型一致

### 金额

- 金额字段默认单位为“分”
- 典型字段：`price`、`amount`、`discount_amount`、`refund_amount`、`shipping_fee`
- 以下不是金额字段：
  - `discount_rate`
  - `odds`
  - `confidence`

### 分类

- 分类统一通过 `category.id` 关联，不再继续使用自由文本 `category`
- `category` 已按 `biz_type` 区分不同业务域，不再共用一套无边界分类池
- 当前已经接入 `category_id` 的主表包括：
  - `brand`
  - `brand_apply`
  - `brand_product`
  - `guess`
  - `shop`
  - `shop_apply`
- 分类名称、图标、排序、状态统一从 `category` 表维护
- `category.parent_id / level / path` 用于表达分类树
- 当前本地测试库已经补入一批按老系统语义整理的标准分类种子，覆盖：
  - 品牌分类
  - 店铺经营分类
  - 商品分类
  - 竞猜分类
- 早期测试占位分类（如 `零食品牌`、`零食店铺`、`膨化零食`、`零食竞猜`、`GuessCat-*`、`PublicShopCat-*`）已清理，不再作为当前事实

`category` 这张表当前的职责不是“随便放一些分类文案”，而是整个系统的分类主数据表，承担 4 个业务域的统一分类来源：

- `biz_type = 10`
  品牌分类，给 `brand` / `brand_apply` 用
- `biz_type = 20`
  店铺经营分类，给 `shop` / `shop_apply` 用
- `biz_type = 30`
  商品分类，给 `brand_product` 用，后续 `product` 也应通过品牌商品间接继承
- `biz_type = 40`
  竞猜分类，给 `guess` 用

别的线程在看这张表时，默认按下面这几个原则理解：

1. 它不是一个“全站所有地方都能混用”的万能字典表。
2. 同名分类如果跨业务域复用，必须靠不同 `biz_type` 隔离语义。
3. `brand_product.category_id` 和 `guess.category_id` 即使名字看起来接近，也不代表可互换。
4. 如果页面要新增分类，优先先判断它属于哪个业务域，再往对应 `biz_type` 下加，不要直接复用别的域的分类。
5. 如果只是页面展示标签，而不是主业务分类，不要直接塞进 `category`。

当前 `category` 表更像“带业务域隔离的分类主数据表”，不是旧系统那种自由文本分类字段的简单替代。

### 编码

- `status/type/scope/interaction_type/...` 默认使用 `TINYINT UNSIGNED`
- `source_type/sub_type` 默认使用 `SMALLINT UNSIGNED`
- 具体映射以 [status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md) 为准

### JSON

以下字段使用原生 `JSON`：

- `brand_product.images`
- `guess.tags`
- `guess_oracle_evidence.query_payload`
- `guess_oracle_evidence.response_payload`
- `post.images`
- `product.images`
- `product.tags`
- `user.achievements`
- `warehouse_item_log.meta_json`

## 表清单

### 用户与关系

| 表名 | 用途 |
| --- | --- |
| `user` | 用户主表 |
| `user_profile` | 用户资料表 |
| `auth_session` | 登录会话表 |
| `sms_verification_code` | 短信验证码记录表 |
| `user_follow` | 用户关注关系表 |
| `friendship` | 好友关系及申请表 |
| `address` | 用户收货地址表 |
| `admin_user` | 后台管理员账号表 |
| `admin_role` | 后台角色表 |
| `admin_permission` | 后台权限表 |
| `admin_user_role` | 管理员角色关联表 |
| `admin_role_permission` | 角色权限关联表 |

### 商品、品牌、店铺

| 表名 | 用途 |
| --- | --- |
| `brand` | 品牌主表 |
| `brand_apply` | 品牌入驻申请表 |
| `brand_product` | 平台品牌商品库 |
| `category` | 分类表 |
| `product` | 商品主表 |
| `shop` | 店铺主表 |
| `shop_apply` | 开店申请表 |
| `shop_brand_auth` | 店铺品牌授权表 |
| `shop_brand_auth_apply` | 店铺品牌授权申请表 |
| `banner` | 运营 Banner 配置表 |

### 竞猜

| 表名 | 用途 |
| --- | --- |
| `guess` | 竞猜主表 |
| `guess_option` | 竞猜选项表 |
| `guess_bet` | 竞猜下注记录表 |
| `guess_product` | 竞猜与商品关联表 |
| `guess_review_log` | 竞猜审核日志表 |
| `guess_oracle_evidence` | 竞猜 Oracle 证据表 |
| `guess_invitation` | 竞猜邀请关系表 |
| `friend_guess_confirm` | 好友竞猜结果确认表 |
| `pk_record` | 好友 PK 对战记录表 |
| `comment_item` | 通用评论表 |

### 订单、履约、资金

| 表名 | 用途 |
| --- | --- |
| `order` | 订单主表 |
| `order_item` | 订单项表 |
| `order_status_log` | 订单状态流转日志表 |
| `order_refund` | 订单退款表 |
| `fulfillment_order` | 履约单表 |
| `fulfillment_order_item` | 履约单明细表 |
| `coin_ledger` | 余额流水表 |
| `leaderboard_entry` | 排行榜结果表 |
| `consign_trade` | 寄售成交表 |

### 优惠与权益

| 表名 | 用途 |
| --- | --- |
| `coupon_template` | 优惠券模板表 |
| `coupon_grant_batch` | 发券批次表 |
| `coupon` | 用户优惠券表 |
| `equity_account` | 权益金账户表 |
| `equity_log` | 权益金流水表 |

### 仓库

| 表名 | 用途 |
| --- | --- |
| `virtual_warehouse` | 虚拟仓库表 |
| `physical_warehouse` | 实体仓库表 |
| `warehouse_item_log` | 仓库物品操作日志表 |

### 内容与社交

| 表名 | 用途 |
| --- | --- |
| `post` | 社区动态主表 |
| `post_interaction` | 帖子互动关系表 |
| `comment_interaction` | 评论互动关系表 |
| `report_item` | 举报记录表 |
| `notification` | 用户通知表 |
| `chat_conversation` | 用户私聊会话表 |
| `chat_message` | 用户私聊消息表 |
| `live` | 直播场次表 |
| `ai_chat_message` | AI 对话消息记录表 |
| `achievement_config` | 成就配置表 |
| `checkin_reward_config` | 签到奖励配置表 |
| `checkin` | 用户签到记录表 |
| `cart_item` | 购物车明细表 |

## 主链路关系

### 用户主链路

- `user` 作为账户主表
- `user_profile` 作为资料扩展
- `auth_session` 作为登录态
- `address` 作为收货地址
- `user_follow`、`friendship` 作为用户关系

### 后台权限主链路

- `admin_user` 是后台独立账号表
- `admin_role` 是后台角色定义
- `admin_permission` 是后台权限定义
- `admin_user_role` 负责管理员与角色多对多关系
- `admin_role_permission` 负责角色与权限多对多关系

说明：

- 新系统后台不再把 `user.role='admin'` 当作长期权限模型
- 用户端账号与后台管理员账号分离，避免普通用户体系和后台权限体系耦合

### 商品和店铺主链路

- `brand` 维护品牌
- `brand_product` 维护平台标准商品
- `shop` 维护店铺
- `product` 维护店铺在售商品
- `shop_brand_auth` 表示店铺对品牌的授权关系
- `category` 为品牌、店铺、商品、竞猜四条链路提供分类主数据

`shop_brand_auth` 的职责要固定理解成“店铺已经拿到的有效品牌授权关系”。

它负责承接：

- 哪个店铺
- 对哪个品牌
- 当前授权是否生效
- 授权类型是什么
- 授权范围到哪里
- 到期时间是什么

它不负责承接：

- 申请过程
- 审核历史
- 品牌主数据
- 商品主数据

所以别的线程在判断“某店能不能经营某品牌”时，默认先看 `shop_brand_auth`；
在判断“某店提交过什么授权申请”时，再看 `shop_brand_auth_apply`。

### 竞猜主链路

- `guess` 是竞猜主表
- `guess_option` 是选项表
- `guess_product` 负责竞猜与商品关系
- `guess_bet` 负责用户下注
- `guess_review_log`、`guess_oracle_evidence` 分别负责审核和证据
- `guess_invitation`、`friend_guess_confirm`、`pk_record` 负责好友对战链路

### 订单主链路

- `order` 是订单主表
- `order_item` 是订单明细
- `order_status_log` 记录状态流转
- `order_refund` 记录退款
- `fulfillment_order` / `fulfillment_order_item` 负责实物履约

### 优惠和仓库主链路

- `coupon_template` 定义模板
- `coupon_grant_batch` 记录一次发券动作
- `coupon` 是用户持有券实例
- `virtual_warehouse` / `physical_warehouse` 负责用户仓库资产
- `consign_trade` 承接寄售上架、成交、取消这条交易事实链
- `warehouse_item_log` 记录仓库物品操作

`coupon_grant_batch` 这张表也不要理解错：

- 它记录的是“一次发券动作”
- 不是模板
- 也不是用户最终拿到的券

三层关系固定这样理解：

- `coupon_template`
  定义券规则
- `coupon_grant_batch`
  定义这次是谁发的、按什么来源发的、原计划发多少、实际发多少
- `coupon`
  记录每个用户实际拿到的券实例

## 核心表速查

### `user`

用途：

- 账户主表，承载认证、等级、风险、优米号和邀请码

关键字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 用户主键 |
| `uid_code` | 优米号，8 位随机大小写字母，唯一 |
| `phone_number` | 手机号，唯一 |
| `password` | 密码哈希 |
| `banned` | 是否封禁 |
| `level` | 等级 |
| `title` | 头衔 |
| `achievements` | 成就 JSON |
| `risk_level` | 风险等级编码 |
| `invite_code` | 邀请码 |
| `invited_by` | 邀请人 |

补充约定：

- `uid_code` 用于前端展示“优米号”，不是主键，也不参与业务关联
- `uid_code` 规则为 8 位随机大小写字母，例如 `aZkLmNqP`
- `uid_code` 必须全局唯一，靠 `uk_user_uid_code` 约束保证
- `uid_code` 生成后应保持稳定，不随昵称、手机号变化而变化
- `invite_code` 只用于邀请注册链路，不用于个人主页展示

### `admin_user`

用途：

- 新系统后台管理员独立账号表

关键字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 管理员主键 |
| `username` | 登录用户名，唯一 |
| `password_hash` | 密码哈希 |
| `display_name` | 展示名称 |
| `phone_number` | 联系手机号，唯一，可空 |
| `email` | 邮箱，可空 |
| `status` | 状态编码 |
| `last_login_at` | 最后登录时间 |
| `last_login_ip` | 最后登录 IP |

### `admin_role`

用途：

- 后台角色定义表

关键字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 角色主键 |
| `code` | 角色编码，唯一 |
| `name` | 角色名称 |
| `description` | 角色说明 |
| `status` | 状态编码 |
| `is_system` | 是否系统内置角色 |
| `sort` | 排序 |

### `admin_permission`

用途：

- 后台权限定义表

关键字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 权限主键 |
| `code` | 权限编码，唯一 |
| `name` | 权限名称 |
| `module` | 所属模块 |
| `action` | 动作编码 |
| `parent_id` | 父权限 ID，可空 |
| `status` | 状态编码 |
| `sort` | 排序 |

### `admin_user_role` / `admin_role_permission`

用途：

- 后台 RBAC 两张关联表

关键约束：

- `admin_user_role(admin_user_id, role_id)` 唯一
- `admin_role_permission(role_id, permission_id)` 唯一

### `user_profile`

用途：

- 用户资料扩展表

关键字段：

| 字段 | 说明 |
| --- | --- |
| `user_id` | 用户 ID |
| `name` | 昵称 |
| `avatar_url` | 头像 |
| `signature` | 个性签名 |
| `gender` | 性别编码 |
| `birthday` | 生日 |
| `region` | 地区 |
| `works_privacy` | 作品可见范围 |
| `fav_privacy` | 收藏可见范围 |

### `product`

用途：

- 店铺在售商品

关键字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 商品主键 |
| `shop_id` | 店铺 ID |
| `brand_product_id` | 平台标准商品 ID |
| `name` | 商品名称 |
| `price` | 销售价，单位分 |
| `original_price` | 原价，单位分 |
| `guess_price` | 竞猜价，单位分 |
| `image_url` | 主图 |
| `images` | 图片 JSON |
| `stock` | 可用库存 |
| `frozen_stock` | 冻结库存 |
| `tags` | 标签 JSON |
| `status` | 状态编码 |

### `brand_product`

用途：

- 平台标准商品库

关键字段：

| 字段 | 说明 |
| --- | --- |
| `brand_id` | 品牌 ID |
| `name` | 标准商品名称 |
| `category_id` | 商品分类 ID |
| `guide_price` | 建议零售价，单位分 |
| `supply_price` | 供货价，单位分 |
| `default_img` | 默认图 |
| `images` | 图片 JSON |
| `status` | 状态编码 |

### `shop_brand_auth`

用途：

- 店铺和品牌之间的有效授权关系

关键字段：

| 字段 | 说明 |
| --- | --- |
| `auth_no` | 授权编号，唯一 |
| `shop_id` | 店铺 ID |
| `brand_id` | 品牌 ID |
| `auth_type` | 授权类型编码 |
| `auth_scope` | 授权范围编码 |
| `scope_value` | 授权范围扩展值 JSON |
| `status` | 授权状态编码 |
| `granted_at` | 授权通过时间 |
| `expire_at` | 到期时间 |
| `expired_at` | 实际过期时间 |

说明：

- `auth_type` 用于区分普通 / 独家 / 试用授权
- `auth_scope` 用于区分全品牌 / 指定类目 / 指定商品
- `scope_value` 只在非全品牌范围时使用

### `guess`

用途：

- 竞猜主实体

关键字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 竞猜主键 |
| `title` | 标题 |
| `type` | 类型编码 |
| `source_type` | 来源类型编码 |
| `status` | 状态编码 |
| `review_status` | 审核状态编码 |
| `scope` | 可见范围编码 |
| `settlement_mode` | 结算模式编码 |
| `stake_type` | 下注类型编码 |
| `creator_id` | 创建人 |
| `end_time` | 截止时间 |
| `tags` | 标签 JSON |

说明：

- 商品关系通过 `guess_product` 维护
- 结果通过 `guess_option` 表达
- 用户参与通过 `guess_bet` 表达

### `guess_option`

用途：

- 竞猜选项表

关键字段：

| 字段 | 说明 |
| --- | --- |
| `guess_id` | 竞猜 ID |
| `idx` | 选项索引 |
| `text` | 选项内容 |
| `odds` | 赔率 |

### `guess_bet`

用途：

- 用户下注记录

关键字段：

| 字段 | 说明 |
| --- | --- |
| `user_id` | 用户 ID |
| `guess_id` | 竞猜 ID |
| `choice_idx` | 下注选项索引 |
| `amount` | 下注金额，单位分 |
| `product_id` | 关联商品 |
| `coupon_id` | 使用优惠券 |
| `status` | 状态编码 |
| `reward_type` | 奖励类型编码 |

说明：

- 唯一约束：`(user_id, guess_id)`

### `order`

用途：

- 订单主表

关键字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 订单主键 |
| `order_sn` | 订单编号，唯一 |
| `user_id` | 下单用户 |
| `type` | 订单类型编码 |
| `guess_id` | 关联竞猜 |
| `amount` | 实付金额，单位分 |
| `original_amount` | 原始金额，单位分 |
| `coupon_discount` | 优惠金额，单位分 |
| `address_id` | 收货地址 |
| `status` | 订单状态编码 |

说明：

- `type` 当前用于区分竞猜奖励单与普通店铺订单
- 用户端订单列表在读取时优先以 `guess_id` 判断是否为竞猜奖励单，`type` 作为显式补充编码
- 订单的物流中间态不直接落在 `order.status`，而是通过 `fulfillment_order.status` 派生

### `order_item`

用途：

- 订单明细

关键字段：

| 字段 | 说明 |
| --- | --- |
| `order_id` | 订单 ID |
| `product_id` | 商品 ID |
| `quantity` | 数量 |
| `unit_price` | 成交单价，单位分 |
| `original_unit_price` | 原始单价，单位分 |
| `item_amount` | 行金额，单位分 |
| `coupon_discount` | 优惠分摊金额，单位分 |

### `order_refund`

用途：

- 订单退款申请与处理记录

关键字段：

| 字段 | 说明 |
| --- | --- |
| `refund_no` | 退款单号，唯一 |
| `order_id` | 订单 ID |
| `user_id` | 用户 ID |
| `status` | 退款状态编码 |
| `refund_amount` | 退款金额，单位分 |
| `reviewer_id` | 审核人 |
| `requested_at` | 申请时间 |
| `reviewed_at` | 审核时间 |
| `completed_at` | 完成时间 |

### `fulfillment_order`

用途：

- 实物履约 / 发货 / 提货单

关键字段：

| 字段 | 说明 |
| --- | --- |
| `fulfillment_sn` | 履约单号，唯一 |
| `type` | 履约类型编码 |
| `status` | 履约状态编码 |
| `user_id` | 用户 ID |
| `order_id` | 订单 ID |
| `shop_id` | 店铺 ID |
| `address_id` | 地址 ID |
| `receiver_name` | 收货人 |
| `phone_number` | 收货手机号 |
| `shipping_type` | 配送类型编码 |
| `shipping_fee` | 运费，单位分 |
| `total_amount` | 总金额，单位分 |
| `tracking_no` | 物流单号 |

说明：

- 实物履约链路正式从订单主表拆出
- 履约明细通过 `fulfillment_order_item` 维护
- 用户端“待发货 / 运输中 / 已签收”主要依赖这张表派生：
  - `status = 10/20` 视为待发货或处理中
  - `status = 30` 视为运输中
  - `status = 40` 视为已签收 / 已完成

### 仓库页展示约定

- 用户端仓库页不再假设单表能覆盖全部状态
- “虚拟仓”来自 `virtual_warehouse`
- “运输中”来自 `fulfillment_order.status = 30`
- “已签收 / 在仓 / 寄售中”来自 `physical_warehouse`
- 因此用户端仓库聚合是跨 `virtual_warehouse + fulfillment_order + physical_warehouse` 的组合视图

### `coupon_template`

用途：

- 优惠券模板定义

关键字段：

| 字段 | 说明 |
| --- | --- |
| `code` | 模板编码，唯一 |
| `type` | 类型编码 |
| `status` | 状态编码 |
| `scope_type` | 适用范围编码 |
| `source_type` | 来源类型编码 |
| `validity_type` | 有效期类型编码 |
| `shop_id` | 指定店铺 |
| `min_amount` | 门槛金额，单位分 |
| `discount_amount` | 优惠金额，单位分 |
| `discount_rate` | 折扣率 |
| `max_discount_amount` | 最大优惠金额，单位分 |

### `coupon`

用途：

- 用户持有的优惠券实例

关键字段：

| 字段 | 说明 |
| --- | --- |
| `coupon_no` | 券号，唯一 |
| `user_id` | 用户 ID |
| `template_id` | 模板 ID |
| `amount` | 面额，单位分 |
| `type` | 类型编码 |
| `source_type` | 来源类型编码 |
| `status` | 状态编码 |

### `coupon_grant_batch`

用途：

- 记录一次批量发券或运营发券动作

关键字段：

| 字段 | 说明 |
| --- | --- |
| `batch_no` | 发券批次号，唯一 |
| `template_id` | 优惠券模板 ID |
| `source_type` | 来源类型编码 |
| `operator_id` | 操作人 ID |
| `target_user_count` | 目标用户数 |
| `granted_count` | 实际发放数量 |
| `status` | 批次状态编码 |
| `note` | 备注 |

说明：

- `coupon_template` 定义券规则
- `coupon_grant_batch` 记录发券动作
- `coupon` 记录用户最终拿到的券实例
- 它不承接券规则本身，也不承接单个用户的领券结果

### `virtual_warehouse`

用途：

- 用户虚拟仓资产

关键字段：

| 字段 | 说明 |
| --- | --- |
| `user_id` | 用户 ID |
| `product_id` | 商品 ID |
| `quantity` | 数量 |
| `frozen_quantity` | 冻结数量 |
| `price` | 价值金额，单位分 |
| `fragment_value` | 碎片价值，单位分 |
| `source_type` | 来源类型编码 |
| `source_id` | 来源业务 ID |
| `status` | 状态编码 |
| `type` | 物品类型编码 |

### `physical_warehouse`

用途：

- 用户实体仓资产

关键字段：

| 字段 | 说明 |
| --- | --- |
| `user_id` | 用户 ID |
| `product_id` | 商品 ID |
| `quantity` | 数量 |
| `frozen_quantity` | 冻结数量 |
| `price` | 价值金额，单位分 |
| `source_virtual_id` | 来源虚拟仓记录 |
| `status` | 状态编码 |
| `consign_price` | 寄售价，单位分 |

说明：

- 仓库表只表达货物状态
- 寄售成交行为单独落在 `consign_trade`

### `consign_trade`

用途：

- 承载寄售上架、成交、取消这条交易事实链

关键字段：

| 字段 | 说明 |
| --- | --- |
| `trade_no` | 寄售成交单号，唯一 |
| `physical_item_id` | 实体仓物品 ID |
| `seller_user_id` | 卖家用户 ID |
| `buyer_user_id` | 买家用户 ID |
| `order_id` | 关联订单 ID |
| `status` | 成交状态编码 |
| `sale_amount` | 成交金额，单位分 |
| `commission_amount` | 平台抽成，单位分 |
| `seller_amount` | 卖家实收金额，单位分 |
| `listed_at` | 上架时间 |
| `traded_at` | 成交时间 |
| `canceled_at` | 取消时间 |

说明：

- 仓库表不再承担成交事实本身
- `consign_trade` 负责承接寄售市场这条交易链

### `post`

用途：

- 社区动态主表

关键字段：

| 字段 | 说明 |
| --- | --- |
| `user_id` | 发布用户 |
| `guess_id` | 关联竞猜 |
| `repost_id` | 转发源动态 |
| `type` | 类型编码 |
| `scope` | 可见范围编码 |
| `content` | 内容 |
| `images` | 图片 JSON |

### `post_interaction`

用途：

- 帖子互动关系

关键字段：

| 字段 | 说明 |
| --- | --- |
| `user_id` | 用户 ID |
| `post_id` | 帖子 ID |
| `interaction_type` | 互动类型编码 |

说明：

- 当前只承载 `post` 的点赞和收藏
- 唯一约束：`(user_id, post_id, interaction_type)`

### `comment_interaction`

用途：

- 评论互动关系

关键字段：

| 字段 | 说明 |
| --- | --- |
| `user_id` | 用户 ID |
| `comment_id` | 评论 ID |
| `interaction_type` | 互动类型编码 |

说明：

- 当前承载评论点赞关系
- 唯一约束：`(user_id, comment_id, interaction_type)`

### `comment_item`

用途：

- 通用评论表

关键字段：

| 字段 | 说明 |
| --- | --- |
| `target_type` | 目标类型编码 |
| `target_id` | 目标 ID |
| `user_id` | 评论用户 |
| `parent_id` | 父评论 |
| `content` | 评论内容 |

### `notification`

用途：

- 用户通知

关键字段：

| 字段 | 说明 |
| --- | --- |
| `user_id` | 用户 ID |
| `type` | 通知类型编码 |
| `target_type` | 目标类型编码 |
| `target_id` | 目标 ID |
| `action_url` | 跳转链接 |
| `is_read` | 是否已读 |

### `leaderboard_entry`

用途：

- 承载排行榜刷新后的结果条目

关键字段：

| 字段 | 说明 |
| --- | --- |
| `board_type` | 榜单类型编码 |
| `period_type` | 周期类型编码 |
| `period_value` | 周期值，如日/周/月/总榜编码值 |
| `user_id` | 用户 ID |
| `rank_no` | 排名 |
| `score` | 榜单分值 |
| `extra_json` | 扩展指标 JSON |

说明：

- 只承载榜单结果，不存用户名、头像等快照字段
- 支持多榜单、多周期
- 它不是榜单规则定义表，也不是排行榜刷新任务表
- 榜单排序逻辑仍在应用层，`leaderboard_entry` 只负责承接刷新后的结果

## 关键约束与索引

### 关键唯一约束

- `order.order_sn`
- `order_refund.refund_no`
- `coupon.coupon_no`
- `coupon_template.code`
- `coupon_grant_batch.batch_no`
- `fulfillment_order.fulfillment_sn`
- `consign_trade.trade_no`
- `shop_brand_auth.auth_no`
- `brand_apply.apply_no`
- `shop_apply.apply_no`
- `shop_brand_auth_apply.apply_no`
- `post_interaction(user_id, post_id, interaction_type)`
- `guess_bet(user_id, guess_id)`
- `shop_brand_auth(shop_id, brand_id)`
- `leaderboard_entry(board_type, period_type, period_value, user_id)`

### 关键索引

- `notification(user_id, is_read, created_at)`
- `banner(position, status, sort)`
- `comment_item(target_type, target_id, parent_id, created_at)`
- `fulfillment_order(user_id, status)`
- `fulfillment_order(shop_id, status)`
- `fulfillment_order(status, created_at)`
- `consign_trade(status, listed_at)`
- `consign_trade(seller_user_id, status)`
- `consign_trade(buyer_user_id, status)`
- `shop_brand_auth(status, expire_at)`
- `post.guess_id`
- `post.repost_id`
- `shop_apply.user_id`
- `leaderboard_entry(board_type, period_type, period_value, rank_no)`

## 快速判断

- 看库里有哪些表：先看“表清单”
- 看表之间主关系：看“主链路关系”
- 看一张核心表长什么样：看“核心表速查”
- 看编码含义：看 [status-codes.md](/Users/ezreal/Downloads/joy/umi/docs/status-codes.md)
- 看金额口径：默认按“分”理解，除非字段明确是比例或概率
