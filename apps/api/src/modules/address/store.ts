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

async function ensureOwnedAddress(userId: string, addressId: string) {
  const address = await getOwnedAddress(userId, addressId);
  if (!address) {
    throw new HttpError(404, 'ADDRESS_NOT_FOUND', '地址不存在');
  }
  return address;
}

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
