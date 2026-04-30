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
  CONSIGN_TRADED,
  type AdminConsignListResult,
  type AdminConsignQueryRow,
  type AdminConsignRow,
  mapConsignSourceType,
  mapConsignStatusLabel,
  toMoney,
  toNullableIso,
} from './orders-shared';

export interface AdminConsignListParams {
  page?: number;
  pageSize?: number;
  tradeNo?: string;
  productName?: string;
  sellerUserId?: string;
  orderSn?: string;
  sourceType?: string;
  statusKey?: string;
}

const CONSIGN_BASE_SQL = `
  FROM consign_trade ct
  LEFT JOIN physical_warehouse pw ON pw.id = ct.physical_item_id
  LEFT JOIN product p ON p.id = pw.product_id
  LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
  LEFT JOIN \`order\` o ON o.id = ct.order_id
  LEFT JOIN user_profile seller_up ON seller_up.user_id = ct.seller_user_id
  LEFT JOIN user_profile buyer_up ON buyer_up.user_id = ct.buyer_user_id
`;

function clampPagination(page: number | undefined, pageSize: number | undefined) {
  const safePage = Number.isFinite(page) && (page ?? 0) > 0 ? Math.floor(page!) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && (pageSize ?? 0) > 0 ? Math.min(Math.floor(pageSize!), 100) : 10;
  return { page: safePage, pageSize: safePageSize };
}

