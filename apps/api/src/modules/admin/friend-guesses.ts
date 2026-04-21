import type mysql from 'mysql2/promise';

import { getDbPool } from '../../lib/db';
import {
  FRIEND_CONFIRM_CONFIRMED,
  FRIEND_CONFIRM_REJECTED,
  GUESS_ACTIVE,
  GUESS_REJECTED,
  GUESS_SCOPE_FRIENDS,
  GUESS_SETTLED,
  INVITATION_ACCEPTED,
  INVITATION_EXPIRED,
  INVITATION_PENDING,
  INVITATION_REJECTED,
  FriendGuessRow,
  fallbackUserName,
  toIsoString,
  toNumber,
  toOptionalNumber,
  toOptionalStringId,
} from './guesses-shared';

export type AdminFriendGuessStatus = 'pending' | 'active' | 'pending_confirm' | 'ended';

export interface AdminFriendGuessItem {
  id: string;
  guessId: string;
  roomName: string;
  inviterId: string;
  inviter: string;
  participants: number;
  reward: string;
  status: AdminFriendGuessStatus;
  statusLabel: '待开赛' | '进行中' | '待确认' | '已结束';
  endTime: string;
  invitationCount: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  rejectedInvitations: number;
  expiredInvitations: number;
  confirmedResults: number;
  rejectedResults: number;
  betParticipantCount: number;
  paidAmount: number;
  paymentMode: number | null;
  paidBy: string | null;
}

export interface AdminFriendGuessListResult {
  items: AdminFriendGuessItem[];
}

function mapFriendGuessStatus(
  guessStatus: number | string,
  reviewStatus: number | string,
  confirmedResults: number,
  rejectedResults: number,
  betParticipantCount: number,
): AdminFriendGuessItem['status'] {
  const status = Number(guessStatus ?? 0);
  const review = Number(reviewStatus ?? 0);

  if (status === GUESS_ACTIVE && review === 30) {
    return 'active';
  }

  if (status === GUESS_SETTLED || status === GUESS_REJECTED) {
    if (betParticipantCount > 0 && confirmedResults + rejectedResults < betParticipantCount) {
      return 'pending_confirm';
    }
    return 'ended';
  }

  return 'pending';
}

function mapFriendGuessStatusLabel(
  status: AdminFriendGuessItem['status'],
): AdminFriendGuessItem['statusLabel'] {
  if (status === 'active') {
    return '进行中';
  }

  if (status === 'pending_confirm') {
    return '待确认';
  }

  if (status === 'ended') {
    return '已结束';
  }

  return '待开赛';
}

