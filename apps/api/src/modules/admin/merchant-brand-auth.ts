import type mysql from 'mysql2/promise';
import { toEntityId } from '@umi/shared';
import type {
  RevokeAdminBrandAuthRecordResult,
  ReviewAdminBrandAuthApplyPayload,
  ReviewAdminBrandAuthApplyResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  AUTH_SCOPE_ALL_BRAND,
  AUTH_SCOPE_CATEGORY_ONLY,
  AUTH_SCOPE_PRODUCT_ONLY,
  AUTH_STATUS_ACTIVE,
  AUTH_STATUS_REVOKED,
  AUTH_TYPE_NORMAL,
  BrandAuthApplyListRow,
  BrandAuthListRow,
  buildUserDisplayName,
  createNo,
  ensurePendingReview,
  mapAuthScope,
  mapAuthStatus,
  mapAuthType,
  mapReviewStatus,
  normalizeRejectReason,
  normalizeReviewStatus,
  parseJsonValue,
  PRODUCT_STATUS_ACTIVE,
  PRODUCT_STATUS_OFF_SHELF,
  summarizeByKey,
  toIso,
} from './merchant-shared';

function normalizeScopeIdTokens(value: unknown): string[] {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeScopeIdTokens(item));
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? [String(value)] : [];
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) {
      return [];
    }
    return text
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const scopedKeyCandidates = ['categoryId', 'categoryIds', 'productId', 'productIds', 'brandProductId', 'brandProductIds', 'id', 'ids', 'value', 'values'];
    const matchedValues = scopedKeyCandidates
      .filter((key) => Object.prototype.hasOwnProperty.call(record, key))
      .map((key) => record[key]);

    if (matchedValues.length > 0) {
      return matchedValues.flatMap((item) => normalizeScopeIdTokens(item));
    }

    return Object.values(record).flatMap((item) =>
      typeof item === 'object' ? normalizeScopeIdTokens(item) : [],
    );
  }
  return [];
}

function extractScopedAuthIds(scopeValue: unknown): string[] {
  return Array.from(
    new Set(
      normalizeScopeIdTokens(scopeValue).filter((item) => item.length > 0),
    ),
  );
}

async function listBrandAuthRecordsInternal() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        sba.id,
        sba.auth_no,
        sba.shop_id,
        s.name AS shop_name,
        up.name AS owner_name,
        u.phone_number AS owner_phone,
        sba.brand_id,
        b.name AS brand_name,
        sba.auth_type,
        sba.auth_scope,
        sba.scope_value,
        sba.status,
        sba.granted_at,
        sba.expire_at,
        sba.expired_at,
        sba.created_at,
        sba.updated_at
      FROM shop_brand_auth sba
      LEFT JOIN shop s ON s.id = sba.shop_id
      LEFT JOIN user u ON u.id = s.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN brand b ON b.id = sba.brand_id
      ORDER BY sba.created_at DESC, sba.id DESC
    `,
  );

  return (rows as BrandAuthListRow[]).map((row) => {
    const authType = mapAuthType(row.auth_type);
    const authScope = mapAuthScope(row.auth_scope);
    const status = mapAuthStatus(row.status);
    const shopName = row.shop_name ?? '未知店铺';
    const brandName = row.brand_name ?? '未知品牌';

    return {
      id: String(row.id),
      authNo: row.auth_no,
      shopId: String(row.shop_id),
      shopName,
      ownerName: buildUserDisplayName(row.owner_name, row.owner_phone),
      ownerPhone: row.owner_phone ?? null,
      brandId: String(row.brand_id),
      brandName,
      subject: `${brandName} -> ${shopName}`,
      authType: authType.key,
      authTypeLabel: authType.label,
      authScope: authScope.key,
      authScopeLabel: authScope.label,
      scopeValue: parseJsonValue(row.scope_value),
      status: status.key,
      statusLabel: status.label,
      grantedAt: toIso(row.granted_at),
      expireAt: toIso(row.expire_at),
      expiredAt: toIso(row.expired_at),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      operatorName: null as string | null,
    };
  });
}

export async function getAdminBrandAuthApplies() {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        sbaa.id,
        sbaa.apply_no,
        sbaa.shop_id,
        s.name AS shop_name,
        up.name AS owner_name,
        u.phone_number AS owner_phone,
        sbaa.brand_id,
        b.name AS brand_name,
        sbaa.reason,
        sbaa.license,
        sbaa.status,
        sbaa.reject_reason,
        sbaa.reviewed_at,
        sbaa.created_at
      FROM shop_brand_auth_apply sbaa
      LEFT JOIN shop s ON s.id = sbaa.shop_id
      LEFT JOIN user u ON u.id = s.user_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN brand b ON b.id = sbaa.brand_id
      ORDER BY sbaa.created_at DESC, sbaa.id DESC
    `,
  );

  const items = (rows as BrandAuthApplyListRow[]).map((row) => {
    const status = mapReviewStatus(row.status);
    return {
      id: String(row.id),
      applyNo: row.apply_no,
      shopId: String(row.shop_id),
      shopName: row.shop_name ?? '未知店铺',
      ownerName: buildUserDisplayName(row.owner_name, row.owner_phone),
      ownerPhone: row.owner_phone ?? null,
      brandId: String(row.brand_id),
      brandName: row.brand_name ?? '未知品牌',
      reason: row.reason ?? null,
      license: row.license ?? null,
      status: status.key,
      statusLabel: status.label,
      rejectReason: row.reject_reason ?? null,
      reviewedAt: toIso(row.reviewed_at),
      submittedAt: toIso(row.created_at),
      scope: null as string | null,
    };
  });

  return {
    items,
    summary: {
      total: items.length,
      byStatus: summarizeByKey(items, 'status'),
    },
  };
}

