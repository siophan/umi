ALTER TABLE `user_profile`
  ADD COLUMN `works_privacy` TINYINT UNSIGNED NOT NULL DEFAULT 10 COMMENT '作品可见范围' AFTER `region`,
  ADD COLUMN `fav_privacy` TINYINT UNSIGNED NOT NULL DEFAULT 10 COMMENT '收藏可见范围' AFTER `works_privacy`;
