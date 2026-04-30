-- 下线 pk_record 表（admin/pk 菜单与 /api/admin/pk* 接口已删除）
-- 该表自始至终没有 INSERT 路径，admin 后台读取永远是空集；好友 PK 数据完全在 guess + guess_bet 中。
-- 与 drop_coin_ledger.sql / drop_product_original_price.sql 一致流程，由运维手工执行。

DROP TABLE IF EXISTS pk_record;
