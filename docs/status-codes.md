# 状态编码规范

## 目的

这份文档统一定义本地测试库 `joy-test` 当前使用的数字状态编码。

约定：

- 数据库存储数字编码，不再存字符串枚举
- `status/type/scope/source_type/...` 默认使用 `TINYINT UNSIGNED`
- 值域更大的来源类、子类型字段使用 `SMALLINT UNSIGNED`
- 同一张表内，状态流必须稳定，不允许同义不同码
- 不同领域允许复用同一数字段位，但不能假设跨表同码同义

## 通用规则

### 字段类型

- `status`
- `type`
- `scope`
- `interaction_type`
- `payment_mode`
- `reward_type`
- `review_status`
- `stake_type`
- `target_type`

以上字段默认使用 `TINYINT UNSIGNED`。

- `source_type`
- `sub_type`

以上字段默认使用 `SMALLINT UNSIGNED`。

### 编码段位

- `10` 系列：初始化 / 待处理
- `20` 系列：进行中 / 生效中
- `30` 系列：成功 / 完成 / 已生效
- `40` 系列：失败 / 拒绝 / 关闭
- `90` 系列：终态异常，如撤销、过期、作废

### 通用映射表头

下文统一使用：

- `原语义`：历史字符串语义或业务常量名
- `编码`：数据库中实际存储的数字

## 订单域

### `order.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待支付或待确认 |
| `paid` | `20` | 已支付 |
| `fulfilled` | `30` | 已履约完成 |
| `closed` | `40` | 已关闭 |
| `refunded` | `90` | 已退款完成 |

### `order.type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `guess_reward` | `10` | 竞猜奖励订单 |
| `shop_order` | `20` | 店铺购买订单 |

### `order_refund.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待审核 |
| `reviewing` | `20` | 审核中 |
| `approved` | `30` | 已通过，待打款或待完成 |
| `rejected` | `40` | 已拒绝 |
| `completed` | `90` | 退款完成 |

### `fulfillment_order.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待履约 |
| `processing` | `20` | 履约处理中 |
| `shipped` | `30` | 已发货 |
| `completed` | `40` | 已签收或已完成 |
| `canceled` | `90` | 已取消 |

### `fulfillment_order.type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `ship` | `10` | 物流配送 |
| `pickup` | `20` | 线下提货 |

## 优惠券域

### `coupon.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `unused` | `10` | 未使用 |
| `locked` | `20` | 已锁定，占用中 |
| `used` | `30` | 已使用 |
| `expired` | `90` | 已过期 |

### `coupon.type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `cash` | `10` | 满减券 / 立减券 |
| `discount` | `20` | 折扣券 |
| `shipping` | `30` | 运费券 |

### `coupon_template.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 启用中 |
| `paused` | `20` | 暂停发放 |
| `disabled` | `90` | 已停用 |

### `coupon_template.scope_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `platform` | `10` | 平台通用 |
| `shop` | `20` | 指定店铺 |

### `coupon_template.validity_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `fixed` | `10` | 固定时间段有效 |
| `relative` | `20` | 领取后 N 天有效 |

### `coupon_grant_batch.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待执行 |
| `processing` | `20` | 执行中 |
| `completed` | `30` | 已完成 |
| `failed` | `40` | 已失败 |

### `coupon_grant_batch.source_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `admin` | `10` | 后台人工发放 |
| `activity` | `20` | 活动发放 |
| `compensation` | `30` | 补偿发放 |
| `system` | `40` | 系统发放 |

## 竞猜域

### `guess.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `draft` | `10` | 草稿 |
| `pending_review` | `20` | 待审核 |
| `active` | `30` | 进行中 |
| `pending_settle` | `35` | 投注截止后、揭晓前（仅店铺竞猜，已达最低参与人数） |
| `settled` | `40` | 已结算 |
| `abandoned` | `80` | 流标（仅店铺竞猜，未达最低参与人数已退款） |
| `rejected` | `90` | 已拒绝 |

### `guess_bet.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 已下注，待开奖 |
| `won` | `30` | 已中奖 |
| `lost` | `40` | 未中奖 |
| `canceled` | `90` | 已撤销 |

### `guess_invitation.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待响应 |
| `accepted` | `30` | 已接受 |
| `rejected` | `40` | 已拒绝 |
| `expired` | `90` | 已过期 |

