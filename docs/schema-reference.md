# Schema Reference

## 用途

这份文档是当前本地测试库 `joy-test` 的“真实表和字段速查”入口。

使用顺序：

1. 先读 [db.md](docs/db.md) 了解业务结构和主链路
2. 再读本文件，对照真实表名和字段名
3. 只有本文件也找不到，或者需要确认真实索引、唯一约束、列类型时，才允许直接查本地 MySQL

说明：

- 本文件只维护 `umi/` 当前数据库事实
- 根目录 `docs/` 不作为当前结构依据
- 本文件偏“字典”，`db.md` 偏“设计说明”

## 账户与后台

### `user`

`id`, `uid_code`, `phone_number`, `password`, `banned`, `level`, `title`, `achievements`, `weight`, `risk_level`, `is_newbie`, `newbie_guesses`, `streak_loss`, `invite_code`, `invited_by`, `created_at`, `updated_at`

### `user_profile`

`id`, `user_id`, `name`, `avatar_url`, `signature`, `gender`, `birthday`, `region`, `works_privacy`, `fav_privacy`, `created_at`, `updated_at`

### `auth_session`

`id`, `token`, `user_id`, `expires_at`, `created_at`, `updated_at`

### `sms_verification_code`

`id`, `phone_number`, `biz_type`, `code_hash`, `status`, `expires_at`, `used_at`, `request_ip`, `created_at`, `updated_at`

### `admin_user`

`id`, `username`, `password_hash`, `display_name`, `phone_number`, `email`, `status`, `last_login_at`, `last_login_ip`, `created_at`, `updated_at`

### `admin_role`

`id`, `code`, `name`, `description`, `status`, `is_system`, `sort`, `created_at`, `updated_at`

### `admin_permission`

`id`, `code`, `name`, `module`, `action`, `parent_id`, `status`, `sort`, `created_at`, `updated_at`

### `admin_user_role`

`id`, `admin_user_id`, `role_id`, `created_at`

### `admin_role_permission`

`id`, `role_id`, `permission_id`, `created_at`

### `address`

`id`, `user_id`, `name`, `phone_number`, `province`, `city`, `district`, `detail`, `tag`, `is_default`, `created_at`, `updated_at`

### `user_follow`

`id`, `follower_id`, `following_id`, `created_at`, `updated_at`

### `friendship`

`id`, `user_id`, `friend_id`, `status`, `message`, `created_at`, `updated_at`

## 分类、品牌、店铺、商品

### `category`

`id`, `biz_type`, `parent_id`, `level`, `path`, `name`, `icon_url`, `description`, `sort`, `status`, `created_at`, `updated_at`

说明：

- 这是当前系统的分类主数据表，不是通用文案表
- 需要结合 `biz_type` 才能正确理解一条分类记录属于哪个业务域
- 当前约定：
  - `10` = 品牌分类
  - `20` = 店铺经营分类
  - `30` = 商品分类
  - `40` = 竞猜分类
- `parent_id / level / path` 用于分类树
- 别的线程如果只知道“某张表有 `category_id`”，先回到这里看该表对应哪个 `biz_type`

当前主要对应关系：

- `brand.category_id` -> `biz_type = 10`
- `shop.category_id` / `shop_apply.category_id` -> `biz_type = 20`
- `brand_product.category_id` -> `biz_type = 30`
- `guess.category_id` -> `biz_type = 40`

补充：

- 早期占位分类已经清理，不要再把 `零食品牌`、`零食店铺`、`膨化零食`、`零食竞猜` 这类旧测试值当成当前事实
- 当前本地测试库已经补入一批按老系统语义整理过的标准分类种子，可直接用于页面联调

### `brand`

`id`, `name`, `logo_url`, `category_id`, `contact_name`, `contact_phone`, `description`, `status`, `created_at`, `updated_at`

### `brand_product`

`id`, `brand_id`, `name`, `category_id`, `guide_price`, `supply_price`, `default_img`, `images`, `description`, `status`, `created_at`, `updated_at`

### `shop`

