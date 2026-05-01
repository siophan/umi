import type mysql from 'mysql2/promise';

import { toEntityId, type CreateGuessPayload, type CreateGuessResult } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { getCurrentShop, STATUS_ACTIVE as SHOP_STATUS_ACTIVE } from '../shop/shop-shared';

const GUESS_TYPE_STANDARD = 10;
const GUESS_SOURCE_USER = 10;
const GUESS_STATUS_ACTIVE = 30;
const REVIEW_APPROVED = 30;
const GUESS_SCOPE_PUBLIC = 10;
const GUESS_SCOPE_FRIENDS = 20;
const SETTLEMENT_MODE_ORACLE = 10;
const GUESS_PRODUCT_SOURCE_PLATFORM = 10;
const GUESS_PRODUCT_SOURCE_SHOP = 20;
const INVITATION_PENDING = 10;

type GuessCategoryRow = {
  id: number | string;
  name: string;
  status: number | string;
  biz_type: number | string;
};

type CreateGuessProductRow = {
  id: number | string;
  shop_id: number | string | null;
  image_url: string | null;
  status: number | string;
  stock: number | string | null;
  frozen_stock: number | string | null;
  shop_status: number | string | null;
  brand_status: number | string | null;
  brand_product_status: number | string | null;
};

function normalizeOptionTexts(optionTexts: string[]) {
  const normalized = optionTexts.map((item) => item.trim()).filter((item) => item.length > 0);

  if (normalized.length < 2) {
    throw new Error('至少填写两个有效选项');
  }

  const uniqueCount = new Set(normalized.map((item) => item.toLowerCase())).size;
  if (uniqueCount !== normalized.length) {
    throw new Error('竞猜选项不能重复');
  }

  return normalized;
}

function normalizeEndTime(endTime: string) {
  const value = endTime.trim();
  if (!value) {
    throw new Error('请设置截止时间');
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('截止时间不合法');
  }

  if (parsed.getTime() <= Date.now()) {
    throw new Error('截止时间必须晚于当前时间');
  }

  return parsed;
}

function normalizeRevealAt(revealAt: string | null | undefined, endTime: Date) {
  const value = (revealAt ?? '').trim();
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('揭晓时间不合法');
  }
  if (parsed.getTime() < endTime.getTime()) {
    throw new Error('揭晓时间必须晚于投注截止时间');
  }
  return parsed;
}

function normalizeMinParticipants(minParticipants: number | null | undefined) {
  if (minParticipants == null) {
    return null;
  }
  const value = Number(minParticipants);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error('最低参与人数必须是正整数');
  }
  if (value > 100000) {
    throw new Error('最低参与人数过大');
  }
  return value;
}

async function getCreatorActiveShop(creatorId: string) {
  const shop = await getCurrentShop(creatorId);
  if (shop && Number(shop.status) === SHOP_STATUS_ACTIVE) {
    return shop;
  }
  return null;
}

/**
 * 商家创建竞猜必须传有效 categoryId；非商家可不传，此时存 0 表示无分类。
 * 任意模式下传了 categoryId 都要校验存在、biz_type=40、已启用，否则报错。
 */
async function resolveGuessCategoryId(categoryId: string | null | undefined, isMerchant: boolean) {
  if (categoryId?.trim()) {
    const db = getDbPool();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `
        SELECT id, name, status, biz_type
        FROM category
        WHERE id = ?
        LIMIT 1
      `,
      [categoryId],
    );
    const category = (rows[0] as GuessCategoryRow | undefined) ?? null;
    if (!category || Number(category.biz_type) !== 40) {
      throw new Error('竞猜分类不存在');
    }
    if (Number(category.status) !== 10) {
      throw new Error('竞猜分类未启用');
    }
    return String(category.id);
  }

  if (isMerchant) {
    throw new Error('商家创建竞猜必须选择分类');
  }

  return '0';
}

async function requireProductForGuessCreate(productId: string, creatorShopId: string | null) {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        p.id,
        p.shop_id,
        bp.default_img AS image_url,
        p.status,
        bp.stock,
        bp.frozen_stock,
        s.status AS shop_status,
        b.status AS brand_status,
        bp.status AS brand_product_status
      FROM product p
      LEFT JOIN shop s ON s.id = p.shop_id
      LEFT JOIN brand_product bp ON bp.id = p.brand_product_id
      LEFT JOIN brand b ON b.id = bp.brand_id
      WHERE p.id = ?
      LIMIT 1
    `,
    [productId],
  );

  const product = (rows[0] as CreateGuessProductRow | undefined) ?? null;
  if (!product) {
    throw new Error('关联商品不存在');
  }

  if (Number(product.status) !== 10) {
    throw new Error('关联商品不可用于创建竞猜');
  }

  if (product.shop_status != null && Number(product.shop_status) !== 10) {
    throw new Error('关联商品所属店铺不可用于创建竞猜');
  }

  if (product.brand_status != null && Number(product.brand_status) !== 10) {
    throw new Error('关联商品所属品牌不可用于创建竞猜');
  }

  if (product.brand_product_status != null && Number(product.brand_product_status) !== 10) {
    throw new Error('关联商品所属品牌商品不可用于创建竞猜');
  }

  if (Number(product.stock ?? 0) - Number(product.frozen_stock ?? 0) <= 0) {
    throw new Error('关联商品可用库存不足');
  }

  // 商家创建竞猜：商品必须属于自家店铺，避免拿别家商品做营销。
  if (creatorShopId != null) {
    if (product.shop_id == null || String(product.shop_id) !== String(creatorShopId)) {
      throw new Error('店铺模式只能选自家店铺商品');
    }
  }

  return product;
}

async function resolveInviteeIds(invitedFriendIds: Array<string | number> | undefined, creatorId: string) {
  const normalizedIds = Array.from(
    new Set(
      (invitedFriendIds ?? [])
        .map((item) => String(item).trim())
        .filter((item) => /^\d+$/.test(item) && item !== creatorId),
    ),
  );

  if (normalizedIds.length === 0) {
    return [] as string[];
  }

  const db = getDbPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM user
      WHERE id IN (?)
    `,
    [normalizedIds],
  );

  return rows.map((row) => String(row.id));
}

