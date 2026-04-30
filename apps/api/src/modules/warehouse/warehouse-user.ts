import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';
import {
  FULFILLMENT_PENDING,
  FULFILLMENT_PROCESSING,
  FULFILLMENT_SHIPPED,
  PHYSICAL_STATUS_CONSIGNING,
  PHYSICAL_STATUS_FULFILLED,
  PHYSICAL_STATUS_STORED,
  PhysicalWarehouseRow,
  sanitizePhysicalRow,
  sanitizeVirtualRow,
  VIRTUAL_STATUS_CONVERTED,
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
        bp.name AS product_name,
        bp.default_img AS product_img,
        vw.quantity,
        vw.price,
        vw.source_type,
        vw.status,
        vw.created_at
      FROM virtual_warehouse vw
      LEFT JOIN product p ON p.id = vw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      WHERE vw.user_id = ?
        AND vw.status IN (?, ?, ?)
      ORDER BY vw.created_at DESC, vw.id DESC
    `,
    [userId, VIRTUAL_STATUS_STORED, VIRTUAL_STATUS_LOCKED, VIRTUAL_STATUS_CONVERTED],
  );

  return (rows as VirtualWarehouseRow[]).map((row) => sanitizeVirtualRow(row));
}

export async function getUserPhysicalWarehouseItems(userId: string) {
  const db = getDbPool();
  const [fulfillmentRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        CONCAT('fo-', fo.id, '-', oi.id) AS id,
        fo.user_id,
        oi.product_id,
        bp.name AS product_name,
        bp.default_img AS product_img,
        oi.quantity,
        oi.item_amount AS price,
        CASE
          WHEN fo.status = ? THEN 'stored'
          WHEN fo.status = ? THEN 'stored'
          WHEN fo.status = ? THEN 'shipping'
          ELSE 'stored'
        END AS status,
        NULL AS consign_price,
        NULL AS estimate_days,
        COALESCE(fo.shipped_at, fo.created_at) AS created_at,
        CASE WHEN o.guess_id IS NULL THEN '商家发货' ELSE '竞猜奖励' END AS source_type
      FROM fulfillment_order fo
      INNER JOIN \`order\` o ON o.id = fo.order_id
      INNER JOIN order_item oi ON oi.order_id = o.id
      LEFT JOIN product p ON p.id = oi.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      WHERE fo.user_id = ?
        AND fo.status IN (?, ?, ?)
      ORDER BY fo.created_at DESC, fo.id DESC
    `,
    [
      FULFILLMENT_PENDING,
      FULFILLMENT_PROCESSING,
      FULFILLMENT_SHIPPED,
      userId,
      FULFILLMENT_PENDING,
      FULFILLMENT_PROCESSING,
      FULFILLMENT_SHIPPED,
    ],
  );

  const [warehouseRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        CONCAT('pw-', pw.id) AS id,
        pw.user_id,
        pw.product_id,
        bp.name AS product_name,
        bp.default_img AS product_img,
        pw.quantity,
        pw.price,
        CASE
          WHEN pw.status = ? THEN 'delivered'
          WHEN pw.status = ? THEN 'consigning'
          WHEN pw.status = ? THEN 'completed'
          ELSE 'completed'
        END AS status,
        pw.consign_price,
        pw.estimate_days,
        COALESCE(pw.consign_date, pw.created_at) AS created_at,
        CASE WHEN pw.source_virtual_id IS NULL THEN '仓库商品' ELSE '仓库调入' END AS source_type
      FROM physical_warehouse pw
      LEFT JOIN product p ON p.id = pw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      WHERE pw.user_id = ?
        AND pw.status IN (?, ?, ?)
      ORDER BY pw.created_at DESC, pw.id DESC
    `,
    [
      PHYSICAL_STATUS_STORED,
      PHYSICAL_STATUS_CONSIGNING,
      PHYSICAL_STATUS_FULFILLED,
      userId,
      PHYSICAL_STATUS_STORED,
      PHYSICAL_STATUS_CONSIGNING,
      PHYSICAL_STATUS_FULFILLED,
    ],
  );

  return [...(fulfillmentRows as PhysicalWarehouseRow[]), ...(warehouseRows as PhysicalWarehouseRow[])].map((row) =>
    sanitizePhysicalRow(row),
  );
}