`id`, `user_id`, `name`, `category_id`, `description`, `logo_url`, `status`, `created_at`, `updated_at`

### `shop_apply`

`id`, `apply_no`, `user_id`, `shop_name`, `category_id`, `reason`, `status`, `reject_reason`, `reviewed_at`, `created_at`, `updated_at`

### `shop_brand_auth`

`id`, `auth_no`, `shop_id`, `brand_id`, `auth_type`, `auth_scope`, `scope_value`, `status`, `granted_at`, `expire_at`, `expired_at`, `created_at`, `updated_at`

说明：

- 这是“生效后的店铺品牌授权关系表”
- 它表达的是店铺当前已经拿到的授权，不是申请过程
- 申请过程看 `shop_brand_auth_apply`
- 判断店铺能否经营某品牌，先看这里

接手时重点看：

- `auth_type`
  授权类型，如普通/独家/试用
- `auth_scope`
  授权范围，如全品牌/指定类目/指定商品
- `scope_value`
  授权范围扩展值
- `status`
  当前授权是否生效
- `expire_at`
  授权计划到期时间

### `shop_brand_auth_apply`

`id`, `apply_no`, `shop_id`, `brand_id`, `reason`, `license`, `status`, `reject_reason`, `reviewed_at`, `created_at`, `updated_at`

### `product`

`id`, `shop_id`, `brand_product_id`, `name`, `price`, `original_price`, `image_url`, `images`, `sales`, `rating`, `stock`, `frozen_stock`, `description`, `tags`, `guess_price`, `collab`, `source_url`, `status`, `created_at`, `updated_at`

### `product_interaction`

`id`, `user_id`, `product_id`, `interaction_type`, `created_at`, `updated_at`

说明：

- 这是“商品互动关系表”
- 当前只承接商品收藏和商品点赞
- 不要和 `post_interaction` 混用

接手时重点理解：

- `user_id + product_id + interaction_type` 唯一
- `interaction_type`
  不是状态，而是互动动作类型
- 商品是否被某用户收藏/点赞，默认查这里

### `cart_item`

`id`, `user_id`, `product_id`, `quantity`, `specs`, `checked`, `created_at`, `updated_at`

### `banner`

`id`, `position`, `title`, `subtitle`, `image_url`, `target_type`, `target_id`, `action_url`, `sort`, `status`, `start_at`, `end_at`, `created_at`, `updated_at`

## 竞猜与互动

### `guess`

`id`, `title`, `type`, `source_type`, `image_url`, `status`, `end_time`, `creator_id`, `category_id`, `tags`, `description`, `topic_detail`, `settled_at`, `review_status`, `scope`, `stake_type`, `settlement_mode`, `min_loser_ratio`, `created_at`, `updated_at`

### `guess_option`

`id`, `guess_id`, `option_index`, `option_text`, `odds`, `trend`, `is_result`, `created_at`, `updated_at`

### `guess_product`

`id`, `guess_id`, `product_id`, `option_idx`, `source_type`, `shop_id`, `quantity`, `created_at`, `updated_at`

### `guess_bet`

`id`, `user_id`, `guess_id`, `choice_idx`, `amount`, `product_id`, `coupon_id`, `status`, `reward_type`, `created_at`, `updated_at`

### `guess_invitation`

`id`, `guess_id`, `inviter_id`, `invitee_id`, `status`, `payment_mode`, `paid_amount`, `paid_by`, `responded_at`, `created_at`, `updated_at`

### `friend_guess_confirm`

`id`, `guess_id`, `user_id`, `action`, `created_at`, `updated_at`

### `pk_record`

`id`, `initiator_id`, `opponent_id`, `guess_id`, `initiator_choice_idx`, `opponent_choice_idx`, `stake_amount`, `result`, `reward_type`, `reward_value`, `reward_ref_id`, `created_at`, `settled_at`, `updated_at`

### `guess_review_log`

`id`, `guess_id`, `reviewer_id`, `action`, `from_status`, `to_status`, `note`, `created_at`, `updated_at`

