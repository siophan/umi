import type mysql from 'mysql2/promise';

import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { FULFILLMENT_PENDING, FULFILLMENT_TYPE_SHIP } from '../order/order-shared';
import {
  getRouteIdParam,
  PHYSICAL_STATUS_FULFILLED,
  PHYSICAL_STATUS_STORED,
  VIRTUAL_STATUS_CONVERTED,
  VIRTUAL_STATUS_STORED,
  WAREHOUSE_LOG_ACTION_OUTBOUND,
  WAREHOUSE_OPERATOR_ROLE_USER,
  WAREHOUSE_TYPE_PHYSICAL,
  WAREHOUSE_TYPE_VIRTUAL,
} from './warehouse-shared';

type AddressRow = {
  id: number | string;
  name: string;
  phone_number: string;
  province: string;
  city: string;
  district: string;
  detail: string;
};

type WarehouseRowForShip = {
  productId: number | string | null;
  skuId: number | string | null;
  quantity: number;
  priceCents: number;
  fromStatus: number;
};

export async function shipWarehouseItem(userId: string, routeId: string, addressId: string) {
  const rawId = getRouteIdParam(routeId);
  const isVirtual = rawId.startsWith('vw-');
  const isPhysical = rawId.startsWith('pw-');
  if (!isVirtual && !isPhysical) {
    throw new HttpError(400, 'INVALID_ID', '无效的商品 ID');
  }
  const dbId = Number(rawId.slice(3));
  if (!Number.isFinite(dbId) || dbId <= 0) {
    throw new HttpError(400, 'INVALID_ID', '无效的商品 ID');
  }

  const addressIdNum = Number(addressId);
  if (!Number.isFinite(addressIdNum) || addressIdNum <= 0) {
    throw new HttpError(400, 'ADDRESS_REQUIRED', '请选择收货地址');
  }

  const db = getDbPool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [addrRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, name, phone_number, province, city, district, detail
         FROM address WHERE id = ? AND user_id = ? LIMIT 1`,
      [addressIdNum, userId],
    );
    const address = addrRows[0] as AddressRow | undefined;
    if (!address) {
      throw new HttpError(404, 'ADDRESS_NOT_FOUND', '收货地址不存在');
    }

    let warehouseRow: WarehouseRowForShip;
    if (isVirtual) {
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id, product_id, brand_product_sku_id, quantity, price, status
           FROM virtual_warehouse WHERE id = ? AND user_id = ? FOR UPDATE`,
        [dbId, userId],
      );
      const row = rows[0] as
        | {
            id: number | string;
            product_id: number | string | null;
            brand_product_sku_id: number | string | null;
            quantity: number | string;
            price: number | string;
            status: number | string;
          }
        | undefined;
      if (!row) {
        throw new HttpError(404, 'NOT_FOUND', '商品不存在');
      }
      const fromStatus = Number(row.status);
      if (fromStatus !== VIRTUAL_STATUS_STORED) {
        throw new HttpError(400, 'INVALID_STATUS', '当前状态不可提货');
      }
      warehouseRow = {
        productId: row.product_id,
        skuId: row.brand_product_sku_id,
        quantity: Number(row.quantity ?? 0),
        priceCents: Number(row.price ?? 0),
        fromStatus,
      };
    } else {
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id, product_id, brand_product_sku_id, quantity, price, status
           FROM physical_warehouse WHERE id = ? AND user_id = ? FOR UPDATE`,
        [dbId, userId],
      );
      const row = rows[0] as
        | {
            id: number | string;
            product_id: number | string | null;
            brand_product_sku_id: number | string | null;
            quantity: number | string;
            price: number | string;
            status: number | string;
          }
        | undefined;
      if (!row) {
        throw new HttpError(404, 'NOT_FOUND', '商品不存在');
      }
      const fromStatus = Number(row.status);
      if (fromStatus !== PHYSICAL_STATUS_STORED) {
        throw new HttpError(400, 'INVALID_STATUS', '当前状态不可提货');
      }
      warehouseRow = {
        productId: row.product_id,
        skuId: row.brand_product_sku_id,
        quantity: Number(row.quantity ?? 0),
        priceCents: Number(row.price ?? 0),
        fromStatus,
      };
    }

    if (!warehouseRow.productId) {
      throw new HttpError(400, 'PRODUCT_MISSING', '商品信息缺失，无法提货');
    }
    if (warehouseRow.quantity <= 0) {
      throw new HttpError(400, 'QUANTITY_INVALID', '商品数量异常');
    }

    const [productRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT shop_id FROM product WHERE id = ? LIMIT 1`,
      [warehouseRow.productId],
    );
    const shopId = (productRows[0] as { shop_id?: number | string | null } | undefined)?.shop_id ?? null;

    const totalAmount = warehouseRow.priceCents * warehouseRow.quantity;
    const fulfillmentSn = `FW${Date.now()}${Math.floor(Math.random() * 9000) + 1000}`;
    const [foResult] = await connection.execute<mysql.ResultSetHeader>(
      `INSERT INTO fulfillment_order (
         fulfillment_sn, type, status, user_id, order_id, shop_id, address_id, receiver_name, phone_number,
         province, city, district, detail_address, shipping_type, shipping_fee, total_amount,
         tracking_no, shipped_at, completed_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [
        fulfillmentSn,
        FULFILLMENT_TYPE_SHIP,
        FULFILLMENT_PENDING,
        userId,
        shopId,
        addressIdNum,
        address.name,
        address.phone_number,
        address.province,
        address.city,
        address.district,
        address.detail,
        FULFILLMENT_TYPE_SHIP,
        0,
        totalAmount,
      ],
    );
    const fulfillmentOrderId = Number(foResult.insertId);

    await connection.execute(
      `INSERT INTO fulfillment_order_item (
         fulfillment_order_id, product_id, brand_product_sku_id, unit_price, quantity, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [
        fulfillmentOrderId,
        warehouseRow.productId,
        warehouseRow.skuId,
        warehouseRow.priceCents,
        warehouseRow.quantity,
      ],
    );

    if (isVirtual) {
      await connection.execute(
        `UPDATE virtual_warehouse SET status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [VIRTUAL_STATUS_CONVERTED, dbId],
      );
    } else {
      await connection.execute(
        `UPDATE physical_warehouse SET status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [PHYSICAL_STATUS_FULFILLED, dbId],
      );
    }

    const toStatus = isVirtual ? VIRTUAL_STATUS_CONVERTED : PHYSICAL_STATUS_FULFILLED;
    await connection.execute(
      `INSERT INTO warehouse_item_log (
         warehouse_type, item_id, user_id, product_id, brand_product_sku_id, action,
         from_status, to_status, quantity, source_type, source_id, operator_id, operator_role,
         note, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [
        isVirtual ? WAREHOUSE_TYPE_VIRTUAL : WAREHOUSE_TYPE_PHYSICAL,
        dbId,
        userId,
        warehouseRow.productId,
        warehouseRow.skuId,
        WAREHOUSE_LOG_ACTION_OUTBOUND,
        warehouseRow.fromStatus,
        toStatus,
        warehouseRow.quantity,
        fulfillmentOrderId,
        userId,
        WAREHOUSE_OPERATOR_ROLE_USER,
        '用户提货',
      ],
    );

    await connection.commit();
    return {
      success: true as const,
      fulfillmentOrderId: toEntityId(fulfillmentOrderId),
      fulfillmentSn,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
