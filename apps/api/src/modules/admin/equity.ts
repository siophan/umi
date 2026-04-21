import type mysql from 'mysql2/promise';

import {
  toEntityId,
  toOptionalEntityId,
  type AdjustAdminEquityPayload,
  type AdminEquityAccountItem,
  type AdminEquityDetailResult,
  type AdminEquityListResult,
  type AdminEquityLogItem,
  type AdjustAdminEquityResult,
} from '@umi/shared';

import { HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';

const EQUITY_LOG_TYPE_GRANT = 10;
const EQUITY_LOG_TYPE_USE = 20;
const EQUITY_LOG_TYPE_EXPIRE = 30;
const EQUITY_LOG_TYPE_ADJUST = 40;

const EQUITY_SUB_TYPE_CATEGORY = 10;
const EQUITY_SUB_TYPE_EXCHANGE = 20;
const EQUITY_SUB_TYPE_GENERAL = 30;

const EQUITY_SOURCE_TYPE_ADMIN = 40;

type EquityAccountRow = {
  id: number | string;
  user_id: number | string;
  user_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  category_amount: number | string | null;
  exchange_amount: number | string | null;
  general_amount: number | string | null;
  total_granted: number | string | null;
  total_used: number | string | null;
  total_expired: number | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type EquityLogRow = {
  id: number | string;
  account_id: number | string;
  user_id: number | string;
  type: number | string | null;
  sub_type: number | string | null;
  amount: number | string | null;
  balance: number | string | null;
  source_type: number | string | null;
  ref_id: number | string | null;
  note: string | null;
  expire_at: Date | string | null;
  created_at: Date | string;
};

type SummaryRow = {
  total_accounts: number | string | null;
  total_granted: number | string | null;
  total_used: number | string | null;
  total_expired: number | string | null;
  active_balance: number | string | null;
};

type EquityListParams = {
  page: number;
  pageSize: number;
  userId?: string;
  userName?: string;
  phone?: string;
};

function toMoneyInCents(value: number | string | null | undefined) {
  return Math.round(Number(value ?? 0) * 100);
}

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

function mapEquityLogType(code: number): AdminEquityLogItem['type'] {
  if (code === EQUITY_LOG_TYPE_GRANT) {
    return 'grant';
  }
  if (code === EQUITY_LOG_TYPE_USE) {
    return 'use';
  }
  if (code === EQUITY_LOG_TYPE_EXPIRE) {
    return 'expire';
  }
  if (code === EQUITY_LOG_TYPE_ADJUST) {
    return 'adjust';
  }
  return 'unknown';
}

function mapEquitySubType(code: number): AdminEquityLogItem['subType'] {
  if (code === EQUITY_SUB_TYPE_CATEGORY) {
    return 'category';
  }
  if (code === EQUITY_SUB_TYPE_EXCHANGE) {
    return 'exchange';
  }
  if (code === EQUITY_SUB_TYPE_GENERAL) {
    return 'general';
  }
  return null;
}

function mapEquitySubTypeCode(value: AdjustAdminEquityPayload['subType']) {
  if (value === 'category') {
    return EQUITY_SUB_TYPE_CATEGORY;
  }
  if (value === 'exchange') {
    return EQUITY_SUB_TYPE_EXCHANGE;
  }
  return EQUITY_SUB_TYPE_GENERAL;
}

function sanitizeEquityAccount(row: EquityAccountRow): AdminEquityAccountItem {
  const categoryAmount = toMoneyInCents(row.category_amount);
  const exchangeAmount = toMoneyInCents(row.exchange_amount);
  const generalAmount = toMoneyInCents(row.general_amount);

  return {
    id: toEntityId(row.id),
    userId: toEntityId(row.user_id),
    userName: row.user_name,
    phoneNumber: row.phone_number,
    avatarUrl: row.avatar_url,
    categoryAmount,
    exchangeAmount,
    generalAmount,
    totalBalance: categoryAmount + exchangeAmount + generalAmount,
    totalGranted: toMoneyInCents(row.total_granted),
    totalUsed: toMoneyInCents(row.total_used),
    totalExpired: toMoneyInCents(row.total_expired),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function sanitizeEquityLog(row: EquityLogRow): AdminEquityLogItem {
  return {
    id: toEntityId(row.id),
    accountId: toEntityId(row.account_id),
    userId: toEntityId(row.user_id),
    type: mapEquityLogType(Number(row.type ?? 0)),
    subType: mapEquitySubType(Number(row.sub_type ?? 0)),
    amount: toMoneyInCents(row.amount),
    balance: toMoneyInCents(row.balance),
    sourceType: row.source_type == null ? null : Number(row.source_type),
    refId: toOptionalEntityId(row.ref_id),
    note: row.note,
    expireAt: toIsoString(row.expire_at),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function clampPagination(page: number, pageSize: number) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : 20;
  return { page: safePage, pageSize: safePageSize };
}

function buildListWhere(params: EquityListParams) {
  const clauses: string[] = [];
  const values: Array<string | number> = [];

  if (params.userId) {
    clauses.push('CAST(ea.user_id AS CHAR) LIKE ?');
    values.push(`%${params.userId.trim()}%`);
  }
  if (params.userName) {
    clauses.push('COALESCE(up.name, \'\') LIKE ?');
    values.push(`%${params.userName.trim()}%`);
  }
  if (params.phone) {
    clauses.push('COALESCE(u.phone_number, \'\') LIKE ?');
    values.push(`%${params.phone.trim()}%`);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

export async function getAdminEquityAccounts(
  params: EquityListParams,
): Promise<AdminEquityListResult> {
  const { page, pageSize } = clampPagination(params.page, params.pageSize);
  const offset = (page - 1) * pageSize;
  const { whereSql, values } = buildListWhere(params);
  const db = getDbPool();

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ea.id,
        ea.user_id,
        up.name AS user_name,
        u.phone_number,
        up.avatar_url,
        ea.category_amount,
        ea.exchange_amount,
        ea.general_amount,
        ea.total_granted,
        ea.total_used,
        ea.total_expired,
        ea.created_at,
        ea.updated_at
      FROM equity_account ea
      LEFT JOIN \`user\` u ON u.id = ea.user_id
      LEFT JOIN user_profile up ON up.user_id = ea.user_id
      ${whereSql}
      ORDER BY ea.updated_at DESC, ea.id DESC
      LIMIT ? OFFSET ?
    `,
    [...values, pageSize, offset],
  );

  const [countRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM equity_account ea
      LEFT JOIN \`user\` u ON u.id = ea.user_id
      LEFT JOIN user_profile up ON up.user_id = ea.user_id
      ${whereSql}
    `,
    values,
  );

  const [summaryRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        COUNT(*) AS total_accounts,
        COALESCE(SUM(ea.total_granted), 0) AS total_granted,
        COALESCE(SUM(ea.total_used), 0) AS total_used,
        COALESCE(SUM(ea.total_expired), 0) AS total_expired,
        COALESCE(SUM(ea.category_amount + ea.exchange_amount + ea.general_amount), 0) AS active_balance
      FROM equity_account ea
      LEFT JOIN \`user\` u ON u.id = ea.user_id
      LEFT JOIN user_profile up ON up.user_id = ea.user_id
      ${whereSql}
    `,
    values,
  );

  const total = Number((countRows[0] as { total?: number | string } | undefined)?.total ?? 0);
  const summaryRow = (summaryRows[0] as SummaryRow | undefined) ?? {
    total_accounts: 0,
    total_granted: 0,
    total_used: 0,
    total_expired: 0,
    active_balance: 0,
  };

  return {
    items: (rows as EquityAccountRow[]).map(sanitizeEquityAccount),
    total,
    page,
    pageSize,
    summary: {
      totalAccounts: Number(summaryRow.total_accounts ?? 0),
      totalGranted: toMoneyInCents(summaryRow.total_granted),
      totalUsed: toMoneyInCents(summaryRow.total_used),
      totalExpired: toMoneyInCents(summaryRow.total_expired),
      activeBalance: toMoneyInCents(summaryRow.active_balance),
    },
  };
}

export async function getAdminEquityDetail(userId: string): Promise<AdminEquityDetailResult> {
  const db = getDbPool();
  const [accountRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        ea.id,
        ea.user_id,
        up.name AS user_name,
        u.phone_number,
        up.avatar_url,
        ea.category_amount,
        ea.exchange_amount,
        ea.general_amount,
        ea.total_granted,
        ea.total_used,
        ea.total_expired,
        ea.created_at,
        ea.updated_at
      FROM equity_account ea
      LEFT JOIN \`user\` u ON u.id = ea.user_id
      LEFT JOIN user_profile up ON up.user_id = ea.user_id
      WHERE ea.user_id = ?
      LIMIT 1
    `,
    [userId],
  );

  const accountRow = (accountRows[0] as EquityAccountRow | undefined) ?? null;
  if (!accountRow) {
    throw new HttpError(404, 'ADMIN_EQUITY_ACCOUNT_NOT_FOUND', '权益金账户不存在');
  }

  const [logRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        id,
        account_id,
        user_id,
        type,
        sub_type,
        amount,
        balance,
        source_type,
        ref_id,
        note,
        expire_at,
        created_at
      FROM equity_log
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 100
    `,
    [userId],
  );

  return {
    account: sanitizeEquityAccount(accountRow),
    logs: (logRows as EquityLogRow[]).map(sanitizeEquityLog),
  };
}

export async function adjustAdminEquity(
  payload: AdjustAdminEquityPayload,
): Promise<AdjustAdminEquityResult> {
  if (!payload.userId) {
    throw new HttpError(400, 'ADMIN_EQUITY_USER_REQUIRED', '用户不能为空');
  }
  if (!payload.subType) {
    throw new HttpError(400, 'ADMIN_EQUITY_SUB_TYPE_REQUIRED', '请选择子账户');
  }
  if (!Number.isFinite(payload.amount) || payload.amount === 0) {
    throw new HttpError(400, 'ADMIN_EQUITY_AMOUNT_INVALID', '请输入有效金额');
  }

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [accountRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          id,
          user_id,
          category_amount,
          exchange_amount,
          general_amount,
          total_granted,
          total_used,
          total_expired,
          created_at,
          updated_at
        FROM equity_account
        WHERE user_id = ?
        FOR UPDATE
      `,
      [payload.userId],
    );

    let accountRow = (accountRows[0] as EquityAccountRow | undefined) ?? null;
    const amountYuan = payload.amount / 100;
    const fieldCode = mapEquitySubTypeCode(payload.subType);
    const fieldMap: Record<AdjustAdminEquityPayload['subType'], string> = {
      category: 'category_amount',
      exchange: 'exchange_amount',
      general: 'general_amount',
    };
    const selectedField = fieldMap[payload.subType];

    if (!accountRow) {
      if (amountYuan < 0) {
        throw new HttpError(400, 'ADMIN_EQUITY_INSUFFICIENT_BALANCE', '余额不足，无法扣减');
      }

      await connection.execute(
        `
          INSERT INTO equity_account (
            user_id,
            category_amount,
            exchange_amount,
            general_amount,
            total_granted,
            total_used,
            total_expired
          ) VALUES (?, 0, 0, 0, 0, 0, 0)
        `,
        [payload.userId],
      );

      const [createdRows] = await connection.execute<mysql.RowDataPacket[]>(
        `
          SELECT
            id,
            user_id,
            category_amount,
            exchange_amount,
            general_amount,
            total_granted,
            total_used,
            total_expired,
            created_at,
            updated_at
          FROM equity_account
          WHERE user_id = ?
          LIMIT 1
        `,
        [payload.userId],
      );
      accountRow = (createdRows[0] as EquityAccountRow | undefined) ?? null;
    }

    if (!accountRow) {
      throw new HttpError(500, 'ADMIN_EQUITY_ACCOUNT_CREATE_FAILED', '权益金账户初始化失败');
    }

    const currentValue = Number((accountRow as Record<string, number | string | null>)[selectedField] ?? 0);
    const nextValue = currentValue + amountYuan;
    if (nextValue < 0) {
      throw new HttpError(400, 'ADMIN_EQUITY_INSUFFICIENT_BALANCE', '余额不足，无法扣减');
    }

    const totalGrantedIncrement = amountYuan > 0 ? amountYuan : 0;
    const totalUsedIncrement = amountYuan < 0 ? Math.abs(amountYuan) : 0;

    await connection.execute(
      `
        UPDATE equity_account
        SET
          ${selectedField} = ${selectedField} + ?,
          total_granted = total_granted + ?,
          total_used = total_used + ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [amountYuan, totalGrantedIncrement, totalUsedIncrement, accountRow.id],
    );

    const [updatedRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          id,
          user_id,
          category_amount,
          exchange_amount,
          general_amount,
          total_granted,
          total_used,
          total_expired,
          created_at,
          updated_at
        FROM equity_account
        WHERE id = ?
        LIMIT 1
      `,
      [accountRow.id],
    );
    const updatedAccountRow = (updatedRows[0] as EquityAccountRow | undefined) ?? null;
    if (!updatedAccountRow) {
      throw new HttpError(500, 'ADMIN_EQUITY_ACCOUNT_UPDATE_FAILED', '权益金账户更新失败');
    }

    const totalBalanceYuan =
      Number(updatedAccountRow.category_amount ?? 0) +
      Number(updatedAccountRow.exchange_amount ?? 0) +
      Number(updatedAccountRow.general_amount ?? 0);

    const [logResult] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO equity_log (
          account_id,
          user_id,
          type,
          sub_type,
          amount,
          balance,
          source_type,
          note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        updatedAccountRow.id,
        payload.userId,
        EQUITY_LOG_TYPE_ADJUST,
        fieldCode,
        amountYuan,
        totalBalanceYuan,
        EQUITY_SOURCE_TYPE_ADMIN,
        payload.note?.trim() || (amountYuan > 0 ? '后台增加权益金' : '后台扣减权益金'),
      ],
    );

    const [detailRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          ea.id,
          ea.user_id,
          up.name AS user_name,
          u.phone_number,
          up.avatar_url,
          ea.category_amount,
          ea.exchange_amount,
          ea.general_amount,
          ea.total_granted,
          ea.total_used,
          ea.total_expired,
          ea.created_at,
          ea.updated_at
        FROM equity_account ea
        LEFT JOIN \`user\` u ON u.id = ea.user_id
        LEFT JOIN user_profile up ON up.user_id = ea.user_id
        WHERE ea.id = ?
        LIMIT 1
      `,
      [updatedAccountRow.id],
    );

    const [logRows] = await connection.execute<mysql.RowDataPacket[]>(
      `
        SELECT
          id,
          account_id,
          user_id,
          type,
          sub_type,
          amount,
          balance,
          source_type,
          ref_id,
          note,
          expire_at,
          created_at
        FROM equity_log
        WHERE id = ?
        LIMIT 1
      `,
      [logResult.insertId],
    );

    await connection.commit();

    return {
      account: sanitizeEquityAccount((detailRows[0] as EquityAccountRow) ?? updatedAccountRow),
      log: sanitizeEquityLog(logRows[0] as EquityLogRow),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
