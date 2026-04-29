-- 砍掉金币概念（2026-04-29）：
--   1) 平台不再保留任何"用户余额 / 站内代币"语义，所有支付一律走真实通道（微信/支付宝）
--   2) 卖家寄售收款挂在 consign_trade.seller_amount + settlement_status，提现走 admin 审核
--   3) 竞猜流标退款改为按 pay_no 调原通道 refund（apps/api/src/modules/guess/guess-scheduler.ts）
--
-- 执行前置检查：
--   - 历史 coin_ledger 数据已确认全部为零或可丢弃（2026-04-29 当时数据为空）
--   - 后端代码已无任何引用（wallet 模块已删，users 聚合已移除）

DROP TABLE IF EXISTS `coin_ledger`;
