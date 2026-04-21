import type mysql from 'mysql2/promise';
import {
  toEntityId,
  type AdminCouponGrantBatchListResult,
  type CreateAdminCouponGrantBatchPayload,
  type CreateAdminCouponGrantBatchResult,
} from '@umi/shared';

import { HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
import {
  COUPON_SOURCE_ADMIN,
  COUPON_STATUS_UNUSED,
  GRANT_STATUS_COMPLETED,
  GRANT_STATUS_PROCESSING,
  CouponGrantBatchRow,
  buildCouponAmountForIssuedCoupon,
  buildIssuedCouponCondition,
  createNo,
  fetchCouponRecipientIds,
  fetchCouponTemplateById,
  getCouponGrantExpiryAt,
  sanitizeCouponGrantBatch,
  sanitizeCouponTemplate,
  toNumber,
  trimOptionalText,
} from './coupons-shared';

export async function getAdminCouponGrantBatches(
  templateId: string,
): Promise<AdminCouponGrantBatchListResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await fetchCouponTemplateById(connection, templateId);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          b.id,
          b.batch_no,
          b.template_id,
          b.source_type,
          b.operator_id,
          COALESCE(au.display_name, au.username) AS operator_name,
          b.target_user_count,
          b.granted_count,
          b.status,
          b.note,
          b.created_at,
          b.updated_at
        FROM coupon_grant_batch b
        LEFT JOIN admin_user au ON au.id = b.operator_id
        WHERE b.template_id = ?
        ORDER BY b.created_at DESC, b.id DESC
        LIMIT 20
      `,
      [templateId],
    );

    return {
      items: (rows as CouponGrantBatchRow[]).map((row) => sanitizeCouponGrantBatch(row)),
    };
  } finally {
    connection.release();
  }
}

export async function createAdminCouponGrantBatch(
  templateId: string,
  operatorId: string,
  payload: CreateAdminCouponGrantBatchPayload,
): Promise<CreateAdminCouponGrantBatchResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const templateRow = await fetchCouponTemplateById(connection, templateId);
    const template = sanitizeCouponTemplate(templateRow);
    if (template.rawStatus === 'paused') {
      throw new HttpError(400, 'ADMIN_COUPON_TEMPLATE_PAUSED', '已暂停模板不允许发券');
    }
    if (template.rawStatus === 'disabled') {
      throw new HttpError(400, 'ADMIN_COUPON_TEMPLATE_DISABLED', '已停用模板不允许发券');
    }
    if (template.status === 'ended') {
      throw new HttpError(400, 'ADMIN_COUPON_TEMPLATE_ENDED', '已结束模板不允许发券');
    }

    const targetUserIds = await fetchCouponRecipientIds(connection, payload.audience);
    if (targetUserIds.length === 0) {
      throw new HttpError(400, 'ADMIN_COUPON_GRANT_EMPTY_AUDIENCE', '当前人群没有可发券用户');
    }

    const placeholders = targetUserIds.map(() => '?').join(',');
    const [existingRows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT user_id, COUNT(*) AS coupon_count
        FROM coupon
        WHERE template_id = ? AND user_id IN (${placeholders})
        GROUP BY user_id
      `,
      [templateId, ...targetUserIds],
    );
    const existingByUser = new Map(
      (existingRows as Array<{ user_id: number | string; coupon_count: number | string }>)
        .map((row) => [String(row.user_id), toNumber(row.coupon_count)]),
    );

    const eligibleUserIds = targetUserIds.filter(
      (userId) => (existingByUser.get(userId) ?? 0) < template.userLimit,
    );

    if (eligibleUserIds.length === 0) {
      throw new HttpError(400, 'ADMIN_COUPON_GRANT_LIMIT_REACHED', '目标用户都已达到限领数量');
    }

    if (template.totalQuantity >= 0) {
      const remaining = Math.max(template.totalQuantity - template.grantedCount, 0);
      if (remaining <= 0) {
        throw new HttpError(400, 'ADMIN_COUPON_GRANT_OUT_OF_STOCK', '优惠券库存不足');
      }
      if (eligibleUserIds.length > remaining) {
        throw new HttpError(
          400,
          'ADMIN_COUPON_GRANT_OUT_OF_STOCK',
          `优惠券剩余库存不足，当前仅剩 ${remaining} 张`,
        );
      }
    }

    const [batchResult] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO coupon_grant_batch (
          batch_no,
          template_id,
          source_type,
          operator_id,
          target_user_count,
          granted_count,
          status,
          note,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
      `,
      [
        createNo('BCH'),
        templateId,
        COUPON_SOURCE_ADMIN,
        operatorId,
        targetUserIds.length,
        0,
        GRANT_STATUS_PROCESSING,
        trimOptionalText(payload.note),
      ],
    );

    const batchId = String(batchResult.insertId);
    const expireAt = getCouponGrantExpiryAt(templateRow);
    const couponAmount = buildCouponAmountForIssuedCoupon(templateRow);
    const condition = buildIssuedCouponCondition(templateRow);
    const issuedAt = new Date();

    const couponRows = eligibleUserIds.map((userId) => [
      createNo('CPN'),
      userId,
      templateId,
      batchId,
      templateRow.name,
      couponAmount,
      templateRow.type,
      condition,
      expireAt,
      COUPON_SOURCE_ADMIN,
      COUPON_STATUS_UNUSED,
      issuedAt,
      issuedAt,
      issuedAt,
      issuedAt,
    ]);

    await connection.query(
      `
        INSERT INTO coupon (
          coupon_no,
          user_id,
          template_id,
          grant_batch_id,
          name,
          amount,
          type,
          \`condition\`,
          expire_at,
          source_type,
          status,
          claimed_at,
          used_at,
          created_at,
          updated_at
        ) VALUES ?
      `,
      [couponRows],
    );

    await connection.execute(
      `
        UPDATE coupon_grant_batch
        SET granted_count = ?, status = ?, updated_at = NOW(3)
        WHERE id = ?
      `,
      [eligibleUserIds.length, GRANT_STATUS_COMPLETED, batchId],
    );

    await connection.commit();

    return {
      id: toEntityId(batchId),
      grantedCount: eligibleUserIds.length,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