function buildConsignFilterWhere(params: AdminConsignListParams) {
  const clauses: string[] = [];
  const values: Array<string | number> = [];

  if (params.tradeNo) {
    clauses.push('(COALESCE(ct.trade_no, \'\') LIKE ? OR CAST(ct.id AS CHAR) LIKE ?)');
    const keyword = `%${params.tradeNo.trim()}%`;
    values.push(keyword, keyword);
  }
  if (params.productName) {
    clauses.push('bp.name LIKE ?');
    values.push(`%${params.productName.trim()}%`);
  }
  if (params.sellerUserId) {
    clauses.push('(CAST(ct.seller_user_id AS CHAR) LIKE ? OR COALESCE(seller_up.name, \'\') LIKE ?)');
    const keyword = `%${params.sellerUserId.trim()}%`;
    values.push(keyword, keyword);
  }
  if (params.orderSn) {
    clauses.push('COALESCE(o.order_sn, \'\') LIKE ?');
    values.push(`%${params.orderSn.trim()}%`);
  }
  if (params.sourceType === '仓库商品') {
    clauses.push('pw.source_virtual_id IS NULL');
  } else if (params.sourceType === '仓库调入') {
    clauses.push('pw.source_virtual_id IS NOT NULL');
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

function statusKeyToSql(key: string | undefined) {
  if (key === 'listed') {
    return { sql: 'ct.status = ?', values: [CONSIGN_LISTED] as Array<string | number> };
  }
  if (key === 'pending_settle') {
    return { sql: 'ct.status = ? AND ct.settled_at IS NULL', values: [CONSIGN_TRADED] };
  }
  if (key === 'settled') {
    return { sql: 'ct.status = ? AND ct.settled_at IS NOT NULL', values: [CONSIGN_TRADED] };
  }
  if (key === 'canceled') {
    return { sql: 'ct.status = ?', values: [CONSIGN_CANCELED] };
  }
  return null;
}

function sanitizeConsignRow(row: AdminConsignQueryRow): AdminConsignRow {
  const sourceType = mapConsignSourceType(row);
  const price = toMoney(row.sale_amount ?? row.consign_price);
  const commissionAmount = toMoney(row.commission_amount);
  const commissionRate = price > 0 ? Math.round((commissionAmount / price) * 10000) / 100 : null;
  return {
    id: String(toEntityId(row.id)),
    tradeNo: row.trade_no,
    physicalItemId: row.physical_item_id ? String(toEntityId(row.physical_item_id)) : null,
    productName: row.product_name || '未命名商品',
    productImg: row.product_img,
    userId: String(toEntityId(row.seller_user_id)),
    userName: row.seller_user_name || null,
    buyerUserId: row.buyer_user_id ? String(toEntityId(row.buyer_user_id)) : null,
    buyerUserName: row.buyer_user_name || null,
    orderId: row.order_id ? String(toEntityId(row.order_id)) : null,
    orderSn: row.order_sn,
    price,
    listingPrice: row.consign_price == null ? null : toMoney(row.consign_price),
    commissionAmount,
    commissionRate,
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
    cancelReason: row.cancel_reason || null,
  };
}

const SELECT_COLUMNS = `
  ct.id,
  ct.trade_no,
  ct.physical_item_id,
  ct.seller_user_id,
  seller_up.name AS seller_user_name,
  ct.buyer_user_id,
  buyer_up.name AS buyer_user_name,
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
  ct.cancel_reason,
  ct.created_at,
  bp.name AS product_name,
  bp.default_img AS product_img,
  pw.source_virtual_id
`;

export async function getAdminConsignRows(
  params: AdminConsignListParams = {},
): Promise<AdminConsignListResult> {
  const { page, pageSize } = clampPagination(params.page, params.pageSize);
  const offset = (page - 1) * pageSize;
  const db = getDbPool();
  const { whereSql: filterWhere, values: filterValues } = buildConsignFilterWhere(params);

  const fullClauses: string[] = [];
  const fullValues: Array<string | number> = [...filterValues];
  if (filterWhere) {
    fullClauses.push(filterWhere.replace(/^WHERE\s+/, ''));
  }

  const statusFilter = statusKeyToSql(params.statusKey);
  if (statusFilter) {
    fullClauses.push(statusFilter.sql);
    fullValues.push(...statusFilter.values);
  }

  const fullWhere = fullClauses.length > 0 ? `WHERE ${fullClauses.join(' AND ')}` : '';

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT ${SELECT_COLUMNS}
      ${CONSIGN_BASE_SQL}
      ${fullWhere}
      ORDER BY COALESCE(ct.traded_at, ct.canceled_at, ct.listed_at, ct.created_at) DESC, ct.id DESC
      LIMIT ? OFFSET ?
    `,
    [...fullValues, pageSize, offset],
  );

  const [countRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      ${CONSIGN_BASE_SQL}
      ${fullWhere}
    `,
    fullValues,
  );

  const [statusGroupRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        ct.status AS status,
        ct.settled_at AS settled_at,
        COUNT(*) AS cnt
      ${CONSIGN_BASE_SQL}
      ${filterWhere}
      GROUP BY ct.status, (ct.settled_at IS NOT NULL)
    `,
    filterValues,
  );

  const statusCounts: Record<string, number> = {
    all: 0,
    listed: 0,
    pending_settle: 0,
    settled: 0,
    canceled: 0,
  };
  for (const row of statusGroupRows as Array<{
    status: number | string;
    settled_at: Date | string | null;
    cnt: number | string;
  }>) {
    const code = Number(row.status);
    const count = Number(row.cnt ?? 0);
    statusCounts.all += count;
    if (code === CONSIGN_LISTED) statusCounts.listed += count;
    else if (code === CONSIGN_TRADED) {
      if (row.settled_at) statusCounts.settled += count;
      else statusCounts.pending_settle += count;
    } else if (code === CONSIGN_CANCELED) statusCounts.canceled += count;
  }

  const total = Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0);

  return {
    items: (rows as AdminConsignQueryRow[]).map((row) => sanitizeConsignRow(row)),
    total,
    page,
    pageSize,
    statusCounts,
  };
}

export async function getAdminConsignDetail(consignId: string): Promise<AdminConsignRow> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT ${SELECT_COLUMNS}
      ${CONSIGN_BASE_SQL}
      WHERE ct.id = ?
      LIMIT 1
    `,
    [consignId],
  );

  const row = (rows as AdminConsignQueryRow[])[0];
  if (!row) {
    throw new HttpError(404, 'ADMIN_CONSIGN_NOT_FOUND', '寄售记录不存在');
  }
  return sanitizeConsignRow(row);
}

type AdminConsignActionRow = {
  id: number | string;
  physical_item_id: number | string | null;
  status: number | string;
};

export async function cancelAdminConsign(consignId: string, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    throw new HttpError(400, 'ADMIN_CONSIGN_REASON_REQUIRED', '强制下架理由必填');
  }
  if (trimmedReason.length > 255) {
    throw new HttpError(400, 'ADMIN_CONSIGN_REASON_TOO_LONG', '强制下架理由最多 255 字');
  }

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
          cancel_reason = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [CONSIGN_CANCELED, canceledAt, trimmedReason, canceledAt, consignId],
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
      cancelReason: trimmedReason,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
