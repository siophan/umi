import { Router } from 'express';
import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { requireAdmin } from '../admin/auth';
import { fetchAdminOrderOverview, fetchOrderDetail, fetchUserOrders } from './order-read';
import { confirmOrder, createOrder, urgeOrder, reviewOrder } from './order-write';
export const orderRouter = Router();
orderRouter.get('/', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await fetchUserOrders(user.id));
}));
orderRouter.post('/', requireUser, withErrorBoundary({
    status: 400,
    code: 'ORDER_CREATE_FAILED',
    message: '创建订单失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await createOrder(user.id, request.body));
}));
orderRouter.get('/admin/stats/overview', requireAdmin, asyncHandler(async (_request, response) => {
    ok(response, await fetchAdminOrderOverview());
}));
orderRouter.get('/:id', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await fetchOrderDetail(user.id, String(request.params.id)));
}));
orderRouter.post('/:id/confirm', requireUser, withErrorBoundary({
    status: 400,
    code: 'ORDER_CONFIRM_FAILED',
    message: '确认收货失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await confirmOrder(user.id, String(request.params.id)));
}));
orderRouter.post('/:id/urge', requireUser, withErrorBoundary({
    status: 400,
    code: 'ORDER_URGE_FAILED',
    message: '催发货失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await urgeOrder(user.id, String(request.params.id)));
}));
orderRouter.post('/:id/review', requireUser, withErrorBoundary({
    status: 400,
    code: 'ORDER_REVIEW_FAILED',
    message: '提交评价失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    const { productId, rating, content } = request.body;
    ok(response, await reviewOrder(user.id, String(request.params.id), productId, rating, content));
}));
