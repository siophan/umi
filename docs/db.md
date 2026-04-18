# 数据库结构说明

## 概览

当前数据库已经完成第一阶段结构改造，整体特征如下：

- 表名统一为小写下划线
- 字段名统一为小写下划线
- 已移除外键约束
- 已补齐表注释和字段注释
- 核心业务表已经完成第一轮拆表

当前数据库更接近“重构后的新结构”，而不是旧版原型结构。

## 当前设计原则

### 1. 命名统一

- 表名：`snake_case`
- 字段名：`snake_case`
- 索引名：`snake_case`

### 2. 不依赖数据库外键

当前库中已移除外键约束，表之间关系由应用层维护。

### 3. 关键业务拆分

已经完成以下方向的拆分：

- 竞猜主表与竞猜选项拆分
- 订单主表与订单项拆分
- 订单状态日志独立
- 退款记录独立
- 余额流水独立
- 仓库操作日志独立

## 表清单

当前库主要表如下：

### 用户与关系

| 表名 | 表注释 |
| --- | --- |
| `user` | 用户主表 |
| `auth_session` | 登录会话表 |
| `sms_verification_code` | 短信验证码记录表 |
| `user_follow` | 用户关注关系表 |
| `friendship` | 好友关系及申请表 |
| `address` | 用户收货地址表 |

### 商品与店铺

| 表名 | 表注释 |
| --- | --- |
| `product` | 商品主表 |
| `brand` | 品牌主表 |
| `brand_apply` | 品牌入驻申请表 |
| `brand_auth` | 用户品牌授权记录表 |
| `shop` | 店铺主表 |
| `shop_apply` | 开店申请表 |
| `shop_brand_auth_apply` | 店铺品牌授权申请表 |
| `banner` | 运营 Banner 配置表 |

### 竞猜

| 表名 | 表注释 |
| --- | --- |
| `guess` | 竞猜主表 |
| `guess_option` | 竞猜选项表 |
| `guess_bet` | 竞猜下注记录表 |
| `guess_comment` | 竞猜评论表 |
| `guess_history` | 竞猜历史记录表 |
| `guess_product` | 竞猜与商品关联表 |
| `guess_review_log` | 竞猜审核日志表 |
| `guess_oracle_evidence` | 竞猜 Oracle 证据表 |
| `guess_invitation` | 竞猜邀请关系表 |
| `friend_guess_confirm` | 好友竞猜结果确认表 |
| `pk_record` | 好友 PK 对战记录表 |

### 订单与交易

| 表名 | 表注释 |
| --- | --- |
| `order` | 订单主表 |
| `order_item` | 订单项表 |
| `order_status_log` | 订单状态流转日志表 |
| `order_refund` | 订单退款表 |
| `coin_ledger` | 余额流水表 |

### 权益与优惠

| 表名 | 表注释 |
| --- | --- |
| `coupon` | 用户优惠券表 |
| `equity_account` | 权益金账户表 |
| `equity_log` | 权益金流水表 |

### 仓库

| 表名 | 表注释 |
| --- | --- |
| `virtual_warehouse` | 虚拟仓库表 |
| `physical_warehouse` | 实体仓库表 |
| `warehouse_item_log` | 仓库物品操作日志表 |

### 社交与内容

| 表名 | 表注释 |
| --- | --- |
| `post` | 社区动态主表 |
| `post_comment` | 动态评论表 |
| `post_like` | 动态点赞表 |
| `post_bookmark` | 动态收藏表 |
| `notification` | 用户通知表 |
| `chat_message` | 用户私聊消息表 |
| `live` | 直播场次表 |
| `ranking` | 排行榜快照表 |
| `ai_chat_message` | AI 对话消息记录表 |
| `checkin` | 用户签到记录表 |
| `cart_item` | 购物车明细表 |

## 核心表说明

## 1. 用户体系

### `user`

用途：

- 存储用户主账户信息
- 存储基础画像和部分统计数据

| 字段 | 说明 |
| --- | --- |
| `id` | 用户主键 |
| `phone` | 手机号，唯一 |
| `name` | 用户昵称 |
| `coins` | 当前余额快照 |
| `role` | 用户角色 |
| `shop_verified` | 是否通过店铺认证 |
| `is_shop_owner` | 是否店主 |
| `win_rate` | 竞猜胜率 |
| `total_guess` | 累计竞猜次数 |
| `wins` | 累计获胜次数 |
| `risk_level` | 风险等级 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

