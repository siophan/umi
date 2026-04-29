import { Router } from 'express';
import type { CreateOrderPayload, CreateOrderResult } from '@umi/shared';
import { toEntityId } from '@umi/shared';

import { getRequestUser, requireUser } from '../../lib/auth';
import { HttpError, asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { requireAdmin } from '../admin/auth';
import { fetchAdminOrderOverview, fetchOrderDetail, fetchUserOrders } from './order-read';
import { createOrderPayment, queryOrderPayStatus } from './order-pay';
import { confirmOrder, createPendingOrder, urgeOrder, reviewOrder } from './order-write';

function getClientIp(request: { ip?: string; socket?: { remoteAddress?: string }; headers: Record<string, unknown> }): string {
  const xff = request.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return request.ip || request.socket?.remoteAddress || '127.0.0.1';
}

export const orderRouter = Router();

orderRouter.get(
  '/',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await fetchUserOrders(user.id));
  }),
);

orderRouter.post(
  '/',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'ORDER_CREATE_FAILED',
      message: '创建订单失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      const payload = request.body as CreateOrderPayload;
      if (payload.payChannel !== 'wechat' && payload.payChannel !== 'alipay') {
        throw new HttpError(400, 'PAY_CHANNEL_INVALID', '请选择支付渠道');
      }
      const pending = await createPendingOrder(user.id, payload);
      const payment = await createOrderPayment(user.id, pending.orderId, payload.payChannel, getClientIp(request));
      const result: CreateOrderResult = {
        orderId: toEntityId(payment.orderId),
        orderSn: payment.orderSn,
        payNo: payment.payNo,
        payChannel: payment.payChannel,
        payUrl: payment.payUrl,
        expiresAt: payment.expiresAt.toISOString(),
      };
      ok(response, result);
    },
  ),
);

orderRouter.get(
  '/:id/pay-status',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await queryOrderPayStatus(user.id, String(request.params.id)));
  }),
);

orderRouter.get(
  '/admin/stats/overview',
  requireAdmin,
  asyncHandler(async (_request, response) => {
    ok(response, await fetchAdminOrderOverview());
  }),
);

orderRouter.get(
  '/:id',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await fetchOrderDetail(user.id, String(request.params.id)));
  }),
);

orderRouter.post(
  '/:id/confirm',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'ORDER_CONFIRM_FAILED',
      message: '确认收货失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(response, await confirmOrder(user.id, String(request.params.id)));
    },
  ),
);

orderRouter.post(
  '/:id/urge',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'ORDER_URGE_FAILED',
      message: '催发货失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(response, await urgeOrder(user.id, String(request.params.id)));
    },
  ),
);

orderRouter.post(
  '/:id/review',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'ORDER_REVIEW_FAILED',
      message: '提交评价失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      const { productId, rating, content } = request.body as { productId: string; rating: number; content?: string };
      ok(response, await reviewOrder(user.id, String(request.params.id), productId, rating, content));
    },
  ),
);
