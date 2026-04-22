import type mysql from 'mysql2/promise';
import {
  toEntityId,
  type AdminBannerDisplayStatus,
  type AdminBannerItem,
  type AdminBannerListResult,
  type CreateAdminBannerPayload,
  type CreateAdminBannerResult,
  type DeleteAdminBannerResult,
  type UpdateAdminBannerPayload,
  type UpdateAdminBannerResult,
  type UpdateAdminBannerStatusPayload,
  type UpdateAdminBannerStatusResult,
} from '@umi/shared';

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

type BannerAdminRow = {
  id: number | string;
  position: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  target_type: number | string | null;
  target_id: number | string | null;
  action_url: string | null;
  sort: number | string | null;
  status: number | string | null;
  start_at: Date | string | null;
  end_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  guess_title: string | null;
  post_content: string | null;
  product_name: string | null;
  shop_name: string | null;
};

type BannerListParams = {
  title?: string;
  position?: string;
  targetType?: CreateAdminBannerPayload['targetType'];
  status?: AdminBannerDisplayStatus | 'all';
};

type NormalizedBannerPayload = {
  position: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  targetType: CreateAdminBannerPayload['targetType'];
  targetId: string | null;
  actionUrl: string | null;
  sort: number;
  status: number;
  startAt: Date | null;
  endAt: Date | null;
};

function toIso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeRequiredText(value: string | null | undefined, fieldName: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new HttpError(400, 'ADMIN_BANNER_INVALID_PAYLOAD', `${fieldName}不能为空`);
  }
  return trimmed;
}

function normalizeDate(value: string | null | undefined, fieldName: string) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, 'ADMIN_BANNER_INVALID_PAYLOAD', `${fieldName}格式不正确`);
  }
  return parsed;
}

function mapBannerTargetTypeCode(targetType: CreateAdminBannerPayload['targetType']) {
  if (targetType === 'guess') return TARGET_GUESS;
  if (targetType === 'post') return TARGET_POST;
  if (targetType === 'product') return TARGET_PRODUCT;
  if (targetType === 'shop') return TARGET_SHOP;
  if (targetType === 'page') return TARGET_PAGE;
  return TARGET_EXTERNAL;
}

function mapBannerTargetType(
  targetType: number | string | null | undefined,
): CreateAdminBannerPayload['targetType'] {
  const code = Number(targetType ?? 0);
  if (code === TARGET_GUESS) return 'guess';
  if (code === TARGET_POST) return 'post';
  if (code === TARGET_PRODUCT) return 'product';
  if (code === TARGET_SHOP) return 'shop';
  if (code === TARGET_PAGE) return 'page';
  return 'external';
}

function mapBannerTargetTypeLabel(targetType: CreateAdminBannerPayload['targetType']) {
  if (targetType === 'guess') return '竞猜';
  if (targetType === 'post') return '动态';
  if (targetType === 'product') return '商品';
  if (targetType === 'shop') return '店铺';
  if (targetType === 'page') return '站内页面';
  return '外部链接';
}

function mapBannerPositionLabel(position: string) {
  if (position === 'home_hero') return '首页轮播';
  if (position === 'mall_hero') return '商城推荐';
  if (position === 'mall_banner') return '商城活动';
  return position;
}

function mapBannerRawStatus(status: number | string | null | undefined) {
  return Number(status ?? 0) === BANNER_STATUS_ACTIVE ? 'active' : 'disabled';
}