说明：

- 当前 `user` 仍然保留余额快照字段 `coins`
- 余额流水已拆到 `coin_ledger`

### `sms_verification_code`

用途：

- 存储短信验证码发送与校验记录
- 支撑注册、验证码登录、找回密码等手机号验证场景
- 支撑验证码过期、使用状态、频控和审计

建议字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `phone` | 手机号 |
| `biz_type` | 业务类型，如 `register` / `login` / `reset_password` |
| `code` | 验证码 |
| `status` | 状态，如 `pending` / `used` / `expired` / `invalidated` |
| `expires_at` | 过期时间 |
| `used_at` | 使用时间 |
| `request_ip` | 请求 IP |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

说明：

- 当前阶段为了尽快联调，可以直接存验证码明文
- 后续进入正式环境时，建议改成只存验证码哈希，避免明文落库
- 应至少保证同手机号同业务类型下，查询“最近一条未使用且未过期验证码”足够快
- 校验成功后应更新 `status` 为 `used` 并记录 `used_at`

### `auth_session`

用途：

- 存储用户登录态
- 支撑 `Bearer token` 鉴权
- 保证服务重启后会话不丢失

建议字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `token` | 登录态 token |
| `user_id` | 用户 ID |
| `expires_at` | 过期时间 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

说明：

- 当前阶段 token 可以先直接明文存储，后续如有安全要求可改为哈希存储
- `token` 应保证唯一
- `user_id` 应保证唯一，表示同一用户同一时间只保留一个有效登录态
- 每次鉴权都应校验 `expires_at`
- 过期 session 可以在读请求时清理，也可以后续补定时清理任务
- 用户重新登录时，应使旧 token 立即失效

### `user_follow`

用途：

- 存储用户关注关系

| 字段 | 说明 |
| --- | --- |
| `id` | 关注关系主键 |
| `follower_id` | 发起关注的用户 ID |
| `following_id` | 被关注的用户 ID |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `friendship`

用途：

- 存储好友申请与好友关系

| 字段 | 说明 |
| --- | --- |
| `id` | 好友关系主键 |
| `user_id` | 申请用户 ID |
| `friend_id` | 目标用户 ID |
| `status` | 好友关系状态 |
| `message` | 申请留言 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `address`

用途：

- 存储用户收货地址

| 字段 | 说明 |
| --- | --- |
| `id` | 地址主键 |
| `user_id` | 用户 ID |
| `name` | 收货人姓名 |
| `phone` | 收货手机号 |
| `province` | 省份 |
| `city` | 城市 |
| `district` | 区县 |
| `detail` | 详细地址 |
| `is_default` | 是否默认地址 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

## 2. 商品与店铺体系

### `product`

用途：

- 商品主数据表

| 字段 | 说明 |
| --- | --- |
| `id` | 商品主键 |
| `name` | 商品名称 |
| `brand` | 品牌名称 |
| `price` | 销售价格 |
| `original_price` | 原价 |
| `img` | 主图 |
| `images` | 图片列表 JSON |
| `category` | 商品分类 |
| `stock` | 库存 |
| `guess_price` | 竞猜价 |
| `status` | 商品状态 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `brand`

用途：

- 品牌主表

### `brand_apply`

用途：

- 品牌入驻申请

### `brand_auth`

用途：

- 用户品牌授权记录

### `shop`

用途：

- 店铺主表

| 字段 | 说明 |
| --- | --- |
| `id` | 店铺主键 |
| `user_id` | 店主用户 ID |
| `name` | 店铺名称 |
| `category` | 店铺类目 |
| `status` | 店铺状态 |
| `revenue` | 累计营收 |
| `product_count` | 商品数量 |
| `order_count` | 订单数量 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `shop_apply`

用途：

- 开店申请

### `shop_brand_auth_apply`

用途：

- 店铺申请品牌授权

### `banner`

用途：

- 运营 Banner 配置

## 3. 竞猜体系

### `guess`

用途：

- 竞猜主表
- 存储竞猜基础信息、审核状态、结算状态

