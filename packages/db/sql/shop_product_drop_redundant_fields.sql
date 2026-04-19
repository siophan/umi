ALTER TABLE `product`
  DROP COLUMN `brand`,
  DROP COLUMN `category`;

ALTER TABLE `shop_brand_auth_apply`
  DROP COLUMN `brand_name`,
  DROP COLUMN `category`;
