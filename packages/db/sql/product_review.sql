-- 商品评价表 + 评价点赞关系表
-- product_review 评价正文：1 个用户对 1 条订单内的 1 个商品产出 1 条评价
-- product_review_helpful 用于"评价点赞"，记录 (review_id, user_id) 关系，避免重复点赞
--
-- 评价 status：10=正常 / 90=已删除（暂未使用，给 admin 审核留位）
-- helpful_count 是冗余计数，写入 product_review_helpful 时同时 +1，删除时 -1

CREATE TABLE IF NOT EXISTS `product_review` (
  `id`               BIGINT NOT NULL AUTO_INCREMENT,
  `product_id`       BIGINT NOT NULL,
  `order_id`         BIGINT NULL,
  `user_id`          BIGINT NOT NULL,
  `rating`           TINYINT UNSIGNED NOT NULL DEFAULT 5    COMMENT '评分 1-5',
  `content`          VARCHAR(1000) NULL                     COMMENT '评价正文',
  `images`           JSON NULL                              COMMENT '晒图 URL 数组：["https://...",...]',
  `helpful_count`    INT NOT NULL DEFAULT 0                 COMMENT '点赞数（冗余，写 helpful 时维护）',
  `reply`            VARCHAR(1000) NULL                     COMMENT '卖家/admin 对该评价的回复',
  `replied_at`       DATETIME(3) NULL                       COMMENT '回复时间',
  `appended_content` VARCHAR(1000) NULL                     COMMENT '用户追评正文（仅评价作者本人写入）',
  `appended_images`  JSON NULL                              COMMENT '追评晒图 URL 数组',
  `appended_at`      DATETIME(3) NULL                       COMMENT '追评时间；写入后即视为已追评，本字段同时作为「是否追评过」的判定',
  `status`           TINYINT UNSIGNED NOT NULL DEFAULT 10   COMMENT '状态：10=正常, 90=已删除',
  `created_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_product_review_product` (`product_id`, `status`, `created_at` DESC),
  KEY `idx_product_review_user` (`user_id`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品评价表';

CREATE TABLE IF NOT EXISTS `product_review_helpful` (
  `id`         BIGINT NOT NULL AUTO_INCREMENT,
  `review_id`  BIGINT NOT NULL,
  `user_id`    BIGINT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_review_helpful` (`review_id`, `user_id`),
  KEY `idx_product_review_helpful_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品评价点赞关系表';