### `pk_record.result`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待结算 |
| `initiator_win` | `30` | 发起方获胜 |
| `opponent_win` | `40` | 对手获胜 |
| `draw` | `50` | 平局 |
| `canceled` | `90` | 已取消 |

### `guess.scope`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `public` | `10` | 公开竞猜 |
| `friends` | `20` | 好友 / PK 场景竞猜 |
| `private` | `90` | 私密竞猜 |

## 店铺与品牌域

### `shop_apply.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待审核 |
| `approved` | `30` | 已通过 |
| `rejected` | `40` | 已拒绝 |

### `shop_brand_auth_apply.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待审核 |
| `approved` | `30` | 已通过 |
| `rejected` | `40` | 已拒绝 |

### `shop_brand_auth.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 授权生效中 |
| `expired` | `90` | 授权已过期 |
| `revoked` | `91` | 授权已撤销 |

### `shop_brand_auth.auth_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `normal` | `10` | 普通授权 |
| `exclusive` | `20` | 独家授权 |
| `trial` | `30` | 试用授权 |

### `shop_brand_auth.auth_scope`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `all_brand` | `10` | 全品牌授权 |
| `category_only` | `20` | 指定类目授权 |
| `product_only` | `30` | 指定商品授权 |

### `category.biz_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `brand` | `10` | 品牌分类 |
| `shop` | `20` | 店铺经营分类 |
| `product` | `30` | 商品分类 |
| `guess` | `40` | 竞猜分类 |

### `shop.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 店铺正常可经营 |
| `paused` | `20` | 店铺暂停营业 |
| `closed` | `90` | 店铺关闭 |

## 营销与签到域

### `checkin.reward_type` / `checkin_reward_config.reward_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `coin` | `10` | 零食币奖励 |
| `coupon` | `20` | 优惠券奖励 |
| `physical` | `30` | 实物 / 仓库奖励 |

### `checkin_reward_config.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 启用 |
| `disabled` | `90` | 停用 |

### `invite_reward_config.inviter_reward_type` / `invite_reward_config.invitee_reward_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `coin` | `10` | 零食币奖励 |
| `coupon` | `20` | 优惠券奖励 |
| `physical` | `30` | 实物 / 仓库奖励 |

### `invite_reward_config.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 启用 |
| `disabled` | `90` | 停用 |

### `achievement_config.type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `achievement` | `10` | 成就类 |
| `badge` | `20` | 徽章类 |
| `title` | `30` | 称号类 |
| `vip` | `40` | VIP / 特权类 |

### `brand.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 品牌可用 |
| `disabled` | `90` | 品牌停用 |

### `brand_product.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 品牌商品可被店铺选择 |
| `disabled` | `90` | 品牌商品停用 |

### `product.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 店铺商品上架中 |
| `off_shelf` | `20` | 店铺商品已下架 |
| `disabled` | `90` | 店铺商品不可售 |

## 内容与互动域

### `post.scope`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `public` | `10` | 公开可见 |
| `followers` | `20` | 仅关注者可见 |
| `private` | `90` | 仅自己可见 |

## 后台权限域

### `admin_user.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 可正常登录 |
| `disabled` | `90` | 已停用 |

### `admin_role.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 角色启用 |
| `disabled` | `90` | 角色停用 |

### `admin_permission.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 权限启用 |
| `disabled` | `90` | 权限停用 |

### `admin_permission.action`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `view` | `10` | 查看 |
| `create` | `20` | 新建 |
| `edit` | `30` | 编辑 |
| `manage` | `40` | 完整管理 |

### `post_interaction.interaction_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `like` | `10` | 点赞 |
| `bookmark` | `20` | 收藏 |

### `product_interaction.interaction_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `favorite` | `10` | 收藏 |
| `like` | `20` | 点赞 |

### `comment_interaction.interaction_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `like` | `10` | 点赞 |

### `notification.type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `system` | `10` | 系统通知 |
| `order` | `20` | 订单通知 |
| `guess` | `30` | 竞猜通知 |
| `social` | `40` | 社交通知 |

### `comment_item.target_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `guess` | `10` | 竞猜评论目标 |
| `post` | `20` | 动态评论目标 |

### `banner.target_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `guess` | `10` | 跳转到竞猜 |
| `post` | `20` | 跳转到动态 |
| `product` | `30` | 跳转到商品 |
| `shop` | `40` | 跳转到店铺 |
| `page` | `50` | 跳转到站内页面 |
| `external` | `90` | 外部链接 |

