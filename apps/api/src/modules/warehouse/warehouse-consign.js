import { HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
import { computeEstimateDays, getRouteIdParam, PHYSICAL_STATUS_CONSIGNING, PHYSICAL_STATUS_STORED, } from './warehouse-shared';
export async function consignPhysicalWarehouseItem(userId, routeId, price) {
    const rawId = getRouteIdParam(routeId);
    if (!rawId.startsWith('pw-')) {
        throw new HttpError(400, 'INVALID_ID', '只有实体仓库商品可以寄售');
    }
    const dbId = Number(rawId.slice(3));
    if (!Number.isFinite(dbId) || dbId <= 0) {
        throw new HttpError(400, 'INVALID_ID', '无效的商品 ID');
    }
    const priceYuan = Number(price);
    if (!Number.isFinite(priceYuan) || priceYuan <= 0) {
        throw new HttpError(400, 'INVALID_PRICE', '请输入有效价格');
    }
    const db = getDbPool();
    const [rows] = await db.execute(`SELECT id, user_id, price, status FROM physical_warehouse WHERE id = ? AND user_id = ? LIMIT 1`, [dbId, userId]);
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, 'NOT_FOUND', '商品不存在');
    }
    if (row.status !== PHYSICAL_STATUS_STORED) {
        throw new HttpError(400, 'INVALID_STATUS', '当前状态不可寄售');
    }
    const marketPriceYuan = Number(row.price) / 100;
    const estimateDays = computeEstimateDays(priceYuan, marketPriceYuan);
    await db.execute(`UPDATE physical_warehouse
     SET status = ?, consign_price = ?, estimate_days = ?, consign_date = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
     WHERE id = ?`, [PHYSICAL_STATUS_CONSIGNING, Math.round(priceYuan * 100), estimateDays, dbId]);
    return { success: true, estimateDays };
}
export async function cancelPhysicalWarehouseConsign(userId, routeId) {
    const rawId = getRouteIdParam(routeId);
    if (!rawId.startsWith('pw-')) {
        throw new HttpError(400, 'INVALID_ID', '无效的商品 ID');
    }
    const dbId = Number(rawId.slice(3));
    if (!Number.isFinite(dbId) || dbId <= 0) {
        throw new HttpError(400, 'INVALID_ID', '无效的商品 ID');
    }
    const db = getDbPool();
    const [rows] = await db.execute(`SELECT id, user_id, status FROM physical_warehouse WHERE id = ? AND user_id = ? LIMIT 1`, [dbId, userId]);
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, 'NOT_FOUND', '商品不存在');
    }
    if (row.status !== PHYSICAL_STATUS_CONSIGNING) {
        throw new HttpError(400, 'INVALID_STATUS', '当前状态不可取消寄售');
    }
    await db.execute(`UPDATE physical_warehouse
     SET status = ?, consign_price = NULL, estimate_days = NULL, consign_date = NULL, updated_at = CURRENT_TIMESTAMP(3)
     WHERE id = ?`, [PHYSICAL_STATUS_STORED, dbId]);
    return { success: true };
}