| 字段 | 说明 |
| --- | --- |
| `id` | 竞猜主键 |
| `title` | 竞猜标题 |
| `type` | 竞猜类型 |
| `source` | 竞猜来源 |
| `status` | 竞猜状态 |
| `review_status` | 审核状态 |
| `scope` | 可见范围 |
| `settlement_mode` | 结算方式 |
| `result_idx` | 开奖结果索引 |
| `participants` | 参与人数 |
| `pool` | 奖池金额 |
| `end_time` | 截止时间 |
| `creator_id` | 创建人 ID |
| `category` | 竞猜分类 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

说明：

- 旧的 `options / odds / votes / trend` 已从主表移除
- Oracle 与审核日志已拆到独立表

### `guess_option`

用途：

- 存储竞猜选项

| 字段 | 说明 |
| --- | --- |
| `id` | 竞猜选项主键 |
| `guess_id` | 竞猜 ID |
| `option_index` | 选项序号 |
| `option_text` | 选项文本 |
| `odds` | 当前赔率 |
| `vote_count` | 投票数 |
| `trend` | 赔率趋势 |
| `is_result` | 是否为开奖结果 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

说明：

- 这是竞猜拆表后的核心子表

### `guess_bet`

用途：

- 用户下注记录

| 字段 | 说明 |
| --- | --- |
| `id` | 下注记录主键 |
| `user_id` | 下注用户 ID |
| `guess_id` | 竞猜 ID |
| `choice_idx` | 下注选项索引 |
| `amount` | 下注金额 |
| `status` | 下注状态 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `guess_comment`

用途：

- 竞猜评论

### `guess_history`

用途：

- 竞猜历史记录

### `guess_product`

用途：

- 竞猜与商品的关联关系

### `guess_review_log`

用途：

- 存储竞猜审核日志

### `guess_oracle_evidence`

用途：

- 存储 Oracle 外部数据证据

### `guess_invitation`

用途：

- 存储好友竞猜邀请关系

### `friend_guess_confirm`

用途：

- 记录好友竞猜双方确认结果

### `pk_record`

用途：

- 存储好友 PK 对战记录

## 4. 订单体系

### `order`

用途：

- 订单主表
- 存储订单主体信息

| 字段 | 说明 |
| --- | --- |
| `id` | 订单主键 |
| `user_id` | 下单用户 ID |
| `order_type` | 订单类型 |
| `guess_id` | 关联竞猜 ID |
| `amount` | 实付金额 |
| `original_amount` | 原始金额 |
| `coupon_discount` | 优惠金额 |
| `address_id` | 收货地址 ID |
| `status` | 订单状态 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

说明：

- 商品快照、物流信息等已从主表迁出

### `order_item`

用途：

- 订单项表

| 字段 | 说明 |
| --- | --- |
| `id` | 订单项主键 |
| `order_id` | 订单 ID |
| `product_id` | 商品 ID |
| `product_name` | 商品名称快照 |
| `product_img` | 商品图片快照 |
| `sku_text` | 规格快照 |
| `quantity` | 购买数量 |
| `unit_price` | 成交单价 |
| `item_amount` | 订单项金额 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `order_status_log`

用途：

- 订单状态流转日志

### `order_refund`

用途：

- 订单退款记录

## 5. 余额与权益体系

### `coin_ledger`

用途：

- 用户余额流水表

| 字段 | 说明 |
| --- | --- |
| `id` | 流水主键 |
| `user_id` | 用户 ID |
| `type` | 流水类型 |
| `amount` | 变动金额 |
| `balance_after` | 变动后余额 |
| `source_type` | 来源业务类型 |
| `source_id` | 来源业务 ID |
| `operator_id` | 操作人 ID |
| `operator_role` | 操作人角色 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

说明：

- 这是新引入的余额审计表
- 后续所有 `coins` 变动都应写入该表

### `equity_account`

用途：

- 用户权益金账户

| 字段 | 说明 |
| --- | --- |
| `id` | 权益账户主键 |
| `user_id` | 用户 ID |
| `category_amount` | 类目权益余额 |
| `exchange_amount` | 换购权益余额 |
| `general_amount` | 通兑权益余额 |
| `total_granted` | 累计发放权益 |
| `total_used` | 累计使用权益 |
| `total_expired` | 累计过期权益 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `equity_log`

用途：

- 权益金流水表

