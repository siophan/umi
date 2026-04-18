CREATE TABLE `sms_verification_code` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `biz_type` VARCHAR(32) NOT NULL COMMENT '业务类型：register/login/reset_password',
  `code` VARCHAR(10) NOT NULL COMMENT '短信验证码',
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/used/expired/invalidated',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `used_at` DATETIME NULL COMMENT '使用时间',
  `request_ip` VARCHAR(64) NULL COMMENT '请求 IP',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_sms_verification_code_phone_biz_type` (`phone`, `biz_type`),
  KEY `idx_sms_verification_code_status_expires_at` (`status`, `expires_at`),
  KEY `idx_sms_verification_code_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信验证码记录表';