### `banner.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `active` | `10` | 轮播启用 |
| `disabled` | `90` | 轮播停用 |

### `live.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `upcoming` | `10` | 预告 / 待开播 |
| `live` | `20` | 直播中 |
| `ended` | `30` | 正常结束 |
| `banned` | `90` | 强制下播 / 违规 |

说明：

- 公共 `/api/lives` 列表只返回 `upcoming` + `live`，前端 `status` 字段统一暴露字符串枚举
- `ended` 与 `banned` 仅在后台管理列表中可见
- `live.start_time` 和 `live.status` 同时参与判断：`status = 20` 但 `start_time > NOW()` 时仍按 `upcoming` 展示

### `notification.target_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `order` | `10` | 订单目标 |
| `guess` | `20` | 竞猜目标 |
| `post` | `30` | 动态目标 |
| `chat` | `40` | 会话目标 |

## 社区治理域

### `report_item.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待处理 |
| `reviewing` | `20` | 处理中 |
| `resolved` | `30` | 已处理完成 |
| `rejected` | `40` | 已驳回 |

### `report_item.target_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `post` | `10` | 社区动态 |

### `report_item.reason_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `spam` | `10` | 垃圾广告 |
| `explicit` | `20` | 低俗色情 |
| `abuse` | `30` | 人身攻击 |
| `false_info` | `40` | 虚假信息 |
| `other` | `90` | 其他原因 |

### `report_item.handle_action`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `approve` | `10` | 采纳举报 |
| `reject` | `20` | 驳回举报 |
| `ban` | `30` | 封禁目标或用户 |

## 仓库域

### `virtual_warehouse.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `stored` | `10` | 在库 |
| `locked` | `20` | 已冻结 |
| `converted` | `30` | 已转换或提取 |
| `expired` | `90` | 已失效 |

### `virtual_warehouse.type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `full` | `10` | 完整商品 |
| `fragment` | `20` | 碎片 |

### `physical_warehouse.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `stored` | `10` | 在仓 |
| `consigning` | `20` | 寄售中 |
| `fulfilled` | `30` | 已出库 / 已履约 |
| `expired` | `90` | 已失效 |

说明：

- 用户端“运输中”不直接来自 `physical_warehouse.status`
- “运输中”应通过 `fulfillment_order.status = 30(shipped)` 判断
- `physical_warehouse.status = 10(stored)` 对应用户端已入实体仓 / 已签收后的在仓状态

### `warehouse_item_log.warehouse_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `virtual` | `10` | 虚拟仓 |
| `physical` | `20` | 实体仓 |

### `consign_trade.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `listed` | `10` | 上架中 |
| `traded` | `20` | 已成交 |
| `canceled` | `30` | 已取消 |

## 来源与扩展类型

### `guess.source_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `user` | `10` | 用户创建 |
| `system` | `20` | 系统创建 |
| `operation` | `30` | 运营创建 |

### `guess_product.source_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `platform` | `10` | 平台商品池 |
| `shop` | `20` | 店铺商品 |
| `manual` | `30` | 手工指定 |

### `coupon.source_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `system` | `10` | 系统发放 |
| `activity` | `20` | 活动发放 |
| `order_compensation` | `30` | 订单补偿 |
| `manual` | `40` | 手工发放 |

### `coupon_template.source_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `system` | `10` | 系统模板 |
| `operation` | `20` | 运营模板 |
| `shop` | `30` | 店铺模板 |

### `virtual_warehouse.source_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `guess_reward` | `10` | 竞猜奖励入仓 |
| `order` | `20` | 订单入仓 |
| `exchange` | `30` | 兑换入仓 |
| `manual` | `40` | 手工入仓 |

### `equity_log.type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `grant` | `10` | 发放 |
| `use` | `20` | 使用 |
| `expire` | `30` | 过期 |
| `adjust` | `40` | 调整 |

### `equity_log.sub_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `category` | `10` | 类目权益金 |
| `exchange` | `20` | 换购权益金 |
| `general` | `30` | 通兑资产 |

### `equity_log.source_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `admin_adjust` | `40` | 后台调账 |

## 审核、结算、操作

### `guess.review_status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending_review` | `10` | 待审核 |
| `approved` | `30` | 审核通过 |
| `rejected` | `40` | 审核拒绝 |

