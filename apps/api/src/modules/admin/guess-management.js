import { toEntityId, toOptionalEntityId, } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { GUESS_ACTIVE, GUESS_PRODUCT_SOURCE_PLATFORM, GUESS_PRODUCT_SOURCE_SHOP, GUESS_REJECTED, GUESS_SCOPE_PUBLIC, GUESS_SOURCE_OPERATION, GUESS_TYPE_STANDARD, REVIEW_ACTION_APPROVE, REVIEW_ACTION_REJECT, REVIEW_APPROVED, REVIEW_REJECTED, SETTLEMENT_MODE_ORACLE, buildGuessSummary, buildVoteCountLookup, ensureGuessPendingReview, getGuessOptionRows, getGuessRows, getGuessVoteRows, normalizeCreateGuessEndTime, normalizeGuessOptionTexts, normalizeGuessRejectReason, normalizeGuessReviewStatus, mapGuessReviewStatus, mapGuessStatus, requireActiveGuessCategory, requireGuessProductForCreate, groupRowsByGuess, } from './guesses-shared';
const COMMENT_TARGET_GUESS = 10;
const REVIEW_ACTION_SUBMIT = 10;
function parseUnknownJson(value) {
    if (typeof value !== 'string') {
        return value;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}
function mapReviewActionLabel(action) {
    const code = Number(action ?? 0);
    if (code === REVIEW_ACTION_APPROVE) {
        return { action: 'approve', label: '审核通过' };
    }
    if (code === REVIEW_ACTION_REJECT) {
        return { action: 'reject', label: '审核拒绝' };
    }
    return { action: 'submit', label: '提交审核' };
}
export async function getAdminGuesses() {
    const rows = await getGuessRows();
    const guessIds = rows.map((row) => String(row.id));
    const [optionRows, voteRows] = await Promise.all([
        getGuessOptionRows(guessIds),
        getGuessVoteRows(guessIds),
    ]);
    const optionsByGuess = groupRowsByGuess(optionRows);
    const voteCountMap = buildVoteCountLookup(voteRows);
    return {
        items: rows.map((row) => buildGuessSummary(row, optionsByGuess.get(String(row.id)) || [], voteCountMap)),
    };
}
export async function getAdminGuessDetail(guessId) {
    const db = getDbPool();
    const [guessRows] = await db.query(`
      SELECT
        g.id,
        g.title,
        g.status,
        g.review_status,
        g.creator_id,
        COALESCE(au.display_name, au.username, up.name, IF(u.phone_number IS NOT NULL, CONCAT('用户', RIGHT(u.phone_number, 4)), NULL), CONCAT('用户', g.creator_id)) AS creator_name,
        gc.name AS category_name,
        g.description,
        g.topic_detail,
        g.scope,
        g.settlement_mode,
        g.end_time,
        g.settled_at,
        g.created_at,
        g.updated_at,
        p.id AS product_id,
        p.name AS product_name,
        b.name AS brand_name,
        COALESCE(p.image_url, bp.default_img, g.image_url) AS product_image_url,
        p.price AS product_price,
        p.guess_price AS product_guess_price
      FROM guess g
      LEFT JOIN admin_user au ON au.id = g.creator_id
      LEFT JOIN user u ON u.id = g.creator_id
      LEFT JOIN user_profile up ON up.user_id = u.id
      LEFT JOIN category gc ON gc.id = g.category_id
      LEFT JOIN (
        SELECT guess_id, MIN(id) AS first_guess_product_id
        FROM guess_product
        GROUP BY guess_id
      ) first_gp ON first_gp.guess_id = g.id
      LEFT JOIN guess_product gp ON gp.id = first_gp.first_guess_product_id
      LEFT JOIN product p ON p.id = gp.product_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      WHERE g.id = ?
      LIMIT 1
    `, [guessId]);
    const guess = guessRows[0];
    if (!guess) {
        throw new Error('竞猜不存在');
    }
    const [optionRows, aggregateRows, reviewRows, evidenceRows, commentRows] = await Promise.all([
        db.query(`
        SELECT
          go.id,
          go.option_index,
          go.option_text,
          go.odds,
          go.is_result,
          COALESCE(stats.vote_count, 0) AS vote_count,
          COALESCE(stats.vote_amount, 0) AS vote_amount
        FROM guess_option go
        LEFT JOIN (
          SELECT
            choice_idx AS option_index,
            COUNT(*) AS vote_count,
            COALESCE(SUM(amount), 0) AS vote_amount
          FROM guess_bet
          WHERE guess_id = ?
          GROUP BY choice_idx
        ) stats ON stats.option_index = go.option_index
        WHERE go.guess_id = ?
        ORDER BY go.option_index ASC
      `, [guessId, guessId]),
        db.query(`
        SELECT
          COUNT(*) AS total_bets,
          COUNT(DISTINCT user_id) AS total_participants,
          COALESCE(SUM(amount), 0) AS total_amount
        FROM guess_bet
        WHERE guess_id = ?
      `, [guessId]),
        db.query(`
        SELECT
          grl.id,
          grl.action,
          grl.from_status,
          grl.to_status,
          grl.note,
          grl.reviewer_id,
          COALESCE(au.display_name, au.username) AS reviewer_name,
          grl.created_at
        FROM guess_review_log grl
        LEFT JOIN admin_user au ON au.id = grl.reviewer_id
        WHERE grl.guess_id = ?
        ORDER BY grl.created_at DESC, grl.id DESC
      `, [guessId]),
        db.query(`
        SELECT
          goe.id,
          goe.source_type,
          goe.matched_index,
          goe.confidence,
          goe.reason,
          goe.verified_at,
          goe.created_at,
          goe.query_payload,
          goe.response_payload
        FROM guess_oracle_evidence goe
        WHERE goe.guess_id = ?
        ORDER BY goe.created_at DESC, goe.id DESC
      `, [guessId]),
        db.query(`
        SELECT
          ci.id,
          up.name AS author_name,
          u.phone_number AS author_phone,
          ci.content,
          ci.created_at,
          (
            SELECT COUNT(*)
            FROM comment_item reply
            WHERE reply.parent_id = ci.id
          ) AS reply_count
        FROM comment_item ci
        LEFT JOIN user u ON u.id = ci.user_id
        LEFT JOIN user_profile up ON up.user_id = u.id
        WHERE ci.target_type = ?
          AND ci.target_id = ?
          AND ci.parent_id IS NULL
        ORDER BY ci.created_at DESC, ci.id DESC
        LIMIT 20
      `, [COMMENT_TARGET_GUESS, guessId]),
    ]);
    const aggregate = aggregateRows[0][0] ?? {
        total_bets: 0,
        total_participants: 0,
        total_amount: 0,
    };
    return {
        guess: {
            id: toEntityId(guess.id),
            title: guess.title,
            status: mapGuessStatus(guess.status),
            reviewStatus: mapGuessReviewStatus(guess.review_status),
            category: guess.category_name ?? '-',
            creatorId: toEntityId(guess.creator_id),
            creatorName: guess.creator_name ?? '-',
            description: guess.description ?? null,
            topicDetail: guess.topic_detail ?? null,
            scope: Number(guess.scope ?? 0) === GUESS_SCOPE_PUBLIC ? 'public' : 'friends',
            settlementMode: Number(guess.settlement_mode ?? 0) === SETTLEMENT_MODE_ORACLE ? 'oracle' : 'manual',
            endTime: guess.end_time ? new Date(guess.end_time).toISOString() : null,
            settledAt: guess.settled_at ? new Date(guess.settled_at).toISOString() : null,
            createdAt: guess.created_at ? new Date(guess.created_at).toISOString() : null,
            updatedAt: guess.updated_at ? new Date(guess.updated_at).toISOString() : null,
            product: {
                id: toOptionalEntityId(guess.product_id),
                name: guess.product_name ?? '-',
                brand: guess.brand_name ?? '-',
                price: Number(guess.product_price ?? 0),
                guessPrice: Number(guess.product_guess_price ?? 0),
                imageUrl: guess.product_image_url ?? null,
            },
            options: optionRows[0].map((row) => ({
                id: toEntityId(row.id),
                optionIndex: Number(row.option_index ?? 0),
                optionText: row.option_text,
                odds: Number(row.odds ?? 0),
                voteCount: Number(row.vote_count ?? 0),
                voteAmount: Number(row.vote_amount ?? 0),
                isResult: Boolean(Number(row.is_result ?? 0)),
            })),
        },
        stats: {
            totalBets: Number(aggregate.total_bets ?? 0),
            totalParticipants: Number(aggregate.total_participants ?? 0),
            totalAmount: Number(aggregate.total_amount ?? 0),
        },
        reviewLogs: reviewRows[0].map((row) => {
            const current = row;
            const action = mapReviewActionLabel(current.action);
            return {
                id: toEntityId(current.id),
                action: action.action,
                actionLabel: action.label,
                fromStatus: Number(current.from_status ?? 0),
                toStatus: Number(current.to_status ?? 0),
                note: current.note ?? null,
                reviewerId: toOptionalEntityId(current.reviewer_id),
                reviewerName: current.reviewer_name ?? null,
                createdAt: current.created_at ? new Date(current.created_at).toISOString() : null,
            };
        }),
        comments: commentRows[0].map((row) => {
            const current = row;
            return {
                id: toEntityId(current.id),
                authorName: current.author_name?.trim() ||
                    (current.author_phone ? `用户${String(current.author_phone).slice(-4)}` : '未知用户'),
                content: current.content,
                createdAt: current.created_at ? new Date(current.created_at).toISOString() : null,
                replyCount: Number(current.reply_count ?? 0),
            };
        }),
        oracleEvidence: evidenceRows[0].map((row) => {
            const current = row;
            return {
                id: toEntityId(current.id),
                sourceType: current.source_type,
                matchedIndex: current.matched_index == null ? null : Number(current.matched_index),
                confidence: current.confidence == null ? null : Number(current.confidence),
                reason: current.reason ?? null,
                verifiedAt: current.verified_at ? new Date(current.verified_at).toISOString() : null,
                createdAt: current.created_at ? new Date(current.created_at).toISOString() : null,
                queryPayload: parseUnknownJson(current.query_payload),
                responsePayload: parseUnknownJson(current.response_payload),
            };
        }),
    };
}
export async function createAdminGuess(payload, creatorId) {
    const title = payload.title.trim();
    if (!title) {
        throw new Error('竞猜标题不能为空');
    }
    if (!payload.categoryId) {
        throw new Error('请选择竞猜分类');
    }
    if (!payload.productId) {
        throw new Error('请选择关联商品');
    }
    const endTime = normalizeCreateGuessEndTime(payload.endTime);
    const optionTexts = normalizeGuessOptionTexts(payload.optionTexts);
    const product = await requireGuessProductForCreate(String(payload.productId));
    await requireActiveGuessCategory(String(payload.categoryId));
    const description = payload.description?.trim() || null;
    const imageUrl = payload.imageUrl?.trim() || product.image_url || null;
    const guessProductSourceType = product.shop_id == null ? GUESS_PRODUCT_SOURCE_PLATFORM : GUESS_PRODUCT_SOURCE_SHOP;
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [guessResult] = await connection.execute(`
        INSERT INTO guess (
          title,
          type,
          source_type,
          image_url,
          status,
          end_time,
          creator_id,
          category_id,
          description,
          review_status,
          scope,
          settlement_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
            title,
            GUESS_TYPE_STANDARD,
            GUESS_SOURCE_OPERATION,
            imageUrl,
            GUESS_ACTIVE,
            endTime,
            creatorId,
            payload.categoryId,
            description,
            REVIEW_APPROVED,
            GUESS_SCOPE_PUBLIC,
            SETTLEMENT_MODE_ORACLE,
        ]);
        const guessId = String(guessResult.insertId);
        await connection.execute(`
        INSERT INTO guess_product (
          guess_id,
          product_id,
          option_idx,
          source_type,
          shop_id,
          quantity
        ) VALUES (?, ?, 0, ?, ?, 1)
      `, [guessId, payload.productId, guessProductSourceType, product.shop_id]);
        for (const [index, optionText] of optionTexts.entries()) {
            await connection.execute(`
          INSERT INTO guess_option (
            guess_id,
            option_index,
            option_text,
            odds,
            is_result
          ) VALUES (?, ?, ?, 1, 0)
        `, [guessId, index, optionText]);
        }
        await connection.commit();
        return {
            id: toEntityId(guessId),
            status: 'active',
            reviewStatus: 'approved',
        };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function reviewAdminGuess(guessId, reviewerId, payload) {
    const status = normalizeGuessReviewStatus(payload.status);
    const rejectReason = normalizeGuessRejectReason(status, payload.rejectReason);
    const nextGuessStatus = status === 'approved' ? GUESS_ACTIVE : GUESS_REJECTED;
    const nextReviewStatus = status === 'approved' ? REVIEW_APPROVED : REVIEW_REJECTED;
    const action = status === 'approved' ? REVIEW_ACTION_APPROVE : REVIEW_ACTION_REJECT;
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [guessRows] = await connection.execute(`
        SELECT id, status, review_status
        FROM guess
        WHERE id = ?
        LIMIT 1
      `, [guessId]);
        const guess = guessRows[0];
        if (!guess) {
            throw new Error('竞猜不存在');
        }
        ensureGuessPendingReview(guess);
        await connection.execute(`
        UPDATE guess
        SET
          status = ?,
          review_status = ?,
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [nextGuessStatus, nextReviewStatus, guessId]);
        await connection.execute(`
        INSERT INTO guess_review_log (
          guess_id,
          reviewer_id,
          action,
          from_status,
          to_status,
          note,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `, [guessId, reviewerId, action, Number(guess.status ?? 0), nextGuessStatus, rejectReason]);
        await connection.commit();
        return {
            id: toEntityId(guess.id),
            status,
        };
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
