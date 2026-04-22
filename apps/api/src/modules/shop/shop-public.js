import { toEntityId, toOptionalEntityId } from '@umi/shared';
import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { STATUS_ACTIVE } from './shop-shared';
export async function getPublicShopDetail(shopId) {
    const db = getDbPool();
    const [shopRows] = await db.execute(`
      SELECT
        s.id,
        s.name,
        c.name AS category,
        s.description,
        s.logo_url,
        s.status,
        NULL AS city,
        COALESCE((SELECT COUNT(*) FROM user_follow uf WHERE uf.following_id = s.user_id), 0) AS fans,
        COALESCE((SELECT COUNT(*) FROM product p WHERE p.shop_id = s.id), 0) AS product_count,
        COALESCE((SELECT COUNT(*) FROM fulfillment_order fo WHERE fo.shop_id = s.id), 0) AS total_sales,
        COALESCE((SELECT COUNT(*) FROM shop_brand_auth sba WHERE sba.shop_id = s.id AND sba.status = ?), 0) AS brand_auth_count
      FROM shop s
      LEFT JOIN category c ON c.id = s.category_id
      WHERE s.id = ?
      LIMIT 1
    `, [STATUS_ACTIVE, shopId]);
    const shop = shopRows[0] ?? null;
    if (!shop) {
        throw new HttpError(404, 'SHOP_NOT_FOUND', '店铺不存在');
    }
    const [productRows] = await db.execute(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.image_url,
        p.sales,
        p.rating,
        p.status,
        p.created_at,
        b.name AS brand_name
      FROM product p
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      WHERE p.shop_id = ?
      ORDER BY p.created_at DESC, p.id DESC
    `, [shop.id]);
    const [guessRows] = await db.execute(`
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
    `, [shop.id]);
    const guessIds = guessRows.map((row) => row.id);
    let voteRows = [];
    let optionRows = [];
    if (guessIds.length > 0) {
        const [votes] = await db.query(`
        SELECT guess_id, choice_idx, COUNT(*) AS vote_count
        FROM guess_bet
        WHERE guess_id IN (?)
        GROUP BY guess_id, choice_idx
      `, [guessIds]);
        voteRows = votes;
        const [options] = await db.query(`
        SELECT guess_id, option_index, option_text
        FROM guess_option
        WHERE guess_id IN (?)
        ORDER BY guess_id ASC, option_index ASC
      `, [guessIds]);
        optionRows = options;
    }
    const productItems = productRows.map((row) => ({
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
    const ratedProducts = productItems.filter((item) => item.rating > 0);
    const avgRating = ratedProducts.length > 0
        ? Number((ratedProducts.reduce((sum, item) => sum + item.rating, 0) / ratedProducts.length).toFixed(1))
        : 0;
    return {
        shop: {
            id: toEntityId(shop.id),
            name: shop.name,
            category: shop.category,
            description: shop.description,
            logo: shop.logo_url,
            status: Number(shop.status) === STATUS_ACTIVE ? 'active' : String(shop.status),
            city: shop.city ?? null,
            fans: Number(shop.fans ?? 0),
            productCount: Number(shop.product_count ?? 0),
            totalSales: Number(shop.total_sales ?? 0),
            avgRating,
            brandAuthCount: Number(shop.brand_auth_count ?? 0),
        },
        products: productItems,
        guesses: guessRows.map((row) => {
            const options = optionRows
                .filter((item) => String(item.guess_id) === String(row.id))
                .sort((left, right) => Number(left.option_index) - Number(right.option_index));
            const votes = options.map((option) => {
                const vote = voteRows.find((item) => String(item.guess_id) === String(row.id) && Number(item.choice_idx) === Number(option.option_index));
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
