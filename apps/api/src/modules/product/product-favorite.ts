import { PRODUCT_INTERACTION_FAVORITE, ensureProductExists } from './product-shared';
import { getDbPool } from '../../lib/db';

export async function favoriteProduct(userId: string, productId: string) {
  await ensureProductExists(productId);
  const db = getDbPool();
  await db.execute(
    `
      INSERT INTO product_interaction (user_id, product_id, interaction_type, created_at, updated_at)
      SELECT ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
      WHERE NOT EXISTS (
        SELECT 1
        FROM product_interaction
        WHERE user_id = ?
          AND product_id = ?
          AND interaction_type = ?
      )
    `,
    [userId, productId, PRODUCT_INTERACTION_FAVORITE, userId, productId, PRODUCT_INTERACTION_FAVORITE],
  );
  return { success: true as const };
}

export async function unfavoriteProduct(userId: string, productId: string) {
  const db = getDbPool();
  await db.execute(
    `
      DELETE FROM product_interaction
      WHERE user_id = ?
        AND product_id = ?
        AND interaction_type = ?
    `,
    [userId, productId, PRODUCT_INTERACTION_FAVORITE],
  );
  return { success: true as const };
}