| 字段 | 说明 |
| --- | --- |
| `id` | 权益流水主键 |
| `account_id` | 权益账户 ID |
| `user_id` | 用户 ID |
| `type` | 流水类型 |
| `sub_type` | 流水子类型 |
| `amount` | 变动金额 |
| `balance` | 变动后余额 |
| `source` | 来源业务 |
| `ref_id` | 来源业务 ID |
| `expire_at` | 过期时间 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `coupon`

用途：

- 用户优惠券表

## 6. 仓库体系

### `virtual_warehouse`

用途：

- 虚拟仓库
- 存储竞猜奖励、碎片、待转换资产等

| 字段 | 说明 |
| --- | --- |
| `id` | 虚拟仓记录主键 |
| `user_id` | 用户 ID |
| `product_id` | 商品 ID |
| `source` | 来源类型 |
| `source_id` | 来源业务 ID |
| `status` | 仓库状态 |
| `type` | 物品类型 |
| `fragment_value` | 碎片价值 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `physical_warehouse`

用途：

- 实体仓库
- 存储真实商品与寄售相关信息

| 字段 | 说明 |
| --- | --- |
| `id` | 实体仓记录主键 |
| `user_id` | 用户 ID |
| `product_id` | 商品 ID |
| `product_name` | 商品名称 |
| `source_virtual_id` | 来源虚拟仓 ID |
| `status` | 仓库状态 |
| `consign_price` | 寄售价格 |
| `consign_date` | 寄售时间 |
| `estimate_days` | 预计天数 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `warehouse_item_log`

用途：

- 统一记录仓库物品操作日志

| 字段 | 说明 |
| --- | --- |
| `id` | 日志主键 |
| `warehouse_type` | 仓库类型，`virtual` 或 `physical` |
| `item_id` | 仓库物品记录 ID |
| `user_id` | 用户 ID |
| `product_id` | 商品 ID |
| `action` | 操作类型 |
| `from_status` | 变更前状态 |
| `to_status` | 变更后状态 |
| `quantity` | 变动数量 |
| `source_type` | 来源业务类型 |
| `source_id` | 来源业务 ID |
| `operator_id` | 操作人 ID |
| `operator_role` | 操作人角色 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

说明：

- 当前仓库表不合并
- 通过统一日志表实现操作层统一

## 7. 社交与内容体系

### `post`

用途：

- 社区动态主表

### `post_comment`

用途：

- 动态评论

### `post_like`

用途：

- 动态点赞

### `post_bookmark`

用途：

- 动态收藏

### `notification`

用途：

- 用户通知

### `chat_message`

用途：

- 私聊消息

### `live`

用途：

- 直播场次

### `ranking`

用途：

- 排行榜快照

### `ai_chat_message`

用途：

- AI 对话消息记录

### `checkin`

用途：

- 用户签到记录

### `cart_item`

用途：

- 购物车明细

## 当前结构状态

### 已完成

- 命名统一
- 注释落库
- 外键移除
- `guess` 拆表
- `order` 拆表
- `coin_ledger` 新增
- `warehouse_item_log` 新增
- `transaction` 删除

### 未完成

- 业务代码全面接入 `coin_ledger`
- 业务代码全面接入 `warehouse_item_log`
- 第二轮更细的业务拆表
- 基于真实查询继续补索引

## 当前建议

下一步不建议继续做格式类修改，应该转向：

1. 把余额变动接入 `coin_ledger`
2. 把仓库操作接入 `warehouse_item_log`
3. 把订单状态流转接入 `order_status_log`
4. 逐步清理兼容字段

## 表之间关系图（文字版）

以下关系图不依赖数据库外键，而是描述当前业务上的主关系。

## 1. 用户主链路

`user`

- 1 对多 `address`
- 1 对多 `user_follow`（作为关注人）
- 1 对多 `user_follow`（作为被关注人）
- 1 对多 `friendship`
- 1 对多 `guess`
- 1 对多 `guess_bet`
- 1 对多 `guess_comment`
- 1 对多 `guess_history`
- 1 对多 `order`
- 1 对 1 `equity_account`
- 1 对多 `equity_log`
- 1 对多 `coin_ledger`
- 1 对多 `virtual_warehouse`
- 1 对多 `physical_warehouse`
- 1 对多 `warehouse_item_log`
- 1 对多 `post`
- 1 对多 `post_comment`
- 1 对多 `post_like`
- 1 对多 `post_bookmark`
- 1 对多 `notification`
- 1 对多 `chat_message`
- 1 对多 `coupon`
- 1 对多 `checkin`

