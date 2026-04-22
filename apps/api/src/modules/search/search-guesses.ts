import type mysql from 'mysql2/promise';
import type { SearchResult } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import {
  buildGuessSummary,
  GUESS_ACTIVE,
  GUESS_PENDING_REVIEW,
  GUESS_REVIEW_APPROVED,
  GUESS_SETTLED,
  type GuessOptionRow,
  type GuessRow,
  type GuessVoteRow,
} from './search-shared';

/**
 * 竞猜搜索需要补齐选项和投票数，避免列表页再逐条发请求拼竞猜摘要。
 */
async function getGuessOptionsAndVotes(guessIds: string[]) {
  if (!guessIds.length) {
    return {
      optionsByGuess: new Map<string, GuessOptionRow[]>(),
      votesByGuess: new Map<string, GuessVoteRow[]>(),
    };
  }

  const db = getDbPool();
  const [optionRows, voteRows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, option_index, option_text, odds, is_result
        FROM guess_option
        WHERE guess_id IN (?)
        ORDER BY guess_id ASC, option_index ASC
      `,
      [guessIds],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, choice_idx AS option_index, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id IN (?)
        GROUP BY guess_id, choice_idx
      `,
      [guessIds],
    ),
  ]);

  const optionsByGuess = new Map<string, GuessOptionRow[]>();
  for (const option of optionRows[0] as GuessOptionRow[]) {
    const key = String(option.guess_id);
    const current = optionsByGuess.get(key) || [];
    current.push(option);
    optionsByGuess.set(key, current);
  }

  const votesByGuess = new Map<string, GuessVoteRow[]>();
  for (const vote of voteRows[0] as GuessVoteRow[]) {
    const key = String(vote.guess_id);
    const current = votesByGuess.get(key) || [];
    current.push(vote);
    votesByGuess.set(key, current);
  }

  return { optionsByGuess, votesByGuess };
}

/**
 * 竞猜搜索只返回已审核且仍可展示的竞猜，和用户端其他竞猜列表的可见性口径保持一致。
 */
export async function searchGuesses(query: string, limit: number): Promise<SearchResult['guesses']> {
  const db = getDbPool();
  const like = `%${query}%`;
  const params = [GUESS_REVIEW_APPROVED, GUESS_PENDING_REVIEW, GUESS_ACTIVE, GUESS_SETTLED, like, like, like, like];

  const [countRows, rows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(DISTINCT g.id) AS total
        FROM guess g
        LEFT JOIN guess_product gp ON gp.guess_id = g.id
        LEFT JOIN product p ON p.id = gp.product_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        WHERE g.review_status = ?
          AND g.status IN (?, ?, ?)
          AND (g.title LIKE ? OR p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)
      `,
      params,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          g.id,
          g.title,
          g.status,
          g.review_status,
          g.end_time,
          g.creator_id,
          c.name AS category,
          p.id AS product_id,
          p.name AS product_name,
          b.name AS brand_name,
          COALESCE(p.image_url, bp.default_img) AS product_img,
          p.price AS product_price,
          p.guess_price AS product_guess_price,
          COUNT(gb.id) AS vote_total
        FROM guess g
        LEFT JOIN guess_product gp ON gp.guess_id = g.id
        LEFT JOIN product p ON p.id = gp.product_id
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        LEFT JOIN brand b ON b.id = bp.brand_id
        LEFT JOIN category c ON c.id = bp.category_id
        LEFT JOIN guess_bet gb ON gb.guess_id = g.id
        WHERE g.review_status = ?
          AND g.status IN (?, ?, ?)
          AND (g.title LIKE ? OR p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)
        GROUP BY
          g.id,
          g.title,
          g.status,
          g.review_status,
          g.end_time,
          g.creator_id,
          c.name,
          p.id,
          p.name,
          b.name,
          COALESCE(p.image_url, bp.default_img),
          p.price,
          p.guess_price
        ORDER BY vote_total DESC, g.created_at DESC, g.id DESC
        LIMIT ?
      `,
      [...params, limit],
    ),
  ]);

  const resultRows = rows[0] as GuessRow[];
  const guessIds = resultRows.map((row) => String(row.id));
  const { optionsByGuess, votesByGuess } = await getGuessOptionsAndVotes(guessIds);

  return {
    total: Number((countRows[0] as mysql.RowDataPacket[])[0]?.total ?? 0),
    items: resultRows.map((row) =>
      buildGuessSummary(row, optionsByGuess.get(String(row.id)) || [], votesByGuess.get(String(row.id)) || []),
    ),
  };
}

