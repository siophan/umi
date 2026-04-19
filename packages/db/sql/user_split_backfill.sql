INSERT INTO `user_profile` (
  `user_id`,
  `name`,
  `avatar`,
  `signature`,
  `gender`,
  `birthday`,
  `region`,
  `created_at`,
  `updated_at`
)
SELECT
  `id`,
  `name`,
  `avatar`,
  `signature`,
  `gender`,
  `birthday`,
  `region`,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `user`
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `avatar` = VALUES(`avatar`),
  `signature` = VALUES(`signature`),
  `gender` = VALUES(`gender`),
  `birthday` = VALUES(`birthday`),
  `region` = VALUES(`region`),
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `user_stats` (
  `user_id`,
  `level`,
  `title`,
  `coins`,
  `win_rate`,
  `total_guess`,
  `wins`,
  `followers`,
  `following`,
  `join_date`,
  `created_at`,
  `updated_at`
)
SELECT
  `id`,
  COALESCE(`level`, 1),
  `title`,
  COALESCE(`coins`, 0),
  COALESCE(`win_rate`, 0),
  COALESCE(`total_guess`, 0),
  COALESCE(`wins`, 0),
  COALESCE(`followers`, 0),
  COALESCE(`following`, 0),
  COALESCE(`join_date`, CURRENT_TIMESTAMP(3)),
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `user`
ON DUPLICATE KEY UPDATE
  `level` = VALUES(`level`),
  `title` = VALUES(`title`),
  `coins` = VALUES(`coins`),
  `win_rate` = VALUES(`win_rate`),
  `total_guess` = VALUES(`total_guess`),
  `wins` = VALUES(`wins`),
  `followers` = VALUES(`followers`),
  `following` = VALUES(`following`),
  `join_date` = VALUES(`join_date`),
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `user_shop_profile` (
  `user_id`,
  `shop_name`,
  `shop_verified`,
  `is_shop_owner`,
  `created_at`,
  `updated_at`
)
SELECT
  `id`,
  `shop_name`,
  COALESCE(`shop_verified`, 0),
  COALESCE(`is_shop_owner`, 0),
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `user`
ON DUPLICATE KEY UPDATE
  `shop_name` = VALUES(`shop_name`),
  `shop_verified` = VALUES(`shop_verified`),
  `is_shop_owner` = VALUES(`is_shop_owner`),
  `updated_at` = CURRENT_TIMESTAMP(3);
