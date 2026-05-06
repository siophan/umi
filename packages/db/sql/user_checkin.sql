-- 每日签到表
-- 一个用户一天一行；streak/total 在写入当行时计算并落表，避免每次状态查询都做窗口扫描
--
-- 唯一约束：(user_id, checkin_date) — 同日重复签到由 DB 直接拦截，不依赖应用层先查后写
-- 查询模式：
--   - 当前 streak / 累计 total / 今日是否签：取该用户最新一行 (ORDER BY checkin_date DESC LIMIT 1)
--   - 写入时 streak 计算逻辑（应用层）：
--       上一行 checkin_date = 今天 - 1 天 → streak = 上一行 streak + 1
--       上一行 checkin_date < 今天 - 1 天 或 无上一行  → streak = 1
--       total = 上一行 total + 1（无上一行则 1）
--
-- 奖励发放本期不做：reward 字段保留 0，等 #品牌发券改造 落地后再绑模板

CREATE TABLE IF NOT EXISTS `user_checkin` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `checkin_date` DATE NOT NULL COMMENT '签到日期(自然日, server timezone)',
  `streak` INT NOT NULL DEFAULT 1 COMMENT '当前连续签到天数',
  `total` INT NOT NULL DEFAULT 1 COMMENT '累计签到天数',
  `reward` INT NOT NULL DEFAULT 0 COMMENT '本次签到发放奖励数量(预留,本期 0)',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_checkin_user_date` (`user_id`, `checkin_date`),
  KEY `idx_user_checkin_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日签到记录表';
