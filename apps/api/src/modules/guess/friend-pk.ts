import type mysql from 'mysql2/promise';
import type { FriendPkResult, FriendPkSummary } from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { GUESS_ACTIVE, REVIEW_APPROVED } from './guess-shared';

const GUESS_SCOPE_FRIENDS = 20;
const INVITATION_PENDING = 10;
const INVITATION_ACCEPTED = 30;

type Row = {
  guess_id: number | string;
  title: string;
  end_time: Date | string;
  creator_id: number | string;
  creator_name: string | null;
  creator_avatar: string | null;
};

type OptionRow = {
  option_index: number | string;
  option_text: string;
  vote_count: number | string;
};

export async function getFriendPkSummary(currentUserId: string): Promise<FriendPkResult> {
  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        g.id AS guess_id,
        g.title,
        g.end_time,
        g.creator_id,
        up.name AS creator_name,
        up.avatar_url AS creator_avatar
      FROM guess_invitation gi
      INNER JOIN guess g ON g.id = gi.guess_id
      LEFT JOIN user_profile up ON up.user_id = g.creator_id
      WHERE gi.invitee_id = ?
        AND gi.status IN (?, ?)
        AND g.scope = ?
        AND g.status = ?
        AND g.review_status = ?
        AND g.end_time > NOW()
      ORDER BY gi.created_at DESC, g.id DESC
      LIMIT 1
    `,
    [
      currentUserId,
      INVITATION_PENDING,
      INVITATION_ACCEPTED,
      GUESS_SCOPE_FRIENDS,
      GUESS_ACTIVE,
      REVIEW_APPROVED,
    ],
  );

  const row = (rows as Row[])[0];
  if (!row) {
    return { item: null };
  }

  const [optionRows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT
        go.option_index,
        go.option_text,
        COALESCE(vc.vote_count, 0) AS vote_count
      FROM guess_option go
      LEFT JOIN (
        SELECT choice_idx AS option_index, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id = ?
        GROUP BY choice_idx
      ) vc ON vc.option_index = go.option_index
      WHERE go.guess_id = ?
      ORDER BY go.option_index ASC
    `,
    [String(row.guess_id), String(row.guess_id)],
  );

  const options = optionRows as OptionRow[];
  const totalVotes = options.reduce((sum, o) => sum + Number(o.vote_count ?? 0), 0);

  const item: FriendPkSummary = {
    id: toEntityId(row.guess_id),
    title: row.title,
    endTime: new Date(row.end_time).toISOString(),
    creator: {
      id: toEntityId(row.creator_id),
      name: row.creator_name?.trim() || `用户${row.creator_id}`,
      avatar: row.creator_avatar,
    },
    options: options.map((o) => {
      const voteCount = Number(o.vote_count ?? 0);
      return {
        text: o.option_text,
        voteCount,
        pct: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
      };
    }),
  };

  return { item };
}
