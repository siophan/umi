import type mysql from 'mysql2/promise';

import {
  toEntityId,
  type GuessHistoryActiveItem,
  type GuessHistoryListTab,
  type GuessHistoryPageResult,
  type GuessHistoryPkItem,
  type GuessHistoryRecordItem,
  type GuessHistoryResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
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
const PAGE_SIZE = 20;
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

const BET_DETAIL_SELECT = `
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
`;

// 真实下注 + 流标退款的复合过滤；存量数据按 status 识别（pay_status 列是后期加的）
const REAL_BET_WHERE = `
  (
    gb.status IN (?, ?, ?)
    OR (gb.status = ? AND gb.pay_status = ?)
  )
`;
const REAL_BET_PARAMS = [BET_PENDING, BET_WON, BET_LOST, BET_CANCELED, PAY_STATUS_REFUNDED];

type TabSqlSpec = {
  /** 额外 AND 条件（不含 user_id / cursor） */
  extraWhere: string;
  /** extraWhere 的参数 */
  extraParams: Array<number | string>;
};

function buildTabSpec(tab: GuessHistoryListTab): TabSqlSpec {
  if (tab === 'active') {
    return {
      extraWhere: `AND g.status = ? AND gb.status = ?`,
      extraParams: [GUESS_ACTIVE, BET_PENDING],
    };
  }
  if (tab === 'won') {
    return {
      extraWhere: `AND g.status IN (?, ?) AND gb.status = ?`,
      extraParams: [GUESS_SETTLED, GUESS_REJECTED, BET_WON],
    };
  }
  if (tab === 'lost') {
    return {
      extraWhere: `AND g.status IN (?, ?) AND gb.status = ?`,
      extraParams: [GUESS_SETTLED, GUESS_REJECTED, BET_LOST],
    };
  }
  if (tab === 'pk') {
    // 好友 PK 历史：scope=FRIEND + (settled/rejected OR abandoned+refunded)
    return {
      extraWhere: `AND g.scope = ? AND (
        g.status IN (?, ?)
        OR (g.status = ? AND gb.pay_status = ?)
      )`,
      extraParams: [GUESS_SCOPE_FRIEND, GUESS_SETTLED, GUESS_REJECTED, GUESS_ABANDONED, PAY_STATUS_REFUNDED],
    };
  }
  // 'history': 已结算 / 已拒绝 / 流标退款（任意 scope）
  return {
    extraWhere: `AND (
      g.status IN (?, ?)
      OR (g.status = ? AND gb.pay_status = ?)
    )`,
    extraParams: [GUESS_SETTLED, GUESS_REJECTED, GUESS_ABANDONED, PAY_STATUS_REFUNDED],
  };
}

function parseCursor(cursor: string | null): Date | null {
  if (!cursor) {
    return null;
  }
  const date = new Date(cursor);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'GUESS_HISTORY_CURSOR_INVALID', '游标格式错误');
  }
  return date;
}

