import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import type { AddCartItemPayload, UpdateCartItemPayload } from '@umi/shared';

import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { addCartItem, getCart, removeCartItem, updateCartItem } from './store';

export const cartRouter: ExpressRouter = Router();

// 购物车列表：返回当前用户真实 cart_item，并带上商品展示字段。
cartRouter.get(
  '/',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getCart(user.id));
  }),
);

// 加入购物车：同商品同规格会在 store 层自动合并数量。
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

// 更新购物车：支持修改数量和勾选状态，供购物车页乐观更新后回写。
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

// 删除购物车商品：供单删和管理态批量删除复用。
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
