import { Router } from 'express';
import { toEntityId } from '@umi/shared';
import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler, HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
import { ok } from '../../lib/http';
import { requireAdmin } from '../admin/auth';
export const warehouseRouter = Router();
const VIRTUAL_STATUS_STORED = 10;
const VIRTUAL_STATUS_LOCKED = 20;
const VIRTUAL_STATUS_CONVERTED = 30;
const PHYSICAL_STATUS_STORED = 10;
const PHYSICAL_STATUS_CONSIGNING = 20;
const PHYSICAL_STATUS_FULFILLED = 30;
const FULFILLMENT_PENDING = 10;
const FULFILLMENT_PROCESSING = 20;
const FULFILLMENT_SHIPPED = 30;
function mapVirtualSourceType(code) {
    if (code === 10) {
        return '竞猜奖励';
    }
    if (code === 20) {
        return '订单入仓';
    }
    if (code === 30) {
        return '兑换入仓';
    }
    return '手工入仓';
}
function mapVirtualStatus(code) {
    if (code === VIRTUAL_STATUS_LOCKED) {
        return 'locked';
    }
    if (code === VIRTUAL_STATUS_CONVERTED) {
        return 'converted';
    }
    return 'stored';
}
function sanitizeVirtualRow(row) {
    return {
        id: toEntityId(row.id),
        userId: toEntityId(row.user_id),
        productId: toEntityId(row.product_id ?? 0),
        productName: row.product_name || '未命名商品',
        productImg: row.product_img || null,
        quantity: Number(row.quantity ?? 0),
        price: Number(row.price ?? 0) / 100,
        status: mapVirtualStatus(Number(row.status ?? 0)),
        warehouseType: 'virtual',
        sourceType: mapVirtualSourceType(Number(row.source_type ?? 0)),
        createdAt: new Date(row.created_at).toISOString(),
    };
}
function sanitizePhysicalRow(row) {
    return {
        id: toEntityId(row.id),
        userId: toEntityId(row.user_id),
        productId: toEntityId(row.product_id ?? 0),
        productName: row.product_name || '未命名商品',
        productImg: row.product_img || null,
        quantity: Number(row.quantity ?? 0),
        price: Number(row.price ?? 0) / 100,
        status: row.status,
        warehouseType: 'physical',
        sourceType: row.source_type,
        consignPrice: row.consign_price === null ? null : Number(row.consign_price ?? 0) / 100,
        estimateDays: row.estimate_days === null ? null : Number(row.estimate_days ?? 0),
        createdAt: new Date(row.created_at).toISOString(),
    };
}
async function getAdminVirtualWarehouseItems() {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT
        vw.id,
        vw.user_id,
        vw.product_id,
        COALESCE(p.name, bp.name) AS product_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
        vw.quantity,
        vw.price,
        vw.source_type,
        vw.status,
        vw.created_at
      FROM virtual_warehouse vw
      LEFT JOIN product p ON p.id = vw.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      WHERE vw.status IN (?, ?, ?)
      ORDER BY vw.created_at DESC, vw.id DESC
    `, [VIRTUAL_STATUS_STORED, VIRTUAL_STATUS_LOCKED, VIRTUAL_STATUS_CONVERTED]);
    return rows.map((row) => sanitizeVirtualRow(row));
}
async function getAdminVirtualWarehouseItemDetail(itemId) {
    const items = await getAdminVirtualWarehouseItems();
    const matched = items.find((item) => item.id === itemId);
    if (!matched) {
        throw new HttpError(404, 'ADMIN_VIRTUAL_WAREHOUSE_ITEM_NOT_FOUND', '虚拟仓记录不存在');
    }
    return matched;
}
async function getAdminPhysicalWarehouseItems() {
    const db = getDbPool();
    const [fulfillmentRows] = await db.execute(`
      SELECT
        CONCAT('fo-', fo.id, '-', oi.id) AS id,
        fo.user_id,
        oi.product_id,
        COALESCE(p.name, bp.name) AS product_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
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
      WHERE fo.status IN (?, ?, ?)
      ORDER BY fo.created_at DESC, fo.id DESC
    `, [
        FULFILLMENT_PENDING,
        FULFILLMENT_PROCESSING,
        FULFILLMENT_SHIPPED,
        FULFILLMENT_PENDING,
        FULFILLMENT_PROCESSING,
        FULFILLMENT_SHIPPED,
    ]);
    const [warehouseRows] = await db.execute(`
      SELECT
        CONCAT('pw-', pw.id) AS id,
        pw.user_id,
        pw.product_id,
        COALESCE(p.name, bp.name) AS product_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
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
      WHERE pw.status IN (?, ?, ?)
      ORDER BY pw.created_at DESC, pw.id DESC
    `, [
        PHYSICAL_STATUS_STORED,
        PHYSICAL_STATUS_CONSIGNING,
        PHYSICAL_STATUS_FULFILLED,
        PHYSICAL_STATUS_STORED,
        PHYSICAL_STATUS_CONSIGNING,
        PHYSICAL_STATUS_FULFILLED,
    ]);
    return [...fulfillmentRows, ...warehouseRows].map((row) => sanitizePhysicalRow(row));
}
async function getAdminPhysicalWarehouseItemDetail(itemId) {
    const items = await getAdminPhysicalWarehouseItems();
    const matched = items.find((item) => item.id === itemId);
    if (!matched) {
        throw new HttpError(404, 'ADMIN_PHYSICAL_WAREHOUSE_ITEM_NOT_FOUND', '实体仓记录不存在');
    }
    return matched;
}
warehouseRouter.get('/virtual', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const db = getDbPool();
    const [rows] = await db.execute(`
        SELECT
          vw.id,
          vw.user_id,
          vw.product_id,
          COALESCE(p.name, bp.name) AS product_name,
          COALESCE(p.image_url, bp.default_img) AS product_img,
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
      `, [
        user.id,
        VIRTUAL_STATUS_STORED,
        VIRTUAL_STATUS_LOCKED,
        VIRTUAL_STATUS_CONVERTED,
    ]);
    ok(response, {
        items: rows.map((row) => sanitizeVirtualRow(row)),
    });
}));
warehouseRouter.get('/physical', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const db = getDbPool();
    const [fulfillmentRows] = await db.execute(`
      SELECT
        CONCAT('fo-', fo.id, '-', oi.id) AS id,
        fo.user_id,
        oi.product_id,
        COALESCE(p.name, bp.name) AS product_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
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
    `, [
        FULFILLMENT_PENDING,
        FULFILLMENT_PROCESSING,
        FULFILLMENT_SHIPPED,
        user.id,
        FULFILLMENT_PENDING,
        FULFILLMENT_PROCESSING,
        FULFILLMENT_SHIPPED,
    ]);
    const [warehouseRows] = await db.execute(`
      SELECT
        CONCAT('pw-', pw.id) AS id,
        pw.user_id,
        pw.product_id,
        COALESCE(p.name, bp.name) AS product_name,
        COALESCE(p.image_url, bp.default_img) AS product_img,
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
    `, [
        PHYSICAL_STATUS_STORED,
        PHYSICAL_STATUS_CONSIGNING,
        PHYSICAL_STATUS_FULFILLED,
        user.id,
        PHYSICAL_STATUS_STORED,
        PHYSICAL_STATUS_CONSIGNING,
        PHYSICAL_STATUS_FULFILLED,
    ]);
    ok(response, {
        items: [
            ...fulfillmentRows,
            ...warehouseRows,
        ].map((row) => sanitizePhysicalRow(row)),
    });
}));
function computeEstimateDays(priceYuan, marketPriceYuan) {
    if (marketPriceYuan <= 0)
        return 5;
    const ratio = priceYuan / marketPriceYuan;
    if (ratio <= 0.85)
        return 2;
    if (ratio <= 0.95)
        return 3;
    if (ratio <= 1.05)
        return 5;
    return 7;
}
function getRouteIdParam(value) {
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}
warehouseRouter.post('/physical/:id/consign', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const rawId = getRouteIdParam(request.params.id);
    if (!rawId.startsWith('pw-')) {
        response.status(400).json({ success: false, code: 'INVALID_ID', message: '只有实体仓库商品可以寄售', status: 400 });
        return;
    }
    const dbId = Number(rawId.slice(3));
    if (!Number.isFinite(dbId) || dbId <= 0) {
        response.status(400).json({ success: false, code: 'INVALID_ID', message: '无效的商品 ID', status: 400 });
        return;
    }
    const body = request.body;
    const priceYuan = Number(body.price);
    if (!Number.isFinite(priceYuan) || priceYuan <= 0) {
        response.status(400).json({ success: false, code: 'INVALID_PRICE', message: '请输入有效价格', status: 400 });
        return;
    }
    const db = getDbPool();
    const [rows] = await db.execute(`SELECT id, user_id, price, status FROM physical_warehouse WHERE id = ? AND user_id = ? LIMIT 1`, [dbId, user.id]);
    const row = rows[0];
    if (!row) {
        response.status(404).json({ success: false, code: 'NOT_FOUND', message: '商品不存在', status: 404 });
        return;
    }
    if (row.status !== PHYSICAL_STATUS_STORED) {
        response.status(400).json({ success: false, code: 'INVALID_STATUS', message: '当前状态不可寄售', status: 400 });
        return;
    }
    const marketPriceYuan = Number(row.price) / 100;
    const estimateDays = computeEstimateDays(priceYuan, marketPriceYuan);
    await db.execute(`UPDATE physical_warehouse
       SET status = ?, consign_price = ?, estimate_days = ?, consign_date = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?`, [PHYSICAL_STATUS_CONSIGNING, Math.round(priceYuan * 100), estimateDays, dbId]);
    ok(response, { success: true, estimateDays });
}));
warehouseRouter.post('/physical/:id/cancel-consign', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const rawId = getRouteIdParam(request.params.id);
    if (!rawId.startsWith('pw-')) {
        response.status(400).json({ success: false, code: 'INVALID_ID', message: '无效的商品 ID', status: 400 });
        return;
    }
    const dbId = Number(rawId.slice(3));
    if (!Number.isFinite(dbId) || dbId <= 0) {
        response.status(400).json({ success: false, code: 'INVALID_ID', message: '无效的商品 ID', status: 400 });
        return;
    }
    const db = getDbPool();
    const [rows] = await db.execute(`SELECT id, user_id, status FROM physical_warehouse WHERE id = ? AND user_id = ? LIMIT 1`, [dbId, user.id]);
    const row = rows[0];
    if (!row) {
        response.status(404).json({ success: false, code: 'NOT_FOUND', message: '商品不存在', status: 404 });
        return;
    }
    if (row.status !== PHYSICAL_STATUS_CONSIGNING) {
        response.status(400).json({ success: false, code: 'INVALID_STATUS', message: '当前状态不可取消寄售', status: 400 });
        return;
    }
    await db.execute(`UPDATE physical_warehouse
       SET status = ?, consign_price = NULL, estimate_days = NULL, consign_date = NULL, updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?`, [PHYSICAL_STATUS_STORED, dbId]);
    ok(response, { success: true });
}));
warehouseRouter.get('/admin/stats', requireAdmin, asyncHandler(async (_request, response) => {
    const db = getDbPool();
    const [virtualRows] = await db.execute(`SELECT COUNT(*) AS total_virtual FROM virtual_warehouse`);
    const [physicalRows] = await db.execute(`SELECT COUNT(*) AS total_physical FROM physical_warehouse`);
    ok(response, {
        totalVirtual: Number(virtualRows[0]?.total_virtual ?? 0),
        totalPhysical: Number(physicalRows[0]?.total_physical ?? 0),
    });
}));
warehouseRouter.get('/admin/virtual', requireAdmin, asyncHandler(async (_request, response) => {
    ok(response, { items: await getAdminVirtualWarehouseItems() });
}));
warehouseRouter.get('/admin/virtual/:id', requireAdmin, asyncHandler(async (request, response) => {
    ok(response, await getAdminVirtualWarehouseItemDetail(String(request.params.id)));
}));
warehouseRouter.get('/admin/physical', requireAdmin, asyncHandler(async (_request, response) => {
    ok(response, { items: await getAdminPhysicalWarehouseItems() });
}));
warehouseRouter.get('/admin/physical/:id', requireAdmin, asyncHandler(async (request, response) => {
    ok(response, await getAdminPhysicalWarehouseItemDetail(String(request.params.id)));
}));
