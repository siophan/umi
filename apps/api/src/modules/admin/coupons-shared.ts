import { randomBytes } from 'node:crypto';
import type mysql from 'mysql2/promise';
import {
  toEntityId,
  type AdminCouponGrantBatchDisplayStatus,
  type AdminCouponGrantBatchItem,
  type AdminCouponGrantBatchListResult,
  type AdminCouponGrantAudience,
  type AdminCouponListResult,
  type AdminCouponTemplateDisplayStatus,
  type AdminCouponTemplateItem,
  type CreateAdminCouponTemplatePayload,
  type UpdateAdminCouponTemplatePayload,
  type UpdateAdminCouponTemplateStatusPayload,
} from '@umi/shared';

import { HttpError } from '../../lib/errors';

export const COUPON_TYPE_CASH = 10;
export const COUPON_TYPE_DISCOUNT = 20;
export const COUPON_TYPE_SHIPPING = 30;

export const COUPON_TEMPLATE_STATUS_ACTIVE = 10;
export const COUPON_TEMPLATE_STATUS_PAUSED = 20;
export const COUPON_TEMPLATE_STATUS_DISABLED = 90;

export const COUPON_SCOPE_PLATFORM = 10;
export const COUPON_SCOPE_SHOP = 20;

export const COUPON_VALIDITY_FIXED = 10;
export const COUPON_VALIDITY_RELATIVE = 20;

export const COUPON_SOURCE_ADMIN = 10;
export const COUPON_SOURCE_ACTIVITY = 20;
export const COUPON_SOURCE_COMPENSATION = 30;
export const COUPON_SOURCE_SYSTEM = 40;

export const COUPON_STATUS_UNUSED = 10;

export const GRANT_STATUS_PENDING = 10;
export const GRANT_STATUS_PROCESSING = 20;
export const GRANT_STATUS_COMPLETED = 30;
export const GRANT_STATUS_FAILED = 40;

export type CouponTemplateRow = {
  id: number | string;
  code: string;
  name: string;
  type: number | string | null;
  status: number | string | null;
  scope_type: number | string | null;
  shop_id: number | string | null;
  description: string | null;
  source_type: number | string | null;
  min_amount: number | string | null;
  discount_amount: number | string | null;
  discount_rate: number | string | null;
  max_discount_amount: number | string | null;
  validity_type: number | string | null;
  start_at: Date | string | null;
  end_at: Date | string | null;
  valid_days: number | string | null;
  total_quantity: number | string | null;
  user_limit: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  shop_name: string | null;
  batch_count: number | string | null;
  granted_count: number | string | null;
  last_batch_at: Date | string | null;
};

