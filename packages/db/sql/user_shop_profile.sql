CREATE TABLE `user_shop_profile` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` VARCHAR(191) NOT NULL COMMENT '用户 ID',
  `shop_name` VARCHAR(191) NULL COMMENT '店铺名称',
  `shop_verified` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否店铺认证',
  `is_shop_owner` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否店主',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_shop_profile_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户店铺资料表';