### `guess.stake_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `coin` | `10` | 金币下注 |
| `coupon` | `20` | 优惠券下注 |
| `mixed` | `30` | 混合下注 |

### `guess.settlement_mode`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `oracle` | `10` | Oracle 结算 |
| `manual` | `20` | 人工结算 |

### `fulfillment_order.shipping_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `express` | `10` | 快递物流 |
| `same_city` | `20` | 同城配送 |
| `self_pickup` | `30` | 自提 |

### `guess_review_log.action`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `submit` | `10` | 提交审核 |
| `approve` | `20` | 审核通过 |
| `reject` | `30` | 审核拒绝 |
| `abandon` | `40` | 运营作废 |
| `settle` | `50` | 手动开奖 |
| `edit` | `60` | 运营编辑（note 为字段 diff JSON） |

### `friend_guess_confirm.action`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `confirm` | `10` | 确认结果 |
| `reject` | `20` | 拒绝确认 |

### `warehouse_item_log.action`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `inbound` | `10` | 入仓 |
| `lock` | `20` | 冻结 |
| `unlock` | `30` | 解冻 |
| `outbound` | `40` | 出仓 |
| `consign` | `50` | 寄售 |

## 用户与关系域

### `friendship.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `pending` | `10` | 待确认 |
| `accepted` | `30` | 已成为好友 |
| `rejected` | `40` | 已拒绝 |
| `blocked` | `90` | 已拉黑 |

### `sms_verification_code.status`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `sent` | `10` | 已发送 |
| `verified` | `30` | 已验证 |
| `expired` | `90` | 已过期 |

### `user.risk_level`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `normal` | `10` | 普通风险 |
| `watch` | `20` | 观察中 |
| `restricted` | `30` | 受限 |

### `user_profile.gender`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `unknown` | `10` | 未设置 |
| `male` | `20` | 男 |
| `female` | `30` | 女 |

### `user_profile.works_privacy`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `public` | `10` | 所有人可见 |
| `friends` | `20` | 仅好友可见 |
| `private` | `90` | 仅自己可见 |

### `user_profile.fav_privacy`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `public` | `10` | 所有人可见 |
| `private` | `90` | 仅自己可见 |

### `sms_verification_code.biz_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `login` | `10` | 登录 |
| `register` | `20` | 注册 |
| `reset_password` | `30` | 重置密码 |

### 用户态展示约定

- `shopVerified` 不是独立落库字段
- 当前用户态展示层统一按“存在 `shop.status = 10` 的店铺”推导 `shopVerified = true`
- 如果后续需要区分“已开店”和“已认证”，应补单独字段，不再复用这个派生语义

### `order_status_log.operator_role`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `system` | `10` | 系统操作 |
| `user` | `20` | 用户操作 |
| `admin` | `30` | 管理员操作 |

### `warehouse_item_log.operator_role`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `system` | `10` | 系统操作 |
| `user` | `20` | 用户操作 |
| `admin` | `30` | 管理员操作 |

## 排行榜域

### `leaderboard_entry.board_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `guess_wins` | `10` | 猜中次数榜 |
| `guess_win_rate` | `20` | 胜率榜 |
| `invite_count` | `30` | 邀请榜 |

### `leaderboard_entry.period_type`

| 原语义 | 编码 | 说明 |
| --- | --- | --- |
| `daily` | `10` | 日榜 |
| `weekly` | `20` | 周榜 |
| `monthly` | `30` | 月榜 |
| `all_time` | `40` | 总榜 |

### `leaderboard_entry.period_value`

说明：

- 日榜：使用 `YYYYMMDD`，如 `20260419`
- 周榜：使用 `YYYYWW`，如 `202616`
- 月榜：使用 `YYYYMM`，如 `202604`
- 总榜：固定使用 `0`

## 快速判断

- 看业务含义：先看“原语义”
- 看数据库存值：直接看“编码”
- 新增编码：优先复用现有段位，不要打乱同一字段的既有区间
- 新字段若属来源扩展类：优先用 `SMALLINT UNSIGNED`

## 使用要求

1. 新增编码前，先补这份文档。
2. 新增表若有 `status/type/scope/source_type`，优先复用已有数字编码段位。
3. 数据库字段直接落数字编码，不再落字符串枚举。
4. 代码层枚举、埋点、后台筛选项、数据仓口径必须和本文一致。
