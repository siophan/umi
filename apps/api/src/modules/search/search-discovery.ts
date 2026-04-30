import type mysql from 'mysql2/promise';
import type { SearchHotKeywordItem, SearchHotResult, SearchSuggestItem, SearchSuggestResult } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { GUESS_ACTIVE, GUESS_PENDING_REVIEW, GUESS_REVIEW_APPROVED, GUESS_SETTLED } from './search-shared';

/**
 * 热搜目前没有独立统计表，先用商品销量和竞猜参与热度混排，后续再替换成真实搜索统计源。
 */
export async function getHotSearches(limit: number): Promise<SearchHotResult> {
  const db = getDbPool();
  const [productRows, guessRows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT bp.name AS keyword, COALESCE(p.sales, 0) AS score
        FROM product p
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        WHERE p.status = 10
        ORDER BY COALESCE(p.sales, 0) DESC, p.created_at DESC, p.id DESC
        LIMIT 6
      `,
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT g.title AS keyword, COUNT(gb.id) AS score
        FROM guess g
        LEFT JOIN guess_bet gb ON gb.guess_id = g.id
        WHERE g.review_status = ?
          AND g.status IN (?, ?, ?)
        GROUP BY g.id, g.title, g.created_at
        ORDER BY score DESC, g.created_at DESC, g.id DESC
        LIMIT 4
      `,
      [GUESS_REVIEW_APPROVED, GUESS_PENDING_REVIEW, GUESS_ACTIVE, GUESS_SETTLED],
    ),
  ]);

  const merged = [
    ...(productRows[0] as Array<{ keyword: string; score: number | string }>).map((row) => ({
      keyword: row.keyword,
      score: Number(row.score ?? 0),
      source: 'product' as const,
    })),
    ...(guessRows[0] as Array<{ keyword: string; score: number | string }>).map((row) => ({
      keyword: row.keyword,
      score: Number(row.score ?? 0),
      source: 'guess' as const,
    })),
  ]
    .filter((item) => item.keyword?.trim())
    .sort((left, right) => right.score - left.score)
    .filter((item, index, array) => array.findIndex((candidate) => candidate.keyword === item.keyword) === index)
    .slice(0, limit);

  const items: SearchHotKeywordItem[] = merged.map((item, index) => ({
    keyword: item.keyword,
    rank: index + 1,
    badge: index < 2 ? '热' : index < 4 ? '新' : index === 4 ? '↑' : '',
    source: item.source,
  }));

  return { items };
}

/**
 * 联想词同时覆盖商品、品牌和竞猜，前端按 type 区分展示，不再额外猜测来源。
 */
export async function getSearchSuggestions(query: string, limit: number): Promise<SearchSuggestResult> {
  const keyword = query.trim();
  if (!keyword) {
    return { query: '', items: [] };
  }

  const db = getDbPool();
  const prefixLike = `${keyword}%`;
  const containsLike = `%${keyword}%`;
  const [productRows, brandRows, guessRows] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT bp.name AS text
        FROM product p
        LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
        WHERE p.status = 10
          AND bp.name LIKE ?
        ORDER BY
          CASE WHEN bp.name LIKE ? THEN 0 ELSE 1 END ASC,
          COALESCE(p.sales, 0) DESC,
          p.created_at DESC,
          p.id DESC
        LIMIT ?
      `,
      [containsLike, prefixLike, limit],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT DISTINCT b.name AS text
        FROM brand b
        WHERE b.name LIKE ?
        ORDER BY CASE WHEN b.name LIKE ? THEN 0 ELSE 1 END ASC, b.name ASC
        LIMIT ?
      `,
      [containsLike, prefixLike, limit],
    ),
    db.query<mysql.RowDataPacket[]>(
      `
        SELECT g.title AS text
        FROM guess g
        WHERE g.review_status = ?
          AND g.status IN (?, ?, ?)
          AND g.title LIKE ?
        ORDER BY
          CASE WHEN g.title LIKE ? THEN 0 ELSE 1 END ASC,
          g.created_at DESC,
          g.id DESC
        LIMIT ?
      `,
      [
        GUESS_REVIEW_APPROVED,
        GUESS_PENDING_REVIEW,
        GUESS_ACTIVE,
        GUESS_SETTLED,
        containsLike,
        prefixLike,
        limit,
      ],
    ),
  ]);

  const items = [
    ...(productRows[0] as Array<{ text: string }>).map((row) => ({ text: row.text, type: 'product' as const })),
    ...(brandRows[0] as Array<{ text: string }>).map((row) => ({ text: row.text, type: 'brand' as const })),
    ...(guessRows[0] as Array<{ text: string }>).map((row) => ({ text: row.text, type: 'guess' as const })),
  ]
    .filter((item) => item.text?.trim())
    .filter((item, index, array) => array.findIndex((candidate) => candidate.text === item.text) === index)
    .slice(0, limit) as SearchSuggestItem[];

  return {
    query: keyword,
    items,
  };
}

