CREATE TABLE `brand_product` (
  `id` VARCHAR(191) NOT NULL COMMENT '品牌商品主键',
  `brand_id` VARCHAR(191) NOT NULL COMMENT '品牌 ID',
  `brand_name` VARCHAR(191) NOT NULL COMMENT '品牌名称快照',
  `name` VARCHAR(191) NOT NULL COMMENT '标准商品名称',
  `category` VARCHAR(191) NULL COMMENT '商品分类',
  `guide_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '建议零售价',
  `supply_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '供货价',
  `default_img` VARCHAR(191) NULL COMMENT '默认主图',
  `images` VARCHAR(191) NOT NULL DEFAULT '[]' COMMENT '图片列表 JSON',
  `description` TEXT NULL COMMENT '商品描述',
  `status` VARCHAR(191) NOT NULL DEFAULT 'active' COMMENT '状态：active/inactive',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_brand_product_brand_status` (`brand_id`, `status`),
  KEY `idx_brand_product_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台品牌商品库';
