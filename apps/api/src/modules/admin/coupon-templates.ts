import type mysql from 'mysql2/promise';
import {
  toEntityId,
  type AdminCouponListResult,
  type CreateAdminCouponTemplatePayload,
  type CreateAdminCouponTemplateResult,
  type UpdateAdminCouponTemplatePayload,
  type UpdateAdminCouponTemplateResult,
  type UpdateAdminCouponTemplateStatusPayload,
  type UpdateAdminCouponTemplateStatusResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  COUPON_SOURCE_ADMIN,
  CouponListParams,
  CouponTemplateRow,
  assertShopExists,
  buildCouponListWhere,
  createNo,
  fetchCouponTemplateById,
  normalizeCouponTemplatePayload,
  normalizeCouponTemplateStatus,
  sanitizeCouponTemplate,
} from './coupons-shared';

export async function getAdminCoupons(params: CouponListParams = {}): Promise<AdminCouponListResult> {
  const db = getDbPool();
  const { whereSql, values } = buildCouponListWhere(params);
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ct.id,
        ct.code,
        ct.name,
        ct.type,
        ct.status,
        ct.scope_type,
        ct.shop_id,
        ct.description,
        ct.source_type,
        ct.min_amount,
        ct.discount_amount,
        ct.discount_rate,
        ct.max_discount_amount,
        ct.validity_type,
        ct.start_at,
        ct.end_at,
        ct.valid_days,
        ct.total_quantity,
        ct.user_limit,
        ct.created_at,
        ct.updated_at,
        s.name AS shop_name,
        COALESCE(gs.batch_count, 0) AS batch_count,
        COALESCE(gs.granted_count, 0) AS granted_count,
        gs.last_batch_at
      FROM coupon_template ct
      LEFT JOIN shop s ON s.id = ct.shop_id
      LEFT JOIN (
        SELECT
          template_id,
          COUNT(*) AS batch_count,
          COALESCE(SUM(granted_count), 0) AS granted_count,
          MAX(created_at) AS last_batch_at
        FROM coupon_grant_batch
        GROUP BY template_id
      ) gs ON gs.template_id = ct.id
      ${whereSql}
      ORDER BY ct.updated_at DESC, ct.id DESC
    `,
    values,
  );

  const items = (rows as CouponTemplateRow[]).map((row) => sanitizeCouponTemplate(row));
  const summary = {
    total: items.length,
    active: items.filter((item) => item.status === 'active').length,
    scheduled: items.filter((item) => item.status === 'scheduled').length,
    paused: items.filter((item) => item.status === 'paused').length,
    disabled: items.filter((item) => item.status === 'disabled').length,
    ended: items.filter((item) => item.status === 'ended').length,
  };

  return {
    items:
      params.status && params.status !== 'all'
        ? items.filter((item) => item.status === params.status)
        : items,
    summary,
  };
}

export async function createAdminCouponTemplate(
  payload: CreateAdminCouponTemplatePayload,
): Promise<CreateAdminCouponTemplateResult> {
  const normalized = normalizeCouponTemplatePayload(payload);
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    if (normalized.shopId) {
      await assertShopExists(connection, normalized.shopId);
    }

    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO coupon_template (
          code,
          name,
          type,
          status,
          scope_type,
          shop_id,
          description,
          source_type,
          min_amount,
          discount_amount,
          discount_rate,
          max_discount_amount,
          validity_type,
          start_at,
          end_at,
          valid_days,
          total_quantity,
          user_limit,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
      `,
      [
        createNo('TPL'),
        normalized.name,
        normalized.typeCode,
        normalized.statusCode,
        normalized.scopeTypeCode,
        normalized.shopId,
        normalized.description,
        COUPON_SOURCE_ADMIN,
        normalized.minAmount,
        normalized.discountAmount,
        normalized.discountRate,
        normalized.maxDiscountAmount,
        normalized.validityTypeCode,
        normalized.startAt,
        normalized.endAt,
        normalized.validDays,
        normalized.totalQuantity,
        normalized.userLimit,
      ],
    );

    return { id: toEntityId(result.insertId) };
  } finally {
    connection.release();
  }
}

export async function updateAdminCouponTemplate(
  templateId: string,
  payload: UpdateAdminCouponTemplatePayload,
): Promise<UpdateAdminCouponTemplateResult> {
  const normalized = normalizeCouponTemplatePayload(payload);
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await fetchCouponTemplateById(connection, templateId);
    if (normalized.shopId) {
      await assertShopExists(connection, normalized.shopId);
    }

    await connection.execute(
      `
        UPDATE coupon_template
        SET
          name = ?,
          type = ?,
          status = ?,
          scope_type = ?,
          shop_id = ?,
          description = ?,
          min_amount = ?,
          discount_amount = ?,
          discount_rate = ?,
          max_discount_amount = ?,
          validity_type = ?,
          start_at = ?,
          end_at = ?,
          valid_days = ?,
          total_quantity = ?,
          user_limit = ?,
          updated_at = NOW(3)
        WHERE id = ?
      `,
      [
        normalized.name,
        normalized.typeCode,
        normalized.statusCode,
        normalized.scopeTypeCode,
        normalized.shopId,
        normalized.description,
        normalized.minAmount,
        normalized.discountAmount,
        normalized.discountRate,
        normalized.maxDiscountAmount,
        normalized.validityTypeCode,
        normalized.startAt,
        normalized.endAt,
        normalized.validDays,
        normalized.totalQuantity,
        normalized.userLimit,
        templateId,
      ],
    );

    return { id: toEntityId(templateId) };
  } finally {
    connection.release();
  }
}

export async function updateAdminCouponTemplateStatus(
  templateId: string,
  payload: UpdateAdminCouponTemplateStatusPayload,
): Promise<UpdateAdminCouponTemplateStatusResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await fetchCouponTemplateById(connection, templateId);
    const status = payload.status;

    await connection.execute(
      `
        UPDATE coupon_template
        SET status = ?, updated_at = NOW(3)
        WHERE id = ?
      `,
      [normalizeCouponTemplateStatus(status), templateId],
    );

    return {
      id: toEntityId(templateId),
      status,
    };
  } finally {
    connection.release();
  }
}
