CREATE TABLE IF NOT EXISTS `comment_interaction` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `comment_id` bigint unsigned NOT NULL,
  `interaction_type` tinyint unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_comment_interaction` (`user_id`, `comment_id`, `interaction_type`),
  KEY `idx_comment_interaction_comment_type` (`comment_id`, `interaction_type`),
  KEY `idx_comment_interaction_user_type` (`user_id`, `interaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
