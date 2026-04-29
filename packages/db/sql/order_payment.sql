-- 商城订单对接真实支付：在 order 上加支付字段
-- 状态码约定（应用层）：
--   order.status:        10=PENDING(待支付), 20=PAID(已支付/待发货), 30=FULFILLED(已完成), 40=CLOSED(已关闭/超时取消), 90=REFUNDED
--   order.pay_status:    10=waiting, 20=paid, 30=failed, 40=closed/canceled, 50=refunded
--   order.pay_channel:   10=wechat, 20=alipay

ALTER TABLE `order`
  ADD COLUMN `pay_status`     TINYINT UNSIGNED NOT NULL DEFAULT 10  COMMENT '支付状态：10=waiting, 20=paid, 30=failed, 40=closed, 50=refunded' AFTER `status`,
  ADD COLUMN `pay_channel`    TINYINT UNSIGNED NULL                 COMMENT '支付渠道：10=wechat, 20=alipay'                                  AFTER `pay_status`,
  ADD COLUMN `pay_no`         VARCHAR(64) NULL                      COMMENT '我方生成的 out_trade_no，前缀 OR 区别于竞猜 GB'                  AFTER `pay_channel`,
  ADD COLUMN `pay_trade_no`   VARCHAR(64) NULL                      COMMENT '第三方交易号'                                                       AFTER `pay_no`,
  ADD COLUMN `paid_at`        DATETIME(3) NULL                      COMMENT '支付完成时间'                                                       AFTER `pay_trade_no`,
  ADD COLUMN `pay_expires_at` DATETIME(3) NULL                      COMMENT '支付链接过期时间'                                                   AFTER `paid_at`;

-- pay_no 全表唯一（含历史已存在的 OR 单号回写也安全）
ALTER TABLE `order`
  ADD UNIQUE KEY `uk_order_pay_no` (`pay_no`);

-- 历史已支付的订单回填一次默认值，方便切换后兼容查询：
--   既有 status=20(PAID) 的老订单 → pay_status=20(paid)
UPDATE `order` SET `pay_status` = 20 WHERE `status` = 20 AND `pay_status` = 10;