async function getFriendGuessRows() {
  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        g.id AS guess_id,
        g.title,
        g.status,
        g.review_status,
        g.end_time,
        g.creator_id,
        invitation_stats.inviter_id,
        inviter_profile.name AS inviter_name,
        inviter_user.phone_number AS inviter_phone,
        p.name AS product_name,
        invitation_stats.invitation_count,
        invitation_stats.pending_count,
        invitation_stats.accepted_count,
        invitation_stats.rejected_count,
        invitation_stats.expired_count,
        COALESCE(confirm_stats.confirm_count, 0) AS confirm_count,
        COALESCE(confirm_stats.reject_confirm_count, 0) AS reject_confirm_count,
        COALESCE(bet_stats.bet_participant_count, 0) AS bet_participant_count,
        invitation_stats.total_paid_amount,
        invitation_stats.payment_mode,
        invitation_stats.paid_by
      FROM guess g
      INNER JOIN (
        SELECT
          guess_id,
          MIN(inviter_id) AS inviter_id,
          COUNT(*) AS invitation_count,
          SUM(CASE WHEN status = ${INVITATION_PENDING} THEN 1 ELSE 0 END) AS pending_count,
          SUM(CASE WHEN status = ${INVITATION_ACCEPTED} THEN 1 ELSE 0 END) AS accepted_count,
          SUM(CASE WHEN status = ${INVITATION_REJECTED} THEN 1 ELSE 0 END) AS rejected_count,
          SUM(CASE WHEN status = ${INVITATION_EXPIRED} THEN 1 ELSE 0 END) AS expired_count,
          SUM(COALESCE(paid_amount, 0)) AS total_paid_amount,
          MAX(payment_mode) AS payment_mode,
          MAX(paid_by) AS paid_by
        FROM guess_invitation
        GROUP BY guess_id
      ) invitation_stats ON invitation_stats.guess_id = g.id
      LEFT JOIN (
        SELECT
          guess_id,
          SUM(CASE WHEN action = ${FRIEND_CONFIRM_CONFIRMED} THEN 1 ELSE 0 END) AS confirm_count,
          SUM(CASE WHEN action = ${FRIEND_CONFIRM_REJECTED} THEN 1 ELSE 0 END) AS reject_confirm_count
        FROM friend_guess_confirm
        GROUP BY guess_id
      ) confirm_stats ON confirm_stats.guess_id = g.id
      LEFT JOIN (
        SELECT guess_id, COUNT(*) AS bet_participant_count
        FROM guess_bet
        GROUP BY guess_id
      ) bet_stats ON bet_stats.guess_id = g.id
      LEFT JOIN user inviter_user
        ON inviter_user.id = COALESCE(invitation_stats.inviter_id, g.creator_id)
      LEFT JOIN user_profile inviter_profile
        ON inviter_profile.user_id = inviter_user.id
      LEFT JOIN (
        SELECT guess_id, MIN(id) AS first_guess_product_id
        FROM guess_product
        GROUP BY guess_id
      ) first_gp ON first_gp.guess_id = g.id
      LEFT JOIN guess_product gp ON gp.id = first_gp.first_guess_product_id
      LEFT JOIN product p ON p.id = gp.product_id
      WHERE g.scope = ${GUESS_SCOPE_FRIENDS}
      ORDER BY g.created_at DESC, g.id DESC
    `,
  );

  return rows as FriendGuessRow[];
}

export async function getAdminFriendGuesses(): Promise<AdminFriendGuessListResult> {
  const rows = await getFriendGuessRows();

  return {
    items: rows.map((row) => {
      const acceptedInvitations = toNumber(row.accepted_count);
      const confirmedResults = toNumber(row.confirm_count);
      const rejectedResults = toNumber(row.reject_confirm_count);
      const betParticipantCount = toNumber(row.bet_participant_count);
      const status = mapFriendGuessStatus(
        row.status,
        row.review_status,
        confirmedResults,
        rejectedResults,
        betParticipantCount,
      );
      const participants = Math.max(2, acceptedInvitations + 1, betParticipantCount);
      const inviterId = toOptionalStringId(row.inviter_id ?? row.creator_id) ?? '';

      return {
        id: `friend-${String(row.guess_id)}`,
        guessId: String(row.guess_id),
        roomName: `${row.title} 好友房`,
        inviterId,
        inviter: fallbackUserName(
          row.inviter_name,
          row.inviter_phone,
          row.inviter_id ?? row.creator_id,
        ),
        participants,
        reward: row.product_name || row.title,
        status,
        statusLabel: mapFriendGuessStatusLabel(status),
        endTime: toIsoString(row.end_time),
        invitationCount: toNumber(row.invitation_count),
        pendingInvitations: toNumber(row.pending_count),
        acceptedInvitations,
        rejectedInvitations: toNumber(row.rejected_count),
        expiredInvitations: toNumber(row.expired_count),
        confirmedResults,
        rejectedResults,
        betParticipantCount,
        paidAmount: toNumber(row.total_paid_amount),
        paymentMode: toOptionalNumber(row.payment_mode),
        paidBy: toOptionalStringId(row.paid_by),
      };
    }),
  };
}
