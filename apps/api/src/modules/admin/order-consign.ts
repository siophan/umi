import type mysql from 'mysql2/promise';

import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import {
  PHYSICAL_STATUS_CONSIGNING,
  PHYSICAL_STATUS_STORED,
} from '../warehouse/warehouse-shared';
import {
  CONSIGN_CANCELED,
  CONSIGN_LISTED,
  type AdminConsignQueryRow,
  type AdminConsignRow,
  mapConsignSourceType,
  mapConsignStatusLabel,
  toMoney,
  toNullableIso,
} from './orders-shared';

export async function getAdminConsignRows(): Promise<AdminConsignRow[]> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ct.id,
        ct.trade_no,
        ct.physical_item_id,
        ct.seller_user_id,
        ct.buyer_user_id,
        ct.order_id,
        o.order_sn,
        ct.status,
        ct.settlement_status,
        ct.sale_amount,
        ct.commission_amount,
        ct.seller_amount,
        pw.consign_price,
        ct.listed_at,
        ct.traded_at,
        ct.settled_at,
        ct.canceled_at,
        ct.created_at,
        bp.name AS product_name,
        bp.default_img AS product_img,
        pw.source_virtual_id
      FROM consign_trade ct
      LEFT JOIN physical_warehouse pw ON pw.id = ct.physical_item_id
      LEFT JOIN product p ON p.id = pw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN \`order\` o ON o.id = ct.order_id
      ORDER BY COALESCE(ct.traded_at, ct.canceled_at, ct.listed_at, ct.created_at) DESC, ct.id DESC
    `,
  );

  return (rows as AdminConsignQueryRow[]).map((row) => {
    const sourceType = mapConsignSourceType(row);
    return {
      id: String(toEntityId(row.id)),
      tradeNo: row.trade_no,
      physicalItemId: row.physical_item_id ? String(toEntityId(row.physical_item_id)) : null,
      productName: row.product_name || '未命名商品',
      productImg: row.product_img,
      userId: String(toEntityId(row.seller_user_id)),
      buyerUserId: row.buyer_user_id ? String(toEntityId(row.buyer_user_id)) : null,
      orderId: row.order_id ? String(toEntityId(row.order_id)) : null,
      orderSn: row.order_sn,
      price: toMoney(row.sale_amount ?? row.consign_price),
      listingPrice: row.consign_price == null ? null : toMoney(row.consign_price),
      commissionAmount: toMoney(row.commission_amount),
      sellerAmount: toMoney(row.seller_amount),
      statusCode: Number(row.status ?? 0),
      settlementStatusCode: row.settlement_status == null ? null : Number(row.settlement_status),
      statusLabel: mapConsignStatusLabel(row),
      sourceType: sourceType.value,
      sourceTypeDerived: sourceType.derived,
      createdAt: new Date(row.created_at).toISOString(),
      listedAt: toNullableIso(row.listed_at),
      tradedAt: toNullableIso(row.traded_at),
      settledAt: toNullableIso(row.settled_at),
      canceledAt: toNullableIso(row.canceled_at),
    };
  });
}

export async function getAdminConsignDetail(consignId: string): Promise<AdminConsignRow> {
  const items = await getAdminConsignRows();
  const matched = items.find((item) => item.id === consignId);

  if (!matched) {
    throw new HttpError(404, 'ADMIN_CONSIGN_NOT_FOUND', '寄售记录不存在');
  }

  return matched;
}

type AdminConsignActionRow = {
  id: number | string;
  physical_item_id: number | string | null;
  status: number | string;
};

export async function cancelAdminConsign(consignId: string) {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          id,
          physical_item_id,
          status
        FROM consign_trade
        WHERE id = ?
        LIMIT 1
      `,
      [consignId],
    );

    const record = (rows as AdminConsignActionRow[])[0];
    if (!record) {
      throw new HttpError(404, 'ADMIN_CONSIGN_NOT_FOUND', '寄售记录不存在');
    }

    if (Number(record.status) !== CONSIGN_LISTED) {
      throw new HttpError(400, 'ADMIN_CONSIGN_STATUS_INVALID', '当前寄售状态不支持强制下架');
    }

    const canceledAt = new Date();

    await connection.execute(
      `
        UPDATE consign_trade
        SET
          status = ?,
          canceled_at = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [CONSIGN_CANCELED, canceledAt, canceledAt, consignId],
    );

    if (record.physical_item_id != null) {
      await connection.execute(
        `
          UPDATE physical_warehouse
          SET
            status = ?,
            consign_price = NULL,
            estimate_days = NULL,
            consign_date = NULL,
            updated_at = ?
          WHERE id = ?
            AND status = ?
        `,
        [PHYSICAL_STATUS_STORED, canceledAt, record.physical_item_id, PHYSICAL_STATUS_CONSIGNING],
      );
    }

    await connection.commit();

    return {
      id: toEntityId(record.id),
      physicalItemId:
        record.physical_item_id == null ? null : toEntityId(record.physical_item_id),
      status: 'canceled' as const,
      canceledAt: canceledAt.toISOString(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