export async function getAdminBrandAuthRecords() {
  const items = await listBrandAuthRecordsInternal();
  return {
    items,
    summary: {
      total: items.length,
      byStatus: summarizeByKey(items, 'status'),
    },
  };
}

export async function reviewAdminBrandAuthApply(
  applyId: string,
  payload: ReviewAdminBrandAuthApplyPayload,
): Promise<ReviewAdminBrandAuthApplyResult> {
  const status = normalizeReviewStatus(payload.status);
  const rejectReason = normalizeRejectReason(status, payload.rejectReason);
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [applyRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, shop_id, brand_id, status
        FROM shop_brand_auth_apply
        WHERE id = ?
        LIMIT 1
      `,
      [applyId],
    );
    const apply = applyRows[0] as {
      id: number | string;
      shop_id: number | string;
      brand_id: number | string;
      status: number | string;
    } | undefined;

    if (!apply) {
      throw new Error('品牌授权申请不存在');
    }
    ensurePendingReview(apply.status);

    if (status === 'approved') {
      const [authRows] = await connection.execute<mysql.RowDataPacket[]>(
        `
          SELECT id
          FROM shop_brand_auth
          WHERE shop_id = ?
            AND brand_id = ?
          ORDER BY CASE WHEN status = ${AUTH_STATUS_ACTIVE} THEN 0 ELSE 1 END, id DESC
          LIMIT 1
        `,
        [apply.shop_id, apply.brand_id],
      );
      const auth = authRows[0] as { id?: number | string } | undefined;

      if (auth?.id) {
        await connection.execute(
          `
            UPDATE shop_brand_auth
            SET
              auth_type = ?,
              auth_scope = ?,
              scope_value = NULL,
              status = ?,
              granted_at = CURRENT_TIMESTAMP(3),
              expire_at = NULL,
              expired_at = NULL,
              updated_at = CURRENT_TIMESTAMP(3)
            WHERE id = ?
          `,
          [AUTH_TYPE_NORMAL, AUTH_SCOPE_ALL_BRAND, AUTH_STATUS_ACTIVE, auth.id],
        );
      } else {
        await connection.execute(
          `
            INSERT INTO shop_brand_auth (
              auth_no,
              shop_id,
              brand_id,
              auth_type,
              auth_scope,
              scope_value,
              status,
              granted_at,
              expire_at,
              expired_at,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, NULL, ?, CURRENT_TIMESTAMP(3), NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
          `,
          [
            createNo('SBA'),
            apply.shop_id,
            apply.brand_id,
            AUTH_TYPE_NORMAL,
            AUTH_SCOPE_ALL_BRAND,
            AUTH_STATUS_ACTIVE,
          ],
        );
      }
    }

    await connection.execute(
      `
        UPDATE shop_brand_auth_apply
        SET
          status = ?,
          reject_reason = ?,
          reviewed_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [status === 'approved' ? 30 : 40, rejectReason, applyId],
    );

    await connection.commit();
    return { id: toEntityId(apply.id), status };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function revokeAdminBrandAuthRecord(
  authId: string,
): Promise<RevokeAdminBrandAuthRecordResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [authRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, shop_id, brand_id, auth_scope, scope_value, status
        FROM shop_brand_auth
        WHERE id = ?
        LIMIT 1
      `,
      [authId],
    );

    const auth = authRows[0] as
      | {
          id: number | string;
          shop_id: number | string;
          brand_id: number | string;
          auth_scope: number | string;
          scope_value: unknown;
          status: number | string;
        }
      | undefined;

    if (!auth) {
      throw new Error('品牌授权记录不存在');
    }

    if (Number(auth.status ?? 0) !== AUTH_STATUS_ACTIVE) {
      throw new Error('当前授权不可撤销');
    }

    const authScopeCode = Number(auth.auth_scope ?? 0);
    const scopedIds =
      authScopeCode === AUTH_SCOPE_ALL_BRAND
        ? []
        : extractScopedAuthIds(parseJsonValue(auth.scope_value));

    if (authScopeCode !== AUTH_SCOPE_ALL_BRAND && scopedIds.length === 0) {
      throw new Error('当前授权范围数据不合法');
    }

    await connection.execute(
      `
        UPDATE shop_brand_auth
        SET
          status = ?,
          expired_at = CURRENT_TIMESTAMP(3),
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [AUTH_STATUS_REVOKED, authId],
    );

    if (authScopeCode === AUTH_SCOPE_ALL_BRAND) {
      await connection.execute(
        `
          UPDATE product p
          INNER JOIN brand_product bp ON bp.id = p.brand_product_id
          SET
            p.status = ?,
            p.updated_at = CURRENT_TIMESTAMP(3)
          WHERE p.shop_id = ?
            AND bp.brand_id = ?
            AND p.status = ?
        `,
        [PRODUCT_STATUS_OFF_SHELF, auth.shop_id, auth.brand_id, PRODUCT_STATUS_ACTIVE],
      );
    } else if (authScopeCode === AUTH_SCOPE_CATEGORY_ONLY) {
      const placeholders = scopedIds.map(() => '?').join(', ');
      await connection.execute(
        `
          UPDATE product p
          INNER JOIN brand_product bp ON bp.id = p.brand_product_id
          SET
            p.status = ?,
            p.updated_at = CURRENT_TIMESTAMP(3)
          WHERE p.shop_id = ?
            AND bp.brand_id = ?
            AND p.status = ?
            AND bp.category_id IN (${placeholders})
        `,
        [
          PRODUCT_STATUS_OFF_SHELF,
          auth.shop_id,
          auth.brand_id,
          PRODUCT_STATUS_ACTIVE,
          ...scopedIds,
        ],
      );
    } else if (authScopeCode === AUTH_SCOPE_PRODUCT_ONLY) {
      const placeholders = scopedIds.map(() => '?').join(', ');
      await connection.execute(
        `
          UPDATE product p
          INNER JOIN brand_product bp ON bp.id = p.brand_product_id
          SET
            p.status = ?,
            p.updated_at = CURRENT_TIMESTAMP(3)
          WHERE p.shop_id = ?
            AND bp.brand_id = ?
            AND p.status = ?
            AND (p.id IN (${placeholders}) OR p.brand_product_id IN (${placeholders}))
        `,
        [
          PRODUCT_STATUS_OFF_SHELF,
          auth.shop_id,
          auth.brand_id,
          PRODUCT_STATUS_ACTIVE,
          ...scopedIds,
          ...scopedIds,
        ],
      );
    } else {
      throw new Error('当前授权范围数据不合法');
    }

    await connection.commit();
    return { id: toEntityId(auth.id), status: 'revoked' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
