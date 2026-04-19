ALTER TABLE `sms_verification_code`
  ADD COLUMN `code_hash` CHAR(64) NULL COMMENT '短信验证码哈希' AFTER `biz_type`;

UPDATE `sms_verification_code`
SET `code_hash` = SHA2(CONCAT(`phone`, ':', `biz_type`, ':', `code`, ':'), 256)
WHERE `code_hash` IS NULL;

ALTER TABLE `sms_verification_code`
  MODIFY COLUMN `code_hash` CHAR(64) NOT NULL COMMENT '短信验证码哈希';

ALTER TABLE `sms_verification_code`
  DROP COLUMN `code`;
