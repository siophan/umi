import { asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import { completeAdminOrderRefund, getAdminConsignDetail, getAdminOrderDetail, getAdminConsignRows, getAdminLogisticsDetail, getAdminLogistics, getAdminOrders, getAdminTransactions, reviewAdminOrderRefund, shipAdminOrder, } from '../orders';
import { getRequestAdmin } from '../auth';
import { getRouteParam, toRouteHttpError } from '../route-helpers';
export function registerAdminOrderRoutes(adminRouter) {
    adminRouter.get('/orders', asyncHandler(async (_request, response) => {
        ok(response, { items: await getAdminOrders() });
    }));
    adminRouter.get('/orders/transactions', asyncHandler(async (_request, response) => {
        ok(response, { items: await getAdminTransactions() });
    }));
    adminRouter.get('/orders/logistics', asyncHandler(async (_request, response) => {
        ok(response, { items: await getAdminLogistics() });
    }));
    adminRouter.get('/orders/logistics/:id', asyncHandler(async (request, response) => {
        ok(response, await getAdminLogisticsDetail(getRouteParam(request.params.id)));
    }));
    adminRouter.get('/orders/consign', asyncHandler(async (_request, response) => {
        ok(response, { items: await getAdminConsignRows() });
    }));
    adminRouter.get('/orders/consign/:id', asyncHandler(async (request, response) => {
        ok(response, await getAdminConsignDetail(getRouteParam(request.params.id)));
    }));
    adminRouter.put('/orders/:id/ship', asyncHandler(async (request, response) => {
        try {
            ok(response, await shipAdminOrder(getRouteParam(request.params.id), request.body));
        }
        catch (error) {
            throw toRouteHttpError(error, {
                status: 400,
                code: 'ADMIN_ORDER_SHIP_FAILED',
                message: '订单发货失败',
            }, [
                { message: '订单不存在', status: 404, code: 'ADMIN_ORDER_NOT_FOUND' },
                { message: '快递发货必须填写物流单号', status: 400, code: 'ADMIN_ORDER_TRACKING_REQUIRED' },
                { message: '待支付订单不支持发货', status: 400, code: 'ADMIN_ORDER_NOT_PAID' },
                { message: '已关闭订单不支持发货', status: 400, code: 'ADMIN_ORDER_CLOSED' },
                { message: '已退款订单不支持发货', status: 400, code: 'ADMIN_ORDER_REFUNDED' },
                { message: '订单缺少履约单，暂不能发货', status: 400, code: 'ADMIN_ORDER_FULFILLMENT_MISSING' },
                { message: '当前履约状态不支持发货', status: 400, code: 'ADMIN_ORDER_FULFILLMENT_INVALID' },
            ]);
        }
    }));
    adminRouter.put('/orders/:id/refund/review', asyncHandler(async (request, response) => {
        try {
            ok(response, await reviewAdminOrderRefund(getRouteParam(request.params.id), request.body, getRequestAdmin(request).id));
        }
        catch (error) {
            throw toRouteHttpError(error, {
                status: 400,
                code: 'ADMIN_ORDER_REFUND_REVIEW_FAILED',
                message: '退款审核失败',
            }, [
                { message: '订单不存在', status: 404, code: 'ADMIN_ORDER_NOT_FOUND' },
                { message: '订单没有退款申请', status: 400, code: 'ADMIN_ORDER_REFUND_NOT_FOUND' },
                { message: '当前退款状态不支持审核', status: 400, code: 'ADMIN_ORDER_REFUND_STATUS_INVALID' },
                { message: '请填写拒绝原因', status: 400, code: 'ADMIN_ORDER_REFUND_REJECT_REASON_REQUIRED' },
            ]);
        }
    }));
    adminRouter.put('/orders/:id/refund/complete', asyncHandler(async (request, response) => {
        try {
            ok(response, await completeAdminOrderRefund(getRouteParam(request.params.id), request.body, getRequestAdmin(request).id));
        }
        catch (error) {
            throw toRouteHttpError(error, {
                status: 400,
                code: 'ADMIN_ORDER_REFUND_COMPLETE_FAILED',
                message: '完成退款失败',
            }, [
                { message: '订单不存在', status: 404, code: 'ADMIN_ORDER_NOT_FOUND' },
                { message: '订单没有退款申请', status: 400, code: 'ADMIN_ORDER_REFUND_NOT_FOUND' },
                { message: '当前退款状态不支持完成退款', status: 400, code: 'ADMIN_ORDER_REFUND_COMPLETE_INVALID' },
            ]);
        }
    }));
    adminRouter.get('/orders/:id', asyncHandler(async (request, response) => {
        ok(response, await getAdminOrderDetail(getRouteParam(request.params.id)));
    }));
}
