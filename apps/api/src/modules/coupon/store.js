import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
function mapCouponType(type) {
    if (type === 20) {
        return 'percent';
    }
    if (type === 30) {
        return 'shipping';
    }
    return 'amount';
}
function mapCouponStatus(status, expireAt) {
    const expired = expireAt ? new Date(expireAt).getTime() < Date.now() : false;
    if (status === 30) {
        return 'used';
    }
    if (status === 20) {
        return 'locked';
    }
    if (status === 90 || expired) {
        return 'expired';
    }
    return 'unused';
}
function mapCouponSource(sourceType) {
    if (sourceType === 10) {
        return '后台发放';
    }
    if (sourceType === 20) {
        return '活动奖励';
    }
    if (sourceType === 30) {
        return '补偿发放';
    }
    return '系统发放';
}
function sanitizeCoupon(row) {
    const sourceType = Number(row.source_type ?? 0);
    return {
        id: toEntityId(row.id),
        couponNo: row.coupon_no || '',
        name: row.name || '优惠券',
        amount: Number(row.amount ?? 0) / 100,
        type: mapCouponType(Number(row.type ?? 0)),
        condition: row.condition || '',
        expireAt: row.expire_at ? new Date(row.expire_at).toISOString() : null,
        status: mapCouponStatus(Number(row.status ?? 0), row.expire_at),
        sourceType,
        source: mapCouponSource(sourceType),
    };
}
export async function listCoupons(userId) {
    const db = getDbPool();
    const [rows] = await db.execute(`
      SELECT id, coupon_no, name, amount, type, condition, expire_at, source_type, status
      FROM coupon
      WHERE user_id = ?
      ORDER BY
        CASE WHEN status = 10 THEN 0 WHEN status = 20 THEN 1 WHEN status = 30 THEN 2 ELSE 3 END,
        expire_at IS NULL DESC,
        expire_at ASC,
        created_at DESC
    `, [userId]);
    return {
        items: rows.map((row) => sanitizeCoupon(row)),
    };
}
