-- 多规格品牌商品（SKU）schema 变更
-- 设计文档：docs/superpowers/specs/2026-05-04-multi-spec-brand-product-design.md
--
-- 不考虑历史数据：相关业务表会在切换前清空 / 测试环境直接 truncate。
-- 一次性变更：建表 + 改 brand_product + 9 张子表加 sku_id + 唯一约束。

-- ────────────────────────────────────────────────────────────────────
-- 1) brand_product_sku：SPU 下的具体规格行
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE `brand_product_sku` (
  `id`                BIGINT          NOT NULL AUTO_INCREMENT             COMMENT 'SKU 主键',
  `brand_product_id`  BIGINT          NOT NULL                            COMMENT '关联 SPU brand_product.id',
  `sku_code`          VARCHAR(64)     NULL                                COMMENT '运营自填的对外 SKU 码（可留空）',
  `spec_json`         JSON            NOT NULL                            COMMENT '规格 JSON：{"颜色":"红","尺寸":"M"}；单规格商品写 {}',
  `spec_signature`    VARCHAR(255)    NOT NULL                            COMMENT '应用层算的 spec_json key=value 排序拼接，UNIQUE 用；单规格商品写空串',
  `guide_price`       BIGINT          NOT NULL                            COMMENT '吊牌价，单位分；运营每个 SKU 必填',
  `supply_price`      BIGINT          NULL                                COMMENT '供货价，单位分；不参与展示',
  `guess_price`       BIGINT          NULL                                COMMENT '竞猜价，单位分；NULL 时 fallback 到 sku 自己的 guide_price',
  `stock`             INT             NOT NULL DEFAULT 0                  COMMENT 'SKU 库存',
  `frozen_stock`      INT             NOT NULL DEFAULT 0                  COMMENT 'SKU 冻结库存（pending 订单占用）',
  `image`             VARCHAR(191)    NULL                                COMMENT 'SKU 主图，留空取 SPU default_img',
  `status`            TINYINT UNSIGNED NOT NULL DEFAULT 10                COMMENT '10=active 90=disabled',
  `sort`              INT             NOT NULL DEFAULT 0                  COMMENT '排序',
  `created_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bp_spec` (`brand_product_id`, `spec_signature`),
  KEY `idx_brand_product_id` (`brand_product_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='品牌商品 SKU 表';

-- ────────────────────────────────────────────────────────────────────
-- 2) brand_product 改造：加规格定义 + DROP 价格/库存五列
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE `brand_product`
  ADD COLUMN `spec_definitions` JSON NULL COMMENT '规格维度定义：[{"name":"颜色","values":["红","黑"]},...]；NULL=单规格商品' AFTER `name`,
  DROP COLUMN `guide_price`,
  DROP COLUMN `supply_price`,
  DROP COLUMN `guess_price`,
  DROP COLUMN `stock`,
  DROP COLUMN `frozen_stock`;

-- ────────────────────────────────────────────────────────────────────
-- 3) 9 张子表加 brand_product_sku_id 列
--    业务关键路径全部 NOT NULL；warehouse_item_log 是日志，可空
-- ────────────────────────────────────────────────────────────────────

-- 3.1 cart_item：购物车合并键变了，先 DROP 老的（如果有），再加列+UNIQUE
ALTER TABLE `cart_item`
  ADD COLUMN `brand_product_sku_id` BIGINT NOT NULL COMMENT 'SKU id；购物车合并键的一部分' AFTER `product_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);
ALTER TABLE `cart_item`
  ADD UNIQUE KEY `uk_cart_user_product_sku` (`user_id`, `product_id`, `brand_product_sku_id`);

-- 3.2 order_item
ALTER TABLE `order_item`
  ADD COLUMN `brand_product_sku_id` BIGINT NOT NULL COMMENT '订单项的具体 SKU' AFTER `product_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);

-- 3.3 fulfillment_order_item
ALTER TABLE `fulfillment_order_item`
  ADD COLUMN `brand_product_sku_id` BIGINT NOT NULL COMMENT '履约项的具体 SKU' AFTER `product_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);

-- 3.4 product_review
ALTER TABLE `product_review`
  ADD COLUMN `brand_product_sku_id` BIGINT NOT NULL COMMENT '评价归属的具体 SKU' AFTER `product_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);

-- 3.5 consign_trade
ALTER TABLE `consign_trade`
  ADD COLUMN `brand_product_sku_id` BIGINT NOT NULL COMMENT '寄售物品的具体 SKU' AFTER `physical_item_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);

-- 3.6 virtual_warehouse
ALTER TABLE `virtual_warehouse`
  ADD COLUMN `brand_product_sku_id` BIGINT NOT NULL COMMENT '虚拟仓物品的具体 SKU' AFTER `product_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);

-- 3.7 physical_warehouse
ALTER TABLE `physical_warehouse`
  ADD COLUMN `brand_product_sku_id` BIGINT NOT NULL COMMENT '实体仓物品的具体 SKU' AFTER `product_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);

-- 3.8 warehouse_item_log（日志，可空）
ALTER TABLE `warehouse_item_log`
  ADD COLUMN `brand_product_sku_id` BIGINT NULL COMMENT '仓库物品操作的 SKU；日志列可空' AFTER `product_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);

-- 3.9 guess_bet
ALTER TABLE `guess_bet`
  ADD COLUMN `brand_product_sku_id` BIGINT NOT NULL COMMENT '下注关联的 SKU' AFTER `product_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);

-- 3.10 guess_product：关联竞猜与商品的 join 表
ALTER TABLE `guess_product`
  ADD COLUMN `brand_product_sku_id` BIGINT NOT NULL COMMENT '关联奖品的具体 SKU' AFTER `product_id`,
  ADD KEY `idx_brand_product_sku_id` (`brand_product_sku_id`);

-- guess_product UNIQUE：(guess_id)
-- 一个竞猜只能关联一个商品 + 一个 SKU；option_idx 仍存在但不参与唯一约束（恒为 0）
ALTER TABLE `guess_product`
  ADD UNIQUE KEY `uk_guess_product_guess_id` (`guess_id`);
