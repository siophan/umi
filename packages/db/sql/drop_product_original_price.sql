-- 砍掉 product 表的品牌共享字段（2026-04-29）：
--   product 表只是店铺铺货层，不再独立存"商品名/原价/主图/相册/描述/tag/联名"等品牌属性
--   所有读路径已切到 brand_product.* （CLAUDE.md #22 列表）
--   shop/shop-brand-auth.ts 创建铺货 INSERT 已移除这些列的写入
--
-- 步骤：
--   1) brand_product 补上 tags / collab 两个原本只在 product 上的字段（其它如 name/description/images/default_img 已存在）
--   2) product 表 DROP 掉 6 个被替代的列：original_price / image_url / images / description / tags / collab
--      （product.name 列暂留为 NOT NULL 副本，写入时仍按 brand_product.name 同步，避免 admin/老查询裸跑 p.name 时报错；后续可再清掉）
--
-- 执行前置检查：
--   - 后端代码已无任何 SELECT/INSERT/UPDATE 引用 p.original_price / p.image_url / p.images / p.tags / p.collab / p.description
--   - brand_product 已是这些字段的权威源（admin 端品牌商品库的封面、相册、描述、视频、详情 HTML 等都在维护）
--   - 历史数据：product 上这些列原本就是 brand_product 的副本（创建铺货时复制过来），可丢弃
--
-- ⚠️ 部署顺序：本迁移必须先于新代码上线
--   shop/shop-brand-auth.ts 的 INSERT product 已不再写 image_url / images / tags 三列；
--   迁移未跑前这三列仍是 NOT NULL 且无默认值，新代码会因 "Field 'images' doesn't have a default value" 报错。
--   操作流程：先在线上跑本 SQL → 再发布新版后端服务。
--
-- 不可回滚：DROP 后 product 上的 image_url / images / description / tags / collab / original_price 历史值无法恢复，
--   重新加列需要先决定默认值/补回逻辑。如需回滚，请先备份 product 表全表。

ALTER TABLE `brand_product`
  ADD COLUMN `tags` JSON NULL COMMENT '商品标签 JSON 数组（如 ["新品","限定","联名"]）' AFTER `delivery_days`,
  ADD COLUMN `collab` VARCHAR(191) NULL COMMENT '联名信息（如 "LISA × CELINE"）' AFTER `tags`;

ALTER TABLE `product`
  DROP COLUMN `original_price`,
  DROP COLUMN `image_url`,
  DROP COLUMN `images`,
  DROP COLUMN `description`,
  DROP COLUMN `tags`,
  DROP COLUMN `collab`;
