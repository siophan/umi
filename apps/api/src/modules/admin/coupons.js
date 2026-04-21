import { randomBytes } from 'node:crypto';
import { toEntityId, } from '@umi/shared';
import { HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
const COUPON_TYPE_CASH = 10;
const COUPON_TYPE_DISCOUNT = 20;
const COUPON_TYPE_SHIPPING = 30;
const COUPON_TEMPLATE_STATUS_ACTIVE = 10;
const COUPON_TEMPLATE_STATUS_PAUSED = 20;
const COUPON_TEMPLATE_STATUS_DISABLED = 90;
const COUPON_SCOPE_PLATFORM = 10;
const COUPON_SCOPE_SHOP = 20;
const COUPON_VALIDITY_FIXED = 10;
const COUPON_VALIDITY_RELATIVE = 20;
const COUPON_SOURCE_ADMIN = 10;
const COUPON_SOURCE_ACTIVITY = 20;
const COUPON_SOURCE_COMPENSATION = 30;
const COUPON_SOURCE_SYSTEM = 40;
const COUPON_STATUS_UNUSED = 10;
const GRANT_STATUS_PENDING = 10;
const GRANT_STATUS_PROCESSING = 20;
const GRANT_STATUS_COMPLETED = 30;
const GRANT_STATUS_FAILED = 40;
function createNo(prefix) {
    return `${prefix}${randomBytes(6).toString('hex').toUpperCase()}`;
}
function toNumber(value) {
    return Number(value ?? 0);
}
function toNullableNumber(value) {
    if (value == null) {
        return null;
    }
    return Number(value);
}
function toIsoString(value) {
    return value ? new Date(value).toISOString() : null;
}
function trimOptionalText(value, maxLength = 255) {
    const trimmed = value?.trim() ?? '';
    return trimmed ? trimmed.slice(0, maxLength) : null;
}
function requireText(value, label, maxLength = 100) {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        throw new Error(`${label}不能为空`);
    }
    return trimmed.slice(0, maxLength);
}
function requireNonNegativeInteger(value, label) {
    if (!Number.isFinite(value) || value == null || value < 0) {
        throw new Error(`${label}不合法`);
    }
    return Math.round(value);
}
function normalizeCouponType(value) {
    if (value === 'cash' || value === 'discount' || value === 'shipping') {
        return value;
    }
    throw new Error('优惠券类型不合法');
}
function normalizeCouponScopeType(value) {
    if (value === 'platform' || value === 'shop') {
        return value;
    }
    throw new Error('适用范围不合法');
}
function normalizeCouponValidityType(value) {
    if (value === 'fixed' || value === 'relative') {
        return value;
    }
    throw new Error('有效期类型不合法');
}
function normalizeCouponTemplateStatus(value) {
    if (value === 'paused') {
        return COUPON_TEMPLATE_STATUS_PAUSED;
    }
    if (value === 'disabled') {
        return COUPON_TEMPLATE_STATUS_DISABLED;
    }
    return COUPON_TEMPLATE_STATUS_ACTIVE;
}
function mapCouponType(type) {
    const code = toNumber(type);
    if (code === COUPON_TYPE_DISCOUNT) {
        return 'discount';
    }
    if (code === COUPON_TYPE_SHIPPING) {
        return 'shipping';
    }
    return 'cash';
}
function mapCouponTypeLabel(type) {
    if (type === 'discount') {
        return '折扣券';
    }
    if (type === 'shipping') {
        return '运费券';
    }
    return '满减券';
}
function mapCouponScopeType(scopeType) {
    return toNumber(scopeType) === COUPON_SCOPE_SHOP ? 'shop' : 'platform';
}
function mapCouponScopeTypeLabel(scopeType) {
    return scopeType === 'shop' ? '指定店铺' : '平台通用';
}
function mapCouponValidityType(validityType) {
    return toNumber(validityType) === COUPON_VALIDITY_RELATIVE ? 'relative' : 'fixed';
}
function mapCouponValidityTypeLabel(validityType) {
    return validityType === 'relative' ? '领取后 N 天' : '固定时间段';
}
function mapCouponSourceType(sourceType) {
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
function mapCouponSourceTypeLabel(sourceType) {
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
function mapCouponRawStatus(status) {
    const code = toNumber(status);
    if (code === COUPON_TEMPLATE_STATUS_PAUSED) {
        return 'paused';
    }
    if (code === COUPON_TEMPLATE_STATUS_DISABLED) {
        return 'disabled';
    }
    return 'active';
}
function getCouponDisplayStatus(rawStatus, validityType, startAt, endAt) {
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
function mapGrantStatus(status) {
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
function mapGrantStatusLabel(status) {
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
function mapGrantSourceType(sourceType) {
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
function mapGrantSourceTypeLabel(sourceType) {
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
function formatAmountText(amountInCents) {
    const amount = amountInCents / 100;
    return Number.isInteger(amount) ? `${amount}` : amount.toFixed(2);
}
function buildCouponCondition(minAmountInCents) {
    if (minAmountInCents <= 0) {
        return '无门槛';
    }
    return `满${formatAmountText(minAmountInCents)}可用`;
}
function sanitizeCouponTemplate(row) {
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
function sanitizeCouponGrantBatch(row) {
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
function mapCouponTypeCode(type) {
    if (type === 'discount') {
        return COUPON_TYPE_DISCOUNT;
    }
    if (type === 'shipping') {
        return COUPON_TYPE_SHIPPING;
    }
    return COUPON_TYPE_CASH;
}
function mapCouponScopeTypeCode(scopeType) {
    return scopeType === 'shop' ? COUPON_SCOPE_SHOP : COUPON_SCOPE_PLATFORM;
}
function mapCouponValidityTypeCode(validityType) {
    return validityType === 'relative' ? COUPON_VALIDITY_RELATIVE : COUPON_VALIDITY_FIXED;
}
function normalizeCouponTemplatePayload(payload) {
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
    const normalized = {
        name,
        typeCode: mapCouponTypeCode(type),
        scopeTypeCode: mapCouponScopeTypeCode(scopeType),
        shopId: scopeType === 'shop'
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
        normalized.maxDiscountAmount = requireNonNegativeInteger(payload.maxDiscountAmount ?? 0, '最高优惠金额');
    }
    else {
        normalized.discountAmount = requireNonNegativeInteger(payload.discountAmount, type === 'shipping' ? '减免金额' : '优惠金额');
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
    }
    else {
        const validDays = Math.round(Number(payload.validDays ?? 0));
        if (!Number.isFinite(validDays) || validDays < 1) {
            throw new Error('领取后有效天数不合法');
        }
        normalized.validDays = validDays;
    }
    return normalized;
}
async function assertShopExists(connection, shopId) {
    const [rows] = await connection.execute('SELECT id FROM shop WHERE id = ? LIMIT 1', [shopId]);
    if (rows.length === 0) {
        throw new HttpError(404, 'ADMIN_COUPON_SHOP_NOT_FOUND', '指定店铺不存在');
    }
}
function buildCouponListWhere(params) {
    const clauses = [];
    const values = [];
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
async function fetchCouponTemplateById(connection, templateId) {
    const [rows] = await connection.execute(`
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
    `, [templateId]);
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, 'ADMIN_COUPON_TEMPLATE_NOT_FOUND', '优惠券模板不存在');
    }
    return row;
}
function buildCouponAmountForIssuedCoupon(template) {
    const type = mapCouponType(template.type);
    if (type === 'discount') {
        return Math.round(Number(template.discount_rate ?? 0) * 10);
    }
    return toNumber(template.discount_amount);
}
function buildCouponConditionForIssuedCoupon(template) {
    return buildCouponCondition(toNumber(template.min_amount));
}
async function fetchCouponRecipientIds(connection, audience) {
    if (audience === 'order_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT o.user_id AS user_id
        FROM \`order\` o
        INNER JOIN user u ON u.id = o.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    if (audience === 'guess_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT gb.user_id AS user_id
        FROM guess_bet gb
        INNER JOIN user u ON u.id = gb.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    if (audience === 'shop_users') {
        const [rows] = await connection.execute(`
        SELECT DISTINCT s.user_id AS user_id
        FROM shop s
        INNER JOIN user u ON u.id = s.user_id
        WHERE COALESCE(u.banned, 0) = 0
      `);
        return rows
            .map((row) => row.user_id)
            .filter((value) => value != null)
            .map((value) => String(value));
    }
    const [rows] = await connection.execute(`
      SELECT id
      FROM user
      WHERE COALESCE(banned, 0) = 0
    `);
    return rows
        .map((row) => row.id)
        .filter((value) => value != null)
        .map((value) => String(value));
}
function getCouponGrantExpiryAt(template) {
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
export async function getAdminCoupons(params = {}) {
    const db = getDbPool();
    const { whereSql, values } = buildCouponListWhere(params);
    const [rows] = await db.execute(`
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
    `, values);
    const items = rows.map((row) => sanitizeCouponTemplate(row));
    const summary = {
        total: items.length,
        active: items.filter((item) => item.status === 'active').length,
        scheduled: items.filter((item) => item.status === 'scheduled').length,
        paused: items.filter((item) => item.status === 'paused').length,
        disabled: items.filter((item) => item.status === 'disabled').length,
        ended: items.filter((item) => item.status === 'ended').length,
    };
    return {
        items: params.status && params.status !== 'all'
            ? items.filter((item) => item.status === params.status)
            : items,
        summary,
    };
}
export async function getAdminCouponGrantBatches(templateId) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await fetchCouponTemplateById(connection, templateId);
        const [rows] = await connection.execute(`
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
      `, [templateId]);
        return {
            items: rows.map((row) => sanitizeCouponGrantBatch(row)),
        };
    }
    finally {
        connection.release();
    }
}
export async function createAdminCouponTemplate(payload) {
    const normalized = normalizeCouponTemplatePayload(payload);
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        if (normalized.shopId) {
            await assertShopExists(connection, normalized.shopId);
        }
        const [result] = await connection.execute(`
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
      `, [
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
        ]);
        return { id: toEntityId(result.insertId) };
    }
    finally {
        connection.release();
    }
}
export async function updateAdminCouponTemplate(templateId, payload) {
    const normalized = normalizeCouponTemplatePayload(payload);
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await fetchCouponTemplateById(connection, templateId);
        if (normalized.shopId) {
            await assertShopExists(connection, normalized.shopId);
        }
        await connection.execute(`
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
      `, [
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
        ]);
        return { id: toEntityId(templateId) };
    }
    finally {
        connection.release();
    }
}
export async function updateAdminCouponTemplateStatus(templateId, payload) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await fetchCouponTemplateById(connection, templateId);
        const status = payload.status;
        await connection.execute(`
        UPDATE coupon_template
        SET status = ?, updated_at = NOW(3)
        WHERE id = ?
      `, [normalizeCouponTemplateStatus(status), templateId]);
        return {
            id: toEntityId(templateId),
            status,
        };
    }
    finally {
        connection.release();
    }
}
export async function createAdminCouponGrantBatch(templateId, operatorId, payload) {
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
        const [existingRows] = await connection.query(`
        SELECT user_id, COUNT(*) AS coupon_count
        FROM coupon
        WHERE template_id = ? AND user_id IN (${placeholders})
        GROUP BY user_id
      `, [templateId, ...targetUserIds]);
        const existingByUser = new Map(existingRows
            .map((row) => [String(row.user_id), toNumber(row.coupon_count)]));
        const eligibleUserIds = targetUserIds.filter((userId) => (existingByUser.get(userId) ?? 0) < template.userLimit);
        if (eligibleUserIds.length === 0) {
            throw new HttpError(400, 'ADMIN_COUPON_GRANT_LIMIT_REACHED', '目标用户都已达到限领数量');
        }
        if (template.totalQuantity >= 0) {
            const remaining = Math.max(template.totalQuantity - template.grantedCount, 0);
            if (remaining <= 0) {
                throw new HttpError(400, 'ADMIN_COUPON_GRANT_OUT_OF_STOCK', '优惠券库存不足');
            }
            if (eligibleUserIds.length > remaining) {
                throw new HttpError(400, 'ADMIN_COUPON_GRANT_OUT_OF_STOCK', `优惠券剩余库存不足，当前仅剩 ${remaining} 张`);
            }
        }
        const [batchResult] = await connection.execute(`
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
      `, [
            createNo('BCH'),
            templateId,
            COUPON_SOURCE_ADMIN,
            operatorId,
            targetUserIds.length,
            0,
            GRANT_STATUS_PROCESSING,
            trimOptionalText(payload.note),
        ]);
        const batchId = String(batchResult.insertId);
        const expireAt = getCouponGrantExpiryAt(templateRow);
        const couponAmount = buildCouponAmountForIssuedCoupon(templateRow);
        const condition = buildCouponConditionForIssuedCoupon(templateRow);
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
        await connection.query(`
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
      `, [couponRows]);
        await connection.execute(`
        UPDATE coupon_grant_batch
        SET granted_count = ?, status = ?, updated_at = NOW(3)
        WHERE id = ?
      `, [eligibleUserIds.length, GRANT_STATUS_COMPLETED, batchId]);
        await connection.commit();
        return {
            id: toEntityId(batchId),
            grantedCount: eligibleUserIds.length,
        };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
