import type mysql from 'mysql2/promise';

import { toEntityId, type GuessHistoryResult } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { PAY_STATUS_PAID, PAY_STATUS_REFUNDED } from '../payment/payment-shared';
import {
  BET_PENDING,
  BET_WON,
  getChoiceText,
  GuessBetRow,
  GuessOptionRow,
  GuessParticipantRow,
  GuessVoteRow,
  GUESS_ABANDONED,
  GUESS_ACTIVE,
  GUESS_REJECTED,
  GUESS_SETTLED,
} from './guess-shared';

const GUESS_SCOPE_FRIEND = 20;

type LevelRow = mysql.RowDataPacket & { level: number | string };
type OpponentRow = mysql.RowDataPacket & {
  guess_id: number | string;
  user_id: number | string;
  choice_idx: number | string;
  name: string | null;
  avatar_url: string | null;
};

export async function getUserHistoryResult(userId: string, userName: string): Promise<GuessHistoryResult> {
  const db = getDbPool();
  // 只拉已支付 + 已退款的 bet — 排除 waiting/failed/closed（用户没真正下成的）
  const [betRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        gb.id,
        gb.guess_id,
        gb.choice_idx,
        gb.amount,
        gb.status,
        gb.pay_status,
        gb.created_at,
        g.title AS guess_title,
        g.status AS guess_status,
        g.scope AS guess_scope,
        g.end_time AS guess_end_time,
        g.image_url AS guess_image,
        go_my.odds AS my_choice_odds,
        result_option.option_text AS result_text,
        bp.name AS prize_product_name
      FROM guess_bet gb
      INNER JOIN guess g ON g.id = gb.guess_id
      LEFT JOIN guess_option go_my
        ON go_my.guess_id = g.id
       AND go_my.option_index = gb.choice_idx
      LEFT JOIN guess_option result_option
        ON result_option.guess_id = g.id
       AND result_option.is_result = 1
      LEFT JOIN guess_product gp ON gp.guess_id = g.id
      LEFT JOIN brand_product bp ON bp.id = gp.brand_product_id
      WHERE gb.user_id = ?
        AND gb.pay_status IN (?, ?)
      ORDER BY gb.created_at DESC, gb.id DESC
      LIMIT 100
    `,
    [userId, PAY_STATUS_PAID, PAY_STATUS_REFUNDED],
  );

  const typedBetRows = betRows as GuessBetRow[];
  const guessIds = Array.from(new Set(typedBetRows.map((row) => String(row.guess_id))));
  let optionRows: GuessOptionRow[] = [];
  let participantRows: GuessParticipantRow[] = [];
  let voteRows: GuessVoteRow[] = [];

  if (guessIds.length > 0) {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, option_index, option_text, is_result
        FROM guess_option
        WHERE guess_id IN (?)
        ORDER BY guess_id ASC, option_index ASC
      `,
      [guessIds],
    );
    optionRows = rows as GuessOptionRow[];

    // 参与人数 + 投票分布只算 paid bet（不含未付/退款）
    const [participantCountRows] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, COUNT(*) AS participant_count
        FROM guess_bet
        WHERE guess_id IN (?) AND pay_status = ?
        GROUP BY guess_id
      `,
      [guessIds, PAY_STATUS_PAID],
    );
    participantRows = participantCountRows as GuessParticipantRow[];

    const [optionVoteRows] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, choice_idx AS option_index, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id IN (?) AND pay_status = ?
        GROUP BY guess_id, choice_idx
      `,
      [guessIds, PAY_STATUS_PAID],
    );
    voteRows = optionVoteRows as GuessVoteRow[];
  }

  const optionsByGuess = new Map<string, GuessOptionRow[]>();
  for (const row of optionRows) {
    const guessId = String(row.guess_id);
    const list = optionsByGuess.get(guessId) || [];
    list.push(row);
    optionsByGuess.set(guessId, list);
  }

  const participantsByGuess = new Map<string, number>();
  for (const row of participantRows) {
    participantsByGuess.set(String(row.guess_id), Number(row.participant_count ?? 0));
  }

  const voteCountByGuessOption = new Map<string, number>();
  for (const row of voteRows) {
    voteCountByGuessOption.set(`${String(row.guess_id)}:${Number(row.option_index)}`, Number(row.vote_count ?? 0));
  }

  const active = typedBetRows
    .filter(
      (row) =>
        Number(row.guess_status) === GUESS_ACTIVE &&
        Number(row.status) === BET_PENDING &&
        Number(row.pay_status) === PAY_STATUS_PAID,
    )
    .map((row) => {
      const options = optionsByGuess.get(String(row.guess_id)) || [];
      const totalVotes = options.reduce(
        (sum, option) => sum + (voteCountByGuessOption.get(`${String(row.guess_id)}:${Number(option.option_index)}`) ?? 0),
        0,
      );
      const oddsCurrent = Number(row.my_choice_odds ?? 0) || 0;
      return {
        betId: toEntityId(row.id),
        guessId: toEntityId(row.guess_id),
        title: row.guess_title,
        imageUrl: row.guess_image || null,
        participants: participantsByGuess.get(String(row.guess_id)) ?? 0,
        endTime: new Date(row.guess_end_time).toISOString(),
        choiceText: getChoiceText(row, options),
        oddsCurrent,
        optionProgress: options.map((option) => {
          const votes = voteCountByGuessOption.get(`${String(row.guess_id)}:${Number(option.option_index)}`) ?? 0;
          return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        }),
        options: options.map((option) => option.option_text),
      };
    });

  // history 包含：已结算（GUESS_SETTLED / REJECTED）+ 流标退款（GUESS_ABANDONED + pay_status=refunded）
  const settledRows = typedBetRows.filter((row) => {
    const guessStatus = Number(row.guess_status);
    if (guessStatus === GUESS_SETTLED || guessStatus === GUESS_REJECTED) {
      return true;
    }
    if (guessStatus === GUESS_ABANDONED && Number(row.pay_status) === PAY_STATUS_REFUNDED) {
      return true;
    }
    return false;
  });

  const history = settledRows.map((row) => {
    const options = optionsByGuess.get(String(row.guess_id)) || [];
    const isRefunded = Number(row.pay_status) === PAY_STATUS_REFUNDED;
    const outcome: GuessHistoryResult['history'][number]['outcome'] = isRefunded
      ? 'refunded'
      : Number(row.status) === BET_WON
        ? 'won'
        : 'lost';
    const amountCents = Number(row.amount ?? 0);
    let rewardText: string;
    let resultText: string;
    if (isRefunded) {
      rewardText = '💸 已退款';
      resultText = '竞猜流标，已原路退款';
    } else {
      rewardText = outcome === 'won' ? '🎉 猜中' : '未中奖';
      resultText = row.result_text || (Number(row.guess_status) === GUESS_REJECTED ? '竞猜未通过' : '待结算');
    }
    return {
      betId: toEntityId(row.id),
      guessId: toEntityId(row.guess_id),
      title: row.guess_title,
      date: new Date(row.created_at).toISOString().slice(0, 10),
      choiceText: getChoiceText(row, options),
      resultText,
      outcome,
      rewardText,
      amountYuan: amountCents > 0 ? Number((amountCents / 100).toFixed(2)) : 0,
      participants: participantsByGuess.get(String(row.guess_id)) ?? 0,
    };
  });

  // 用户等级
  const [levelRows] = await db.execute<LevelRow[]>(
    'SELECT level FROM user WHERE id = ? LIMIT 1',
    [userId],
  );
  const userLevel = Number(levelRows[0]?.level ?? 1);

  // 自身头像（PK 卡左边用）
  const [meProfileRows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT avatar_url FROM user_profile WHERE user_id = ? LIMIT 1',
    [userId],
  );
  const myAvatar = (meProfileRows[0]?.avatar_url as string | null) || null;

  // 找出所有已结算的好友 PK 竞猜的"对手" — 同一 guess 下其他用户的最早一笔已支付 bet
  const settledFriendGuessIds = Array.from(
    new Set(
      settledRows
        .filter((row) => Number(row.guess_scope) === GUESS_SCOPE_FRIEND)
        .map((row) => String(row.guess_id)),
    ),
  );

  const opponentByGuess = new Map<string, OpponentRow>();
  if (settledFriendGuessIds.length > 0) {
    const [opponentRows] = await db.query<OpponentRow[]>(
      `
        SELECT
          gb2.guess_id,
          gb2.user_id,
          gb2.choice_idx,
          up.name AS name,
          up.avatar_url AS avatar_url
        FROM guess_bet gb2
        LEFT JOIN user_profile up ON up.user_id = gb2.user_id
        WHERE gb2.guess_id IN (?)
          AND gb2.user_id <> ?
          AND gb2.pay_status = ?
        ORDER BY gb2.guess_id ASC, gb2.created_at ASC, gb2.id ASC
      `,
      [settledFriendGuessIds, userId, PAY_STATUS_PAID],
    );
    for (const row of opponentRows) {
      const key = String(row.guess_id);
      if (!opponentByGuess.has(key)) {
        opponentByGuess.set(key, row);
      }
    }
  }

  const pk = settledRows
    .filter((row) => Number(row.guess_scope) === GUESS_SCOPE_FRIEND)
    .map((row) => {
      const options = optionsByGuess.get(String(row.guess_id)) || [];
      const isRefunded = Number(row.pay_status) === PAY_STATUS_REFUNDED;
      const outcome: GuessHistoryResult['pk'][number]['outcome'] = isRefunded
        ? 'lost'
        : Number(row.status) === BET_WON
          ? 'won'
          : 'lost';
      const opponent = opponentByGuess.get(String(row.guess_id)) || null;
      const opponentChoiceIdx = opponent ? Number(opponent.choice_idx) : -1;
      const opponentChoiceText = options.find((option) => Number(option.option_index) === opponentChoiceIdx)?.option_text || '未参与';
      return {
        betId: toEntityId(row.id),
        guessId: toEntityId(row.guess_id),
        title: row.guess_title,
        outcome,
        leftName: userName,
        leftAvatar: myAvatar,
        leftChoice: getChoiceText(row, options),
        rightName: opponent?.name || '对手',
        rightAvatar: opponent?.avatar_url || null,
        rightChoice: opponentChoiceText,
        date: new Date(row.created_at).toISOString().slice(0, 10),
        prize: row.prize_product_name || '纪念奖',
      };
    });

  const wonCount = history.filter((row) => row.outcome === 'won').length;
  const lostCount = history.filter((row) => row.outcome === 'lost').length;
  return {
    stats: {
      total: typedBetRows.length,
      active: active.length,
      won: wonCount,
      lost: lostCount,
      pk: pk.length,
      winRate: wonCount + lostCount > 0 ? Number(((wonCount / (wonCount + lostCount)) * 100).toFixed(1)) : 0,
      level: userLevel,
    },
    active,
    history,
    pk,
  };
}
