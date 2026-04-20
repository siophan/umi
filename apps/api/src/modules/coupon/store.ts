import type mysql from 'mysql2/promise';

import type {
  CouponListItem,
  CouponListResult,
} from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';

type CouponRow = {
  id: number | string;
  coupon_no: string | null;
  name: string | null;
  amount: number | string | null;
  type: number | string | null;
  condition: string | null;
  expire_at: Date | string | null;
  source_type: number | string | null;
  status: number | string | null;
};

function mapCouponType(type: number): CouponListItem['type'] {
  if (type === 20) {
    return 'percent';
  }
  if (type === 30) {
    return 'shipping';
  }
  return 'amount';
}

function mapCouponStatus(status: number, expireAt: Date | string | null): CouponListItem['status'] {
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

function mapCouponSource(sourceType: number) {
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

function sanitizeCoupon(row: CouponRow): CouponListItem {
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

export async function listCoupons(userId: string): Promise<CouponListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, coupon_no, name, amount, type, condition, expire_at, source_type, status
      FROM coupon
      WHERE user_id = ?
      ORDER BY
        CASE WHEN status = 10 THEN 0 WHEN status = 20 THEN 1 WHEN status = 30 THEN 2 ELSE 3 END,
        expire_at IS NULL DESC,
        expire_at ASC,
        created_at DESC
    `,
    [userId],
  );

  return {
    items: (rows as CouponRow[]).map((row) => sanitizeCoupon(row)),
  };
}
