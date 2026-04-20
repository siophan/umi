import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import type { AddCartItemPayload, UpdateCartItemPayload } from '@umi/shared';

import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { addCartItem, getCart, removeCartItem, updateCartItem } from './store';

export const cartRouter: ExpressRouter = Router();

cartRouter.get(
  '/',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getCart(user.id));
  }),
);

cartRouter.post(
  '/items',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'CART_ADD_FAILED',
      message: '加入购物车失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(response, await addCartItem(user.id, request.body as AddCartItemPayload));
    },
  ),
);

cartRouter.put(
  '/items/:id',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'CART_UPDATE_FAILED',
      message: '更新购物车失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(
        response,
        await updateCartItem(
          user.id,
          String(request.params.id),
          request.body as UpdateCartItemPayload,
        ),
      );
    },
  ),
);

cartRouter.delete(
  '/items/:id',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'CART_REMOVE_FAILED',
      message: '移除购物车商品失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(response, await removeCartItem(user.id, String(request.params.id)));
    },
  ),
);
