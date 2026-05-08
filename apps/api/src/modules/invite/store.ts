import type mysql from 'mysql2/promise';

import { toEntityId, type InviteRecordListResult } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { claimCouponFromTemplate } from '../coupon/store';

const REWARD_TYPE_COIN = 10;
const REWARD_TYPE_COUPON = 20;
const REWARD_TYPE_PHYSICAL = 30;
const CONFIG_STATUS_ACTIVE = 10;

type InviteRewardConfigRow = mysql.RowDataPacket & {
  inviter_reward_type: number | string;
  inviter_reward_ref_id: number | string | null;
  invitee_reward_type: number | string;
  invitee_reward_ref_id: number | string | null;
};

type InviteRecordRow = mysql.RowDataPacket & {
  invitee_id: number | string;
  invitee_phone: string | null;
  invitee_created_at: Date | string;
  invitee_name: string | null;
  invitee_avatar: string | null;
};

async function readActiveInviteRewardConfig(): Promise<InviteRewardConfigRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<InviteRewardConfigRow[]>(
    `
      SELECT inviter_reward_type, inviter_reward_ref_id,
             invitee_reward_type, invitee_reward_ref_id
      FROM invite_reward_config
      WHERE status = ?
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `,
    [CONFIG_STATUS_ACTIVE],
  );
  return rows[0] ?? null;
}

async function grantOneSide(
  userId: string,
  rewardType: number | string,
  refId: number | string | null,
  side: 'inviter' | 'invitee',
): Promise<void> {
  const type = Number(rewardType);
  if (type === REWARD_TYPE_COIN) {
    console.warn('invite reward skipped (coin已下线)', { side, userId });
    return;
  }
  if (type === REWARD_TYPE_PHYSICAL) {
    console.warn('invite reward skipped (physical 一期不发)', { side, userId });
    return;
  }
  if (type !== REWARD_TYPE_COUPON) {
    console.warn('invite reward skipped (unknown type)', { side, userId, rewardType });
    return;
  }
  if (refId == null) {
    console.warn('invite reward skipped (coupon 无 template_id)', { side, userId });
    return;
  }
  await claimCouponFromTemplate(userId, String(refId));
}

/**
 * 注册主流程返回前调用：给邀请人 + 被邀请人各发一张券。
 * 失败仅 log，不抛——主流程不能被发券失败拖死。
 */
export async function maybeGrantInviteRewards(
  inviterId: string | null,
  inviteeId: string,
): Promise<void> {
  if (!inviterId) return;
  if (inviterId === inviteeId) return;

  const config = await readActiveInviteRewardConfig();
  if (!config) return;

  await grantOneSide(inviterId, config.inviter_reward_type, config.inviter_reward_ref_id, 'inviter')
    .catch((e) => console.error('invite reward grant inviter failed', { inviterId, e }));

  await grantOneSide(inviteeId, config.invitee_reward_type, config.invitee_reward_ref_id, 'invitee')
    .catch((e) => console.error('invite reward grant invitee failed', { inviteeId, e }));
}

export async function getMyInviteRecords(userId: string): Promise<InviteRecordListResult> {
  const db = getDbPool();
  const [rows] = await db.execute<InviteRecordRow[]>(
    `
      SELECT
        invitee.id AS invitee_id,
        invitee.phone_number AS invitee_phone,
        invitee.created_at AS invitee_created_at,
        invitee_profile.name AS invitee_name,
        invitee_profile.avatar_url AS invitee_avatar
      FROM user invitee
      LEFT JOIN user_profile invitee_profile ON invitee_profile.user_id = invitee.id
      WHERE invitee.invited_by = ?
      ORDER BY invitee.created_at DESC, invitee.id DESC
      LIMIT 100
    `,
    [userId],
  );

  const items = rows.map((row) => {
    const trimmedName = row.invitee_name?.trim();
    const fallbackName = row.invitee_phone
      ? `用户${String(row.invitee_phone).slice(-4)}`
      : `用户 ${row.invitee_id}`;
    return {
      id: toEntityId(row.invitee_id),
      name: trimmedName || fallbackName,
      avatar: row.invitee_avatar ?? null,
      registeredAt: new Date(row.invitee_created_at).toISOString(),
    };
  });

  return { items, total: items.length };
}
