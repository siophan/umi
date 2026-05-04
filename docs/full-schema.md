# 全量数据库表结构

这份文档直接基于本地 `joy-test` 的真实表结构整理，按表分组展示。

## 目录
- [achievement_config](#achievement_config)
- [address](#address)
- [admin_permission](#admin_permission)
- [admin_role](#admin_role)
- [admin_role_permission](#admin_role_permission)
- [admin_user](#admin_user)
- [admin_user_role](#admin_user_role)
- [ai_chat_message](#ai_chat_message)
- [auth_session](#auth_session)
- [banner](#banner)
- [brand](#brand)
- [brand_product](#brand_product)
- [brand_product_sku](#brand_product_sku)
- [cart_item](#cart_item)
- [category](#category)
- [chat_conversation](#chat_conversation)
- [chat_message](#chat_message)
- [checkin](#checkin)
- [checkin_reward_config](#checkin_reward_config)
- [comment_interaction](#comment_interaction)
- [comment_item](#comment_item)
- [consign_trade](#consign_trade)
- [coupon](#coupon)
- [coupon_grant_batch](#coupon_grant_batch)
- [coupon_template](#coupon_template)
- [equity_account](#equity_account)
- [equity_log](#equity_log)
- [friend_guess_confirm](#friend_guess_confirm)
- [friendship](#friendship)
- [fulfillment_order](#fulfillment_order)
- [fulfillment_order_item](#fulfillment_order_item)
- [guess](#guess)
- [guess_bet](#guess_bet)
- [guess_invitation](#guess_invitation)
- [guess_option](#guess_option)
- [guess_oracle_evidence](#guess_oracle_evidence)
- [guess_product](#guess_product)
- [guess_review_log](#guess_review_log)
- [invite_reward_config](#invite_reward_config)
- [leaderboard_entry](#leaderboard_entry)
- [live](#live)
- [notification](#notification)
- [order](#order)
- [order_item](#order_item)
- [order_refund](#order_refund)
- [order_status_log](#order_status_log)
- [payment_settings](#payment_settings)
- [physical_warehouse](#physical_warehouse)
- [pk_record](#pk_record)
- [post](#post)
- [post_interaction](#post_interaction)
- [product](#product)
- [product_interaction](#product_interaction)
- [report_item](#report_item)
- [shop](#shop)
- [shop_apply](#shop_apply)
- [shop_brand_auth](#shop_brand_auth)
- [shop_brand_auth_apply](#shop_brand_auth_apply)
- [sms_verification_code](#sms_verification_code)
- [user](#user)
- [user_follow](#user_follow)
- [user_profile](#user_profile)
- [virtual_warehouse](#virtual_warehouse)
- [warehouse_item_log](#warehouse_item_log)

> 2026-05-04 多规格改造：以下 9 张子表新增 `brand_product_sku_id` 列（位置在 `product_id` 之后；`warehouse_item_log` 可空，其余 NOT NULL）：`cart_item / order_item / fulfillment_order_item / product_review / consign_trade / virtual_warehouse / physical_warehouse / warehouse_item_log / guess_bet / guess_product`。`guess_product` UNIQUE: `(guess_id, option_idx, product_id, brand_product_sku_id)`。详见设计：`docs/superpowers/specs/2026-05-04-multi-spec-brand-product-design.md`。

## achievement_config

- 表注释：成就配置表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 成就配置 ID |
| 2 | `code` | `varchar(64)` | `NO` | `NULL` | `UNI` | `-` | 成就编码 |
| 3 | `name` | `varchar(64)` | `NO` | `NULL` | `-` | `-` | 成就名称 |
| 4 | `type` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 成就类型编码 |
| 5 | `icon_url` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 成就图标 |
| 6 | `description` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 成就说明 |
| 7 | `threshold_value` | `bigint` | `YES` | `NULL` | `-` | `-` | 达成阈值 |
| 8 | `reward_type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 奖励类型编码 |
| 9 | `reward_value` | `bigint` | `YES` | `NULL` | `-` | `-` | 奖励数值 |
| 10 | `reward_ref_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 奖励关联 ID |
| 11 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 12 | `sort` | `int` | `NO` | `0` | `-` | `-` | 排序 |
| 13 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 14 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## address

- 表注释：用户收货地址表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 地址 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 3 | `name` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 收货人姓名 |
| 4 | `phone_number` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 收货手机号 |
| 5 | `province` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 省份 |
| 6 | `city` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 城市 |
| 7 | `district` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 区县 |
| 8 | `detail` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 详细地址 |
| 9 | `tag` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 地址标签 |
| 10 | `is_default` | `tinyint(1)` | `NO` | `0` | `-` | `-` | 是否默认地址 |
| 11 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 12 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## admin_permission

- 表注释：后台权限表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 权限ID |
| 2 | `code` | `varchar(128)` | `NO` | `NULL` | `UNI` | `-` | 权限编码 |
| 3 | `name` | `varchar(64)` | `NO` | `NULL` | `-` | `-` | 权限名称 |
| 4 | `module` | `varchar(64)` | `NO` | `NULL` | `MUL` | `-` | 所属模块 |
| 5 | `action` | `tinyint unsigned` | `NO` | `NULL` | `-` | `-` | 动作编码 |
| 6 | `parent_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 父权限ID |
| 7 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 8 | `sort` | `int` | `NO` | `0` | `-` | `-` | 排序 |
| 9 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 10 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

## admin_role

- 表注释：后台角色表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 角色ID |
| 2 | `code` | `varchar(64)` | `NO` | `NULL` | `UNI` | `-` | 角色编码 |
| 3 | `name` | `varchar(64)` | `NO` | `NULL` | `-` | `-` | 角色名称 |
| 4 | `description` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 角色说明 |
| 5 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 6 | `is_system` | `tinyint unsigned` | `NO` | `0` | `-` | `-` | 是否系统角色 |
| 7 | `sort` | `int` | `NO` | `0` | `-` | `-` | 排序 |
| 8 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 9 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

## admin_role_permission

- 表注释：角色权限关联表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 角色权限关联ID |
| 2 | `role_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 角色ID |
| 3 | `permission_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 权限ID |
| 4 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |

## admin_user

- 表注释：后台管理员表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 管理员ID |
| 2 | `username` | `varchar(64)` | `NO` | `NULL` | `UNI` | `-` | 登录用户名 |
| 3 | `password_hash` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 密码哈希 |
| 4 | `display_name` | `varchar(64)` | `NO` | `NULL` | `-` | `-` | 显示名称 |
| 5 | `phone_number` | `varchar(32)` | `YES` | `NULL` | `UNI` | `-` | 手机号 |
| 6 | `email` | `varchar(128)` | `YES` | `NULL` | `-` | `-` | 邮箱 |
| 7 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 8 | `last_login_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 最后登录时间 |
| 9 | `last_login_ip` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 最后登录IP |
| 10 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 11 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

## admin_user_role

- 表注释：管理员角色关联表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 管理员角色关联ID |
| 2 | `admin_user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 管理员ID |
| 3 | `role_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 角色ID |
| 4 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |

## ai_chat_message

- 表注释：AI 对话消息记录表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | AI 消息 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 3 | `role` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 角色编码 |
| 4 | `content` | `text` | `NO` | `NULL` | `-` | `-` | 消息内容 |
| 5 | `context` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 上下文标识 |
| 6 | `guess_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 关联竞猜 ID |
| 7 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 8 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## auth_session

- 表注释：登录会话表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 主键 |
| 2 | `token` | `varchar(64)` | `NO` | `NULL` | `UNI` | `-` | 登录态 token |
| 3 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 4 | `expires_at` | `datetime` | `NO` | `NULL` | `MUL` | `-` | 过期时间 |
| 5 | `created_at` | `datetime` | `NO` | `CURRENT_TIMESTAMP` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 6 | `updated_at` | `datetime` | `NO` | `CURRENT_TIMESTAMP` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | 更新时间 |

## banner

- 表注释：运营 Banner 配置表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | Banner ID |
| 2 | `position` | `varchar(191)` | `NO` | `NULL` | `MUL` | `-` | 展示位置 |
| 3 | `title` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 主标题 |
| 4 | `subtitle` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 副标题 |
| 5 | `image_url` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 图片地址 |
| 6 | `target_type` | `tinyint unsigned` | `YES` | `NULL` | `MUL` | `-` | 目标类型编码 |
| 7 | `target_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 跳转目标 ID |
| 8 | `action_url` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 外部跳转地址 |
| 9 | `sort` | `int` | `NO` | `0` | `-` | `-` | 排序值 |
| 10 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 轮播状态：10=active, 90=disabled |
| 11 | `start_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 生效开始时间 |
| 12 | `end_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 生效结束时间 |
| 13 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 14 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## brand

- 表注释：品牌主表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 品牌 ID |
| 2 | `name` | `varchar(191)` | `NO` | `NULL` | `UNI` | `-` | 品牌名称 |
| 3 | `logo_url` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 品牌 Logo |
| 4 | `category_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 品牌分类 ID |
| 5 | `contact_name` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 联系人姓名 |
| 6 | `contact_phone` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 联系人电话 |
| 7 | `description` | `text` | `YES` | `NULL` | `-` | `-` | 品牌介绍 |
| 8 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 9 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 10 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## brand_product

- 表注释：平台品牌商品库（SPU）

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 品牌商品主键 |
| 2 | `brand_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 品牌 ID |
| 3 | `spec_definitions` | `json` | `YES` | `NULL` | `-` | `-` | 规格维度定义：[{"name":"颜色","values":[...]}]；NULL=单规格商品 |
| 4 | `name` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 标准商品名称 |
| 5 | `category_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 商品分类 ID |
| 6 | `default_img` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 默认主图 |
| 7 | `images` | `json` | `NO` | `NULL` | `-` | `-` | - |
| 8 | `video_url` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 主图视频 URL（mp4 / m3u8） |
| 9 | `description` | `text` | `YES` | `NULL` | `-` | `-` | 商品描述 |
| 10 | `detail_html` | `mediumtext` | `YES` | `NULL` | `-` | `-` | 商品详情 HTML（详情 tab 渲染） |
| 11 | `spec_table` | `json` | `YES` | `NULL` | `-` | `-` | 参数表 JSON |
| 12 | `package_list` | `json` | `YES` | `NULL` | `-` | `-` | 包装清单 JSON |
| 13 | `freight` | `bigint` | `YES` | `NULL` | `-` | `-` | 运费，单位分；NULL=包邮 |
| 14 | `ship_from` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 发货地 |
| 15 | `delivery_days` | `varchar(32)` | `YES` | `NULL` | `-` | `-` | 发货时效文案 |
| 16 | `tags` | `json` | `YES` | `NULL` | `-` | `-` | 商品标签 JSON 数组 |
| 17 | `collab` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 联名信息 |
| 18 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 19 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 20 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

> 注：2026-05-04 多规格改造后，`brand_product` 仅保留 SPU 共享属性。原 `guide_price / supply_price / guess_price / stock / frozen_stock` 五列 DROP，迁移到子表 `brand_product_sku`。`spec_definitions` 新增列声明 SKU 规格维度；NULL=单规格商品（仍需对应一条 `spec_json={}` 的 default sku）。

## brand_product_sku

- 表注释：品牌商品 SKU 表（多规格）

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | SKU 主键 |
| 2 | `brand_product_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 关联 SPU brand_product.id |
| 3 | `sku_code` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 运营自填的对外 SKU 码 |
| 4 | `spec_json` | `json` | `NO` | `NULL` | `-` | `-` | 规格 JSON：{"颜色":"红"...}；单规格写 {} |
| 5 | `spec_signature` | `varchar(255)` | `NO` | `NULL` | `-` | `-` | 应用层算的 spec_json key 排序拼接，UNIQUE 用 |
| 6 | `guide_price` | `bigint` | `NO` | `NULL` | `-` | `-` | 吊牌价，单位分；运营每个 SKU 必填 |
| 7 | `supply_price` | `bigint` | `YES` | `NULL` | `-` | `-` | 供货价，单位分；不参与展示 |
| 8 | `guess_price` | `bigint` | `YES` | `NULL` | `-` | `-` | 竞猜价；NULL fallback 到 guide_price |
| 9 | `stock` | `int` | `NO` | `0` | `-` | `-` | SKU 库存 |
| 10 | `frozen_stock` | `int` | `NO` | `0` | `-` | `-` | SKU 冻结库存（pending 订单占用） |
| 11 | `image` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | SKU 主图，留空取 SPU default_img |
| 12 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 10=active 90=disabled |
| 13 | `sort` | `int` | `NO` | `0` | `-` | `-` | 排序 |
| 14 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 15 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

> UNIQUE: `(brand_product_id, spec_signature)` —— 同 SPU 下规格组合唯一。
> 库存 freeze-on-pending：可用库存 = `stock - frozen_stock`；createPendingOrder 占用、markOrderPaid 扣减+解冻、超时关单 / 退款入库归还。中奖入虚拟仓不动 stock（中奖物品由备货池出货）。

## cart_item

- 表注释：购物车明细表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 购物车项 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 3 | `product_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 商品 ID |
| 4 | `brand_product_sku_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | SKU ID（合并键的一部分） |
| 5 | `quantity` | `int` | `NO` | `1` | `-` | `-` | 数量 |
| 6 | `specs` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 规格说明（UI 缓存，真实判断走 sku_id） |
| 7 | `checked` | `tinyint(1)` | `NO` | `1` | `-` | `-` | 是否选中 |
| 8 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 9 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

> UNIQUE: `(user_id, product_id, brand_product_sku_id)` 合并键。

## category

- 表注释：分类表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 分类 ID |
| 2 | `biz_type` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 业务类型编码 |
| 3 | `parent_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 父分类 ID |
| 4 | `level` | `tinyint unsigned` | `NO` | `1` | `-` | `-` | 层级 |
| 5 | `path` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 分类路径 |
| 6 | `name` | `varchar(64)` | `NO` | `NULL` | `-` | `-` | 分类名称 |
| 7 | `icon_url` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 分类图标 |
| 8 | `icon_class` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | Font Awesome 图标类名，例如 fa-solid fa-fire |
| 9 | `theme_class` | `varchar(32)` | `YES` | `NULL` | `-` | `-` | 前端配色 key，对应 page.module.css 主题样式 |
| 10 | `description` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 分类简介 |
| 11 | `sort` | `int` | `NO` | `0` | `-` | `-` | 排序 |
| 12 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 13 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 14 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## chat_conversation

- 表注释：用户私聊会话表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 主键 |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 当前用户 ID |
| 3 | `peer_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 对端用户 ID |
| 4 | `last_message_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 最后一条消息 ID |
| 5 | `unread_count` | `int` | `NO` | `0` | `-` | `-` | 当前用户未读数 |
| 6 | `last_message` | `text` | `NO` | `NULL` | `-` | `-` | 最后一条消息摘要 |
| 7 | `last_message_at` | `datetime(3)` | `NO` | `NULL` | `-` | `-` | 最后一条消息时间 |
| 8 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 9 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

## chat_message

- 表注释：用户私聊消息表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 消息 ID |
| 2 | `sender_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 发送人 ID |
| 3 | `receiver_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 接收人 ID |
| 4 | `content` | `text` | `NO` | `NULL` | `-` | `-` | 消息内容 |
| 5 | `is_read` | `tinyint(1)` | `NO` | `0` | `-` | `-` | 是否已读 |
| 6 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 7 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## checkin

- 表注释：用户签到记录表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 签到记录 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 3 | `checked_at` | `datetime(3)` | `NO` | `NULL` | `-` | `-` | 签到时间 |
| 4 | `reward_type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 奖励类型编码 |
| 5 | `reward_value` | `decimal(10,2)` | `YES` | `NULL` | `-` | `-` | 奖励数值 |
| 6 | `reward_ref_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 奖励关联 ID |
| 7 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 8 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## checkin_reward_config

- 表注释：签到奖励配置表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 签到奖励配置 ID |
| 2 | `day_no` | `tinyint unsigned` | `NO` | `NULL` | `UNI` | `-` | 签到天数序号 |
| 3 | `reward_type` | `tinyint unsigned` | `NO` | `NULL` | `-` | `-` | 奖励类型编码 |
| 4 | `reward_value` | `bigint` | `NO` | `0` | `-` | `-` | 奖励数值 |
| 5 | `reward_ref_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 奖励关联 ID |
| 6 | `title` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 奖励标题 |
| 7 | `sort` | `int` | `NO` | `0` | `-` | `-` | 排序 |
| 8 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 9 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 10 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## comment_interaction

- 表注释：-

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint unsigned` | `NO` | `NULL` | `PRI` | `auto_increment` | - |
| 2 | `user_id` | `bigint unsigned` | `NO` | `NULL` | `MUL` | `-` | - |
| 3 | `comment_id` | `bigint unsigned` | `NO` | `NULL` | `MUL` | `-` | - |
| 4 | `interaction_type` | `tinyint unsigned` | `NO` | `NULL` | `-` | `-` | - |
| 5 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | - |
| 6 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | - |

## comment_item

- 表注释：通用评论表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 评论 ID |
| 2 | `target_type` | `tinyint unsigned` | `NO` | `NULL` | `MUL` | `-` | 目标类型编码 |
| 3 | `target_id` | `bigint` | `NO` | `NULL` | `-` | `-` | 评论目标 ID |
| 4 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 评论用户 ID |
| 5 | `parent_id` | `int` | `YES` | `NULL` | `MUL` | `-` | 父评论 ID |
| 6 | `content` | `text` | `NO` | `NULL` | `-` | `-` | 评论内容 |
| 7 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 8 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## consign_trade

- 表注释：寄售成交表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 寄售成交主键 |
| 2 | `trade_no` | `varchar(32)` | `NO` | `NULL` | `UNI` | `-` | 寄售成交单号 |
| 3 | `physical_item_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 实体仓物品 ID |
| 4 | `seller_user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 卖家用户 ID |
| 5 | `buyer_user_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 买家用户 ID |
| 6 | `order_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 关联订单 ID |
| 7 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 成交状态编码 |
| 8 | `settlement_status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 结算状态编码 |
| 9 | `sale_amount` | `bigint` | `NO` | `0` | `-` | `-` | 成交金额，单位分 |
| 10 | `commission_amount` | `bigint` | `NO` | `0` | `-` | `-` | 平台抽成，单位分 |
| 11 | `seller_amount` | `bigint` | `NO` | `0` | `-` | `-` | 卖家实收金额，单位分 |
| 12 | `listed_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 上架时间 |
| 13 | `traded_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 成交时间 |
| 14 | `settled_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 结算时间 |
| 15 | `canceled_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 取消时间 |
| 16 | `cancel_reason` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 取消理由（admin 强制下架时填写） |
| 17 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 18 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## coupon

- 表注释：用户优惠券表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 优惠券 ID |
| 2 | `coupon_no` | `varchar(32)` | `NO` | `NULL` | `UNI` | `-` | 优惠券编号 |
| 3 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 4 | `template_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 优惠券模板 ID |
| 5 | `grant_batch_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 发券批次 ID |
| 6 | `name` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 优惠券名称 |
| 7 | `amount` | `bigint` | `YES` | `NULL` | `-` | `-` | 面额，单位分 |
| 8 | `type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 类型编码 |
| 9 | `condition` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 使用门槛 |
| 10 | `expire_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 过期时间 |
| 11 | `source_type` | `smallint unsigned` | `YES` | `NULL` | `-` | `-` | 来源类型编码 |
| 12 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 13 | `claimed_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 领取时间 |
| 14 | `used_at` | `datetime(3)` | `YES` | `NULL` | `MUL` | `-` | 使用时间 |
| 15 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 16 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## coupon_grant_batch

- 表注释：发券批次表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 发券批次主键 |
| 2 | `batch_no` | `varchar(32)` | `NO` | `NULL` | `UNI` | `-` | 发券批次号 |
| 3 | `template_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 优惠券模板 ID |
| 4 | `source_type` | `smallint unsigned` | `NO` | `NULL` | `-` | `-` | 来源类型编码 |
| 5 | `operator_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 操作人 ID |
| 6 | `target_user_count` | `int` | `NO` | `0` | `-` | `-` | 目标用户数 |
| 7 | `granted_count` | `int` | `NO` | `0` | `-` | `-` | 实际发放数量 |
| 8 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 批次状态编码 |
| 9 | `note` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 备注 |
| 10 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 11 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## coupon_template

- 表注释：优惠券模板表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 模板 ID |
| 2 | `code` | `varchar(50)` | `NO` | `NULL` | `UNI` | `-` | 模板编码 |
| 3 | `name` | `varchar(100)` | `NO` | `NULL` | `-` | `-` | 优惠券名称 |
| 4 | `type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 类型编码 |
| 5 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 6 | `scope_type` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 范围类型编码 |
| 7 | `shop_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 指定店铺 ID |
| 8 | `description` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 模板描述 |
| 9 | `source_type` | `smallint unsigned` | `YES` | `NULL` | `MUL` | `-` | 来源类型编码 |
| 10 | `min_amount` | `bigint` | `NO` | `0` | `-` | `-` | 最低使用金额，单位分 |
| 11 | `discount_amount` | `bigint` | `NO` | `0` | `-` | `-` | 优惠金额，单位分 |
| 12 | `discount_rate` | `decimal(5,2)` | `YES` | `NULL` | `-` | `-` | 折扣率 |
| 13 | `max_discount_amount` | `bigint` | `NO` | `0` | `-` | `-` | 最大优惠金额，单位分 |
| 14 | `validity_type` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 有效期类型编码 |
| 15 | `start_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 有效期开始时间 |
| 16 | `end_at` | `datetime(3)` | `YES` | `NULL` | `MUL` | `-` | 有效期结束时间 |
| 17 | `valid_days` | `int` | `NO` | `0` | `-` | `-` | 领取后有效天数 |
| 18 | `total_quantity` | `int` | `NO` | `-1` | `-` | `-` | 总发放数量，-1 不限 |
| 19 | `user_limit` | `int` | `NO` | `1` | `-` | `-` | 每人限领数量 |
| 20 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 21 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## equity_account

- 表注释：权益金账户表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 权益账户 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `UNI` | `-` | 用户 ID |
| 3 | `category_amount` | `decimal(10,2)` | `NO` | `0.00` | `-` | `-` | 类目权益余额 |
| 4 | `exchange_amount` | `decimal(10,2)` | `NO` | `0.00` | `-` | `-` | 换购权益余额 |
| 5 | `general_amount` | `decimal(10,2)` | `NO` | `0.00` | `-` | `-` | 通兑权益余额 |
| 6 | `total_granted` | `decimal(10,2)` | `NO` | `0.00` | `-` | `-` | 累计发放权益 |
| 7 | `total_used` | `decimal(10,2)` | `NO` | `0.00` | `-` | `-` | 累计使用权益 |
| 8 | `total_expired` | `decimal(10,2)` | `NO` | `0.00` | `-` | `-` | 累计过期权益 |
| 9 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 10 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## equity_log

- 表注释：权益金流水表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 权益流水 ID |
| 2 | `account_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 权益账户 ID |
| 3 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 4 | `type` | `tinyint unsigned` | `YES` | `NULL` | `MUL` | `-` | 类型编码 |
| 5 | `sub_type` | `smallint unsigned` | `YES` | `NULL` | `-` | `-` | 子类型编码 |
| 6 | `amount` | `decimal(10,2)` | `NO` | `NULL` | `-` | `-` | 变动金额 |
| 7 | `balance` | `decimal(10,2)` | `NO` | `NULL` | `-` | `-` | 变动后余额 |
| 8 | `source_type` | `smallint unsigned` | `YES` | `NULL` | `-` | `-` | 来源类型编码 |
| 9 | `ref_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 来源业务 ID |
| 10 | `note` | `text` | `YES` | `NULL` | `-` | `-` | 备注 |
| 11 | `expire_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 过期时间 |
| 12 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `MUL` | `DEFAULT_GENERATED` | 创建时间 |
| 13 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## friend_guess_confirm

- 表注释：好友竞猜结果确认表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 确认记录 ID |
| 2 | `guess_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 竞猜 ID |
| 3 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 确认用户 ID |
| 4 | `action` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 动作编码 |
| 5 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 6 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## friendship

- 表注释：好友关系及申请表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 好友关系 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 申请用户 ID |
| 3 | `friend_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 目标用户 ID |
| 4 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 5 | `message` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 申请留言 |
| 6 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 7 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## fulfillment_order

- 表注释：履约单表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 履约单 ID |
| 2 | `fulfillment_sn` | `varchar(32)` | `NO` | `NULL` | `UNI` | `-` | 履约单号 |
| 3 | `type` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 类型编码 |
| 4 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 5 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 6 | `order_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 关联订单 ID |
| 7 | `shop_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 店铺 ID |
| 8 | `address_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 收货地址 ID |
| 9 | `receiver_name` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 收货人姓名 |
| 10 | `phone_number` | `varchar(20)` | `YES` | `NULL` | `-` | `-` | 收货手机号 |
| 11 | `province` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 省 |
| 12 | `city` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 市 |
| 13 | `district` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 区县 |
| 14 | `detail_address` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 详细地址 |
| 15 | `shipping_type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 配送类型编码 |
| 16 | `shipping_fee` | `bigint` | `NO` | `0` | `-` | `-` | 运费，单位分 |
| 17 | `total_amount` | `bigint` | `NO` | `0` | `-` | `-` | 商品总金额，单位分 |
| 18 | `tracking_no` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 物流单号 |
| 19 | `shipped_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 发货时间 |
| 20 | `completed_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 完成时间 |
| 21 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 22 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## fulfillment_order_item

- 表注释：履约单明细表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 履约单明细 ID |
| 2 | `fulfillment_order_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 履约单 ID |
| 3 | `product_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 商品 ID |
| 4 | `unit_price` | `bigint` | `NO` | `0` | `-` | `-` | 单价，单位分 |
| 5 | `quantity` | `int` | `NO` | `1` | `-` | `-` | 数量 |
| 6 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 7 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## guess

- 表注释：竞猜主表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 竞猜 ID |
| 2 | `title` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 竞猜标题 |
| 3 | `type` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 类型编码 |
| 4 | `source_type` | `smallint unsigned` | `NO` | `10` | `-` | `-` | 来源类型编码 |
| 5 | `image_url` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 竞猜封面图 |
| 6 | `status` | `tinyint unsigned` | `NO` | `30` | `MUL` | `-` | 状态编码 |
| 7 | `end_time` | `datetime(3)` | `NO` | `NULL` | `MUL` | `-` | 截止时间 |
| 8 | `reveal_at` | `datetime` | `YES` | `NULL` | `MUL` | `-` | 揭晓时间（店铺竞猜独立于 end_time）；NULL 表示投注截止即揭晓 |
| 9 | `min_participants` | `int unsigned` | `YES` | `NULL` | `-` | `-` | 最低参与人数；店铺竞猜未达标时自动流标退款；NULL 表示不限 |
| 10 | `creator_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 创建人 ID |
| 11 | `category_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 竞猜分类 ID |
| 12 | `tags` | `json` | `YES` | `NULL` | `-` | `-` | - |
| 13 | `description` | `text` | `YES` | `NULL` | `-` | `-` | 竞猜描述 |
| 14 | `topic_detail` | `text` | `YES` | `NULL` | `-` | `-` | 题目详情 |
| 15 | `settled_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 结算时间 |
| 16 | `review_status` | `tinyint unsigned` | `YES` | `NULL` | `MUL` | `-` | 审核状态编码 |
| 17 | `scope` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 范围编码 |
| 18 | `stake_type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 下注类型编码 |
| 19 | `settlement_mode` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 结算模式编码 |
| 20 | `min_loser_ratio` | `double` | `NO` | `0.2` | `-` | `-` | 最低对手盘比例 |
| 21 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 22 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## guess_bet

- 表注释：竞猜下注记录表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 下注记录 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 下注用户 ID |
| 3 | `guess_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 竞猜 ID |
| 4 | `choice_idx` | `int` | `NO` | `NULL` | `-` | `-` | 下注选项索引 |
| 5 | `amount` | `bigint` | `YES` | `NULL` | `-` | `-` | 下注金额，单位分 |
| 6 | `product_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 关联商品 ID |
| 7 | `coupon_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 使用优惠券 ID |
| 8 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 9 | `reward_type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 奖励类型编码 |
| 10 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 11 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## guess_invitation

- 表注释：竞猜邀请关系表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 邀请记录 ID |
| 2 | `guess_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 竞猜 ID |
| 3 | `inviter_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 邀请人 ID |
| 4 | `invitee_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 被邀请人 ID |
| 5 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 6 | `payment_mode` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 支付模式编码 |
| 7 | `paid_amount` | `bigint` | `YES` | `NULL` | `-` | `-` | 已支付金额，单位分 |
| 8 | `paid_by` | `bigint` | `YES` | `NULL` | `-` | `-` | 支付方 ID |
| 9 | `responded_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 响应时间 |
| 10 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 11 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## guess_option

- 表注释：竞猜选项表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 竞猜选项 ID |
| 2 | `guess_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 竞猜 ID |
| 3 | `option_index` | `int` | `NO` | `NULL` | `-` | `-` | 选项序号 |
| 4 | `option_text` | `varchar(255)` | `NO` | `NULL` | `-` | `-` | 选项文本 |
| 5 | `odds` | `decimal(10,4)` | `YES` | `NULL` | `-` | `-` | 当前赔率 |
| 6 | `trend` | `varchar(50)` | `YES` | `NULL` | `-` | `-` | 赔率趋势 |
| 7 | `is_result` | `tinyint(1)` | `NO` | `0` | `MUL` | `-` | 是否为开奖结果 |
| 8 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 9 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## guess_oracle_evidence

- 表注释：竞猜 Oracle 证据表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | Oracle 证据 ID |
| 2 | `guess_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 竞猜 ID |
| 3 | `source_type` | `smallint unsigned` | `YES` | `NULL` | `MUL` | `-` | 来源类型编码 |
| 4 | `query_payload` | `json` | `YES` | `NULL` | `-` | `-` | - |
| 5 | `response_payload` | `json` | `YES` | `NULL` | `-` | `-` | - |
| 6 | `matched_index` | `int` | `YES` | `NULL` | `-` | `-` | 匹配结果索引 |
| 7 | `confidence` | `decimal(5,4)` | `YES` | `NULL` | `-` | `-` | 置信度 |
| 8 | `reason` | `text` | `YES` | `NULL` | `-` | `-` | 判定原因 |
| 9 | `verified_at` | `datetime(3)` | `YES` | `NULL` | `MUL` | `-` | 校验时间 |
| 10 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 11 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## guess_product

- 表注释：竞猜与商品关联表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 关联记录 ID |
| 2 | `guess_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 竞猜 ID |
| 3 | `product_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 商品 ID |
| 4 | `option_idx` | `int` | `YES` | `NULL` | `-` | `-` | 选项索引 |
| 5 | `source_type` | `smallint unsigned` | `NO` | `10` | `-` | `-` | 来源类型编码 |
| 6 | `shop_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 店铺 ID |
| 7 | `quantity` | `int` | `NO` | `1` | `-` | `-` | 商品数量 |
| 8 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 9 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## guess_review_log

- 表注释：竞猜审核日志表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 审核日志 ID |
| 2 | `guess_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 竞猜 ID |
| 3 | `reviewer_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 审核人 ID |
| 4 | `action` | `tinyint unsigned` | `YES` | `NULL` | `MUL` | `-` | 动作编码 |
| 5 | `from_status` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 原状态编码 |
| 6 | `to_status` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 目标状态编码 |
| 7 | `note` | `text` | `YES` | `NULL` | `-` | `-` | 审核备注 |
| 8 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 9 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## invite_reward_config

- 表注释：邀请奖励配置表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 邀请奖励配置 ID |
| 2 | `inviter_reward_type` | `tinyint unsigned` | `NO` | `NULL` | `-` | `-` | 邀请人奖励类型编码 |
| 3 | `inviter_reward_value` | `bigint` | `NO` | `0` | `-` | `-` | 邀请人奖励数值 |
| 4 | `inviter_reward_ref_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 邀请人奖励关联 ID |
| 5 | `invitee_reward_type` | `tinyint unsigned` | `NO` | `NULL` | `-` | `-` | 被邀请人奖励类型编码 |
| 6 | `invitee_reward_value` | `bigint` | `NO` | `0` | `-` | `-` | 被邀请人奖励数值 |
| 7 | `invitee_reward_ref_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 被邀请人奖励关联 ID |
| 8 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 9 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 10 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## leaderboard_entry

- 表注释：排行榜结果表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 榜单条目主键 |
| 2 | `board_type` | `smallint unsigned` | `NO` | `NULL` | `MUL` | `-` | 榜单类型编码 |
| 3 | `period_type` | `tinyint unsigned` | `NO` | `NULL` | `-` | `-` | 周期类型编码 |
| 4 | `period_value` | `int unsigned` | `NO` | `NULL` | `-` | `-` | 周期值，如 20260419 / 202616 / 202604 / 0 |
| 5 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 6 | `rank_no` | `int` | `NO` | `NULL` | `-` | `-` | 排名 |
| 7 | `score` | `bigint` | `NO` | `0` | `-` | `-` | 榜单分值 |
| 8 | `extra_json` | `json` | `YES` | `NULL` | `-` | `-` | 扩展指标 JSON |
| 9 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 10 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## live

- 表注释：直播场次表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 直播 ID |
| 2 | `host_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 主播用户 ID |
| 3 | `title` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 直播标题 |
| 4 | `image_url` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 直播封面 |
| 5 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 直播状态：10=upcoming, 20=live, 30=ended, 90=banned |
| 6 | `start_time` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 开播时间 |
| 7 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 8 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## notification

- 表注释：用户通知表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 通知 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 3 | `type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 通知类型编码 |
| 4 | `title` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 通知标题 |
| 5 | `content` | `text` | `YES` | `NULL` | `-` | `-` | 通知内容 |
| 6 | `target_type` | `tinyint unsigned` | `YES` | `NULL` | `MUL` | `-` | 目标类型编码 |
| 7 | `target_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 通知目标 ID |
| 8 | `action_url` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 通知跳转地址 |
| 9 | `is_read` | `tinyint(1)` | `NO` | `0` | `MUL` | `-` | 是否已读 |
| 10 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 11 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## order

- 表注释：订单主表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 订单 ID |
| 2 | `order_sn` | `varchar(32)` | `NO` | `NULL` | `UNI` | `-` | 订单编号 |
| 3 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 下单用户 ID |
| 4 | `type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 类型编码 |
| 5 | `guess_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 关联竞猜 ID |
| 6 | `amount` | `bigint` | `YES` | `NULL` | `-` | `-` | 实付金额，单位分 |
| 7 | `original_amount` | `bigint` | `YES` | `NULL` | `-` | `-` | 原始金额，单位分 |
| 8 | `coupon_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 优惠券 ID |
| 9 | `coupon_discount` | `bigint` | `NO` | `0` | `-` | `-` | 优惠金额，单位分 |
| 10 | `address_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 收货地址 ID |
| 11 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 12 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 13 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## order_item

- 表注释：订单项表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 订单项 ID |
| 2 | `order_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 订单 ID |
| 3 | `product_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 商品 ID |
| 4 | `specs` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 规格说明 |
| 5 | `quantity` | `int` | `NO` | `1` | `-` | `-` | 购买数量 |
| 6 | `unit_price` | `bigint` | `NO` | `NULL` | `-` | `-` | 成交单价，单位分 |
| 7 | `original_unit_price` | `bigint` | `YES` | `NULL` | `-` | `-` | 原始单价，单位分 |
| 8 | `item_amount` | `bigint` | `NO` | `NULL` | `-` | `-` | 订单项金额，单位分 |
| 9 | `coupon_discount` | `bigint` | `NO` | `0` | `-` | `-` | 优惠分摊金额，单位分 |
| 10 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 11 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## order_refund

- 表注释：订单退款表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 退款记录 ID |
| 2 | `order_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 订单 ID |
| 3 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 申请用户 ID |
| 4 | `refund_no` | `varchar(32)` | `NO` | `NULL` | `UNI` | `-` | 退款单号 |
| 5 | `reason` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 退款原因 |
| 6 | `description` | `text` | `YES` | `NULL` | `-` | `-` | 退款说明 |
| 7 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 8 | `refund_amount` | `bigint` | `YES` | `NULL` | `-` | `-` | 退款金额，单位分 |
| 9 | `reviewer_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 审核人 ID |
| 10 | `review_note` | `text` | `YES` | `NULL` | `-` | `-` | 审核备注 |
| 11 | `requested_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 申请时间 |
| 12 | `reviewed_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 审核时间 |
| 13 | `completed_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 完成时间 |
| 14 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 15 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## order_status_log

- 表注释：订单状态流转日志表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 订单状态日志 ID |
| 2 | `order_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 订单 ID |
| 3 | `from_status` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 原状态编码 |
| 4 | `to_status` | `tinyint unsigned` | `YES` | `NULL` | `MUL` | `-` | 目标状态编码 |
| 5 | `operator_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 操作人 ID |
| 6 | `operator_role` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 操作角色编码 |
| 7 | `note` | `text` | `YES` | `NULL` | `-` | `-` | 备注 |
| 8 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 9 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## payment_settings

- 表注释：支付参数设置

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `channel` | `varchar(32)` | `NO` | `NULL` | `PRI` | `-` | - |
| 2 | `config_public` | `json` | `NO` | `NULL` | `-` | `-` | - |
| 3 | `secrets_enc` | `mediumblob` | `YES` | `NULL` | `-` | `-` | - |
| 4 | `updated_by` | `int unsigned` | `YES` | `NULL` | `-` | `-` | - |
| 5 | `updated_at` | `datetime` | `NO` | `CURRENT_TIMESTAMP` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | - |

## physical_warehouse

- 表注释：实体仓库表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 实体仓记录 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 3 | `product_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 商品 ID |
| 4 | `quantity` | `int` | `NO` | `1` | `-` | `-` | 数量 |
| 5 | `frozen_quantity` | `int` | `NO` | `0` | `-` | `-` | 冻结数量 |
| 6 | `price` | `bigint` | `NO` | `NULL` | `-` | `-` | 价值金额，单位分 |
| 7 | `source_type` | `smallint unsigned` | `YES` | `NULL` | `MUL` | `-` | 来源类型编码 |
| 8 | `source_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 来源业务 ID |
| 9 | `source_virtual_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 来源虚拟仓 ID |
| 10 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 11 | `consign_price` | `bigint` | `YES` | `NULL` | `-` | `-` | 寄售价格，单位分 |
| 12 | `consign_date` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 寄售时间 |
| 13 | `estimate_days` | `int` | `YES` | `NULL` | `-` | `-` | 预计天数 |
| 14 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 15 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## pk_record

- 表注释：好友 PK 对战记录表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | PK 记录 ID |
| 2 | `initiator_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 发起人 ID |
| 3 | `opponent_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 对手 ID |
| 4 | `guess_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 竞猜 ID |
| 5 | `initiator_choice_idx` | `int` | `YES` | `NULL` | `-` | `-` | 发起方选项索引 |
| 6 | `opponent_choice_idx` | `int` | `YES` | `NULL` | `-` | `-` | 对手方选项索引 |
| 7 | `stake_amount` | `bigint` | `YES` | `NULL` | `-` | `-` | 赌注金额，单位分 |
| 8 | `result` | `varchar(50)` | `NO` | `pending` | `-` | `-` | PK 结果 |
| 9 | `reward_type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 奖励类型编码 |
| 10 | `reward_value` | `bigint` | `YES` | `NULL` | `-` | `-` | 奖励数值，单位分 |
| 11 | `reward_ref_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 奖励关联 ID |
| 12 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 13 | `settled_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 结算时间 |
| 14 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## post

- 表注释：社区动态主表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 动态 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 发布用户 ID |
| 3 | `type` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 类型编码 |
| 4 | `title` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 标题 |
| 5 | `content` | `text` | `YES` | `NULL` | `-` | `-` | 正文内容 |
| 6 | `images` | `json` | `NO` | `NULL` | `-` | `-` | - |
| 7 | `tag` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 标签 |
| 8 | `guess_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 关联竞猜 ID |
| 9 | `video_thumb` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 视频封面 |
| 10 | `video_duration` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 视频时长 |
| 11 | `location` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 位置 |
| 12 | `scope` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 可见范围编码 |
| 13 | `repost_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 转发来源 ID |
| 14 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 15 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## post_interaction

- 表注释：内容互动表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 互动记录 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 发起互动的用户 ID |
| 3 | `post_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 动态 ID |
| 4 | `interaction_type` | `tinyint unsigned` | `NO` | `NULL` | `-` | `-` | 互动类型编码 |
| 5 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 6 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## product

- 表注释：商品主表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 商品 ID |
| 2 | `shop_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 所属店铺 ID |
| 3 | `brand_product_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 关联平台品牌商品 ID |
| 4 | `sales` | `int` | `NO` | `0` | `-` | `-` | 销量 |
| 5 | `rating` | `double` | `NO` | `0` | `-` | `-` | 评分 |
| 6 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 7 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 8 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

> 注：`product` 已彻底退化成"店铺铺货关联表"——`name / price / stock / frozen_stock / guess_price / source_url / original_price / image_url / images / description / tags / collab` 全部删除。所有商品本身的属性 + 库存 + 竞猜价都归 `brand_product`：`name / guide_price / supply_price / guess_price / stock / frozen_stock / default_img / images / description / tags / collab / video_url / detail_html / spec_table / package_list / freight / ship_from / delivery_days`。库存为跨店共享池：`stock` admin 维护，`frozen_stock` 由下单/支付/超时事务自动维护——createPendingOrder `frozen_stock += n`、markOrderPaid `stock -= n, frozen_stock -= n`、超时关单 `frozen_stock -= n`；可用库存 = `stock - frozen_stock`。

## product_review

- 表注释：商品评价表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 评价 ID |
| 2 | `product_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 商品 ID |
| 3 | `order_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 来源订单 ID |
| 4 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 评价人用户 ID |
| 5 | `rating` | `tinyint unsigned` | `NO` | `5` | `-` | `-` | 评分 1-5 |
| 6 | `content` | `varchar(1000)` | `YES` | `NULL` | `-` | `-` | 评价正文 |
| 7 | `images` | `json` | `YES` | `NULL` | `-` | `-` | 晒图 URL 数组 |
| 8 | `helpful_count` | `int` | `NO` | `0` | `-` | `-` | 点赞数（冗余维护） |
| 9 | `reply` | `varchar(1000)` | `YES` | `NULL` | `-` | `-` | 卖家/admin 回复 |
| 10 | `replied_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 回复时间 |
| 11 | `appended_content` | `varchar(1000)` | `YES` | `NULL` | `-` | `-` | 用户追评正文 |
| 12 | `appended_images` | `json` | `YES` | `NULL` | `-` | `-` | 追评晒图 URL 数组 |
| 13 | `appended_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 追评时间（非空 = 已追评） |
| 14 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 10=正常 90=已删除 |
| 15 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 16 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

## product_review_helpful

- 表注释：商品评价点赞关系表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 点赞关系 ID |
| 2 | `review_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 评价 ID |
| 3 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 点赞用户 ID |
| 4 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |

## product_interaction

- 表注释：商品互动表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 商品互动 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 3 | `product_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 商品 ID |
| 4 | `interaction_type` | `tinyint unsigned` | `NO` | `NULL` | `-` | `-` | 互动类型编码 |
| 5 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 6 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

## report_item

- 表注释：举报记录表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 举报记录 ID |
| 2 | `reporter_user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 举报人用户 ID |
| 3 | `target_type` | `tinyint unsigned` | `NO` | `NULL` | `MUL` | `-` | 举报目标类型编码 |
| 4 | `target_id` | `bigint` | `NO` | `NULL` | `-` | `-` | 举报目标 ID |
| 5 | `reason_type` | `tinyint unsigned` | `NO` | `NULL` | `-` | `-` | 举报原因类型编码 |
| 6 | `reason_detail` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 补充说明 |
| 7 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 处理状态编码 |
| 8 | `handler_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 处理人 ID |
| 9 | `handle_action` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 处理动作编码 |
| 10 | `handle_note` | `varchar(255)` | `YES` | `NULL` | `-` | `-` | 处理备注 |
| 11 | `handled_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 处理时间 |
| 12 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 13 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## shop

- 表注释：店铺主表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 店铺 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `UNI` | `-` | 店主用户 ID |
| 3 | `name` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 店铺名称 |
| 4 | `category_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 店铺分类 ID |
| 5 | `description` | `text` | `YES` | `NULL` | `-` | `-` | 店铺简介 |
| 6 | `logo_url` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 店铺 Logo |
| 7 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 8 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 9 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## shop_apply

- 表注释：开店申请表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 开店申请 ID |
| 2 | `apply_no` | `varchar(32)` | `NO` | `NULL` | `UNI` | `-` | 申请单号 |
| 3 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 申请用户 ID |
| 4 | `shop_name` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 申请店铺名 |
| 5 | `category_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 经营分类 ID |
| 6 | `reason` | `text` | `YES` | `NULL` | `-` | `-` | 申请原因 |
| 7 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 8 | `reject_reason` | `text` | `YES` | `NULL` | `-` | `-` | 拒绝原因 |
| 9 | `reviewed_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 审核时间 |
| 10 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 11 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## shop_brand_auth

- 表注释：店铺品牌授权表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 店铺品牌授权主键 |
| 2 | `auth_no` | `varchar(64)` | `NO` | `NULL` | `UNI` | `-` | 授权编号 |
| 3 | `shop_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 店铺 ID |
| 4 | `brand_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 品牌 ID |
| 5 | `auth_type` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 授权类型编码 |
| 6 | `auth_scope` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 授权范围编码 |
| 7 | `scope_value` | `json` | `YES` | `NULL` | `-` | `-` | 授权范围扩展值 |
| 8 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 9 | `granted_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 授权通过时间 |
| 10 | `expire_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 授权到期时间 |
| 11 | `expired_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 授权过期时间 |
| 12 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 13 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

## shop_brand_auth_apply

- 表注释：店铺品牌授权申请表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 店铺品牌授权申请 ID |
| 2 | `apply_no` | `varchar(32)` | `NO` | `NULL` | `UNI` | `-` | 申请单号 |
| 3 | `shop_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 店铺 ID |
| 4 | `brand_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 品牌 ID |
| 5 | `reason` | `text` | `YES` | `NULL` | `-` | `-` | 申请原因 |
| 6 | `license` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 授权书编号 |
| 7 | `status` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 状态编码 |
| 8 | `reject_reason` | `text` | `YES` | `NULL` | `-` | `-` | 拒绝原因 |
| 9 | `reviewed_at` | `datetime(3)` | `YES` | `NULL` | `-` | `-` | 审核时间 |
| 10 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 11 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## sms_verification_code

- 表注释：短信验证码记录表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 主键 |
| 2 | `phone_number` | `varchar(20)` | `NO` | `NULL` | `MUL` | `-` | 手机号 |
| 3 | `biz_type` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 业务类型编码 |
| 4 | `code_hash` | `char(64)` | `NO` | `NULL` | `-` | `-` | 短信验证码哈希 |
| 5 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 6 | `expires_at` | `datetime` | `NO` | `NULL` | `-` | `-` | 过期时间 |
| 7 | `used_at` | `datetime` | `YES` | `NULL` | `-` | `-` | 使用时间 |
| 8 | `request_ip` | `varchar(64)` | `YES` | `NULL` | `-` | `-` | 请求 IP |
| 9 | `created_at` | `datetime` | `NO` | `CURRENT_TIMESTAMP` | `MUL` | `DEFAULT_GENERATED` | 创建时间 |
| 10 | `updated_at` | `datetime` | `NO` | `CURRENT_TIMESTAMP` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP` | 更新时间 |

## user

- 表注释：用户主表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 用户 ID |
| 2 | `uid_code` | `varchar(8)` | `YES` | `NULL` | `UNI` | `-` | 优米号，8位随机大小写字母 |
| 3 | `phone_number` | `varchar(191)` | `NO` | `NULL` | `UNI` | `-` | 手机号 |
| 4 | `password` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 登录密码哈希 |
| 5 | `banned` | `tinyint(1)` | `NO` | `0` | `-` | `-` | 是否封禁 |
| 6 | `level` | `int` | `NO` | `1` | `-` | `-` | 等级 |
| 7 | `title` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 等级头衔 |
| 8 | `achievements` | `json` | `NO` | `NULL` | `-` | `-` | - |
| 9 | `weight` | `double` | `NO` | `1` | `-` | `-` | 用户权重 |
| 10 | `risk_level` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 风险等级编码 |
| 11 | `is_newbie` | `tinyint(1)` | `NO` | `1` | `-` | `-` | 是否新手用户 |
| 12 | `newbie_guesses` | `int` | `NO` | `0` | `-` | `-` | 新手期竞猜次数 |
| 13 | `streak_loss` | `int` | `NO` | `0` | `-` | `-` | 连续失败次数 |
| 14 | `invite_code` | `varchar(191)` | `YES` | `NULL` | `UNI` | `-` | 邀请码 |
| 15 | `invited_by` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 邀请人用户 ID |
| 16 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 17 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## user_follow

- 表注释：用户关注关系表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `int` | `NO` | `NULL` | `PRI` | `auto_increment` | 关注关系 ID |
| 2 | `follower_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 发起关注的用户 ID |
| 3 | `following_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 被关注的用户 ID |
| 4 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 5 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## user_profile

- 表注释：用户资料表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 主键 |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `UNI` | `-` | 用户 ID |
| 3 | `name` | `varchar(191)` | `NO` | `NULL` | `-` | `-` | 用户昵称 |
| 4 | `avatar_url` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 头像 |
| 5 | `signature` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 个性签名 |
| 6 | `gender` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 性别编码 |
| 7 | `birthday` | `date` | `YES` | `NULL` | `-` | `-` | 生日 |
| 8 | `region` | `varchar(191)` | `YES` | `NULL` | `-` | `-` | 地区 |
| 9 | `works_privacy` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 作品可见范围 |
| 10 | `fav_privacy` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 收藏可见范围 |
| 11 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 12 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)` | 更新时间 |

## virtual_warehouse

- 表注释：虚拟仓库表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 虚拟仓记录 ID |
| 2 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 用户 ID |
| 3 | `product_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 商品 ID |
| 4 | `quantity` | `int` | `NO` | `1` | `-` | `-` | 数量 |
| 5 | `frozen_quantity` | `int` | `NO` | `0` | `-` | `-` | 冻结数量 |
| 6 | `price` | `bigint` | `NO` | `NULL` | `-` | `-` | 价值金额，单位分 |
| 7 | `source_type` | `smallint unsigned` | `YES` | `NULL` | `-` | `-` | 来源类型编码 |
| 8 | `source_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 来源业务 ID |
| 9 | `status` | `tinyint unsigned` | `NO` | `10` | `MUL` | `-` | 状态编码 |
| 10 | `type` | `tinyint unsigned` | `NO` | `10` | `-` | `-` | 类型编码 |
| 11 | `fragment_value` | `bigint` | `NO` | `0` | `-` | `-` | 碎片价值，单位分 |
| 12 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 创建时间 |
| 13 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

## warehouse_item_log

- 表注释：仓库物品操作日志表

| 字段顺序 | 字段名 | 列类型 | 是否可空 | 默认值 | 键标记 | Extra | 字段注释 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `id` | `bigint` | `NO` | `NULL` | `PRI` | `auto_increment` | 仓库日志 ID |
| 2 | `warehouse_type` | `tinyint unsigned` | `YES` | `NULL` | `MUL` | `-` | 仓库类型编码 |
| 3 | `item_id` | `bigint` | `NO` | `NULL` | `-` | `-` | 仓库物品记录 ID |
| 4 | `user_id` | `bigint` | `NO` | `NULL` | `MUL` | `-` | 物品所属用户 ID |
| 5 | `product_id` | `bigint` | `YES` | `NULL` | `MUL` | `-` | 商品 ID |
| 6 | `action` | `tinyint unsigned` | `YES` | `NULL` | `MUL` | `-` | 动作编码 |
| 7 | `from_status` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 原状态编码 |
| 8 | `to_status` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 目标状态编码 |
| 9 | `quantity` | `int` | `YES` | `NULL` | `-` | `-` | 变动数量 |
| 10 | `source_type` | `smallint unsigned` | `YES` | `NULL` | `MUL` | `-` | 来源类型编码 |
| 11 | `source_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 来源业务 ID |
| 12 | `operator_id` | `bigint` | `YES` | `NULL` | `-` | `-` | 操作人 ID |
| 13 | `operator_role` | `tinyint unsigned` | `YES` | `NULL` | `-` | `-` | 操作角色编码 |
| 14 | `note` | `text` | `YES` | `NULL` | `-` | `-` | 备注说明 |
| 15 | `meta_json` | `json` | `YES` | `NULL` | `-` | `-` | - |
| 16 | `created_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `MUL` | `DEFAULT_GENERATED` | 创建时间 |
| 17 | `updated_at` | `datetime(3)` | `NO` | `CURRENT_TIMESTAMP(3)` | `-` | `DEFAULT_GENERATED` | 更新时间 |

