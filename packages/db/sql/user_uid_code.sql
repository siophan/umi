ALTER TABLE `user`
  ADD COLUMN `uid_code` VARCHAR(8) NULL COMMENT '优米号，8位随机大小写字母' AFTER `id`;

ALTER TABLE `user`
  ADD UNIQUE KEY `uk_user_uid_code` (`uid_code`);
