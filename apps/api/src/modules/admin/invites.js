import { toEntityId, } from '@umi/shared';
import { HttpError } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
const REWARD_TYPE_COIN = 10;
const REWARD_TYPE_COUPON = 20;
const REWARD_TYPE_PHYSICAL = 30;
const CONFIG_STATUS_ACTIVE = 10;
const CONFIG_STATUS_DISABLED = 90;
function toNumber(value) {
    return Number(value ?? 0);
}
function toIso(value) {
    return new Date(value).toISOString();
}
function mapRewardType(rewardType) {
    const code = Number(rewardType ?? 0);
    if (code === REWARD_TYPE_COUPON) {
        return { type: 'coupon', label: '优惠券' };
    }
    if (code === REWARD_TYPE_PHYSICAL) {
        return { type: 'physical', label: '实物' };
    }
    return { type: 'coin', label: '零食币' };
}
function mapRewardTypeCode(type) {
    if (type === 'coupon') {
        return REWARD_TYPE_COUPON;
    }
    if (type === 'physical') {
        return REWARD_TYPE_PHYSICAL;
    }
    return REWARD_TYPE_COIN;
}
function mapStatus(status) {
    return Number(status ?? 0) === CONFIG_STATUS_ACTIVE
        ? { status: 'active', statusLabel: '启用' }
        : { status: 'disabled', statusLabel: '停用' };
}
function mapStatusCode(status) {
    return status === 'disabled' ? CONFIG_STATUS_DISABLED : CONFIG_STATUS_ACTIVE;
}
function normalizeRewardValue(value, label) {
    const result = Number(value ?? 0);
    if (!Number.isFinite(result) || result <= 0) {
        throw new Error(`${label}不合法`);
    }
    return result;
}
function normalizeOptionalRefId(value, label) {
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
function normalizePayload(payload) {
    const inviterRewardValue = normalizeRewardValue(payload.inviterRewardValue, '邀请人奖励数值');
    const inviteeRewardValue = normalizeRewardValue(payload.inviteeRewardValue, '被邀请人奖励数值');
    const inviterRewardRefId = normalizeOptionalRefId(payload.inviterRewardRefId, '邀请人奖励关联 ID');
    const inviteeRewardRefId = normalizeOptionalRefId(payload.inviteeRewardRefId, '被邀请人奖励关联 ID');
    if ((payload.inviterRewardType === 'coupon' || payload.inviterRewardType === 'physical') &&
        !inviterRewardRefId) {
        throw new Error('邀请人奖励必须填写奖励关联 ID');
    }
    if ((payload.inviteeRewardType === 'coupon' || payload.inviteeRewardType === 'physical') &&
        !inviteeRewardRefId) {
        throw new Error('被邀请人奖励必须填写奖励关联 ID');
    }
    return {
        inviterRewardTypeCode: mapRewardTypeCode(payload.inviterRewardType),
        inviterRewardValue,
        inviterRewardRefId,
        inviteeRewardTypeCode: mapRewardTypeCode(payload.inviteeRewardType),
        inviteeRewardValue,
        inviteeRewardRefId,
        statusCode: mapStatusCode(payload.status),
    };
}
function sanitizeInviteRewardConfig(row) {
    const inviterReward = mapRewardType(row.inviter_reward_type);
    const inviteeReward = mapRewardType(row.invitee_reward_type);
    return {
        id: toEntityId(row.id),
        inviterRewardType: inviterReward.type,
        inviterRewardTypeLabel: inviterReward.label,
        inviterRewardValue: toNumber(row.inviter_reward_value),
        inviterRewardRefId: row.inviter_reward_ref_id == null ? null : toEntityId(row.inviter_reward_ref_id),
        inviteeRewardType: inviteeReward.type,
        inviteeRewardTypeLabel: inviteeReward.label,
        inviteeRewardValue: toNumber(row.invitee_reward_value),
        inviteeRewardRefId: row.invitee_reward_ref_id == null ? null : toEntityId(row.invitee_reward_ref_id),
        ...mapStatus(row.status),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
    };
}
function fallbackUserName(name, phone, id) {
    const trimmed = name?.trim();
    if (trimmed) {
        return trimmed;
    }
    if (phone?.trim()) {
        return phone.trim();
    }
    return `用户 ${id}`;
}
async function fetchCurrentInviteRewardConfigRow(db) {
    const [rows] = await db.execute(`
      SELECT
        id,
        inviter_reward_type,
        inviter_reward_value,
        inviter_reward_ref_id,
        invitee_reward_type,
        invitee_reward_value,
        invitee_reward_ref_id,
        status,
        created_at,
        updated_at
      FROM invite_reward_config
      ORDER BY (status = ?) DESC, updated_at DESC, id DESC
      LIMIT 1
    `, [CONFIG_STATUS_ACTIVE]);
    return (rows[0] ?? null);
}
function buildInviteRecordWhere(params) {
    const clauses = ['invitee.invited_by IS NOT NULL'];
    const values = [];
    if (params.inviter?.trim()) {
        const keyword = `%${params.inviter.trim()}%`;
        clauses.push(`(
        inviter_profile.name LIKE ?
        OR inviter.phone_number LIKE ?
        OR inviter.uid_code LIKE ?
      )`);
        values.push(keyword, keyword, keyword);
    }
    if (params.invitee?.trim()) {
        const keyword = `%${params.invitee.trim()}%`;
        clauses.push(`(
        invitee_profile.name LIKE ?
        OR invitee.phone_number LIKE ?
        OR invitee.uid_code LIKE ?
      )`);
        values.push(keyword, keyword, keyword);
    }
    if (params.inviteCode?.trim()) {
        clauses.push('inviter.invite_code LIKE ?');
        values.push(`%${params.inviteCode.trim()}%`);
    }
    return {
        whereSql: `WHERE ${clauses.join(' AND ')}`,
        values,
    };
}
export async function getAdminInviteRewardConfig() {
    const db = getDbPool();
    const row = await fetchCurrentInviteRewardConfigRow(db);
    return row ? sanitizeInviteRewardConfig(row) : null;
}
export async function updateAdminInviteRewardConfig(payload) {
    const db = getDbPool();
    const normalized = normalizePayload(payload);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const current = await fetchCurrentInviteRewardConfigRow(connection);
        if (current) {
            await connection.execute(`
          UPDATE invite_reward_config
          SET
            inviter_reward_type = ?,
            inviter_reward_value = ?,
            inviter_reward_ref_id = ?,
            invitee_reward_type = ?,
            invitee_reward_value = ?,
            invitee_reward_ref_id = ?,
            status = ?,
            updated_at = NOW(3)
          WHERE id = ?
        `, [
                normalized.inviterRewardTypeCode,
                normalized.inviterRewardValue,
                normalized.inviterRewardRefId,
                normalized.inviteeRewardTypeCode,
                normalized.inviteeRewardValue,
                normalized.inviteeRewardRefId,
                normalized.statusCode,
                current.id,
            ]);
        }
        else {
            await connection.execute(`
          INSERT INTO invite_reward_config (
            inviter_reward_type,
            inviter_reward_value,
            inviter_reward_ref_id,
            invitee_reward_type,
            invitee_reward_value,
            invitee_reward_ref_id,
            status,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
        `, [
                normalized.inviterRewardTypeCode,
                normalized.inviterRewardValue,
                normalized.inviterRewardRefId,
                normalized.inviteeRewardTypeCode,
                normalized.inviteeRewardValue,
                normalized.inviteeRewardRefId,
                normalized.statusCode,
            ]);
        }
        const latest = await fetchCurrentInviteRewardConfigRow(connection);
        if (!latest) {
            throw new HttpError(500, 'ADMIN_INVITE_CONFIG_SAVE_FAILED', '邀请奖励配置保存失败');
        }
        await connection.commit();
        return {
            item: sanitizeInviteRewardConfig(latest),
        };
    }
    catch (error) {
        await connection.rollback();
        if (error instanceof HttpError) {
            throw error;
        }
        if (error instanceof Error) {
            throw new HttpError(400, 'ADMIN_INVITE_CONFIG_INVALID', error.message || '邀请奖励配置保存失败');
        }
        throw new HttpError(400, 'ADMIN_INVITE_CONFIG_INVALID', '邀请奖励配置保存失败');
    }
    finally {
        connection.release();
    }
}
export async function getAdminInviteRecords(params = {}) {
    const db = getDbPool();
    const { whereSql, values } = buildInviteRecordWhere(params);
    const [rows] = await db.execute(`
      SELECT
        invitee.id AS invitee_id,
        invitee_profile.name AS invitee_name,
        invitee.phone_number AS invitee_phone,
        invitee.uid_code AS invitee_uid_code,
        invitee.created_at AS invitee_created_at,
        inviter.id AS inviter_id,
        inviter_profile.name AS inviter_name,
        inviter.phone_number AS inviter_phone,
        inviter.uid_code AS inviter_uid_code,
        inviter.invite_code AS invite_code
      FROM user invitee
      INNER JOIN user inviter
        ON inviter.id = invitee.invited_by
      LEFT JOIN user_profile invitee_profile
        ON invitee_profile.user_id = invitee.id
      LEFT JOIN user_profile inviter_profile
        ON inviter_profile.user_id = inviter.id
      ${whereSql}
      ORDER BY invitee.created_at DESC, invitee.id DESC
    `, values);
    const items = rows.map((row) => ({
        id: toEntityId(row.invitee_id),
        inviterId: toEntityId(row.inviter_id),
        inviterName: fallbackUserName(row.inviter_name, row.inviter_phone, row.inviter_id),
        inviterPhone: row.inviter_phone,
        inviterUidCode: row.inviter_uid_code,
        inviteCode: row.invite_code,
        inviteeId: toEntityId(row.invitee_id),
        inviteeName: fallbackUserName(row.invitee_name, row.invitee_phone, row.invitee_id),
        inviteePhone: row.invitee_phone,
        inviteeUidCode: row.invitee_uid_code,
        registeredAt: toIso(row.invitee_created_at),
    }));
    return {
        items,
        summary: {
            total: items.length,
            distinctInviters: new Set(items.map((item) => item.inviterId)).size,
        },
    };
}