async function fetchBetRowsByTab(
  userId: string,
  tab: GuessHistoryListTab,
  cursor: string | null,
  fetchLimit: number,
): Promise<GuessBetRow[]> {
  const db = getDbPool();
  const cursorDate = parseCursor(cursor);
  const spec = buildTabSpec(tab);

  const params: Array<number | string | Date> = [
    userId,
    ...REAL_BET_PARAMS,
    ...spec.extraParams,
  ];
  let cursorClause = '';
  if (cursorDate) {
    cursorClause = `AND gb.created_at < ?`;
    params.push(cursorDate);
  }
  params.push(fetchLimit);

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      ${BET_DETAIL_SELECT}
      WHERE gb.user_id = ?
        AND ${REAL_BET_WHERE}
        ${spec.extraWhere}
        ${cursorClause}
      ORDER BY gb.created_at DESC, gb.id DESC
      LIMIT ?
    `,
    params,
  );

  return rows as GuessBetRow[];
}

type AggregateData = {
  optionsByGuess: Map<string, GuessOptionRow[]>;
  participantsByGuess: Map<string, number>;
  voteCountByGuessOption: Map<string, number>;
};

async function loadAggregates(guessIds: string[]): Promise<AggregateData> {
  const result: AggregateData = {
    optionsByGuess: new Map(),
    participantsByGuess: new Map(),
    voteCountByGuessOption: new Map(),
  };
  if (guessIds.length === 0) {
    return result;
  }
  const db = getDbPool();

  const optionsP = db.query<mysql.RowDataPacket[]>(
    `
      SELECT guess_id, option_index, option_text, is_result, odds
      FROM guess_option
      WHERE guess_id IN (?)
      ORDER BY guess_id ASC, option_index ASC
    `,
    [guessIds],
  );

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

  for (const row of optsRaw as GuessOptionRow[]) {
    const id = String(row.guess_id);
    const list = result.optionsByGuess.get(id) || [];
    list.push(row);
    result.optionsByGuess.set(id, list);
  }
  for (const row of partsRaw as GuessParticipantRow[]) {
    result.participantsByGuess.set(String(row.guess_id), Number(row.participant_count ?? 0));
  }
  for (const row of votesRaw as GuessVoteRow[]) {
    result.voteCountByGuessOption.set(
      `${String(row.guess_id)}:${Number(row.option_index)}`,
      Number(row.vote_count ?? 0),
    );
  }

  return result;
}

function mapActiveItem(row: GuessBetRow, agg: AggregateData): GuessHistoryActiveItem {
  const options = agg.optionsByGuess.get(String(row.guess_id)) || [];
  const totalVotes = options.reduce(
    (sum, option) =>
      sum + (agg.voteCountByGuessOption.get(`${String(row.guess_id)}:${Number(option.option_index)}`) ?? 0),
    0,
  );
  const oddsCurrent = Number(row.my_choice_odds ?? 0) || 0;
  return {
    betId: toEntityId(row.id),
    guessId: toEntityId(row.guess_id),
    title: row.guess_title,
    imageUrl: row.guess_image || null,
    participants: agg.participantsByGuess.get(String(row.guess_id)) ?? 0,
    endTime: new Date(row.guess_end_time).toISOString(),
    choiceText: getChoiceText(row, options),
    oddsCurrent,
    optionProgress: options.map((option) => {
      const votes = agg.voteCountByGuessOption.get(`${String(row.guess_id)}:${Number(option.option_index)}`) ?? 0;
      return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    }),
    options: options.map((option) => option.option_text),
  };
}

function mapRecordItem(row: GuessBetRow, agg: AggregateData): GuessHistoryRecordItem {
  const options = agg.optionsByGuess.get(String(row.guess_id)) || [];
  const isRefunded = Number(row.pay_status) === PAY_STATUS_REFUNDED;
  const outcome: GuessHistoryRecordItem['outcome'] = isRefunded
    ? 'refunded'
    : Number(row.status) === BET_WON
      ? 'won'
      : 'lost';
  const amountCents = Number(row.amount ?? 0);
  const odds = Number(row.my_choice_odds ?? 0) || 0;
  const wonAmountCents = outcome === 'won' && odds > 0 ? Math.floor(amountCents * odds) : 0;
  const rewardText = isRefunded ? '💸 已退款' : outcome === 'won' ? '🎉 猜中' : '未中奖';
  const resultText = isRefunded
    ? '竞猜流标，已原路退款'
    : row.result_text || (Number(row.guess_status) === GUESS_REJECTED ? '竞猜未通过' : '待结算');
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
    participants: agg.participantsByGuess.get(String(row.guess_id)) ?? 0,
  };
}

function mapPkItem(
  row: GuessBetRow,
  agg: AggregateData,
  userName: string,
  myAvatar: string | null,
  opponent: OpponentRow | null,
): GuessHistoryPkItem {
  const options = agg.optionsByGuess.get(String(row.guess_id)) || [];
  const isRefunded = Number(row.pay_status) === PAY_STATUS_REFUNDED;
  const outcome: GuessHistoryPkItem['outcome'] = isRefunded
    ? 'refunded'
    : Number(row.status) === BET_WON
      ? 'won'
      : 'lost';
  const opponentChoiceIdx = opponent ? Number(opponent.choice_idx) : -1;
  const opponentChoiceText =
    options.find((option) => Number(option.option_index) === opponentChoiceIdx)?.option_text || '未参与';
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
}

async function loadOpponents(userId: string, guessIds: string[]): Promise<Map<string, OpponentRow>> {
  const result = new Map<string, OpponentRow>();
  if (guessIds.length === 0) {
    return result;
  }
  const db = getDbPool();
  const [rows] = await db.query<OpponentRow[]>(
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
    [guessIds, userId, ...REAL_BET_STATUS],
  );
  for (const row of rows) {
    const key = String(row.guess_id);
    if (!result.has(key)) {
      result.set(key, row);
    }
  }
  return result;
}

function pickNextCursor(rows: GuessBetRow[], pageSize: number): string | null {
  if (rows.length <= pageSize) {
    return null;
  }
  const last = rows[pageSize - 1];
  return new Date(last.created_at).toISOString();
}

export async function getUserHistoryResult(userId: string, userName: string): Promise<GuessHistoryResult> {
  const db = getDbPool();

  // stats 全量聚合
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
        AND ${REAL_BET_WHERE}
    `,
    [
      BET_PENDING, GUESS_ACTIVE,
      BET_WON, GUESS_SETTLED, GUESS_REJECTED,
      BET_WON, BET_CANCELED, GUESS_SETTLED, GUESS_REJECTED,
      GUESS_SCOPE_FRIEND,
      BET_PENDING, BET_WON, BET_LOST, GUESS_SETTLED, GUESS_REJECTED,
      BET_CANCELED, PAY_STATUS_REFUNDED, GUESS_ABANDONED,
      userId, ...REAL_BET_PARAMS,
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

  // 各 tab 首页（PAGE_SIZE+1 用于判定 nextCursor）
  const fetchActive = fetchBetRowsByTab(userId, 'active', null, PAGE_SIZE + 1);
  const fetchHistory = fetchBetRowsByTab(userId, 'history', null, PAGE_SIZE + 1);
  const fetchPk = fetchBetRowsByTab(userId, 'pk', null, PAGE_SIZE + 1);

  const [[statsRowsRaw], [levelRowsRaw], [profileRowsRaw], activeRowsRaw, historyRowsRaw, pkRowsRaw] =
    await Promise.all([fetchStats, fetchLevel, fetchProfile, fetchActive, fetchHistory, fetchPk]);

  const statsRow = (statsRowsRaw[0] as StatsRow | undefined) ?? null;
  const levelRow = (levelRowsRaw[0] as LevelRow | undefined) ?? null;
  const profileRow = (profileRowsRaw[0] as ProfileRow | undefined) ?? null;

  const activeRows = activeRowsRaw.slice(0, PAGE_SIZE);
  const historyRows = historyRowsRaw.slice(0, PAGE_SIZE);
  const pkRows = pkRowsRaw.slice(0, PAGE_SIZE);

  // 聚合数据：覆盖三个列表里出现的所有 guess
  const allGuessIds = Array.from(
    new Set([
      ...activeRows.map((row) => String(row.guess_id)),
      ...historyRows.map((row) => String(row.guess_id)),
      ...pkRows.map((row) => String(row.guess_id)),
    ]),
  );
  const agg = await loadAggregates(allGuessIds);

  const myAvatar = profileRow?.avatar_url || null;
  const userLevel = Number(levelRow?.level ?? 1);

  const pkGuessIds = Array.from(new Set(pkRows.map((row) => String(row.guess_id))));
  const opponents = await loadOpponents(userId, pkGuessIds);

  const active = activeRows.map((row) => mapActiveItem(row, agg));
  const history = historyRows.map((row) => mapRecordItem(row, agg));
  const pk = pkRows.map((row) => mapPkItem(row, agg, userName, myAvatar, opponents.get(String(row.guess_id)) || null));

  return {
    stats: {
      total: Number(statsRow?.total ?? 0),
      active: Number(statsRow?.active ?? 0),
      won: Number(statsRow?.won ?? 0),
      lost: Number(statsRow?.lost ?? 0),
      pk: Number(statsRow?.pk ?? 0),
      winRate:
        Number(statsRow?.won ?? 0) + Number(statsRow?.lost ?? 0) > 0
          ? Number(((Number(statsRow?.won ?? 0) / (Number(statsRow?.won ?? 0) + Number(statsRow?.lost ?? 0))) * 100).toFixed(1))
          : 0,
      level: userLevel,
    },
    active,
    history,
    pk,
    nextCursor: {
      active: pickNextCursor(activeRowsRaw, PAGE_SIZE),
      history: pickNextCursor(historyRowsRaw, PAGE_SIZE),
      // won/lost 首屏不预拉，nextCursor 留 null；前端首次进入 won/lost tab 时调 page 接口拉首页
      won: null,
      lost: null,
      pk: pickNextCursor(pkRowsRaw, PAGE_SIZE),
    },
  };
}

export async function getUserHistoryPage(
  userId: string,
  userName: string,
  tab: GuessHistoryListTab,
  cursor: string | null,
): Promise<GuessHistoryPageResult> {
  const rowsRaw = await fetchBetRowsByTab(userId, tab, cursor, PAGE_SIZE + 1);
  const rows = rowsRaw.slice(0, PAGE_SIZE);
  const nextCursor = pickNextCursor(rowsRaw, PAGE_SIZE);

  const guessIds = Array.from(new Set(rows.map((row) => String(row.guess_id))));
  const agg = await loadAggregates(guessIds);

  if (tab === 'active') {
    return { tab, items: rows.map((row) => mapActiveItem(row, agg)), nextCursor };
  }
  if (tab === 'pk') {
    const db = getDbPool();
    const [profileRows] = await db.execute<ProfileRow[]>(
      'SELECT avatar_url FROM user_profile WHERE user_id = ? LIMIT 1',
      [userId],
    );
    const myAvatar = (profileRows[0]?.avatar_url as string | null) || null;
    const opponents = await loadOpponents(userId, guessIds);
    return {
      tab,
      items: rows.map((row) => mapPkItem(row, agg, userName, myAvatar, opponents.get(String(row.guess_id)) || null)),
      nextCursor,
    };
  }
  // history / won / lost
  return {
    tab,
    items: rows.map((row) => mapRecordItem(row, agg)),
    nextCursor,
  };
}
