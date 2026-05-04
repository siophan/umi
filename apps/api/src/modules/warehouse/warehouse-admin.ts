import type mysql from 'mysql2/promise';

import type { WarehouseItem } from '@umi/shared';

import { HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
import {
  PHYSICAL_STATUS_CONSIGNING,
  PHYSICAL_STATUS_FULFILLED,
  PHYSICAL_STATUS_STORED,
  PhysicalWarehouseRow,
  physicalStatusLabelToCode,
  sanitizePhysicalRow,
  sanitizeVirtualRow,
  VIRTUAL_STATUS_CONVERTED,
  VIRTUAL_STATUS_LOCKED,
  VIRTUAL_STATUS_STORED,
  VirtualWarehouseRow,
  virtualStatusLabelToCode,
} from './warehouse-shared';

export interface AdminWarehouseListParams {
  page?: number;
  pageSize?: number;
  productName?: string;
  sourceType?: string;
  userId?: string;
  status?: string;
}

export interface AdminWarehouseListResult {
  items: WarehouseItem[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: Record<string, number>;
}

function clampPagination(page: number | undefined, pageSize: number | undefined) {
  const safePage = Number.isFinite(page) && (page ?? 0) > 0 ? Math.floor(page!) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && (pageSize ?? 0) > 0 ? Math.min(Math.floor(pageSize!), 100) : 10;
  return { page: safePage, pageSize: safePageSize };
}

export async function getAdminWarehouseStats() {
  const db = getDbPool();
  const [virtualRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS total_virtual FROM virtual_warehouse`,
  );
  const [physicalRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS total_physical FROM physical_warehouse`,
  );

  return {
    totalVirtual: Number((virtualRows[0] as { total_virtual?: number | string } | undefined)?.total_virtual ?? 0),
    totalPhysical: Number((physicalRows[0] as { total_physical?: number | string } | undefined)?.total_physical ?? 0),
  };
}

function buildVirtualWhere(params: AdminWarehouseListParams) {
  const clauses: string[] = ['vw.status IN (?, ?, ?)'];
  const values: Array<string | number> = [
    VIRTUAL_STATUS_STORED,
    VIRTUAL_STATUS_LOCKED,
    VIRTUAL_STATUS_CONVERTED,
  ];

  if (params.productName) {
    clauses.push('bp.name LIKE ?');
    values.push(`%${params.productName.trim()}%`);
  }
  if (params.userId) {
    clauses.push('(CAST(vw.user_id AS CHAR) LIKE ? OR COALESCE(up.name, \'\') LIKE ?)');
    const keyword = `%${params.userId.trim()}%`;
    values.push(keyword, keyword);
  }
  if (params.sourceType) {
    if (params.sourceType === '手工入仓') {
      clauses.push('vw.source_type NOT IN (10, 20, 30)');
    } else if (params.sourceType === '竞猜奖励') {
      clauses.push('vw.source_type = ?');
      values.push(10);
    } else if (params.sourceType === '订单入仓') {
      clauses.push('vw.source_type = ?');
      values.push(20);
    } else if (params.sourceType === '兑换入仓') {
      clauses.push('vw.source_type = ?');
      values.push(30);
    }
  }

  return { whereSql: `WHERE ${clauses.join(' AND ')}`, values };
}

export async function getAdminVirtualWarehouseItems(
  params: AdminWarehouseListParams = {},
): Promise<AdminWarehouseListResult> {
  const { page, pageSize } = clampPagination(params.page, params.pageSize);
  const offset = (page - 1) * pageSize;
  const db = getDbPool();
  const { whereSql: filterWhere, values: filterValues } = buildVirtualWhere(params);

  const statusClauses: string[] = [filterWhere];
  const statusValues = [...filterValues];
  const statusCode = params.status ? virtualStatusLabelToCode(params.status) : null;
  if (statusCode != null) {
    statusClauses.push('vw.status = ?');
    statusValues.push(statusCode);
  }
  const fullWhere = statusClauses.filter(Boolean).join(' AND ');

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        vw.id,
        vw.user_id,
        up.name AS user_name,
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
      LEFT JOIN user_profile up ON up.user_id = vw.user_id
      LEFT JOIN product p ON p.id = vw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = vw.brand_product_sku_id
      ${fullWhere}
      ORDER BY vw.created_at DESC, vw.id DESC
      LIMIT ? OFFSET ?
    `,
    [...statusValues, pageSize, offset],
  );

  const [countRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM virtual_warehouse vw
      LEFT JOIN user_profile up ON up.user_id = vw.user_id
      LEFT JOIN product p ON p.id = vw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = vw.brand_product_sku_id
      ${fullWhere}
    `,
    statusValues,
  );

  const [statusGroupRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT vw.status AS status, COUNT(*) AS cnt
      FROM virtual_warehouse vw
      LEFT JOIN user_profile up ON up.user_id = vw.user_id
      LEFT JOIN product p ON p.id = vw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = vw.brand_product_sku_id
      ${filterWhere}
      GROUP BY vw.status
    `,
    filterValues,
  );

  const statusCounts: Record<string, number> = { all: 0, stored: 0, locked: 0, converted: 0 };
  for (const row of statusGroupRows as Array<{ status: number | string; cnt: number | string }>) {
    const code = Number(row.status);
    const count = Number(row.cnt ?? 0);
    statusCounts.all += count;
    if (code === VIRTUAL_STATUS_STORED) statusCounts.stored = count;
    else if (code === VIRTUAL_STATUS_LOCKED) statusCounts.locked = count;
    else if (code === VIRTUAL_STATUS_CONVERTED) statusCounts.converted = count;
  }

  const total = Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0);

  return {
    items: (rows as VirtualWarehouseRow[]).map((row) => sanitizeVirtualRow(row)),
    total,
    page,
    pageSize,
    statusCounts,
  };
}

export async function getAdminVirtualWarehouseItemDetail(itemId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        vw.id,
        vw.user_id,
        up.name AS user_name,
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
      LEFT JOIN user_profile up ON up.user_id = vw.user_id
      LEFT JOIN product p ON p.id = vw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = vw.brand_product_sku_id
      WHERE vw.id = ?
      LIMIT 1
    `,
    [itemId],
  );

  const row = (rows as VirtualWarehouseRow[])[0];
  if (!row) {
    throw new HttpError(404, 'ADMIN_VIRTUAL_WAREHOUSE_ITEM_NOT_FOUND', '虚拟仓记录不存在');
  }
  return sanitizeVirtualRow(row);
}

function buildPhysicalWhere(params: AdminWarehouseListParams) {
  const clauses: string[] = ['pw.status IN (?, ?, ?)'];
  const values: Array<string | number> = [
    PHYSICAL_STATUS_STORED,
    PHYSICAL_STATUS_CONSIGNING,
    PHYSICAL_STATUS_FULFILLED,
  ];

  if (params.productName) {
    clauses.push('bp.name LIKE ?');
    values.push(`%${params.productName.trim()}%`);
  }
  if (params.userId) {
    clauses.push('(CAST(pw.user_id AS CHAR) LIKE ? OR COALESCE(up.name, \'\') LIKE ?)');
    const keyword = `%${params.userId.trim()}%`;
    values.push(keyword, keyword);
  }
  if (params.sourceType === '仓库商品') {
    clauses.push('pw.source_virtual_id IS NULL');
  } else if (params.sourceType === '仓库调入') {
    clauses.push('pw.source_virtual_id IS NOT NULL');
  }

  return { whereSql: `WHERE ${clauses.join(' AND ')}`, values };
}

export async function getAdminPhysicalWarehouseItems(
  params: AdminWarehouseListParams = {},
): Promise<AdminWarehouseListResult> {
  const { page, pageSize } = clampPagination(params.page, params.pageSize);
  const offset = (page - 1) * pageSize;
  const db = getDbPool();
  const { whereSql: filterWhere, values: filterValues } = buildPhysicalWhere(params);

  // 寄售中的物品归属于「寄售市场」页，本页不展示
  const pageWhereExtras: string[] = ['pw.status <> ?'];
  const pageWhereValues: Array<string | number> = [PHYSICAL_STATUS_CONSIGNING];

  const statusCode = params.status ? physicalStatusLabelToCode(params.status) : null;
  if (statusCode != null && statusCode !== PHYSICAL_STATUS_CONSIGNING) {
    pageWhereExtras.push('pw.status = ?');
    pageWhereValues.push(statusCode);
  }

  const fullWhere = `${filterWhere} AND ${pageWhereExtras.join(' AND ')}`;
  const fullValues = [...filterValues, ...pageWhereValues];

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        pw.id,
        pw.user_id,
        up.name AS user_name,
        pw.product_id,
        pw.brand_product_sku_id,
        bp.name AS product_name,
        COALESCE(bps.image, bp.default_img) AS product_img,
        bps.spec_signature AS sku_text,
        pw.quantity,
        pw.price,
        CASE
          WHEN pw.status = ? THEN 'stored'
          WHEN pw.status = ? THEN 'consigning'
          WHEN pw.status = ? THEN 'completed'
          ELSE 'stored'
        END AS status,
        pw.consign_price,
        pw.estimate_days,
        COALESCE(pw.consign_date, pw.created_at) AS created_at,
        CASE WHEN pw.source_virtual_id IS NULL THEN '仓库商品' ELSE '仓库调入' END AS source_type
      FROM physical_warehouse pw
      LEFT JOIN user_profile up ON up.user_id = pw.user_id
      LEFT JOIN product p ON p.id = pw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = pw.brand_product_sku_id
      ${fullWhere}
      ORDER BY pw.created_at DESC, pw.id DESC
      LIMIT ? OFFSET ?
    `,
    [
      PHYSICAL_STATUS_STORED,
      PHYSICAL_STATUS_CONSIGNING,
      PHYSICAL_STATUS_FULFILLED,
      ...fullValues,
      pageSize,
      offset,
    ],
  );

  const [countRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM physical_warehouse pw
      LEFT JOIN user_profile up ON up.user_id = pw.user_id
      LEFT JOIN product p ON p.id = pw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = pw.brand_product_sku_id
      ${fullWhere}
    `,
    fullValues,
  );

  const [statusGroupRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT pw.status AS status, COUNT(*) AS cnt
      FROM physical_warehouse pw
      LEFT JOIN user_profile up ON up.user_id = pw.user_id
      LEFT JOIN product p ON p.id = pw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = pw.brand_product_sku_id
      ${filterWhere} AND pw.status <> ?
      GROUP BY pw.status
    `,
    [...filterValues, PHYSICAL_STATUS_CONSIGNING],
  );

  const statusCounts: Record<string, number> = { all: 0, stored: 0, completed: 0 };
  for (const row of statusGroupRows as Array<{ status: number | string; cnt: number | string }>) {
    const code = Number(row.status);
    const count = Number(row.cnt ?? 0);
    statusCounts.all += count;
    if (code === PHYSICAL_STATUS_STORED) statusCounts.stored = count;
    else if (code === PHYSICAL_STATUS_FULFILLED) statusCounts.completed = count;
  }

  const total = Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0);

  return {
    items: (rows as PhysicalWarehouseRow[]).map((row) => sanitizePhysicalRow(row)),
    total,
    page,
    pageSize,
    statusCounts,
  };
}

export async function getAdminPhysicalWarehouseItemDetail(itemId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        pw.id,
        pw.user_id,
        up.name AS user_name,
        pw.product_id,
        pw.brand_product_sku_id,
        bp.name AS product_name,
        COALESCE(bps.image, bp.default_img) AS product_img,
        bps.spec_signature AS sku_text,
        pw.quantity,
        pw.price,
        CASE
          WHEN pw.status = ? THEN 'stored'
          WHEN pw.status = ? THEN 'consigning'
          WHEN pw.status = ? THEN 'completed'
          ELSE 'stored'
        END AS status,
        pw.consign_price,
        pw.estimate_days,
        COALESCE(pw.consign_date, pw.created_at) AS created_at,
        CASE WHEN pw.source_virtual_id IS NULL THEN '仓库商品' ELSE '仓库调入' END AS source_type
      FROM physical_warehouse pw
      LEFT JOIN user_profile up ON up.user_id = pw.user_id
      LEFT JOIN product p ON p.id = pw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand_product_sku bps ON bps.id = pw.brand_product_sku_id
      WHERE pw.id = ?
      LIMIT 1
    `,
    [PHYSICAL_STATUS_STORED, PHYSICAL_STATUS_CONSIGNING, PHYSICAL_STATUS_FULFILLED, itemId],
  );

  const row = (rows as PhysicalWarehouseRow[])[0];
  if (!row) {
    throw new HttpError(404, 'ADMIN_PHYSICAL_WAREHOUSE_ITEM_NOT_FOUND', '实体仓记录不存在');
  }
  return sanitizePhysicalRow(row);
}
