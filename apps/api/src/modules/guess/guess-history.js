import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { BET_PENDING, BET_WON, getChoiceText, GUESS_ACTIVE, GUESS_REJECTED, GUESS_SETTLED, } from './guess-shared';
export async function getUserHistoryResult(userId, userName) {
    const db = getDbPool();
    const [betRows] = await db.execute(`
      SELECT
        gb.id,
        gb.guess_id,
        gb.choice_idx,
        gb.amount,
        gb.status,
        gb.created_at,
        g.title AS guess_title,
        g.status AS guess_status,
        g.scope AS guess_scope,
        g.end_time AS guess_end_time,
        result_option.option_text AS result_text
      FROM guess_bet gb
      INNER JOIN guess g ON g.id = gb.guess_id
      LEFT JOIN guess_option result_option
        ON result_option.guess_id = g.id
       AND result_option.is_result = 1
      WHERE gb.user_id = ?
      ORDER BY gb.created_at DESC, gb.id DESC
      LIMIT 100
    `, [userId]);
    const typedBetRows = betRows;
    const guessIds = Array.from(new Set(typedBetRows.map((row) => String(row.guess_id))));
    let optionRows = [];
    let participantRows = [];
    let voteRows = [];
    if (guessIds.length > 0) {
        const [rows] = await db.query(`
        SELECT guess_id, option_index, option_text, is_result
        FROM guess_option
        WHERE guess_id IN (?)
        ORDER BY guess_id ASC, option_index ASC
      `, [guessIds]);
        optionRows = rows;
        const [participantCountRows] = await db.query(`
        SELECT guess_id, COUNT(*) AS participant_count
        FROM guess_bet
        WHERE guess_id IN (?)
        GROUP BY guess_id
      `, [guessIds]);
        participantRows = participantCountRows;
        const [optionVoteRows] = await db.query(`
        SELECT guess_id, choice_idx AS option_index, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id IN (?)
        GROUP BY guess_id, choice_idx
      `, [guessIds]);
        voteRows = optionVoteRows;
    }
    const optionsByGuess = new Map();
    for (const row of optionRows) {
        const guessId = String(row.guess_id);
        const list = optionsByGuess.get(guessId) || [];
        list.push(row);
        optionsByGuess.set(guessId, list);
    }
    const participantsByGuess = new Map();
    for (const row of participantRows) {
        participantsByGuess.set(String(row.guess_id), Number(row.participant_count ?? 0));
    }
    const voteCountByGuessOption = new Map();
    for (const row of voteRows) {
        voteCountByGuessOption.set(`${String(row.guess_id)}:${Number(row.option_index)}`, Number(row.vote_count ?? 0));
    }
    const active = typedBetRows
        .filter((row) => Number(row.guess_status) === GUESS_ACTIVE && Number(row.status) === BET_PENDING)
        .map((row) => {
        const options = optionsByGuess.get(String(row.guess_id)) || [];
        const totalVotes = options.reduce((sum, option) => sum + (voteCountByGuessOption.get(`${String(row.guess_id)}:${Number(option.option_index)}`) ?? 0), 0);
        return {
            betId: toEntityId(row.id),
            guessId: toEntityId(row.guess_id),
            title: row.guess_title,
            participants: participantsByGuess.get(String(row.guess_id)) ?? 0,
            endTime: new Date(row.guess_end_time).toISOString(),
            choiceText: getChoiceText(row, options),
            optionProgress: options.map((option) => {
                const votes = voteCountByGuessOption.get(`${String(row.guess_id)}:${Number(option.option_index)}`) ?? 0;
                return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            }),
            options: options.map((option) => option.option_text),
        };
    });
    const settledRows = typedBetRows.filter((row) => Number(row.guess_status) === GUESS_SETTLED || Number(row.guess_status) === GUESS_REJECTED);
    const history = settledRows.map((row) => {
        const options = optionsByGuess.get(String(row.guess_id)) || [];
        const outcome = Number(row.status) === BET_WON ? 'won' : 'lost';
        return {
            betId: toEntityId(row.id),
            guessId: toEntityId(row.guess_id),
            title: row.guess_title,
            date: new Date(row.created_at).toISOString().slice(0, 10),
            choiceText: getChoiceText(row, options),
            resultText: row.result_text || (Number(row.guess_status) === GUESS_REJECTED ? '竞猜未通过' : '待结算'),
            outcome,
            rewardText: outcome === 'won' ? '🎉 猜中' : '未中奖',
        };
    });
    const pk = settledRows
        .filter((row) => Number(row.guess_scope) === 20)
        .map((row) => {
        const options = optionsByGuess.get(String(row.guess_id)) || [];
        const outcome = Number(row.status) === BET_WON ? 'won' : 'lost';
        return {
            betId: toEntityId(row.id),
            guessId: toEntityId(row.guess_id),
            title: row.guess_title,
            outcome,
            leftName: userName,
            leftChoice: getChoiceText(row, options),
            rightName: '对手',
            rightChoice: row.result_text || '待确认',
            footer: `${participantsByGuess.get(String(row.guess_id)) ?? 0} 人参与 · ${new Date(row.created_at).toISOString().slice(0, 10)}`,
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
        },
        active,
        history,
        pk,
    };
}