export type CouponGrantBatchRow = {
  id: number | string;
  batch_no: string;
  template_id: number | string | null;
  source_type: number | string | null;
  operator_id: number | string | null;
  operator_name: string | null;
  target_user_count: number | string | null;
  granted_count: number | string | null;
  status: number | string | null;
  note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type CouponListParams = {
  name?: string;
  code?: string;
  type?: CreateAdminCouponTemplatePayload['type'];
  scopeType?: CreateAdminCouponTemplatePayload['scopeType'];
  status?: AdminCouponTemplateDisplayStatus | 'all';
};

type NormalizedCouponTemplatePayload = {
  name: string;
  typeCode: number;
  scopeTypeCode: number;
  shopId: string | null;
  description: string | null;
  minAmount: number;
  discountAmount: number;
  discountRate: number | null;
  maxDiscountAmount: number;
  validityTypeCode: number;
  startAt: Date | null;
  endAt: Date | null;
  validDays: number;
  totalQuantity: number;
  userLimit: number;
  statusCode: number;
};

export function createNo(prefix: string) {
  return `${prefix}${randomBytes(6).toString('hex').toUpperCase()}`;
}

export function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function toIsoString(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export function trimOptionalText(value: string | null | undefined, maxLength = 255) {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function requireText(value: string | null | undefined, label: string, maxLength = 100) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new Error(`${label}不能为空`);
  }
  return trimmed.slice(0, maxLength);
}

function requireNonNegativeInteger(value: number | null | undefined, label: string) {
  if (!Number.isFinite(value) || value == null || value < 0) {
    throw new Error(`${label}不合法`);
  }
  return Math.round(value);
}

function normalizeCouponType(
  value: CreateAdminCouponTemplatePayload['type'] | UpdateAdminCouponTemplatePayload['type'],
) {
  if (value === 'cash' || value === 'discount' || value === 'shipping') {
    return value;
  }
  throw new Error('优惠券类型不合法');
}

function normalizeCouponScopeType(
  value:
    | CreateAdminCouponTemplatePayload['scopeType']
    | UpdateAdminCouponTemplatePayload['scopeType'],
) {
  if (value === 'platform' || value === 'shop') {
    return value;
  }
  throw new Error('适用范围不合法');
}

function normalizeCouponValidityType(
  value:
    | CreateAdminCouponTemplatePayload['validityType']
    | UpdateAdminCouponTemplatePayload['validityType'],
) {
  if (value === 'fixed' || value === 'relative') {
    return value;
  }
  throw new Error('有效期类型不合法');
}

export function normalizeCouponTemplateStatus(
  value:
    | CreateAdminCouponTemplatePayload['status']
    | UpdateAdminCouponTemplatePayload['status']
    | UpdateAdminCouponTemplateStatusPayload['status']
    | null
    | undefined,
) {
  if (value === 'paused') {
    return COUPON_TEMPLATE_STATUS_PAUSED;
  }
  if (value === 'disabled') {
    return COUPON_TEMPLATE_STATUS_DISABLED;
  }
  return COUPON_TEMPLATE_STATUS_ACTIVE;
}

export function mapCouponType(
  type: number | string | null | undefined,
): AdminCouponTemplateItem['type'] {
  const code = toNumber(type);
  if (code === COUPON_TYPE_DISCOUNT) {
    return 'discount';
  }
  if (code === COUPON_TYPE_SHIPPING) {
    return 'shipping';
  }
  return 'cash';
}

function mapCouponTypeLabel(type: AdminCouponTemplateItem['type']) {
  if (type === 'discount') {
    return '折扣券';
  }
  if (type === 'shipping') {
    return '运费券';
  }
  return '满减券';
}

function mapCouponScopeType(
  scopeType: number | string | null | undefined,
): AdminCouponTemplateItem['scopeType'] {
  return toNumber(scopeType) === COUPON_SCOPE_SHOP ? 'shop' : 'platform';
}

function mapCouponScopeTypeLabel(scopeType: AdminCouponTemplateItem['scopeType']) {
  return scopeType === 'shop' ? '指定店铺' : '平台通用';
}

export function mapCouponValidityType(
  validityType: number | string | null | undefined,
): AdminCouponTemplateItem['validityType'] {
  return toNumber(validityType) === COUPON_VALIDITY_RELATIVE ? 'relative' : 'fixed';
}

function mapCouponValidityTypeLabel(validityType: AdminCouponTemplateItem['validityType']) {
  return validityType === 'relative' ? '领取后 N 天' : '固定时间段';
}

function mapCouponSourceType(
  sourceType: number | string | null | undefined,
): AdminCouponTemplateItem['sourceType'] {
  const code = toNumber(sourceType);
  if (code === COUPON_SOURCE_ACTIVITY) {
    return 'activity';
  }
  if (code === COUPON_SOURCE_COMPENSATION) {
    return 'compensation';
  }
  if (code === COUPON_SOURCE_SYSTEM) {
    return 'system';
  }
  return 'admin';
}

function mapCouponSourceTypeLabel(sourceType: AdminCouponTemplateItem['sourceType']) {
  if (sourceType === 'activity') {
    return '活动发放';
  }
  if (sourceType === 'compensation') {
    return '补偿发放';
  }
  if (sourceType === 'system') {
    return '系统发放';
  }
  return '后台人工';
}

export function mapCouponRawStatus(
  status: number | string | null | undefined,
): AdminCouponTemplateItem['rawStatus'] {
  const code = toNumber(status);
  if (code === COUPON_TEMPLATE_STATUS_PAUSED) {
    return 'paused';
  }
  if (code === COUPON_TEMPLATE_STATUS_DISABLED) {
    return 'disabled';
  }
  return 'active';
}

function getCouponDisplayStatus(
  rawStatus: AdminCouponTemplateItem['rawStatus'],
  validityType: AdminCouponTemplateItem['validityType'],
  startAt: string | null,
  endAt: string | null,
): { key: AdminCouponTemplateDisplayStatus; label: AdminCouponTemplateItem['statusLabel'] } {
  if (rawStatus === 'paused') {
    return { key: 'paused', label: '已暂停' };
  }
  if (rawStatus === 'disabled') {
    return { key: 'disabled', label: '已停用' };
  }
  if (validityType === 'fixed') {
    const now = Date.now();
    const startTime = startAt ? new Date(startAt).getTime() : null;
    const endTime = endAt ? new Date(endAt).getTime() : null;

    if (endTime != null && endTime < now) {
      return { key: 'ended', label: '已结束' };
    }
    if (startTime != null && startTime > now) {
      return { key: 'scheduled', label: '待开始' };
    }
  }

  return { key: 'active', label: '启用' };
}

function mapGrantStatus(
  status: number | string | null | undefined,
): AdminCouponGrantBatchDisplayStatus {
  const code = toNumber(status);
  if (code === GRANT_STATUS_PROCESSING) {
    return 'processing';
  }
  if (code === GRANT_STATUS_COMPLETED) {
    return 'completed';
  }
  if (code === GRANT_STATUS_FAILED) {
    return 'failed';
  }
  return 'pending';
}

function mapGrantStatusLabel(status: AdminCouponGrantBatchDisplayStatus) {
  if (status === 'processing') {
    return '执行中';
  }
  if (status === 'completed') {
    return '已完成';
  }
  if (status === 'failed') {
    return '已失败';
  }
  return '待执行';
}

function mapGrantSourceType(
  sourceType: number | string | null | undefined,
): AdminCouponGrantBatchItem['sourceType'] {
  const code = toNumber(sourceType);
  if (code === COUPON_SOURCE_ACTIVITY) {
    return 'activity';
  }
  if (code === COUPON_SOURCE_COMPENSATION) {
    return 'compensation';
  }
  if (code === COUPON_SOURCE_SYSTEM) {
    return 'system';
  }
  return 'admin';
}

function mapGrantSourceTypeLabel(sourceType: AdminCouponGrantBatchItem['sourceType']) {
  if (sourceType === 'activity') {
    return '活动发放';
  }
  if (sourceType === 'compensation') {
    return '补偿发放';
  }
  if (sourceType === 'system') {
    return '系统发放';
  }
  return '后台人工';
}

function formatAmountText(amountInCents: number) {
  const amount = amountInCents / 100;
  return Number.isInteger(amount) ? `${amount}` : amount.toFixed(2);
}

function buildCouponCondition(minAmountInCents: number) {
  if (minAmountInCents <= 0) {
    return '无门槛';
  }
  return `满${formatAmountText(minAmountInCents)}可用`;
}

export function sanitizeCouponTemplate(row: CouponTemplateRow): AdminCouponTemplateItem {
  const type = mapCouponType(row.type);
  const scopeType = mapCouponScopeType(row.scope_type);
  const validityType = mapCouponValidityType(row.validity_type);
  const rawStatus = mapCouponRawStatus(row.status);
  const startAt = toIsoString(row.start_at);
  const endAt = toIsoString(row.end_at);
  const displayStatus = getCouponDisplayStatus(rawStatus, validityType, startAt, endAt);
  const totalQuantity = toNumber(row.total_quantity);
  const grantedCount = toNumber(row.granted_count);

  return {
    id: toEntityId(row.id),
    code: row.code,
    name: row.name,
    type,
    typeLabel: mapCouponTypeLabel(type),
    rawStatus,
    status: displayStatus.key,
    statusLabel: displayStatus.label,
    scopeType,
    scopeTypeLabel: mapCouponScopeTypeLabel(scopeType),
    shopId: row.shop_id == null ? null : toEntityId(row.shop_id),
    shopName: row.shop_name,
    description: row.description,
    sourceType: mapCouponSourceType(row.source_type),
    sourceTypeLabel: mapCouponSourceTypeLabel(mapCouponSourceType(row.source_type)),
    minAmount: toNumber(row.min_amount),
    discountAmount: toNumber(row.discount_amount),
    discountRate: row.discount_rate == null ? null : Number(row.discount_rate),
    maxDiscountAmount: toNumber(row.max_discount_amount),
    validityType,
    validityTypeLabel: mapCouponValidityTypeLabel(validityType),
    startAt,
    endAt,
    validDays: toNumber(row.valid_days),
    totalQuantity,
    userLimit: toNumber(row.user_limit),
    grantedCount,
    remainingQuantity: totalQuantity < 0 ? null : Math.max(totalQuantity - grantedCount, 0),
    batchCount: toNumber(row.batch_count),
    lastBatchAt: toIsoString(row.last_batch_at),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function sanitizeCouponGrantBatch(row: CouponGrantBatchRow): AdminCouponGrantBatchItem {
  const status = mapGrantStatus(row.status);
  const sourceType = mapGrantSourceType(row.source_type);

  return {
    id: toEntityId(row.id),
    batchNo: row.batch_no,
    templateId: row.template_id == null ? null : toEntityId(row.template_id),
    sourceType,
    sourceTypeLabel: mapGrantSourceTypeLabel(sourceType),
    operatorId: row.operator_id == null ? null : toEntityId(row.operator_id),
    operatorName: row.operator_name ?? null,
    targetUserCount: toNumber(row.target_user_count),
    grantedCount: toNumber(row.granted_count),
    status,
    statusLabel: mapGrantStatusLabel(status),
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function mapCouponTypeCode(type: CreateAdminCouponTemplatePayload['type']) {
  if (type === 'discount') {
    return COUPON_TYPE_DISCOUNT;
  }
  if (type === 'shipping') {
    return COUPON_TYPE_SHIPPING;
  }
  return COUPON_TYPE_CASH;
}

function mapCouponScopeTypeCode(scopeType: CreateAdminCouponTemplatePayload['scopeType']) {
  return scopeType === 'shop' ? COUPON_SCOPE_SHOP : COUPON_SCOPE_PLATFORM;
}

function mapCouponValidityTypeCode(
  validityType: CreateAdminCouponTemplatePayload['validityType'],
) {
  return validityType === 'relative' ? COUPON_VALIDITY_RELATIVE : COUPON_VALIDITY_FIXED;
}

export function normalizeCouponTemplatePayload(
  payload: CreateAdminCouponTemplatePayload | UpdateAdminCouponTemplatePayload,
): NormalizedCouponTemplatePayload {
  const name = requireText(payload.name, '优惠券名称');
  const type = normalizeCouponType(payload.type);
  const scopeType = normalizeCouponScopeType(payload.scopeType);
  const validityType = normalizeCouponValidityType(payload.validityType);
  const minAmount = requireNonNegativeInteger(payload.minAmount, '使用门槛');
  const totalQuantity = Math.round(Number(payload.totalQuantity ?? -1));
  const userLimit = Math.round(Number(payload.userLimit ?? 1));

  if (!Number.isFinite(totalQuantity) || totalQuantity === 0 || totalQuantity < -1) {
    throw new Error('发放数量不合法');
  }
  if (!Number.isFinite(userLimit) || userLimit < 1) {
    throw new Error('每人限领数量不合法');
  }

  const normalized: NormalizedCouponTemplatePayload = {
    name,
    typeCode: mapCouponTypeCode(type),
    scopeTypeCode: mapCouponScopeTypeCode(scopeType),
    shopId:
      scopeType === 'shop'
        ? requireText(payload.shopId ? String(payload.shopId) : '', '指定店铺 ID', 20)
        : null,
    description: trimOptionalText(payload.description),
    minAmount,
    discountAmount: 0,
    discountRate: null,
    maxDiscountAmount: 0,
    validityTypeCode: mapCouponValidityTypeCode(validityType),
    startAt: null,
    endAt: null,
    validDays: 0,
    totalQuantity,
    userLimit,
    statusCode: normalizeCouponTemplateStatus(payload.status),
  };

  if (type === 'discount') {
    const discountRate = Number(payload.discountRate ?? 0);
    if (!Number.isFinite(discountRate) || discountRate <= 0 || discountRate > 10) {
      throw new Error('折扣需填写 0 到 10 之间的数值');
    }
    normalized.discountRate = Number(discountRate.toFixed(2));
    normalized.maxDiscountAmount = requireNonNegativeInteger(
      payload.maxDiscountAmount ?? 0,
      '最高优惠金额',
    );
  } else {
    normalized.discountAmount = requireNonNegativeInteger(
      payload.discountAmount,
      type === 'shipping' ? '减免金额' : '优惠金额',
    );
  }

  if (validityType === 'fixed') {
    const startAt = payload.startAt ? new Date(payload.startAt) : null;
    const endAt = payload.endAt ? new Date(payload.endAt) : null;
    if (!startAt || Number.isNaN(startAt.getTime())) {
      throw new Error('开始时间不能为空');
    }
    if (!endAt || Number.isNaN(endAt.getTime())) {
      throw new Error('结束时间不能为空');
    }
    if (startAt.getTime() > endAt.getTime()) {
      throw new Error('结束时间不能早于开始时间');
    }
    normalized.startAt = startAt;
    normalized.endAt = endAt;
  } else {
    const validDays = Math.round(Number(payload.validDays ?? 0));
    if (!Number.isFinite(validDays) || validDays < 1) {
      throw new Error('领取后有效天数不合法');
    }
    normalized.validDays = validDays;
  }

  return normalized;
}

export async function assertShopExists(connection: mysql.PoolConnection, shopId: string) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM shop WHERE id = ? LIMIT 1',
    [shopId],
  );

  if ((rows as Array<{ id?: number | string }>).length === 0) {
    throw new HttpError(404, 'ADMIN_COUPON_SHOP_NOT_FOUND', '指定店铺不存在');
  }
}

export function buildCouponListWhere(params: CouponListParams) {
  const clauses: string[] = [];
  const values: Array<string | number> = [];

  if (params.name?.trim()) {
    clauses.push('ct.name LIKE ?');
    values.push(`%${params.name.trim()}%`);
  }

  if (params.code?.trim()) {
    clauses.push('ct.code LIKE ?');
    values.push(`%${params.code.trim()}%`);
  }

  if (params.type) {
    clauses.push('ct.type = ?');
    values.push(mapCouponTypeCode(params.type));
  }

  if (params.scopeType) {
    clauses.push('ct.scope_type = ?');
    values.push(mapCouponScopeTypeCode(params.scopeType));
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

export async function fetchCouponTemplateById(
  connection: mysql.PoolConnection,
  templateId: string,
) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
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
      WHERE ct.id = ?
      LIMIT 1
    `,
    [templateId],
  );

  const row = (rows as CouponTemplateRow[])[0];
  if (!row) {
    throw new HttpError(404, 'ADMIN_COUPON_TEMPLATE_NOT_FOUND', '优惠券模板不存在');
  }

  return row;
}

export function buildCouponAmountForIssuedCoupon(template: CouponTemplateRow) {
  const type = mapCouponType(template.type);
  if (type === 'discount') {
    return Math.round(Number(template.discount_rate ?? 0) * 10);
  }
  return toNumber(template.discount_amount);
}

function buildCouponConditionForIssuedCoupon(template: CouponTemplateRow) {
  return buildCouponCondition(toNumber(template.min_amount));
}

export function buildIssuedCouponCondition(template: CouponTemplateRow) {
  return buildCouponConditionForIssuedCoupon(template);
}

export async function fetchCouponRecipientIds(
  connection: mysql.PoolConnection,
  audience: AdminCouponGrantAudience,
) {
  if (audience === 'order_users') {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT DISTINCT o.user_id AS user_id
        FROM \`order\` o
        INNER JOIN user u ON u.id = o.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `,
    );

    return (rows as Array<{ user_id?: number | string | null }>)
      .map((row) => row.user_id)
      .filter((value): value is number | string => value != null)
      .map((value) => String(value));
  }

  if (audience === 'guess_users') {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT DISTINCT gb.user_id AS user_id
        FROM guess_bet gb
        INNER JOIN user u ON u.id = gb.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `,
    );

    return (rows as Array<{ user_id?: number | string | null }>)
      .map((row) => row.user_id)
      .filter((value): value is number | string => value != null)
      .map((value) => String(value));
  }

  if (audience === 'shop_users') {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT DISTINCT s.user_id AS user_id
        FROM shop s
        INNER JOIN user u ON u.id = s.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `,
    );

    return (rows as Array<{ user_id?: number | string | null }>)
      .map((row) => row.user_id)
      .filter((value): value is number | string => value != null)
      .map((value) => String(value));
  }

  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM user
      WHERE COALESCE(banned, 0) = 0
    `,
  );

  return (rows as Array<{ id?: number | string | null }>)
    .map((row) => row.id)
    .filter((value): value is number | string => value != null)
    .map((value) => String(value));
}

export function getCouponGrantExpiryAt(template: CouponTemplateRow) {
  const validityType = mapCouponValidityType(template.validity_type);
  if (validityType === 'relative') {
    const days = Math.max(1, toNumber(template.valid_days));
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  const endAt = template.end_at ? new Date(template.end_at) : null;
  if (!endAt || Number.isNaN(endAt.getTime())) {
    throw new HttpError(400, 'ADMIN_COUPON_TEMPLATE_INVALID', '固定有效期模板缺少结束时间');
  }
  return endAt;
}