### `guess_oracle_evidence`

`id`, `guess_id`, `source_type`, `query_payload`, `response_payload`, `matched_index`, `confidence`, `reason`, `verified_at`, `created_at`, `updated_at`

### `comment_item`

`id`, `target_type`, `target_id`, `user_id`, `parent_id`, `content`, `created_at`, `updated_at`

### `comment_interaction`

`id`, `user_id`, `comment_id`, `interaction_type`, `created_at`, `updated_at`

说明：

- 这是“评论互动关系表”
- 当前承载评论点赞关系
- `user_id + comment_id + interaction_type` 唯一
- `interaction_type` 不是状态，而是互动动作类型编码

## 订单、履约、优惠券、权益

### `order`

`id`, `order_sn`, `user_id`, `type`, `guess_id`, `amount`, `original_amount`, `coupon_id`, `coupon_discount`, `address_id`, `status`, `created_at`, `updated_at`

### `order_item`

`id`, `order_id`, `product_id`, `specs`, `quantity`, `unit_price`, `original_unit_price`, `item_amount`, `coupon_discount`, `created_at`, `updated_at`

### `order_status_log`

`id`, `order_id`, `from_status`, `to_status`, `operator_id`, `operator_role`, `note`, `created_at`, `updated_at`

### `order_refund`

`id`, `order_id`, `user_id`, `refund_no`, `reason`, `description`, `status`, `refund_amount`, `reviewer_id`, `review_note`, `requested_at`, `reviewed_at`, `completed_at`, `created_at`, `updated_at`

### `fulfillment_order`

`id`, `fulfillment_sn`, `type`, `status`, `user_id`, `order_id`, `shop_id`, `address_id`, `receiver_name`, `phone_number`, `province`, `city`, `district`, `detail_address`, `shipping_type`, `shipping_fee`, `total_amount`, `tracking_no`, `shipped_at`, `completed_at`, `created_at`, `updated_at`

### `fulfillment_order_item`

`id`, `fulfillment_order_id`, `product_id`, `unit_price`, `quantity`, `created_at`, `updated_at`

### `coupon_template`

`id`, `code`, `name`, `type`, `status`, `scope_type`, `shop_id`, `description`, `source_type`, `min_amount`, `discount_amount`, `discount_rate`, `max_discount_amount`, `validity_type`, `start_at`, `end_at`, `valid_days`, `total_quantity`, `user_limit`, `created_at`, `updated_at`

### `coupon_grant_batch`

`id`, `batch_no`, `template_id`, `source_type`, `operator_id`, `target_user_count`, `granted_count`, `status`, `note`, `created_at`, `updated_at`

说明：

- 这是“发券动作表”，不是模板表，也不是用户券表
- 一条记录代表一次批量发券动作
- 它用来回答“这批券是哪次发的、谁发的、发了多少”

接手时默认这样理解三层关系：

- `coupon_template`
  券规则
- `coupon_grant_batch`
  发券动作
- `coupon`
  用户实际持有的券

### `coupon`

`id`, `coupon_no`, `user_id`, `template_id`, `grant_batch_id`, `name`, `amount`, `type`, `condition`, `expire_at`, `source_type`, `status`, `claimed_at`, `used_at`, `created_at`, `updated_at`

### `coin_ledger`

`id`, `user_id`, `type`, `amount`, `balance_after`, `source_type`, `source_id`, `operator_id`, `operator_role`, `note`, `created_at`, `updated_at`

### `equity_account`

`id`, `user_id`, `category_amount`, `exchange_amount`, `general_amount`, `total_granted`, `total_used`, `total_expired`, `created_at`, `updated_at`

### `equity_log`

`id`, `account_id`, `user_id`, `type`, `sub_type`, `amount`, `balance`, `source_type`, `ref_id`, `note`, `expire_at`, `created_at`, `updated_at`

## 仓库、营销、治理、社交

### `virtual_warehouse`

`id`, `user_id`, `product_id`, `quantity`, `frozen_quantity`, `price`, `source_type`, `source_id`, `status`, `type`, `fragment_value`, `created_at`, `updated_at`

