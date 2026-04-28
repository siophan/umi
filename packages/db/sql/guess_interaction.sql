-- 竞猜互动关系表
-- 与 product_interaction / post_interaction 同模式：用 interaction_type 区分收藏 / 点赞等互动动作
-- interaction_type 编码（与 product_interaction.interaction_type 对齐）：
--   10 = favorite (收藏)
--   20 = like     (点赞)
-- 当前业务只用 10（竞猜详情页"收藏"按钮）；20 留给未来"对竞猜点赞"扩展
--
-- 唯一约束：(user_id, guess_id, interaction_type)
-- 查询模式：
--   - 我有没有收藏这条竞猜：SELECT 1 WHERE user_id=? AND guess_id=? AND interaction_type=10
--   - 这条竞猜的收藏数：SELECT COUNT(*) WHERE guess_id=? AND interaction_type=10

CREATE TABLE IF NOT EXISTS `guess_interaction` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `guess_id` BIGINT NOT NULL,
  `interaction_type` TINYINT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_guess_interaction_user_guess_type` (`user_id`, `guess_id`, `interaction_type`),
  KEY `idx_guess_interaction_guess_type` (`guess_id`, `interaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='竞猜互动关系表';
