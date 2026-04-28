-- 竞猜参与对接真实支付：在 guess_bet 上加支付字段，并去掉 (user_id, guess_id) 唯一索引
-- 状态码约定（应用层）：
--   guess_bet.status:      5=BET_WAITING_PAY, 10=BET_PENDING(已支付待开奖), 30=BET_WON, 40=BET_LOST, 90=BET_CANCELED
--   guess_bet.pay_status:  10=waiting, 20=paid, 30=failed, 40=closed/canceled, 50=refunded
--   guess_bet.pay_channel: 10=wechat, 20=alipay

ALTER TABLE `guess_bet`
  ADD COLUMN `pay_status`     TINYINT UNSIGNED NOT NULL DEFAULT 10  COMMENT '支付状态：10=waiting, 20=paid, 30=failed, 40=closed, 50=refunded' AFTER `status`,
  ADD COLUMN `pay_channel`    TINYINT UNSIGNED NULL                 COMMENT '支付渠道：10=wechat, 20=alipay'                                  AFTER `pay_status`,
  ADD COLUMN `pay_no`         VARCHAR(64) NULL                      COMMENT '我方生成的 out_trade_no'                                          AFTER `pay_channel`,
  ADD COLUMN `pay_trade_no`   VARCHAR(64) NULL                      COMMENT '第三方交易号（微信 transaction_id / 支付宝 trade_no）'             AFTER `pay_no`,
  ADD COLUMN `paid_at`        DATETIME(3) NULL                      COMMENT '支付完成时间'                                                       AFTER `pay_trade_no`,
  ADD COLUMN `pay_expires_at` DATETIME(3) NULL                      COMMENT '支付链接过期时间'                                                   AFTER `paid_at`;

-- 去掉旧的 (user_id, guess_id) 唯一索引，由代码做"已支付不可重复参与"判重
-- Prisma 生成的索引名按经验是 guess_bet_user_id_guess_id_key；如果名字不同需要先 SHOW INDEX 确认。
ALTER TABLE `guess_bet`
  DROP INDEX `guess_bet_user_id_guess_id_key`;

-- 新增索引：
--   idx_pay_no 用于支付回调按 out_trade_no 反查 bet（高频）
--   idx_user_guess_paystatus 用于"是否已有已支付 bet"判重查询（高频，命中即拒）
ALTER TABLE `guess_bet`
  ADD UNIQUE KEY `uk_pay_no` (`pay_no`),
  ADD INDEX        `idx_user_guess_paystatus` (`user_id`, `guess_id`, `pay_status`);
