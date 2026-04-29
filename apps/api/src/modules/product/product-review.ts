import type mysql from 'mysql2/promise';
import { toEntityId } from '@umi/shared';
import type {
  AppendProductReviewPayload,
  AppendProductReviewResult,
  ProductReviewItem,
  ProductReviewListResult,
  ToggleProductReviewHelpfulResult,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

type ProductReviewListRow = mysql.RowDataPacket & {
  id: number | string;
  user_id: number | string;
  rating: number | string;
  content: string | null;
  images: unknown;
  helpful_count: number | string;
  reply: string | null;
  replied_at: Date | string | null;
  appended_content: string | null;
  appended_images: unknown;
  appended_at: Date | string | null;
  created_at: Date | string;
  user_name: string | null;
  user_avatar: string | null;
  user_voted_helpful: number | string | null;
};

function safeImages(value: unknown): string[] {
  if (value == null) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function mapReviewRow(row: ProductReviewListRow, currentUserId: string | null): ProductReviewItem {
  return {
    id: toEntityId(row.id),
    userName: row.user_name?.trim() || `用户${String(row.user_id)}`,
    userAvatar: row.user_avatar?.trim() || null,
    rating: Math.max(1, Math.min(5, Math.trunc(Number(row.rating) || 5))),
    content: row.content?.trim() || null,
    images: safeImages(row.images),
    helpfulCount: Math.max(0, Number(row.helpful_count) || 0),
    helpfulVoted: Boolean(Number(row.user_voted_helpful ?? 0)),
    reply: row.reply?.trim() || null,
    repliedAt: row.replied_at ? new Date(row.replied_at).toISOString() : null,
    appendedContent: row.appended_content?.trim() || null,
    appendedImages: safeImages(row.appended_images),
    appendedAt: row.appended_at ? new Date(row.appended_at).toISOString() : null,
    isMine: currentUserId != null && String(row.user_id) === String(currentUserId),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function listProductReviews(
  productId: string,
  query: { page?: number; pageSize?: number; userId?: string | null },
): Promise<ProductReviewListResult> {
  const db = getDbPool();
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(query.pageSize ?? PAGE_SIZE_DEFAULT) || PAGE_SIZE_DEFAULT));
  const offset = (page - 1) * pageSize;
  const userId = query.userId ?? null;

  let countRows: mysql.RowDataPacket[] = [];
  let summaryRows: mysql.RowDataPacket[] = [];
  let rows: mysql.RowDataPacket[] = [];

  try {
    [[countRows], [summaryRows], [rows]] = await Promise.all([
      db.query<mysql.RowDataPacket[]>(
        'SELECT COUNT(*) AS total FROM product_review WHERE product_id = ? AND status = 10',
        [productId],
      ),
      db.query<mysql.RowDataPacket[]>(
        `
          SELECT
            COUNT(*) AS total_count,
            COALESCE(AVG(rating), 0) AS avg_rating,
            SUM(CASE WHEN images IS NOT NULL AND JSON_LENGTH(images) > 0 THEN 1 ELSE 0 END) AS with_images
          FROM product_review
          WHERE product_id = ? AND status = 10
        `,
        [productId],
      ),
      db.query<mysql.RowDataPacket[]>(
        `
          SELECT
            pr.id,
            pr.user_id,
            pr.rating,
            pr.content,
            pr.images,
            pr.helpful_count,
            pr.reply,
            pr.replied_at,
            pr.created_at,
            up.name AS user_name,
            up.avatar_url AS user_avatar,
            ${userId ? 'EXISTS (SELECT 1 FROM product_review_helpful prh WHERE prh.review_id = pr.id AND prh.user_id = ?)' : '0'} AS user_voted_helpful
          FROM product_review pr
          LEFT JOIN user_profile up ON up.user_id = pr.user_id
          WHERE pr.product_id = ? AND pr.status = 10
          ORDER BY pr.created_at DESC, pr.id DESC
          LIMIT ?
          OFFSET ?
        `,
        userId ? [userId, productId, pageSize, offset] : [productId, pageSize, offset],
      ),
    ]);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === 'ER_NO_SUCH_TABLE') {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        summary: { averageRating: 0, totalCount: 0, withImages: 0 },
      };
    }
    throw error;
  }

  const total = Number((countRows[0] as { total?: number | string })?.total ?? 0);
  const summary = summaryRows[0] as
    | { total_count?: number | string; avg_rating?: number | string; with_images?: number | string }
    | undefined;

  return {
    items: (rows as ProductReviewListRow[]).map((row) => mapReviewRow(row, userId)),
    total,
    page,
    pageSize,
    summary: {
      averageRating: Number(Number(summary?.avg_rating ?? 0).toFixed(2)),
      totalCount: Number(summary?.total_count ?? 0),
      withImages: Number(summary?.with_images ?? 0),
    },
  };
}

