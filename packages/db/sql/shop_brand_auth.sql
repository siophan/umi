CREATE TABLE `shop_brand_auth` (
  `id` VARCHAR(191) NOT NULL COMMENT '店铺品牌授权主键',
  `shop_id` VARCHAR(191) NOT NULL COMMENT '店铺 ID',
  `brand_id` VARCHAR(191) NOT NULL COMMENT '品牌 ID',
  `status` VARCHAR(191) NOT NULL DEFAULT 'active' COMMENT '授权状态：active/expired/revoked',
  `granted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '授权通过时间',
  `expired_at` DATETIME(3) NULL COMMENT '授权过期时间',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shop_brand_auth_shop_brand` (`shop_id`, `brand_id`),
  KEY `idx_shop_brand_auth_brand_status` (`brand_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺品牌授权表';
