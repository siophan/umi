-- 寄售强制下架收理由：admin 后台「寄售市场」点强制下架时弹层填理由，落到 consign_trade.cancel_reason
-- 长度沿用 varchar(255)（参考 guess_review_log.note 同类用途）
-- 与 drop_pk_record.sql / drop_coin_ledger.sql 一致流程，由运维手工执行。

ALTER TABLE consign_trade
  ADD COLUMN cancel_reason VARCHAR(255) NULL DEFAULT NULL COMMENT '取消理由（admin 强制下架时填写）'
  AFTER canceled_at;