## 2. 竞猜主链路

`guess`

- 1 对多 `guess_option`
- 1 对多 `guess_bet`
- 1 对多 `guess_comment`
- 1 对多 `guess_history`
- 1 对多 `guess_product`
- 1 对多 `guess_review_log`
- 1 对多 `guess_oracle_evidence`
- 1 对多 `guess_invitation`
- 1 对多 `friend_guess_confirm`
- 1 对多 `pk_record`
- 1 对多 `order`（竞猜相关订单）

典型路径：

`user` → `guess` → `guess_option`

`user` → `guess_bet` → `guess`

`guess` → `guess_review_log`

`guess` → `guess_oracle_evidence`

`guess` → `guess_invitation` → `user`

## 3. 竞猜与商品关系

`guess`

- 通过 `guess_product` 关联 `product`

`guess_product`

- 多对一 `guess`
- 多对一 `product`

说明：

- 竞猜和商品已经不是简单单字段关系
- `guess_product` 是当前竞猜商品关系的主连接表

## 4. 订单主链路

`order`

- 1 对多 `order_item`
- 1 对多 `order_status_log`
- 1 对多 `order_refund`
- 多对一 `user`
- 可选关联 `guess`
- 可选关联 `address`

典型路径：

`user` → `order` → `order_item`

`order` → `order_status_log`

`order` → `order_refund`

## 5. 余额与权益主链路

### 余额

`user.coins`

- 表示当前余额快照

`coin_ledger`

- 记录余额变动流水
- 通过 `user_id` 关联 `user`
- 通过 `source_type + source_id` 关联具体业务来源

典型路径：

`user` → `coin_ledger`

来源可能包括：

- `guess_bet`
- `order_refund`
- `pk_record`
- `admin_adjust`

### 权益金

`equity_account`

- 1 对 1 `user`

`equity_log`

- 多对一 `equity_account`
- 多对一 `user`

典型路径：

`user` → `equity_account` → `equity_log`

## 6. 仓库主链路

### 虚拟仓

`virtual_warehouse`

- 多对一 `user`
- 可选关联 `product`
- 可通过 `source + source_id` 追溯来源业务

### 实体仓

`physical_warehouse`

- 多对一 `user`
- 可选关联 `product`
- 可通过 `source_virtual_id` 追溯来源虚拟仓记录

### 仓库日志

`warehouse_item_log`

- 通过 `warehouse_type + item_id` 指向 `virtual_warehouse` 或 `physical_warehouse`
- 通过 `user_id` 指向归属用户
- 通过 `source_type + source_id` 指向来源业务

典型路径：

`guess` → `virtual_warehouse`

`virtual_warehouse` → `physical_warehouse`

`virtual_warehouse / physical_warehouse` → `warehouse_item_log`

说明：

- 当前仓库不做主表合并
- 通过统一日志表建立跨仓库操作追踪

## 7. 社交主链路

`post`

- 1 对多 `post_comment`
- 1 对多 `post_like`
- 1 对多 `post_bookmark`
- 可选关联 `guess`

典型路径：

`user` → `post`

`post` → `post_comment`

`post` → `post_like`

`post` → `post_bookmark`

## 8. 通知与消息主链路

`notification`

- 多对一 `user`

`chat_message`

- 发送方对应 `user`
- 接收方对应 `user`

`ai_chat_message`

- 多对一 `user`
- 可选关联 `guess`

## 9. 店铺与品牌主链路

`shop`

- 多对一 `user`

`shop_apply`

- 多对一 `user`

`brand_auth`

- 多对一 `user`

`brand_apply`

- 可选关联 `brand`

`shop_brand_auth_apply`

- 业务上连接 `shop` 与 `brand`

## 10. 当前关系设计特点

当前数据库关系有三个明显特征：

### 1. 主表瘦身

- `guess` 只保留主信息和状态
- `order` 只保留主体信息

### 2. 明细表承载复杂业务

- `guess_option`
- `order_item`
- `order_status_log`
- `order_refund`
- `coin_ledger`
- `warehouse_item_log`

### 3. 应用层负责关系约束

由于已去掉数据库外键：

- 关系由业务代码维护
- 日志与流水表承担更多审计职责
