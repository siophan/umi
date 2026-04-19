ALTER TABLE `product`
  ADD COLUMN `shop_id` VARCHAR(191) NULL COMMENT '所属店铺 ID' AFTER `id`,
  ADD COLUMN `brand_product_id` VARCHAR(191) NULL COMMENT '关联平台品牌商品 ID' AFTER `shop_id`,
  ADD KEY `idx_product_shop_status` (`shop_id`, `status`),
  ADD KEY `idx_product_brand_product` (`brand_product_id`);
