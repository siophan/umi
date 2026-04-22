import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { getRequestUser, optionalUser, requireUser } from '../../lib/auth';
import { HttpError, asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { getProductDetail } from './product-detail';
import { getProductFeed } from './product-feed';
import { favoriteProduct, unfavoriteProduct } from './product-favorite';

export const productRouter: ExpressRouter = Router();

productRouter.get(
  '/:id',
  optionalUser,
  asyncHandler(async (request, response) => {
    const productId = Array.isArray(request.params.id)
      ? request.params.id[0] ?? ''
      : request.params.id;

    try {
      ok(response, await getProductDetail(productId, request.user?.id));
    } catch (error) {
      if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') {
        throw new HttpError(404, 'PRODUCT_NOT_FOUND', '商品不存在');
      }
      throw error;
    }
  }),
);

productRouter.get(
  '/',
  optionalUser,
  asyncHandler(async (request, response) => {
    ok(
      response,
      await getProductFeed({
        limit: Number(request.query.limit ?? 20),
        keyword: String(request.query.q ?? ''),
        categoryId: String(request.query.categoryId ?? ''),
        userId: request.user?.id,
      }),
    );
  }),
);

productRouter.post(
  '/:id/favorite',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'PRODUCT_FAVORITE_FAILED',
      message: '收藏商品失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(response, await favoriteProduct(user.id, String(request.params.id)));
    },
  ),
);

productRouter.delete(
  '/:id/favorite',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'PRODUCT_UNFAVORITE_FAILED',
      message: '取消收藏商品失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(response, await unfavoriteProduct(user.id, String(request.params.id)));
    },
  ),
);
