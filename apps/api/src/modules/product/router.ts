import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { getRequestUser, optionalUser, requireUser } from '../../lib/auth';
import { HttpError, asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { getProductDetail } from './product-detail';
import { getProductFeed, type ProductFeedSort } from './product-feed';
import { favoriteProduct, unfavoriteProduct } from './product-favorite';
import {
  appendProductReview,
  listProductReviews,
  toggleProductReviewHelpful,
} from './product-review';
import { getProductCategories } from './product-shared';

export const productRouter: ExpressRouter = Router();

productRouter.get(
  '/categories',
  asyncHandler(async (_request, response) => {
    const items = await getProductCategories();
    ok(response, { items });
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
        offset: Number(request.query.offset ?? 0),
        keyword: String(request.query.q ?? ''),
        categoryId: String(request.query.categoryId ?? ''),
        shopId: String(request.query.shopId ?? ''),
        sort: request.query.sort as ProductFeedSort | undefined,
        userId: request.user?.id,
      }),
    );
  }),
);

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

productRouter.get(
  '/:id/reviews',
  optionalUser,
  asyncHandler(async (request, response) => {
    const productId = String(request.params.id);
    ok(
      response,
      await listProductReviews(productId, {
        page: typeof request.query.page === 'string' ? Number(request.query.page) : undefined,
        pageSize:
          typeof request.query.pageSize === 'string' ? Number(request.query.pageSize) : undefined,
        userId: request.user?.id ?? null,
      }),
    );
  }),
);

productRouter.post(
  '/reviews/:reviewId/append',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'PRODUCT_REVIEW_APPEND_FAILED',
      message: '追评失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      try {
        ok(
          response,
          await appendProductReview(
            String(request.params.reviewId),
            user.id,
            request.body as { content: string; images?: string[] },
          ),
        );
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === '评价不存在') {
            throw new HttpError(404, 'PRODUCT_REVIEW_NOT_FOUND', '评价不存在');
          }
          if (error.message === '无权追评') {
            throw new HttpError(403, 'PRODUCT_REVIEW_FORBIDDEN', '无权追评');
          }
          if (error.message === '已追评，不能再次追评') {
            throw new HttpError(400, 'PRODUCT_REVIEW_ALREADY_APPENDED', '已追评，不能再次追评');
          }
          if (error.message === '请输入追评内容' || error.message === '追评内容超出 1000 字') {
            throw new HttpError(400, 'PRODUCT_REVIEW_APPEND_INVALID', error.message);
          }
        }
        throw error;
      }
    },
  ),
);

productRouter.post(
  '/reviews/:reviewId/helpful',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'PRODUCT_REVIEW_HELPFUL_FAILED',
      message: '操作失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      try {
        ok(
          response,
          await toggleProductReviewHelpful(String(request.params.reviewId), user.id),
        );
      } catch (error) {
        if (error instanceof Error && error.message === '评价不存在') {
          throw new HttpError(404, 'PRODUCT_REVIEW_NOT_FOUND', '评价不存在');
        }
        throw error;
      }
    },
  ),
);
