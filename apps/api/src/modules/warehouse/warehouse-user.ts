import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';
import {
  FULFILLMENT_COMPLETED,
  FULFILLMENT_PENDING,
  FULFILLMENT_PROCESSING,
  FULFILLMENT_SHIPPED,
  PHYSICAL_STATUS_CONSIGNING,
  PHYSICAL_STATUS_STORED,
  PhysicalWarehouseRow,
  sanitizePhysicalRow,
  sanitizeVirtualRow,
  VIRTUAL_STATUS_LOCKED,
  VIRTUAL_STATUS_STORED,
  VirtualWarehouseRow,
} from './warehouse-shared';

export async function getUserVirtualWarehouseItems(userId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        vw.id,
        vw.user_id,
        vw.product_id,
        vw.brand_product_sku_id,
        bp.name AS product_name,
        COALESCE(bps.image, bp.default_img) AS product_img,
        bps.spec_signature AS sku_text,
        vw.quantity,
        vw.price,
        vw.source_type,
        vw.status,
        vw.created_at
      FROM virtual_warehouse vw
      LEFT JOIN product p ON p.id = vw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = vw.brand_product_sku_id
      WHERE vw.user_id = ?
        AND vw.status IN (?, ?)
      ORDER BY vw.created_at DESC, vw.id DESC
    `,
    [userId, VIRTUAL_STATUS_STORED, VIRTUAL_STATUS_LOCKED],
  );

  return (rows as VirtualWarehouseRow[]).map((row) => sanitizeVirtualRow(row));
}

/**
 * 用户提货后整条货品流转交给 fulfillment_order 驱动：
 * - vw/pw 行 status 切到 30（已出库）就退出 listing
 * - 履约单按 fulfillment_order_item 行展开，配合 fo.status 推导用户视角的"运输中 / 已签收"
 * - shop 订单（fo.order_id 不为 NULL）和仓库提货（fo.order_id IS NULL）共用同一查询
 */
export async function getUserPhysicalWarehouseItems(userId: string) {
  const db = getDbPool();
  const [fulfillmentRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        CONCAT('fo-', fo.id, '-', foi.id) AS id,
        fo.user_id,
        foi.product_id,
        foi.brand_product_sku_id,
        bp.name AS product_name,
        COALESCE(bps.image, bp.default_img) AS product_img,
        bps.spec_signature AS sku_text,
        foi.quantity,
        foi.unit_price AS price,
        CASE
          WHEN fo.status = ? THEN 'completed'
          ELSE 'shipping'
        END AS status,
        NULL AS consign_price,
        NULL AS estimate_days,
        COALESCE(fo.shipped_at, fo.created_at) AS created_at,
        fo.tracking_no,
        CASE
          WHEN fo.order_id IS NULL THEN '仓库提货'
          WHEN o.guess_id IS NULL THEN '商家发货'
          ELSE '竞猜奖励'
        END AS source_type
      FROM fulfillment_order fo
      INNER JOIN fulfillment_order_item foi ON foi.fulfillment_order_id = fo.id
      LEFT JOIN \`order\` o ON o.id = fo.order_id
      LEFT JOIN product p ON p.id = foi.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = foi.brand_product_sku_id
      WHERE fo.user_id = ?
        AND fo.status IN (?, ?, ?, ?)
      ORDER BY fo.created_at DESC, fo.id DESC
    `,
    [
      FULFILLMENT_COMPLETED,
      userId,
      FULFILLMENT_PENDING,
      FULFILLMENT_PROCESSING,
      FULFILLMENT_SHIPPED,
      FULFILLMENT_COMPLETED,
    ],
  );

  const [warehouseRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        CONCAT('pw-', pw.id) AS id,
        pw.user_id,
        pw.product_id,
        pw.brand_product_sku_id,
        bp.name AS product_name,
        COALESCE(bps.image, bp.default_img) AS product_img,
        bps.spec_signature AS sku_text,
        pw.quantity,
        pw.price,
        pw.status,
        pw.consign_price,
        pw.estimate_days,
        COALESCE(pw.consign_date, pw.created_at) AS created_at,
        NULL AS tracking_no,
        CASE WHEN pw.source_virtual_id IS NULL THEN '仓库商品' ELSE '仓库调入' END AS source_type
      FROM physical_warehouse pw
      LEFT JOIN product p ON p.id = pw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = pw.brand_product_sku_id
      WHERE pw.user_id = ?
        AND pw.status IN (?, ?)
      ORDER BY pw.created_at DESC, pw.id DESC
    `,
    [userId, PHYSICAL_STATUS_STORED, PHYSICAL_STATUS_CONSIGNING],
  );

  return [...(fulfillmentRows as PhysicalWarehouseRow[]), ...(warehouseRows as PhysicalWarehouseRow[])].map((row) =>
    sanitizePhysicalRow(row),
  );
}
