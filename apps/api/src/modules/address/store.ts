import type mysql from 'mysql2/promise';

import type {
  AddressPayload,
  AddressListResult,
  UserAddressItem,
} from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';

type AddressRow = {
  id: number | string;
  user_id: number | string;
  name: string | null;
  phone_number: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  detail: string | null;
  tag: string | null;
  is_default: number | string | boolean | null;
};

/**
 * 把地址表记录转换成前端地址契约。
 */
function sanitizeAddress(row: AddressRow): UserAddressItem {
  return {
    id: toEntityId(row.id),
    name: row.name || '',
    phone: row.phone_number || '',
    province: row.province || '',
    city: row.city || '',
    district: row.district || '',
    detail: row.detail || '',
    tag: row.tag?.trim() || null,
    isDefault: Boolean(row.is_default),
  };
}

/**
 * 读取当前用户拥有的单条地址。
 * 地址更新、删除、设默认都先走这条链路确认归属。
 */
async function getOwnedAddress(userId: string, addressId: string) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, user_id, name, phone_number, province, city, district, detail, tag, is_default
      FROM address
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [addressId, userId],
  );

  return (rows[0] as AddressRow | undefined) ?? null;
}

/**
 * 确认地址归属当前用户。
 */
async function ensureOwnedAddress(userId: string, addressId: string) {
  const address = await getOwnedAddress(userId, addressId);
  if (!address) {
    throw new HttpError(404, 'ADDRESS_NOT_FOUND', '地址不存在');
  }
  return address;
}

/**
 * 规范化地址入参。
 * 这里统一做 trim 和必填校验，避免 store 里每个写操作重复判断。
 */
function normalizePayload(payload: AddressPayload) {
  const name = payload.name?.trim();
  const phone = payload.phone?.trim();
  const province = payload.province?.trim();
  const city = payload.city?.trim();
  const district = payload.district?.trim();
  const detail = payload.detail?.trim();
  const tag = payload.tag?.trim() || null;

  if (!name || !phone || !province || !city || !district || !detail) {
    throw new HttpError(400, 'ADDRESS_INVALID', '请填写完整地址信息');
  }

  return {
    name,
    phone,
    province,
    city,
    district,
    detail,
    tag,
    isDefault: Boolean(payload.isDefault),
  };
}

/**
 * 读取当前用户地址列表。
 */
export async function listAddresses(userId: string): Promise<AddressListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT id, user_id, name, phone_number, province, city, district, detail, tag, is_default
      FROM address
      WHERE user_id = ?
      ORDER BY is_default DESC, updated_at DESC, id DESC
    `,
    [userId],
  );

  return {
    items: (rows as AddressRow[]).map((row) => sanitizeAddress(row)),
  };
}

/**
 * 新增地址。
 * 当新地址被设为默认地址时，会先把用户原默认地址取消。
 */
export async function createAddress(userId: string, payload: AddressPayload): Promise<UserAddressItem> {
  const normalized = normalizePayload(payload);
  const db = getDbPool();

  if (normalized.isDefault) {
    await db.execute(
      `
        UPDATE address
        SET is_default = 0, updated_at = CURRENT_TIMESTAMP(3)
        WHERE user_id = ?
          AND is_default = 1
      `,
      [userId],
    );
  }

  const [result] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO address (
        user_id, name, phone_number, province, city, district, detail, tag, is_default, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [
      userId,
      normalized.name,
      normalized.phone,
      normalized.province,
      normalized.city,
      normalized.district,
      normalized.detail,
      normalized.tag,
      normalized.isDefault ? 1 : 0,
    ],
  );

  const created = await ensureOwnedAddress(userId, String(result.insertId));
  return sanitizeAddress(created);
}

/**
 * 更新地址。
 * 默认地址切换也在这里统一处理。
 */
export async function updateAddress(userId: string, addressId: string, payload: AddressPayload): Promise<UserAddressItem> {
  await ensureOwnedAddress(userId, addressId);
  const normalized = normalizePayload(payload);
  const db = getDbPool();

  if (normalized.isDefault) {
    await db.execute(
      `
        UPDATE address
        SET is_default = 0, updated_at = CURRENT_TIMESTAMP(3)
        WHERE user_id = ?
          AND id <> ?
          AND is_default = 1
      `,
      [userId, addressId],
    );
  }

  await db.execute(
    `
      UPDATE address
      SET
        name = ?,
        phone_number = ?,
        province = ?,
        city = ?,
        district = ?,
        detail = ?,
        tag = ?,
        is_default = ?,
        updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ?
        AND user_id = ?
    `,
    [
      normalized.name,
      normalized.phone,
      normalized.province,
      normalized.city,
      normalized.district,
      normalized.detail,
      normalized.tag,
      normalized.isDefault ? 1 : 0,
      addressId,
      userId,
    ],
  );

  const updated = await ensureOwnedAddress(userId, addressId);
  return sanitizeAddress(updated);
}

/**
 * 删除地址。
 * 如果删掉的是默认地址，会自动把最近一条地址补成新的默认地址。
 */
export async function deleteAddress(userId: string, addressId: string) {
  const address = await ensureOwnedAddress(userId, addressId);
  const db = getDbPool();

  await db.execute(
    `
      DELETE FROM address
      WHERE id = ?
        AND user_id = ?
    `,
    [addressId, userId],
  );

  if (Boolean(address.is_default)) {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM address
        WHERE user_id = ?
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      `,
      [userId],
    );

    const next = rows[0] as { id?: number | string } | undefined;
    if (next?.id) {
      await db.execute(
        `
          UPDATE address
          SET is_default = 1, updated_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
            AND user_id = ?
        `,
        [next.id, userId],
      );
    }
  }

  return { success: true as const, id: toEntityId(addressId) };
}
