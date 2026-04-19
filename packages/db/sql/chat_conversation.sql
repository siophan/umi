CREATE TABLE `chat_conversation` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` VARCHAR(191) NOT NULL COMMENT '当前用户 ID',
  `peer_id` VARCHAR(191) NOT NULL COMMENT '对端用户 ID',
  `unread_count` INT NOT NULL DEFAULT 0 COMMENT '当前用户未读数',
  `last_message` TEXT NOT NULL COMMENT '最后一条消息摘要',
  `last_message_at` DATETIME(3) NOT NULL COMMENT '最后一条消息时间',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_conversation_user_peer` (`user_id`, `peer_id`),
  KEY `idx_chat_conversation_user_last_message_at` (`user_id`, `last_message_at`),
  KEY `idx_chat_conversation_peer_id` (`peer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户私聊会话表';