export async function getRecentProductReviewsWithStats(
  productId: string,
  userId?: string | null,
): Promise<ProductReviewItem[]> {
  const db = getDbPool();
  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          pr.id,
          pr.user_id,
          pr.rating,
          pr.content,
          pr.images,
          pr.helpful_count,
          pr.reply,
          pr.replied_at,
          pr.appended_content,
          pr.appended_images,
          pr.appended_at,
          pr.created_at,
          up.name AS user_name,
          up.avatar_url AS user_avatar,
          ${userId ? 'EXISTS (SELECT 1 FROM product_review_helpful prh WHERE prh.review_id = pr.id AND prh.user_id = ?)' : '0'} AS user_voted_helpful
        FROM product_review pr
        LEFT JOIN user_profile up ON up.user_id = pr.user_id
        WHERE pr.product_id = ? AND pr.status = 10
        ORDER BY pr.created_at DESC, pr.id DESC
        LIMIT 3
      `,
      userId ? [userId, productId] : [productId],
    );
    return (rows as ProductReviewListRow[]).map((row) => mapReviewRow(row, userId ?? null));
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === 'ER_NO_SUCH_TABLE') {
      return [];
    }
    throw error;
  }
}

export async function appendProductReview(
  reviewId: string,
  userId: string,
  payload: AppendProductReviewPayload,
): Promise<AppendProductReviewResult> {
  const content = (payload.content ?? '').trim();
  if (!content) {
    throw new Error('请输入追评内容');
  }
  if (content.length > 1000) {
    throw new Error('追评内容超出 1000 字');
  }
  const images = Array.isArray(payload.images)
    ? payload.images
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 9)
    : [];

  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT id, user_id, appended_at FROM product_review WHERE id = ? AND status = 10 LIMIT 1',
    [reviewId],
  );
  const review = (rows as Array<{ id: number | string; user_id: number | string; appended_at: Date | string | null }>)[0];
  if (!review) {
    throw new Error('评价不存在');
  }
  if (String(review.user_id) !== String(userId)) {
    throw new Error('无权追评');
  }
  if (review.appended_at) {
    throw new Error('已追评，不能再次追评');
  }

  await db.execute(
    `
      UPDATE product_review
      SET appended_content = ?,
          appended_images = ?,
          appended_at = NOW(3),
          updated_at = NOW(3)
      WHERE id = ?
    `,
    [content, JSON.stringify(images), reviewId],
  );

  const [latestRows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT appended_at FROM product_review WHERE id = ? LIMIT 1',
    [reviewId],
  );
  const appendedAt = (latestRows[0] as { appended_at?: Date | string })?.appended_at;
  return {
    id: toEntityId(reviewId),
    appendedAt: appendedAt ? new Date(appendedAt).toISOString() : new Date().toISOString(),
  };
}

export async function toggleProductReviewHelpful(
  reviewId: string,
  userId: string,
): Promise<ToggleProductReviewHelpfulResult> {
  const db = getDbPool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [reviewRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id, helpful_count FROM product_review WHERE id = ? AND status = 10 LIMIT 1',
      [reviewId],
    );
    if (reviewRows.length === 0) {
      throw new Error('评价不存在');
    }

    const [existsRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM product_review_helpful WHERE review_id = ? AND user_id = ? LIMIT 1',
      [reviewId, userId],
    );
    const alreadyVoted = existsRows.length > 0;

    if (alreadyVoted) {
      await connection.execute(
        'DELETE FROM product_review_helpful WHERE review_id = ? AND user_id = ?',
        [reviewId, userId],
      );
      await connection.execute(
        'UPDATE product_review SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = ?',
        [reviewId],
      );
    } else {
      await connection.execute(
        'INSERT INTO product_review_helpful (review_id, user_id) VALUES (?, ?)',
        [reviewId, userId],
      );
      await connection.execute(
        'UPDATE product_review SET helpful_count = helpful_count + 1 WHERE id = ?',
        [reviewId],
      );
    }

    const [latestRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT helpful_count FROM product_review WHERE id = ? LIMIT 1',
      [reviewId],
    );
    const helpfulCount = Math.max(0, Number((latestRows[0] as { helpful_count?: number | string })?.helpful_count ?? 0));

    await connection.commit();
    return {
      reviewId: toEntityId(reviewId),
      helpful: !alreadyVoted,
      helpfulCount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
