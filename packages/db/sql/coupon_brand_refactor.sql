-- 品牌发券改造 批次 1
-- 改造目标：coupon_template 从店铺维度切到品牌维度
--
-- 不向前兼容：scope_type=20 编码从 shop 改为 brand。
-- 上线前提条件：运维已清空旧测试数据，本脚本兜底 DELETE 旧 shop 模板。
--
-- 步骤：
-- 1. 兜底清掉旧 shop 模板（scope_type=20 在旧语义=shop）
-- 2. coupon_template DROP shop_id，ADD brand_id + brand_product_ids
-- 3. coupon ADD scope_type / brand_id / brand_product_ids 快照三列

-- 1) 兜底清旧 shop 模板（防止 scope_type=20 残留行被新代码当做 brand 误读）
DELETE FROM coupon WHERE template_id IN (SELECT id FROM coupon_template WHERE scope_type = 20);
DELETE FROM coupon_grant_batch WHERE template_id IN (SELECT id FROM coupon_template WHERE scope_type = 20);
DELETE FROM coupon_template WHERE scope_type = 20;

-- 2) coupon_template
ALTER TABLE `coupon_template`
  DROP COLUMN `shop_id`,
  ADD COLUMN `brand_id` BIGINT NULL COMMENT '品牌 ID（scope_type=20 时必填）' AFTER `scope_type`,
  ADD COLUMN `brand_product_ids` JSON NULL COMMENT '范围限定 SPU id 列表；NULL=该品牌全量' AFTER `brand_id`,
  ADD INDEX `idx_coupon_template_brand` (`brand_id`);

-- 3) coupon 已发券快照表
ALTER TABLE `coupon`
  ADD COLUMN `scope_type` TINYINT UNSIGNED NOT NULL DEFAULT 10 COMMENT '范围类型快照' AFTER `template_id`,
  ADD COLUMN `brand_id` BIGINT NULL COMMENT '品牌 ID 快照' AFTER `scope_type`,
  ADD COLUMN `brand_product_ids` JSON NULL COMMENT '范围限定 SPU 快照' AFTER `brand_id`,
  ADD INDEX `idx_coupon_brand` (`brand_id`);
