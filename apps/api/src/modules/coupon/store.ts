import type mysql from 'mysql2/promise';

import type {
  ClaimCouponResult,
  CouponListItem,
  CouponListResult,
  CouponTemplateItem,
  CouponTemplateListResult,
} from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';

const COUPON_TYPE_CASH = 10;
const COUPON_TYPE_DISCOUNT = 20;
const COUPON_TYPE_SHIPPING = 30;
const COUPON_TEMPLATE_STATUS_ACTIVE = 10;
const COUPON_SCOPE_PLATFORM = 10;
const COUPON_SCOPE_SHOP = 20;
const COUPON_VALIDITY_FIXED = 10;
const COUPON_VALIDITY_RELATIVE = 20;
const COUPON_SOURCE_ACTIVITY = 20;
const COUPON_STATUS_UNUSED = 10;

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

/**
 * 把优惠券类型码映射成前端可直接消费的类型。
 */
function mapCouponType(type: number): CouponListItem['type'] {
  if (type === 20) {
    return 'percent';
  }
  if (type === 30) {
    return 'shipping';
  }
  return 'amount';
}

/**
 * 计算优惠券当前展示状态。
 * 这里会把数据库状态和过期时间一起折算成 unused / used / expired / locked。
 */
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

/**
 * 优惠券来源文案。
 */
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

/**
 * 把优惠券表记录转换成前端展示契约。
 */
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

/**
 * 读取当前用户优惠券列表。
 */
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

type CouponTemplateRow = mysql.RowDataPacket & {
  id: number | string;
  name: string;
  description: string | null;
  type: number | string | null;
  scope_type: number | string;
  shop_id: number | string | null;
  min_amount: number | string;
  discount_amount: number | string;
  validity_type: number | string;
  end_at: Date | string | null;
  valid_days: number | string;
  total_quantity: number | string;
  user_limit: number | string;
  granted_count: number | string | null;
  user_claimed: number | string | null;
};

function mapTemplateScopeType(code: number): CouponTemplateItem['scopeType'] {
  if (code === COUPON_SCOPE_SHOP) return 'shop';
  if (code === COUPON_SCOPE_PLATFORM) return 'platform';
  return 'category';
}

function mapTemplateType(code: number): CouponTemplateItem['type'] {
  if (code === COUPON_TYPE_DISCOUNT) return 'percent';
  if (code === COUPON_TYPE_SHIPPING) return 'shipping';
  return 'amount';
}

function buildTemplateConditionText(row: CouponTemplateRow): string {
  const minAmount = Number(row.min_amount) || 0;
  if (minAmount > 0) {
    return `满 ¥${minAmount / 100} 可用`;
  }
  return '无门槛';
}

