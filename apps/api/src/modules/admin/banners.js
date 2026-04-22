import { toEntityId, } from '@umi/shared';
import { HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
const BANNER_STATUS_ACTIVE = 10;
const BANNER_STATUS_DISABLED = 90;
const TARGET_GUESS = 10;
const TARGET_POST = 20;
const TARGET_PRODUCT = 30;
const TARGET_SHOP = 40;
const TARGET_PAGE = 50;
const TARGET_EXTERNAL = 90;
function toIso(value) {
    return value ? new Date(value).toISOString() : null;
}
function normalizeOptionalText(value) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}
function normalizeRequiredText(value, fieldName) {
    const trimmed = value?.trim();
    if (!trimmed) {
        throw new HttpError(400, 'ADMIN_BANNER_INVALID_PAYLOAD', `${fieldName}不能为空`);
    }
    return trimmed;
}
function normalizeDate(value, fieldName) {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new HttpError(400, 'ADMIN_BANNER_INVALID_PAYLOAD', `${fieldName}格式不正确`);
    }
    return parsed;
}
function mapBannerTargetTypeCode(targetType) {
    if (targetType === 'guess')
        return TARGET_GUESS;
    if (targetType === 'post')
        return TARGET_POST;
    if (targetType === 'product')
        return TARGET_PRODUCT;
    if (targetType === 'shop')
        return TARGET_SHOP;
    if (targetType === 'page')
        return TARGET_PAGE;
    return TARGET_EXTERNAL;
}
function mapBannerTargetType(targetType) {
    const code = Number(targetType ?? 0);
    if (code === TARGET_GUESS)
        return 'guess';
    if (code === TARGET_POST)
        return 'post';
    if (code === TARGET_PRODUCT)
        return 'product';
    if (code === TARGET_SHOP)
        return 'shop';
    if (code === TARGET_PAGE)
        return 'page';
    return 'external';
}
function mapBannerTargetTypeLabel(targetType) {
    if (targetType === 'guess')
        return '竞猜';
    if (targetType === 'post')
        return '动态';
    if (targetType === 'product')
        return '商品';
    if (targetType === 'shop')
        return '店铺';
    if (targetType === 'page')
        return '站内页面';
    return '外部链接';
}
function mapBannerPositionLabel(position) {
    if (position === 'home_hero')
        return '首页轮播';
    if (position === 'mall_hero')
        return '商城推荐';
    if (position === 'mall_banner')
        return '商城活动';
    return position;
}
function mapBannerRawStatus(status) {
    return Number(status ?? 0) === BANNER_STATUS_ACTIVE ? 'active' : 'disabled';
}
function getBannerDisplayStatus(rawStatus, startAt, endAt) {
    if (rawStatus === 'disabled') {
        return { key: 'paused', label: '已暂停' };
    }
    const now = Date.now();
    const startTime = startAt ? new Date(startAt).getTime() : null;
    const endTime = endAt ? new Date(endAt).getTime() : null;
    if (endTime != null && endTime < now) {
        return { key: 'ended', label: '已结束' };
    }
    if (startTime != null && startTime > now) {
        return { key: 'scheduled', label: '待排期' };
    }
    return { key: 'active', label: '投放中' };
}
function getBannerTargetName(row, targetType) {
    if (targetType === 'guess')
        return row.guess_title ?? null;
    if (targetType === 'post')
        return row.post_content ?? null;
    if (targetType === 'product')
        return row.product_name ?? null;
    if (targetType === 'shop')
        return row.shop_name ?? null;
    if (targetType === 'page')
        return row.action_url ?? null;
    return row.action_url ?? null;
}
function sanitizeBanner(row) {
    const rawStatus = mapBannerRawStatus(row.status);
    const startAt = toIso(row.start_at);
    const endAt = toIso(row.end_at);
    const targetType = mapBannerTargetType(row.target_type);
    const displayStatus = getBannerDisplayStatus(rawStatus, startAt, endAt);
    return {
        id: toEntityId(row.id),
        position: row.position,
        positionLabel: mapBannerPositionLabel(row.position),
        title: row.title,
        subtitle: row.subtitle,
        imageUrl: row.image_url,
        targetType,
        targetTypeLabel: mapBannerTargetTypeLabel(targetType),
        targetId: row.target_id == null ? null : toEntityId(row.target_id),
        targetName: getBannerTargetName(row, targetType),
        actionUrl: row.action_url,
        sort: Number(row.sort ?? 0),
        rawStatus,
        status: displayStatus.key,
        statusLabel: displayStatus.label,
        startAt,
        endAt,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
    };
}
async function assertBannerTargetExists(connection, targetType, targetId) {
    let sql = '';
    let errorMessage = '';
    if (targetType === 'guess') {
        sql = 'SELECT id FROM guess WHERE id = ? LIMIT 1';
        errorMessage = '关联竞猜不存在';
    }
    else if (targetType === 'post') {
        sql = 'SELECT id FROM post WHERE id = ? LIMIT 1';
        errorMessage = '关联动态不存在';
    }
    else if (targetType === 'product') {
        sql = 'SELECT id FROM product WHERE id = ? LIMIT 1';
        errorMessage = '关联商品不存在';
    }
    else if (targetType === 'shop') {
        sql = 'SELECT id FROM shop WHERE id = ? LIMIT 1';
        errorMessage = '关联店铺不存在';
    }
    else {
        return;
    }
    const [rows] = await connection.execute(sql, [targetId]);
    if (rows.length === 0) {
        throw new HttpError(404, 'ADMIN_BANNER_TARGET_NOT_FOUND', errorMessage);
    }
}
function normalizeBannerStatus(status) {
    return status === 'disabled' ? BANNER_STATUS_DISABLED : BANNER_STATUS_ACTIVE;
}
function buildBannerWhere(params) {
    const clauses = [];
    const values = [];
    if (params.title?.trim()) {
        clauses.push('b.title LIKE ?');
        values.push(`%${params.title.trim()}%`);
    }
    if (params.position?.trim()) {
        clauses.push('b.position = ?');
        values.push(params.position.trim());
    }
    if (params.targetType) {
        clauses.push('b.target_type = ?');
        values.push(mapBannerTargetTypeCode(params.targetType));
    }
    return {
        whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
        values,
    };
}
async function fetchBannerById(connection, bannerId) {
    const [rows] = await connection.execute(`
      SELECT
        b.id,
        b.position,
        b.title,
        b.subtitle,
        b.image_url,
        b.target_type,
        b.target_id,
        b.action_url,
        b.sort,
        b.status,
        b.start_at,
        b.end_at,
        b.created_at,
        b.updated_at,
        g.title AS guess_title,
        LEFT(pst.content, 30) AS post_content,
        p.name AS product_name,
        s.name AS shop_name
      FROM banner b
      LEFT JOIN guess g ON b.target_type = ${TARGET_GUESS} AND g.id = b.target_id
      LEFT JOIN post pst ON b.target_type = ${TARGET_POST} AND pst.id = b.target_id
      LEFT JOIN product p ON b.target_type = ${TARGET_PRODUCT} AND p.id = b.target_id
      LEFT JOIN shop s ON b.target_type = ${TARGET_SHOP} AND s.id = b.target_id
      WHERE b.id = ?
      LIMIT 1
    `, [bannerId]);
    const banner = rows[0];
    if (!banner) {
        throw new HttpError(404, 'ADMIN_BANNER_NOT_FOUND', '轮播不存在');
    }
    return banner;
}
async function normalizeBannerPayload(connection, payload) {
    const position = normalizeRequiredText(payload.position, '投放位');
    const title = normalizeRequiredText(payload.title, '标题');
    const imageUrl = normalizeRequiredText(payload.imageUrl, '图片地址');
    const subtitle = normalizeOptionalText(payload.subtitle);
    const targetType = payload.targetType;
    const targetId = normalizeOptionalText(payload.targetId);
    const actionUrl = normalizeOptionalText(payload.actionUrl);
    const sort = Number.isFinite(Number(payload.sort)) ? Number(payload.sort) : 0;
    const status = normalizeBannerStatus(payload.status ?? 'active');
    const startAt = normalizeDate(payload.startAt, '开始时间');
    const endAt = normalizeDate(payload.endAt, '结束时间');
    if (startAt && endAt && startAt.getTime() > endAt.getTime()) {
        throw new HttpError(400, 'ADMIN_BANNER_INVALID_PAYLOAD', '开始时间不能晚于结束时间');
    }
    if (targetType === 'external' || targetType === 'page') {
        if (!actionUrl) {
            throw new HttpError(400, 'ADMIN_BANNER_INVALID_PAYLOAD', targetType === 'page' ? '页面路径不能为空' : '外部链接不能为空');
        }
    }
    else {
        if (!targetId) {
            throw new HttpError(400, 'ADMIN_BANNER_INVALID_PAYLOAD', '跳转目标ID不能为空');
        }
        await assertBannerTargetExists(connection, targetType, targetId);
    }
    return {
        position,
        title,
        subtitle,
        imageUrl,
        targetType,
        targetId: targetType === 'external' || targetType === 'page' ? null : targetId,
        actionUrl: targetType === 'external' || targetType === 'page' ? actionUrl : null,
        sort,
        status,
        startAt,
        endAt,
    };
}
export async function getAdminBanners(params) {
    const db = getDbPool();
    const { whereSql, values } = buildBannerWhere(params);
    const [rows] = await db.execute(`
      SELECT
        b.id,
        b.position,
        b.title,
        b.subtitle,
        b.image_url,
        b.target_type,
        b.target_id,
        b.action_url,
        b.sort,
        b.status,
        b.start_at,
        b.end_at,
        b.created_at,
        b.updated_at,
        g.title AS guess_title,
        LEFT(pst.content, 30) AS post_content,
        p.name AS product_name,
        s.name AS shop_name
      FROM banner b
      LEFT JOIN guess g ON b.target_type = ${TARGET_GUESS} AND g.id = b.target_id
      LEFT JOIN post pst ON b.target_type = ${TARGET_POST} AND pst.id = b.target_id
      LEFT JOIN product p ON b.target_type = ${TARGET_PRODUCT} AND p.id = b.target_id
      LEFT JOIN shop s ON b.target_type = ${TARGET_SHOP} AND s.id = b.target_id
      ${whereSql}
      ORDER BY b.sort DESC, b.created_at DESC, b.id DESC
    `, values);
    const allItems = rows.map(sanitizeBanner);
    const summary = {
        total: allItems.length,
        active: allItems.filter((item) => item.status === 'active').length,
        scheduled: allItems.filter((item) => item.status === 'scheduled').length,
        paused: allItems.filter((item) => item.status === 'paused').length,
        ended: allItems.filter((item) => item.status === 'ended').length,
    };
    const items = params.status && params.status !== 'all'
        ? allItems.filter((item) => item.status === params.status)
        : allItems;
    return { items, summary };
}
export async function createAdminBanner(payload) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        const normalized = await normalizeBannerPayload(connection, payload);
        const [result] = await connection.execute(`
        INSERT INTO banner (
          position,
          title,
          subtitle,
          image_url,
          target_type,
          target_id,
          action_url,
          sort,
          status,
          start_at,
          end_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `, [
            normalized.position,
            normalized.title,
            normalized.subtitle,
            normalized.imageUrl,
            mapBannerTargetTypeCode(normalized.targetType),
            normalized.targetId,
            normalized.actionUrl,
            normalized.sort,
            normalized.status,
            normalized.startAt,
            normalized.endAt,
        ]);
        return { id: toEntityId(result.insertId) };
    }
    finally {
        connection.release();
    }
}
export async function updateAdminBanner(bannerId, payload) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await fetchBannerById(connection, bannerId);
        const normalized = await normalizeBannerPayload(connection, payload);
        await connection.execute(`
        UPDATE banner
        SET
          position = ?,
          title = ?,
          subtitle = ?,
          image_url = ?,
          target_type = ?,
          target_id = ?,
          action_url = ?,
          sort = ?,
          status = ?,
          start_at = ?,
          end_at = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [
            normalized.position,
            normalized.title,
            normalized.subtitle,
            normalized.imageUrl,
            mapBannerTargetTypeCode(normalized.targetType),
            normalized.targetId,
            normalized.actionUrl,
            normalized.sort,
            normalized.status,
            normalized.startAt,
            normalized.endAt,
            bannerId,
        ]);
        return { id: toEntityId(bannerId) };
    }
    finally {
        connection.release();
    }
}
export async function updateAdminBannerStatus(bannerId, payload) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await fetchBannerById(connection, bannerId);
        await connection.execute(`
        UPDATE banner
        SET
          status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [normalizeBannerStatus(payload.status), bannerId]);
        return { id: toEntityId(bannerId), status: payload.status };
    }
    finally {
        connection.release();
    }
}
export async function deleteAdminBanner(bannerId) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await fetchBannerById(connection, bannerId);
        await connection.execute('DELETE FROM banner WHERE id = ?', [bannerId]);
        return { id: toEntityId(bannerId) };
    }
    finally {
        connection.release();
    }
}
