CREATE TABLE `auth_session` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `token` VARCHAR(64) NOT NULL COMMENT '登录态 token',
  `user_id` VARCHAR(64) NOT NULL COMMENT '用户 ID',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_auth_session_token` (`token`),
  UNIQUE KEY `uk_auth_session_user_id` (`user_id`),
  KEY `idx_auth_session_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录会话表';