export async function listClaimableCouponTemplates(
  userId: string | null,
  options: { shopId?: string | null } = {},
): Promise<CouponTemplateListResult> {
  const db = getDbPool();
  const params: Array<string | number> = [];
  const whereParts = [
    `ct.status = ${COUPON_TEMPLATE_STATUS_ACTIVE}`,
    '(ct.end_at IS NULL OR ct.end_at > NOW())',
  ];
  if (options.shopId) {
    whereParts.push(
      `(ct.scope_type = ${COUPON_SCOPE_PLATFORM} OR (ct.scope_type = ${COUPON_SCOPE_SHOP} AND ct.shop_id = ?))`,
    );
    params.push(options.shopId);
  } else {
    whereParts.push(`ct.scope_type = ${COUPON_SCOPE_PLATFORM}`);
  }

  const userIdParam = userId ?? 0;
  const userClaimedExpr = `(SELECT COUNT(*) FROM coupon c WHERE c.template_id = ct.id AND c.user_id = ?)`;
  const grantedExpr = `(SELECT COUNT(*) FROM coupon c WHERE c.template_id = ct.id)`;

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        ct.id,
        ct.name,
        ct.description,
        ct.type,
        ct.scope_type,
        ct.shop_id,
        ct.min_amount,
        ct.discount_amount,
        ct.validity_type,
        ct.end_at,
        ct.valid_days,
        ct.total_quantity,
        ct.user_limit,
        ${grantedExpr} AS granted_count,
        ${userClaimedExpr} AS user_claimed
      FROM coupon_template ct
      WHERE ${whereParts.join(' AND ')}
      ORDER BY ct.created_at DESC, ct.id DESC
    `,
    [userIdParam, ...params],
  );

  return {
    items: (rows as CouponTemplateRow[]).map((row): CouponTemplateItem => {
      const totalQuantity = Number(row.total_quantity);
      const granted = Number(row.granted_count ?? 0);
      const remaining =
        totalQuantity < 0 ? null : Math.max(0, totalQuantity - granted);
      const userClaimed = Number(row.user_claimed ?? 0);
      const userLimit = Math.max(0, Number(row.user_limit) || 0);
      let claimable = true;
      let reason: string | null = null;
      if (!userId) {
        claimable = false;
        reason = '请登录后领取';
      } else if (remaining != null && remaining <= 0) {
        claimable = false;
        reason = '已被领完';
      } else if (userLimit > 0 && userClaimed >= userLimit) {
        claimable = false;
        reason = '已达领取上限';
      }

      return {
        id: toEntityId(row.id),
        name: row.name,
        description: row.description ?? null,
        amount: Number(row.discount_amount) / 100,
        type: mapTemplateType(Number(row.type ?? COUPON_TYPE_CASH)),
        minAmount: Number(row.min_amount) / 100,
        condition: buildTemplateConditionText(row),
        scopeType: mapTemplateScopeType(Number(row.scope_type)),
        shopId: row.shop_id == null ? null : toEntityId(row.shop_id),
        expireAt: row.end_at ? new Date(row.end_at).toISOString() : null,
        validDays: Number(row.valid_days) || 0,
        remaining,
        userClaimed,
        userLimit,
        claimable,
        claimDisabledReason: reason,
      };
    }),
  };
}

export async function claimCouponFromTemplate(
  userId: string,
  templateId: string,
): Promise<ClaimCouponResult> {
  const db = getDbPool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [tplRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, code, name, type, status, min_amount, discount_amount, validity_type,
               start_at, end_at, valid_days, total_quantity, user_limit
        FROM coupon_template
        WHERE id = ?
        LIMIT 1
      `,
      [templateId],
    );
    const template = tplRows[0] as
      | (mysql.RowDataPacket & {
          id: number | string;
          code: string | null;
          name: string;
          type: number | string | null;
          status: number | string;
          min_amount: number | string;
          discount_amount: number | string;
          validity_type: number | string;
          start_at: Date | string | null;
          end_at: Date | string | null;
          valid_days: number | string;
          total_quantity: number | string;
          user_limit: number | string;
        })
      | undefined;

    if (!template) {
      throw new Error('优惠券模板不存在');
    }
    if (Number(template.status) !== COUPON_TEMPLATE_STATUS_ACTIVE) {
      throw new Error('优惠券已停用');
    }
    if (template.end_at && new Date(template.end_at).getTime() < Date.now()) {
      throw new Error('优惠券已过期');
    }
    if (template.start_at && new Date(template.start_at).getTime() > Date.now()) {
      throw new Error('活动尚未开始');
    }

    const totalQuantity = Number(template.total_quantity);
    if (totalQuantity >= 0) {
      const [grantedRows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT COUNT(*) AS granted FROM coupon WHERE template_id = ?',
        [templateId],
      );
      const granted = Number((grantedRows[0] as { granted?: number | string })?.granted ?? 0);
      if (granted >= totalQuantity) {
        throw new Error('优惠券已被领完');
      }
    }

    const userLimit = Number(template.user_limit) || 0;
    if (userLimit > 0) {
      const [userRows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT COUNT(*) AS claimed FROM coupon WHERE template_id = ? AND user_id = ?',
        [templateId, userId],
      );
      const claimed = Number((userRows[0] as { claimed?: number | string })?.claimed ?? 0);
      if (claimed >= userLimit) {
        throw new Error('已达领取上限');
      }
    }

    const validityType = Number(template.validity_type);
    let expireAt: Date | null = null;
    if (validityType === COUPON_VALIDITY_FIXED) {
      expireAt = template.end_at ? new Date(template.end_at) : null;
    } else if (validityType === COUPON_VALIDITY_RELATIVE) {
      const days = Number(template.valid_days) || 0;
      if (days > 0) {
        expireAt = new Date(Date.now() + days * 86400 * 1000);
      }
    }

    const minAmount = Number(template.min_amount) || 0;
    const condition = minAmount > 0 ? `满 ¥${minAmount / 100} 可用` : '无门槛';
    const couponNo = `CP${Date.now()}${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`;

    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO coupon (
          coupon_no, user_id, template_id, name, amount, type, condition,
          expire_at, source_type, status, claimed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3), NOW(3))
      `,
      [
        couponNo,
        userId,
        templateId,
        template.name,
        Number(template.discount_amount),
        Number(template.type ?? COUPON_TYPE_CASH),
        condition,
        expireAt,
        COUPON_SOURCE_ACTIVITY,
        COUPON_STATUS_UNUSED,
      ],
    );

    await connection.commit();
    return {
      couponId: toEntityId(result.insertId),
      templateId: toEntityId(templateId),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
