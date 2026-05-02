import type mysql from 'mysql2/promise';
import type { PublicShopDetailResult } from '@umi/shared';
import { toEntityId, toOptionalEntityId } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { PublicShopGuessRow, ShopProductRow, ShopRow, STATUS_ACTIVE } from './shop-shared';

export async function getPublicShopDetail(
  shopId: string,
  viewerId: string | null = null,
): Promise<PublicShopDetailResult> {
  const db = getDbPool();
  const [shopRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        s.id,
        s.user_id AS owner_user_id,
        s.name,
        c.name AS category,
        s.description,
        s.logo_url,
        s.status,
        COALESCE((SELECT COUNT(*) FROM user_follow uf WHERE uf.following_id = s.user_id), 0) AS fans,
        COALESCE((SELECT COUNT(*) FROM product p WHERE p.shop_id = s.id AND p.status = ?), 0) AS product_count,
        COALESCE((SELECT COUNT(*) FROM fulfillment_order fo WHERE fo.shop_id = s.id), 0) AS total_sales,
        COALESCE((SELECT COUNT(*) FROM shop_brand_auth sba WHERE sba.shop_id = s.id AND sba.status = ?), 0) AS brand_auth_count,
        COALESCE((
          SELECT AVG(pr.rating)
          FROM product_review pr
          INNER JOIN product p2 ON p2.id = pr.product_id
          WHERE p2.shop_id = s.id AND pr.status = 10
        ), 0) AS avg_rating,
        CASE
          WHEN ? IS NULL THEN 0
          ELSE (
            SELECT COUNT(*) FROM user_follow uf
            WHERE uf.follower_id = ? AND uf.following_id = s.user_id
          )
        END AS viewer_followed
      FROM shop s
      LEFT JOIN category c ON c.id = s.category_id
      WHERE s.id = ?
      LIMIT 1
    `,
    [STATUS_ACTIVE, STATUS_ACTIVE, viewerId, viewerId, shopId],
  );

  const shop = (shopRows[0] as (ShopRow & {
    owner_user_id?: number | string;
    fans?: number | string;
    product_count?: number | string;
    total_sales?: number | string;
    brand_auth_count?: number | string;
    avg_rating?: number | string | null;
    viewer_followed?: number | string | null;
  }) | undefined) ?? null;

  if (!shop) {
    throw new HttpError(404, 'SHOP_NOT_FOUND', '店铺不存在');
  }

  const [productRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        bp.name AS name,
        bp.guide_price AS price,
        bp.guide_price AS original_price,
        bp.default_img AS image_url,
        p.sales,
        p.rating,
        p.status,
        p.created_at,
        b.name AS brand_name
      FROM product p
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      WHERE p.shop_id = ? AND p.status = ?
      ORDER BY p.created_at DESC, p.id DESC
    `,
    [shop.id, STATUS_ACTIVE],
  );

  const [guessRows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        g.id,
        g.title,
        gp.product_id AS related_product_id
      FROM guess g
      INNER JOIN guess_product gp ON gp.guess_id = g.id
      INNER JOIN product p ON p.id = gp.product_id
      WHERE p.shop_id = ?
        AND g.status = 30
        AND g.review_status = 30
      ORDER BY g.created_at DESC, g.id DESC
      LIMIT 8
    `,
    [shop.id],
  );

  const guessIds = (guessRows as PublicShopGuessRow[]).map((row) => row.id);
  let voteRows: Array<{ guess_id: number | string; choice_idx: number | string; vote_count: number | string }> = [];
  let optionRows: Array<{ guess_id: number | string; option_index: number | string; option_text: string }> = [];

  if (guessIds.length > 0) {
    const [votes] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, choice_idx, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id IN (?)
        GROUP BY guess_id, choice_idx
      `,
      [guessIds],
    );
    voteRows = votes as Array<{ guess_id: number | string; choice_idx: number | string; vote_count: number | string }>;

    const [options] = await db.query<mysql.RowDataPacket[]>(
      `
        SELECT guess_id, option_index, option_text
        FROM guess_option
        WHERE guess_id IN (?)
        ORDER BY guess_id ASC, option_index ASC
      `,
      [guessIds],
    );
    optionRows = options as Array<{ guess_id: number | string; option_index: number | string; option_text: string }>;
  }

  const productItems = (productRows as ShopProductRow[]).map((row) => ({
    id: toEntityId(row.id),
    name: row.name,
    price: Number(row.price ?? 0) / 100,
    originalPrice: Number(row.original_price ?? row.price ?? 0) / 100,
    sales: Number(row.sales ?? 0),
    rating: Number(row.rating ?? 0),
    brand: row.brand_name ?? null,
    img: row.image_url ?? null,
    badge: '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  }));

  const avgRating = shop.avg_rating != null ? Number(Number(shop.avg_rating).toFixed(1)) : 0;

  return {
    shop: {
      id: toEntityId(shop.id),
      ownerUserId: toEntityId(shop.owner_user_id ?? 0),
      name: shop.name,
      category: shop.category,
      description: shop.description,
      logo: shop.logo_url,
      status: Number(shop.status) === STATUS_ACTIVE ? 'active' : String(shop.status),
      city: null,
      fans: Number(shop.fans ?? 0),
      productCount: Number(shop.product_count ?? 0),
      totalSales: Number(shop.total_sales ?? 0),
      avgRating,
      brandAuthCount: Number(shop.brand_auth_count ?? 0),
      viewerFollowed: Number(shop.viewer_followed ?? 0) > 0,
    },
    products: productItems,
    guesses: (guessRows as PublicShopGuessRow[]).map((row) => {
      const options = optionRows
        .filter((item) => String(item.guess_id) === String(row.id))
        .sort((left, right) => Number(left.option_index) - Number(right.option_index));
      const votes = options.map((option) => {
        const vote = voteRows.find(
          (item) => String(item.guess_id) === String(row.id) && Number(item.choice_idx) === Number(option.option_index),
        );
        return Number(vote?.vote_count ?? 0);
      });
      const totalVotes = votes.reduce((sum, value) => sum + value, 0);
      return {
        id: toEntityId(row.id),
        title: row.title,
        votes: votes.map((value) => (totalVotes > 0 ? Math.round((value / totalVotes) * 100) : 0)),
        options: options.map((item) => item.option_text),
        relatedProductId: toOptionalEntityId(row.related_product_id),
      };
    }),
  };
}

