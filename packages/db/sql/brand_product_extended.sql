-- 品牌商品库扩展字段
-- 商品详情页 UI 需要展示视频、详情HTML、参数表、包装清单、运费/发货地/发货时效
-- 这些都是"品牌商品级别"的共享属性：同一 brand_product 在不同店铺铺货时共用
-- 全部允许为空（NULL / 空 JSON），存量数据不需要回填

ALTER TABLE `brand_product`
  ADD COLUMN `video_url`     VARCHAR(255)   NULL                COMMENT '主图视频 URL（mp4 / m3u8）'                                  AFTER `images`,
  ADD COLUMN `detail_html`   MEDIUMTEXT     NULL                COMMENT '商品详情 HTML（详情 tab 渲染）'                                  AFTER `description`,
  ADD COLUMN `spec_table`    JSON           NULL                COMMENT '参数表 JSON：[{"key":"产地","value":"法国"},...]（参数 tab）'    AFTER `detail_html`,
  ADD COLUMN `package_list`  JSON           NULL                COMMENT '包装清单 JSON：["商品 ×1","保修卡 ×1",...]（清单 tab）'           AFTER `spec_table`,
  ADD COLUMN `freight`       BIGINT         NULL                COMMENT '运费，单位分；NULL=包邮'                                       AFTER `package_list`,
  ADD COLUMN `ship_from`     VARCHAR(64)    NULL                COMMENT '发货地（如 "上海"）'                                            AFTER `freight`,
  ADD COLUMN `delivery_days` VARCHAR(32)    NULL                COMMENT '发货时效文案（如 "24h内发货"、"3天内发货"）'                     AFTER `ship_from`;
