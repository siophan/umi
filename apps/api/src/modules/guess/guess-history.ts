import type mysql from 'mysql2/promise';

import { toEntityId, type GuessHistoryResult } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { PAY_STATUS_REFUNDED } from '../payment/payment-shared';
import {
  BET_CANCELED,
  BET_LOST,
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
// 真实下注状态（已下注待开奖 / 已结算赢 / 已结算输）— 不含 BET_WAITING_PAY(5) 也不含 BET_CANCELED(90)
const REAL_BET_STATUS = [BET_PENDING, BET_WON, BET_LOST] as const;

type StatsRow = mysql.RowDataPacket & {
  total: number | string | null;
  active: number | string | null;
  won: number | string | null;
  lost: number | string | null;
  pk: number | string | null;
};
type LevelRow = mysql.RowDataPacket & { level: number | string };
type ProfileRow = mysql.RowDataPacket & { avatar_url: string | null };
type OpponentRow = mysql.RowDataPacket & {
  guess_id: number | string;
  user_id: number | string;
  choice_idx: number | string;
  name: string | null;
  avatar_url: string | null;
};

export async function getUserHistoryResult(userId: string, userName: string): Promise<GuessHistoryResult> {
  const db = getDbPool();

  // 真实下注 + 流标退款的复合过滤；存量数据按 status 识别（pay_status 列是后期加的，不可作主依据）
  const realBetWhere = `
    (
      gb.status IN (?, ?, ?)
      OR (gb.status = ? AND gb.pay_status = ?)
    )
  `;
  const realBetParams = [BET_PENDING, BET_WON, BET_LOST, BET_CANCELED, PAY_STATUS_REFUNDED];

  // 主查询：拉最近 100 笔卡片所需明细
  const fetchBetDetails = db.execute<mysql.RowDataPacket[]>(
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
      LEFT JOIN (
        SELECT guess_id, MIN(id) AS gp_id
        FROM guess_product
        GROUP BY guess_id
      ) latest_gp ON latest_gp.guess_id = g.id
      LEFT JOIN guess_product gp ON gp.id = latest_gp.gp_id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      WHERE gb.user_id = ?
        AND ${realBetWhere}
      ORDER BY gb.created_at DESC, gb.id DESC
      LIMIT 100
    `,
    [userId, ...realBetParams],
  );

  // 全量统计 — 不受 LIMIT 100 截断；逻辑必须与下面 active/history/pk 过滤一致
  const fetchStats = db.execute<StatsRow[]>(
    `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN gb.status = ? AND g.status = ? THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN gb.status = ? AND g.status IN (?, ?) THEN 1 ELSE 0 END) AS won,
        SUM(CASE WHEN gb.status <> ? AND gb.status <> ? AND g.status IN (?, ?) THEN 1 ELSE 0 END) AS lost,
        SUM(CASE WHEN g.scope = ? AND (
          (gb.status IN (?, ?, ?) AND g.status IN (?, ?))
          OR (gb.status = ? AND gb.pay_status = ? AND g.status = ?)
        ) THEN 1 ELSE 0 END) AS pk
      FROM guess_bet gb
      INNER JOIN guess g ON g.id = gb.guess_id
      WHERE gb.user_id = ?
        AND ${realBetWhere}
    `,
    [
      // active: bet=PENDING + guess=ACTIVE
      BET_PENDING, GUESS_ACTIVE,
      // won: bet=BET_WON + guess in (settled, rejected)
      BET_WON, GUESS_SETTLED, GUESS_REJECTED,
      // lost: bet<>WON AND bet<>CANCELED (排除流标退款) AND guess in (settled, rejected)
      BET_WON, BET_CANCELED, GUESS_SETTLED, GUESS_REJECTED,
      // pk: friend scope + (real-bet-status + settled/rejected OR refunded + abandoned)
      GUESS_SCOPE_FRIEND,
      BET_PENDING, BET_WON, BET_LOST, GUESS_SETTLED, GUESS_REJECTED,
      BET_CANCELED, PAY_STATUS_REFUNDED, GUESS_ABANDONED,
      // total filter
      userId, ...realBetParams,
    ],
  );

  const fetchLevel = db.execute<LevelRow[]>(
    'SELECT level FROM user WHERE id = ? LIMIT 1',
    [userId],
  );

  const fetchProfile = db.execute<ProfileRow[]>(
    'SELECT avatar_url FROM user_profile WHERE user_id = ? LIMIT 1',
    [userId],
  );

  const [[betRowsRaw], [statsRowsRaw], [levelRowsRaw], [profileRowsRaw]] = await Promise.all([
    fetchBetDetails,
    fetchStats,
    fetchLevel,
    fetchProfile,
  ]);

  const typedBetRows = betRowsRaw as GuessBetRow[];
  const statsRow = (statsRowsRaw[0] as StatsRow | undefined) ?? null;
  const levelRow = (levelRowsRaw[0] as LevelRow | undefined) ?? null;
  const profileRow = (profileRowsRaw[0] as ProfileRow | undefined) ?? null;

  const guessIds = Array.from(new Set(typedBetRows.map((row) => String(row.guess_id))));
  let optionRows: GuessOptionRow[] = [];
  let participantRows: GuessParticipantRow[] = [];
  let voteRows: GuessVoteRow[] = [];

  if (guessIds.length > 0) {
    const optionsP = db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, option_index, option_text, is_result
        FROM guess_option
        WHERE guess_id IN (?)
        ORDER BY guess_id ASC, option_index ASC
      `,
      [guessIds],
    );

    // 参与人数 + 投票分布按真实下注 status 识别（含存量数据，排除 WAITING_PAY/CANCELED）
    const participantsP = db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, COUNT(*) AS participant_count
        FROM guess_bet
        WHERE guess_id IN (?) AND status IN (?, ?, ?)
        GROUP BY guess_id
      `,
      [guessIds, ...REAL_BET_STATUS],
    );

    const votesP = db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, choice_idx AS option_index, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id IN (?) AND status IN (?, ?, ?)
        GROUP BY guess_id, choice_idx
      `,
      [guessIds, ...REAL_BET_STATUS],
    );

    const [[optsRaw], [partsRaw], [votesRaw]] = await Promise.all([optionsP, participantsP, votesP]);
    optionRows = optsRaw as GuessOptionRow[];
    participantRows = partsRaw as GuessParticipantRow[];
    voteRows = votesRaw as GuessVoteRow[];
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
      (row) => Number(row.guess_status) === GUESS_ACTIVE && Number(row.status) === BET_PENDING,
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
    const odds = Number(row.my_choice_odds ?? 0) || 0;
    const wonAmountCents = outcome === 'won' && odds > 0 ? Math.floor(amountCents * odds) : 0;
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
      wonAmountYuan: wonAmountCents > 0 ? Number((wonAmountCents / 100).toFixed(2)) : 0,
      participants: participantsByGuess.get(String(row.guess_id)) ?? 0,
    };
  });

  const userLevel = Number(levelRow?.level ?? 1);
  const myAvatar = profileRow?.avatar_url || null;

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
          AND gb2.status IN (?, ?, ?)
        ORDER BY gb2.guess_id ASC, gb2.created_at ASC, gb2.id ASC
      `,
      [settledFriendGuessIds, userId, ...REAL_BET_STATUS],
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
        ? 'refunded'
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

  // stats 全量聚合（独立于 LIMIT 100）
  const totalCount = Number(statsRow?.total ?? 0);
  const activeCount = Number(statsRow?.active ?? 0);
  const wonCount = Number(statsRow?.won ?? 0);
  const lostCount = Number(statsRow?.lost ?? 0);
  const pkCount = Number(statsRow?.pk ?? 0);

  return {
    stats: {
      total: totalCount,
      active: activeCount,
      won: wonCount,
      lost: lostCount,
      pk: pkCount,
      winRate: wonCount + lostCount > 0 ? Number(((wonCount / (wonCount + lostCount)) * 100).toFixed(1)) : 0,
      level: userLevel,
    },
    active,
    history,
    pk,
  };
}