function getBannerDisplayStatus(
  rawStatus: 'active' | 'disabled',
  startAt: string | null,
  endAt: string | null,
): { key: AdminBannerDisplayStatus; label: AdminBannerItem['statusLabel'] } {
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

function getBannerTargetName(
  row: BannerAdminRow,
  targetType: CreateAdminBannerPayload['targetType'],
) {
  if (targetType === 'guess') return row.guess_title ?? null;
  if (targetType === 'post') return row.post_content ?? null;
  if (targetType === 'product') return row.product_name ?? null;
  if (targetType === 'shop') return row.shop_name ?? null;
  if (targetType === 'page') return row.action_url ?? null;
  return row.action_url ?? null;
}

function sanitizeBanner(row: BannerAdminRow): AdminBannerItem {
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

async function assertBannerTargetExists(
  connection: mysql.PoolConnection,
  targetType: CreateAdminBannerPayload['targetType'],
  targetId: string,
) {
  let sql = '';
  let errorMessage = '';

  if (targetType === 'guess') {
    sql = 'SELECT id FROM guess WHERE id = ? LIMIT 1';
    errorMessage = '关联竞猜不存在';
  } else if (targetType === 'post') {
    sql = 'SELECT id FROM post WHERE id = ? LIMIT 1';
    errorMessage = '关联动态不存在';
  } else if (targetType === 'product') {
    sql = 'SELECT id FROM product WHERE id = ? LIMIT 1';
    errorMessage = '关联商品不存在';
  } else if (targetType === 'shop') {
    sql = 'SELECT id FROM shop WHERE id = ? LIMIT 1';
    errorMessage = '关联店铺不存在';
  } else {
    return;
  }

  const [rows] = await connection.execute<mysql.RowDataPacket[]>(sql, [targetId]);
  if ((rows as Array<{ id?: number | string }>).length === 0) {
    throw new HttpError(404, 'ADMIN_BANNER_TARGET_NOT_FOUND', errorMessage);
  }
}

function normalizeBannerStatus(status: 'active' | 'disabled' | null | undefined) {
  return status === 'disabled' ? BANNER_STATUS_DISABLED : BANNER_STATUS_ACTIVE;
}

function buildBannerWhere(params: BannerListParams) {
  const clauses: string[] = [];
  const values: Array<string | number> = [];

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

async function fetchBannerById(connection: mysql.PoolConnection, bannerId: string) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    [bannerId],
  );

  const banner = (rows as BannerAdminRow[])[0];
  if (!banner) {
    throw new HttpError(404, 'ADMIN_BANNER_NOT_FOUND', '轮播不存在');
  }
  return banner;
}

async function normalizeBannerPayload(
  connection: mysql.PoolConnection,
  payload: CreateAdminBannerPayload | UpdateAdminBannerPayload,
): Promise<NormalizedBannerPayload> {
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
      throw new HttpError(
        400,
        'ADMIN_BANNER_INVALID_PAYLOAD',
        targetType === 'page' ? '页面路径不能为空' : '外部链接不能为空',
      );
    }
  } else {
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

export async function getAdminBanners(params: BannerListParams): Promise<AdminBannerListResult> {
  const db = getDbPool();
  const { whereSql, values } = buildBannerWhere(params);
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
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
    `,
    values,
  );

  const allItems = (rows as BannerAdminRow[]).map(sanitizeBanner);
  const summary = {
    total: allItems.length,
    active: allItems.filter((item) => item.status === 'active').length,
    scheduled: allItems.filter((item) => item.status === 'scheduled').length,
    paused: allItems.filter((item) => item.status === 'paused').length,
    ended: allItems.filter((item) => item.status === 'ended').length,
  };
  const items =
    params.status && params.status !== 'all'
      ? allItems.filter((item) => item.status === params.status)
      : allItems;

  return { items, summary };
}

export async function createAdminBanner(
  payload: CreateAdminBannerPayload,
): Promise<CreateAdminBannerResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    const normalized = await normalizeBannerPayload(connection, payload);
    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `
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
      `,
      [
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
      ],
    );
    return { id: toEntityId(result.insertId) };
  } finally {
    connection.release();
  }
}

export async function updateAdminBanner(
  bannerId: string,
  payload: UpdateAdminBannerPayload,
): Promise<UpdateAdminBannerResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await fetchBannerById(connection, bannerId);
    const normalized = await normalizeBannerPayload(connection, payload);
    await connection.execute(
      `
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
      `,
      [
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
      ],
    );
    return { id: toEntityId(bannerId) };
  } finally {
    connection.release();
  }
}

export async function updateAdminBannerStatus(
  bannerId: string,
  payload: UpdateAdminBannerStatusPayload,
): Promise<UpdateAdminBannerStatusResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await fetchBannerById(connection, bannerId);
    await connection.execute(
      `
        UPDATE banner
        SET
          status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [normalizeBannerStatus(payload.status), bannerId],
    );
    return { id: toEntityId(bannerId), status: payload.status };
  } finally {
    connection.release();
  }
}

export async function deleteAdminBanner(
  bannerId: string,
): Promise<DeleteAdminBannerResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await fetchBannerById(connection, bannerId);
    await connection.execute('DELETE FROM banner WHERE id = ?', [bannerId]);
    return { id: toEntityId(bannerId) };
  } finally {
    connection.release();
  }
}
