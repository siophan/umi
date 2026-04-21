import type mysql from 'mysql2/promise';
import {
  toEntityId,
  type AdminCheckinRewardConfigItem,
  type AdminCheckinRewardConfigListResult,
  type CreateAdminCheckinRewardConfigPayload,
  type CreateAdminCheckinRewardConfigResult,
  type UpdateAdminCheckinRewardConfigPayload,
  type UpdateAdminCheckinRewardConfigResult,
  type UpdateAdminCheckinRewardConfigStatusPayload,
  type UpdateAdminCheckinRewardConfigStatusResult,
} from '@umi/shared';

import { HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';

const CHECKIN_REWARD_TYPE_COIN = 10;
const CHECKIN_REWARD_TYPE_COUPON = 20;
const CHECKIN_REWARD_TYPE_PHYSICAL = 30;

const CHECKIN_CONFIG_STATUS_ACTIVE = 10;
const CHECKIN_CONFIG_STATUS_DISABLED = 90;

type CheckinRewardConfigRow = {
  id: number | string;
  day_no: number | string;
  reward_type: number | string;
  reward_value: number | string;
  reward_ref_id: number | string | null;
  title: string | null;
  sort: number | string;
  status: number | string;
  created_at: Date | string;
  updated_at: Date | string;
};

type CheckinRewardConfigListParams = {
  dayNo?: number;
  rewardType?: CreateAdminCheckinRewardConfigPayload['rewardType'];
  title?: string;
  status?: 'all' | AdminCheckinRewardConfigItem['status'];
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toIso(value: Date | string) {
  return new Date(value).toISOString();
}

function normalizeDayNo(value: number | string | null | undefined) {
  const result = Number(value ?? 0);
  if (!Number.isFinite(result) || result < 1 || result > 365) {
    throw new Error('签到天数不合法');
  }
  return Math.floor(result);
}

function normalizeRewardValue(value: number | string | null | undefined) {
  const result = Number(value ?? 0);
  if (!Number.isFinite(result) || result <= 0) {
    throw new Error('奖励数值不合法');
  }
  return result;
}

function normalizeOptionalRefId(
  value: string | number | null | undefined,
  label: string,
) {
  if (value == null || value === '') {
    return null;
  }
  const text = String(value).trim();
  if (!text) {
    return null;
  }
  if (!/^\d+$/.test(text)) {
    throw new Error(`${label}不合法`);
  }
  return text;
}

function normalizeOptionalTitle(value: string | null | undefined) {
  const text = value?.trim() ?? '';
  return text ? text.slice(0, 64) : null;
}

function normalizeSort(value: number | string | null | undefined, dayNo: number) {
  if (value == null || value === '') {
    return dayNo;
  }
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0) {
    throw new Error('排序值不合法');
  }
  return Math.floor(result);
}

function mapRewardType(
  rewardType: number | string,
): Pick<AdminCheckinRewardConfigItem, 'rewardType' | 'rewardTypeLabel'> {
  const code = Number(rewardType ?? 0);
  if (code === CHECKIN_REWARD_TYPE_COUPON) {
    return { rewardType: 'coupon', rewardTypeLabel: '优惠券' };
  }
  if (code === CHECKIN_REWARD_TYPE_PHYSICAL) {
    return { rewardType: 'physical', rewardTypeLabel: '实物' };
  }
  return { rewardType: 'coin', rewardTypeLabel: '零食币' };
}

function mapRewardTypeCode(type: CreateAdminCheckinRewardConfigPayload['rewardType']) {
  if (type === 'coupon') {
    return CHECKIN_REWARD_TYPE_COUPON;
  }
  if (type === 'physical') {
    return CHECKIN_REWARD_TYPE_PHYSICAL;
  }
  return CHECKIN_REWARD_TYPE_COIN;
}

function mapStatus(
  status: number | string,
): Pick<AdminCheckinRewardConfigItem, 'status' | 'statusLabel'> {
  return Number(status ?? 0) === CHECKIN_CONFIG_STATUS_ACTIVE
    ? { status: 'active', statusLabel: '启用' }
    : { status: 'disabled', statusLabel: '停用' };
}

function mapStatusCode(
  status: UpdateAdminCheckinRewardConfigStatusPayload['status'] | string | null | undefined,
) {
  return status === 'disabled' ? CHECKIN_CONFIG_STATUS_DISABLED : CHECKIN_CONFIG_STATUS_ACTIVE;
}

function sanitizeCheckinRewardConfig(row: CheckinRewardConfigRow): AdminCheckinRewardConfigItem {
  return {
    id: toEntityId(row.id),
    dayNo: toNumber(row.day_no),
    ...mapRewardType(row.reward_type),
    rewardValue: toNumber(row.reward_value),
    rewardRefId: row.reward_ref_id == null ? null : toEntityId(row.reward_ref_id),
    title: row.title,
    sort: toNumber(row.sort),
    ...mapStatus(row.status),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function buildListWhere(params: CheckinRewardConfigListParams) {
  const clauses: string[] = [];
  const values: Array<number | string> = [];

  if (params.dayNo != null) {
    clauses.push('day_no = ?');
    values.push(params.dayNo);
  }

  if (params.rewardType) {
    clauses.push('reward_type = ?');
    values.push(mapRewardTypeCode(params.rewardType));
  }

  if (params.title?.trim()) {
    clauses.push('title LIKE ?');
    values.push(`%${params.title.trim()}%`);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

async function fetchCheckinRewardConfigById(
  db: mysql.Pool | mysql.PoolConnection,
  rewardConfigId: string,
) {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        id,
        day_no,
        reward_type,
        reward_value,
        reward_ref_id,
        title,
        sort,
        status,
        created_at,
        updated_at
      FROM checkin_reward_config
      WHERE id = ?
      LIMIT 1
    `,
    [rewardConfigId],
  );

  const row = (rows as CheckinRewardConfigRow[])[0];
  if (!row) {
    throw new HttpError(404, 'ADMIN_CHECKIN_REWARD_NOT_FOUND', '签到奖励配置不存在');
  }

  return row;
}

function normalizeCreatePayload(payload: CreateAdminCheckinRewardConfigPayload) {
  const dayNo = normalizeDayNo(payload.dayNo);
  const rewardType = payload.rewardType;
  if (rewardType !== 'coin' && rewardType !== 'coupon' && rewardType !== 'physical') {
    throw new Error('奖励类型不合法');
  }

  const rewardValue = normalizeRewardValue(payload.rewardValue);
  const rewardRefId = normalizeOptionalRefId(payload.rewardRefId, '奖励关联 ID');
  if ((rewardType === 'coupon' || rewardType === 'physical') && !rewardRefId) {
    throw new Error('当前奖励类型必须填写奖励关联 ID');
  }

  return {
    dayNo,
    rewardTypeCode: mapRewardTypeCode(rewardType),
    rewardValue,
    rewardRefId,
    title: normalizeOptionalTitle(payload.title),
    sort: normalizeSort(payload.sort, dayNo),
    statusCode: mapStatusCode(payload.status),
  };
}

function normalizeUpdatePayload(payload: UpdateAdminCheckinRewardConfigPayload) {
  const dayNo = normalizeDayNo(payload.dayNo);
  const rewardType = payload.rewardType;
  if (rewardType !== 'coin' && rewardType !== 'coupon' && rewardType !== 'physical') {
    throw new Error('奖励类型不合法');
  }

  const rewardValue = normalizeRewardValue(payload.rewardValue);
  const rewardRefId = normalizeOptionalRefId(payload.rewardRefId, '奖励关联 ID');
  if ((rewardType === 'coupon' || rewardType === 'physical') && !rewardRefId) {
    throw new Error('当前奖励类型必须填写奖励关联 ID');
  }

  return {
    dayNo,
    rewardTypeCode: mapRewardTypeCode(rewardType),
    rewardValue,
    rewardRefId,
    title: normalizeOptionalTitle(payload.title),
    sort: normalizeSort(payload.sort, dayNo),
  };
}

function toCheckinRouteHttpError(error: unknown, fallbackMessage: string) {
  if (error instanceof HttpError) {
    return error;
  }
  if (error instanceof Error) {
    return new HttpError(400, 'ADMIN_CHECKIN_REWARD_INVALID', error.message || fallbackMessage);
  }
  return new HttpError(400, 'ADMIN_CHECKIN_REWARD_INVALID', fallbackMessage);
}

function handleDuplicateError(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY'
  ) {
    throw new HttpError(400, 'ADMIN_CHECKIN_REWARD_DUPLICATE_DAY', '签到天数已存在');
  }
  throw error;
}

export async function getAdminCheckinRewardConfigs(
  params: CheckinRewardConfigListParams = {},
): Promise<AdminCheckinRewardConfigListResult> {
  const db = getDbPool();
  const { whereSql, values } = buildListWhere(params);
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        id,
        day_no,
        reward_type,
        reward_value,
        reward_ref_id,
        title,
        sort,
        status,
        created_at,
        updated_at
      FROM checkin_reward_config
      ${whereSql}
      ORDER BY day_no ASC, sort ASC, id ASC
    `,
    values,
  );

  const items = (rows as CheckinRewardConfigRow[]).map((row) => sanitizeCheckinRewardConfig(row));
  return {
    items:
      params.status && params.status !== 'all'
        ? items.filter((item) => item.status === params.status)
        : items,
    summary: {
      total: items.length,
      active: items.filter((item) => item.status === 'active').length,
      disabled: items.filter((item) => item.status === 'disabled').length,
    },
  };
}

export async function createAdminCheckinRewardConfig(
  payload: CreateAdminCheckinRewardConfigPayload,
): Promise<CreateAdminCheckinRewardConfigResult> {
  const db = getDbPool();
  const normalized = normalizeCreatePayload(payload);

  try {
    const [result] = await db.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO checkin_reward_config (
          day_no,
          reward_type,
          reward_value,
          reward_ref_id,
          title,
          sort,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
      `,
      [
        normalized.dayNo,
        normalized.rewardTypeCode,
        normalized.rewardValue,
        normalized.rewardRefId,
        normalized.title,
        normalized.sort,
        normalized.statusCode,
      ],
    );

    return {
      id: toEntityId(result.insertId),
    };
  } catch (error) {
    handleDuplicateError(error);
    throw toCheckinRouteHttpError(error, '签到奖励创建失败');
  }
}

export async function updateAdminCheckinRewardConfig(
  rewardConfigId: string,
  payload: UpdateAdminCheckinRewardConfigPayload,
): Promise<UpdateAdminCheckinRewardConfigResult> {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await fetchCheckinRewardConfigById(connection, rewardConfigId);
    const normalized = normalizeUpdatePayload(payload);

    await connection.execute(
      `
        UPDATE checkin_reward_config
        SET
          day_no = ?,
          reward_type = ?,
          reward_value = ?,
          reward_ref_id = ?,
          title = ?,
          sort = ?,
          updated_at = NOW(3)
        WHERE id = ?
      `,
      [
        normalized.dayNo,
        normalized.rewardTypeCode,
        normalized.rewardValue,
        normalized.rewardRefId,
        normalized.title,
        normalized.sort,
        rewardConfigId,
      ],
    );

    await connection.commit();
    return {
      id: toEntityId(rewardConfigId),
    };
  } catch (error) {
    await connection.rollback();
    try {
      handleDuplicateError(error);
    } catch (duplicateError) {
      throw duplicateError;
    }
    throw toCheckinRouteHttpError(error, '签到奖励更新失败');
  } finally {
    connection.release();
  }
}

export async function updateAdminCheckinRewardConfigStatus(
  rewardConfigId: string,
  payload: UpdateAdminCheckinRewardConfigStatusPayload,
): Promise<UpdateAdminCheckinRewardConfigStatusResult> {
  const db = getDbPool();
  await fetchCheckinRewardConfigById(db, rewardConfigId);

  await db.execute(
    `
      UPDATE checkin_reward_config
      SET status = ?, updated_at = NOW(3)
      WHERE id = ?
    `,
    [mapStatusCode(payload.status), rewardConfigId],
  );

  return {
    id: toEntityId(rewardConfigId),
    status: payload.status,
  };
}
