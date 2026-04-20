import { Router } from 'express';
import { toEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
export const bannerRouter = Router();
const TARGET_GUESS = 10;
const TARGET_POST = 20;
const TARGET_PRODUCT = 30;
const TARGET_SHOP = 40;
const TARGET_EXTERNAL = 90;
const GUESS_ACTIVE = 30;
const GUESS_SETTLED = 40;
const GUESS_REJECTED = 90;
const GUESS_DRAFT = 10;
const GUESS_PENDING_REVIEW = 20;
const REVIEW_PENDING = 10;
const REVIEW_APPROVED = 30;
function mapGuessStatus(code) {
    const value = Number(code ?? 0);
    if (value === GUESS_DRAFT) {
        return 'draft';
    }
    if (value === GUESS_PENDING_REVIEW) {
        return 'pending_review';
    }
    if (value === GUESS_SETTLED) {
        return 'settled';
    }
    if (value === GUESS_REJECTED) {
        return 'cancelled';
    }
    return 'active';
}
function mapGuessReviewStatus(code) {
    return Number(code ?? 0) === REVIEW_PENDING
        ? 'pending'
        : Number(code ?? 0) === REVIEW_APPROVED
            ? 'approved'
            : 'rejected';
}
function mapTargetType(code) {
    const value = Number(code ?? 0);
    if (value === TARGET_GUESS) {
        return 'guess';
    }
    if (value === TARGET_POST) {
        return 'post';
    }
    if (value === TARGET_PRODUCT) {
        return 'product';
    }
    if (value === TARGET_SHOP) {
        return 'shop';
    }
    return 'external';
}
function buildTargetPath(targetType, targetId, actionUrl) {
    if (targetType === 'external') {
        return actionUrl;
    }
    if (!targetId) {
        return actionUrl;
    }
    if (targetType === 'guess') {
        return `/guess/${targetId}`;
    }
    if (targetType === 'post') {
        return `/post/${targetId}`;
    }
    if (targetType === 'product') {
        return `/product/${targetId}`;
    }
    if (targetType === 'shop') {
        return `/shop/${targetId}`;
    }
    return actionUrl;
}
function buildGuessSummary(row, options, voteRows) {
    const product = {
        id: toEntityId(row.product_id ?? 0),
        name: row.product_name || '未命名商品',
        brand: row.brand_name || '未知品牌',
        img: row.product_img || '',
        price: Number(row.product_price ?? 0) / 100,
        guessPrice: Number(row.product_guess_price ?? row.product_price ?? 0) / 100,
        category: row.category || '未分类',
        status: 'active',
    };
    return {
        id: toEntityId(row.id),
        title: row.title,
        status: mapGuessStatus(row.status),
        reviewStatus: mapGuessReviewStatus(row.review_status),
        category: row.category || '热门',
        endTime: row.end_time ? new Date(row.end_time).toISOString() : new Date().toISOString(),
        creatorId: toEntityId(row.creator_id),
        product,
        options: options.map((option) => ({
            id: `${String(row.id)}-${Number(option.option_index)}`,
            optionIndex: Number(option.option_index),
            optionText: option.option_text,
            odds: Number(option.odds ?? 1),
            voteCount: voteRows.find((vote) => String(vote.guess_id) === String(row.id) &&
                Number(vote.option_index) === Number(option.option_index))?.vote_count != null
                ? Number(voteRows.find((vote) => String(vote.guess_id) === String(row.id) &&
                    Number(vote.option_index) === Number(option.option_index))?.vote_count)
                : 0,
            isResult: Boolean(option.is_result),
        })),
    };
}
async function getGuessSummaries(guessIds) {
    if (guessIds.length === 0) {
        return new Map();
    }
    const db = getDbPool();
    const [guessRows] = await db.query(`
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
        COALESCE(p.image_url, bp.default_img, g.image_url) AS product_img,
        p.price AS product_price,
        p.guess_price AS product_guess_price
      FROM guess g
      LEFT JOIN guess_product gp ON gp.guess_id = g.id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      LEFT JOIN category c ON c.id = g.category_id
      WHERE g.id IN (?)
    `, [guessIds]);
    const [optionRows] = await db.query(`
      SELECT
        guess_id,
        option_index,
        option_text,
        odds,
        is_result
      FROM guess_option
      WHERE guess_id IN (?)
      ORDER BY guess_id ASC, option_index ASC
    `, [guessIds]);
    const [voteRows] = await db.query(`
      SELECT
        guess_id,
        choice_idx AS option_index,
        COUNT(*) AS vote_count
      FROM guess_bet
      WHERE guess_id IN (?)
      GROUP BY guess_id, choice_idx
    `, [guessIds]);
    const optionsByGuess = new Map();
    for (const row of optionRows) {
        const key = String(row.guess_id);
        const current = optionsByGuess.get(key) || [];
        current.push(row);
        optionsByGuess.set(key, current);
    }
    const votesByGuess = new Map();
    for (const row of voteRows) {
        const key = String(row.guess_id);
        const current = votesByGuess.get(key) || [];
        current.push(row);
        votesByGuess.set(key, current);
    }
    return new Map(guessRows.map((row) => [
        String(row.id),
        buildGuessSummary(row, optionsByGuess.get(String(row.id)) || [], votesByGuess.get(String(row.id)) || []),
    ]));
}
bannerRouter.get('/', asyncHandler(async (request, response) => {
    const position = typeof request.query.position === 'string' ? request.query.position.trim() : '';
    const limit = Math.min(Math.max(Number(request.query.limit ?? 5) || 5, 1), 10);
    const db = getDbPool();
    const params = [];
    const positionSql = position ? 'AND position = ?' : '';
    if (position) {
        params.push(position);
    }
    params.push(limit);
    const [rows] = await db.query(`
        SELECT
          id,
          position,
          title,
          subtitle,
          image_url,
          target_type,
          target_id,
          action_url,
          sort
        FROM banner
        WHERE (
          status IS NULL
          OR status IN (10, '10', 'active')
        )
          ${positionSql}
          AND (start_at IS NULL OR start_at <= CURRENT_TIMESTAMP(3))
          AND (end_at IS NULL OR end_at >= CURRENT_TIMESTAMP(3))
        ORDER BY sort DESC, created_at DESC, id DESC
        LIMIT ?
      `, params);
    const bannerRows = rows;
    const guessMap = await getGuessSummaries(bannerRows
        .filter((row) => Number(row.target_type ?? 0) === TARGET_GUESS && row.target_id != null)
        .map((row) => String(row.target_id)));
    ok(response, {
        items: bannerRows.map((row) => {
            const targetType = mapTargetType(row.target_type);
            const targetId = row.target_id == null ? null : String(row.target_id);
            return {
                id: toEntityId(row.id),
                position: row.position,
                title: row.title,
                subtitle: row.subtitle,
                imageUrl: row.image_url,
                targetType,
                targetId: targetId ? toEntityId(targetId) : null,
                actionUrl: row.action_url,
                sort: Number(row.sort ?? 0),
                targetPath: buildTargetPath(targetType, targetId, row.action_url),
                guess: targetId ? guessMap.get(targetId) ?? null : null,
            };
        }),
    });
}));
