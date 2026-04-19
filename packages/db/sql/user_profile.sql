CREATE TABLE `user_profile` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` VARCHAR(191) NOT NULL COMMENT '用户 ID',
  `name` VARCHAR(191) NOT NULL COMMENT '用户昵称',
  `avatar` VARCHAR(191) NULL COMMENT '头像',
  `signature` VARCHAR(191) NULL COMMENT '个性签名',
  `gender` VARCHAR(191) NULL COMMENT '性别',
  `birthday` DATE NULL COMMENT '生日',
  `region` VARCHAR(191) NULL COMMENT '地区',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_profile_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户资料表';