### `physical_warehouse`

`id`, `user_id`, `product_id`, `quantity`, `frozen_quantity`, `price`, `source_type`, `source_id`, `source_virtual_id`, `status`, `consign_price`, `consign_date`, `estimate_days`, `created_at`, `updated_at`

### `warehouse_item_log`

`id`, `warehouse_type`, `item_id`, `user_id`, `product_id`, `action`, `from_status`, `to_status`, `quantity`, `source_type`, `source_id`, `operator_id`, `operator_role`, `note`, `meta_json`, `created_at`, `updated_at`

### `consign_trade`

`id`, `trade_no`, `physical_item_id`, `seller_user_id`, `buyer_user_id`, `order_id`, `status`, `settlement_status`, `sale_amount`, `commission_amount`, `seller_amount`, `listed_at`, `traded_at`, `settled_at`, `canceled_at`, `created_at`, `updated_at`

### `checkin_reward_config`

`id`, `day_no`, `reward_type`, `reward_value`, `reward_ref_id`, `title`, `sort`, `status`, `created_at`, `updated_at`

### `checkin`

`id`, `user_id`, `checked_at`, `reward_type`, `reward_value`, `reward_ref_id`, `created_at`, `updated_at`

### `invite_reward_config`

`id`, `inviter_reward_type`, `inviter_reward_value`, `inviter_reward_ref_id`, `invitee_reward_type`, `invitee_reward_value`, `invitee_reward_ref_id`, `status`, `created_at`, `updated_at`

### `achievement_config`

`id`, `code`, `name`, `type`, `icon_url`, `description`, `threshold_value`, `reward_type`, `reward_value`, `reward_ref_id`, `status`, `sort`, `created_at`, `updated_at`

### `leaderboard_entry`

`id`, `board_type`, `period_type`, `period_value`, `user_id`, `rank_no`, `score`, `extra_json`, `created_at`, `updated_at`

说明：

- 这是“排行榜结果表”
- 一条记录表示：某个榜单、某个周期、某个用户的一条结果
- 它不负责定义榜单规则，也不存用户资料快照

接手时重点理解：

- `board_type`
  是榜单类型，不是字符串榜单名
- `period_type + period_value`
  一起定义榜单周期
- `rank_no`
  表示该用户在这一期榜单里的排名
- `score`
  表示该榜单采用的分值
- `extra_json`
  用来放附加指标，比如胜场、胜率、邀请数

### `post`

`id`, `user_id`, `type`, `title`, `content`, `images`, `tag`, `guess_id`, `video_thumb`, `video_duration`, `location`, `scope`, `repost_id`, `created_at`, `updated_at`

### `post_interaction`

`id`, `user_id`, `post_id`, `interaction_type`, `created_at`, `updated_at`

### `report_item`

`id`, `reporter_user_id`, `target_type`, `target_id`, `reason_type`, `reason_detail`, `status`, `handler_id`, `handle_action`, `handle_note`, `handled_at`, `created_at`, `updated_at`

### `notification`

`id`, `user_id`, `type`, `title`, `content`, `target_type`, `target_id`, `action_url`, `is_read`, `created_at`, `updated_at`

### `chat_conversation`

`id`, `user_id`, `peer_id`, `last_message_id`, `unread_count`, `last_message`, `last_message_at`, `created_at`, `updated_at`

### `chat_message`

`id`, `sender_id`, `receiver_id`, `content`, `is_read`, `created_at`, `updated_at`

### `live`

`id`, `host_id`, `title`, `image_url`, `status`, `start_time`, `created_at`, `updated_at`

### `ai_chat_message`

`id`, `user_id`, `role`, `content`, `context`, `guess_id`, `created_at`, `updated_at`

## 维护要求

- 新增表或删字段后，先更新 [db.md](docs/db.md)
- 再同步更新本文件
- 如果是编码字段，额外更新 [status-codes.md](docs/status-codes.md)
- 别的线程默认先查本文件，不先查 MySQL