export async function createUserGuess(
  payload: CreateGuessPayload,
  creatorId: string,
): Promise<CreateGuessResult> {
  const title = payload.title.trim();
  if (!title) {
    throw new Error('竞猜标题不能为空');
  }

  const endTime = normalizeEndTime(payload.endTime);
  const optionTexts = normalizeOptionTexts(payload.optionTexts);
  const scope = payload.scope === 'friends' ? 'friends' : 'public';
  const scopeCode = scope === 'friends' ? GUESS_SCOPE_FRIENDS : GUESS_SCOPE_PUBLIC;
  const creatorShop = await getCreatorActiveShop(creatorId);
  const merchant = creatorShop != null;
  // 商家发起公开竞猜（非好友PK）时商品必须归自家店铺；好友PK 任何身份都可以选全平台商品。
  const enforceShopId = merchant && scope === 'public' ? String(creatorShop.id) : null;
  const categoryId = await resolveGuessCategoryId(payload.categoryId ? String(payload.categoryId) : null, merchant);
  if (!payload.productId) {
    throw new Error('竞猜必须关联商品');
  }
  const product = await requireProductForGuessCreate(String(payload.productId), enforceShopId);
  const inviteeIds = await resolveInviteeIds(payload.invitedFriendIds, creatorId);
  if (scope === 'friends' && inviteeIds.length === 0) {
    throw new Error('好友PK必须选择参战好友');
  }

  const revealAt = merchant ? normalizeRevealAt(payload.revealAt, endTime) : null;
  const minParticipants = merchant ? normalizeMinParticipants(payload.minParticipants) : null;

  const description = payload.description?.trim() || null;
  const imageUrl = (payload.imageUrl ?? '').trim();
  if (!imageUrl) {
    throw new Error('封面图片不能为空');
  }
  const guessProductSourceType =
    product.shop_id == null ? GUESS_PRODUCT_SOURCE_PLATFORM : GUESS_PRODUCT_SOURCE_SHOP;

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [guessResult] = await connection.execute<mysql.ResultSetHeader>(
      `
        INSERT INTO guess (
          title,
          type,
          source_type,
          image_url,
          status,
          end_time,
          reveal_at,
          min_participants,
          creator_id,
          category_id,
          description,
          review_status,
          scope,
          settlement_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        GUESS_TYPE_STANDARD,
        GUESS_SOURCE_USER,
        imageUrl,
        GUESS_STATUS_ACTIVE,
        endTime,
        revealAt,
        minParticipants,
        creatorId,
        categoryId,
        description,
        REVIEW_APPROVED,
        scopeCode,
        SETTLEMENT_MODE_ORACLE,
      ],
    );

    const guessId = String(guessResult.insertId);

    {
      await connection.execute(
        `
          INSERT INTO guess_product (
            guess_id,
            product_id,
            option_idx,
            source_type,
            shop_id,
            quantity
          ) VALUES (?, ?, 0, ?, ?, 1)
        `,
        [guessId, payload.productId, guessProductSourceType, product.shop_id],
      );
    }

    for (const [index, optionText] of optionTexts.entries()) {
      await connection.execute(
        `
          INSERT INTO guess_option (
            guess_id,
            option_index,
            option_text,
            odds,
            is_result
          ) VALUES (?, ?, ?, 1, 0)
        `,
        [guessId, index, optionText],
      );
    }

    if (scope === 'friends' && inviteeIds.length > 0) {
      for (const inviteeId of inviteeIds) {
        await connection.execute(
          `
            INSERT INTO guess_invitation (
              guess_id,
              inviter_id,
              invitee_id,
              status
            ) VALUES (?, ?, ?, ?)
          `,
          [guessId, creatorId, inviteeId, INVITATION_PENDING],
        );
      }
    }

    await connection.commit();

    return {
      id: toEntityId(guessId),
      status: 'active',
      reviewStatus: 'approved',
      scope,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
