-- CLAUDE.md #30 二期：邀请奖励多档梯度
-- 给 invite_reward_config 加 threshold 列（触发阈值=累计邀请人数），
-- 触发逻辑改为"register 后查 inviter 累计邀请数 N，命中 threshold=N 的 active 配置即发奖"。
-- 切换前已确认无历史数据需要保留（同 drop_coin_ledger / drop_pk_record 等同样流程）。
--
-- 部署顺序：本 SQL 与代码 PR 同窗口执行，避免代码读不到列报错。

ALTER TABLE invite_reward_config
  ADD COLUMN threshold INT UNSIGNED NOT NULL DEFAULT 1
    COMMENT '触发阈值（累计邀请人数）'
    AFTER id,
  ADD UNIQUE KEY uk_invite_reward_threshold (threshold);
