import { Router } from 'express';
import { getRequestUser, requireUser } from '../../lib/auth';
import { sendError, toHttpError } from '../../lib/errors';
import { ok } from '../../lib/http';
import { addShopProducts, getBrandAuthOverview, getBrandProducts, submitBrandAuthApplication } from './shop-brand-auth';
import { getMyShopResult, getMyShopStatus, submitShopApplication } from './shop-my';
import { getPublicShopDetail } from './shop-public';
export const shopRouter = Router();
shopRouter.get('/me', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        ok(response, await getMyShopResult(user.id));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_READ_FAILED',
            message: '读取店铺失败',
        }));
    }
});
shopRouter.get('/me/status', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        ok(response, await getMyShopStatus(user.id));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_STATUS_READ_FAILED',
            message: '读取开店状态失败',
        }));
    }
});
shopRouter.post('/apply', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        ok(response, await submitShopApplication(user.id, request.body ?? {}));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_APPLY_FAILED',
            message: '提交开店申请失败',
        }));
    }
});
shopRouter.get('/:id(\\d+)', async (request, response) => {
    try {
        const routeParams = request.params;
        const shopId = String(routeParams['id(\\d+)'] ?? routeParams.id ?? '').trim();
        ok(response, await getPublicShopDetail(shopId));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_DETAIL_READ_FAILED',
            message: '读取店铺详情失败',
        }));
    }
});
shopRouter.get('/brand-auth', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        ok(response, await getBrandAuthOverview(user.id));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_BRAND_AUTH_READ_FAILED',
            message: '读取品牌授权失败',
        }));
    }
});
shopRouter.post('/brand-auth', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        ok(response, await submitBrandAuthApplication(user.id, request.body ?? {}));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_BRAND_AUTH_SUBMIT_FAILED',
            message: '提交品牌授权失败',
        }));
    }
});
shopRouter.get('/brand-products', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        const brandId = typeof request.query.brandId === 'string' ? request.query.brandId.trim() : '';
        ok(response, await getBrandProducts(user.id, brandId));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_BRAND_PRODUCTS_READ_FAILED',
            message: '读取品牌商品失败',
        }));
    }
});
shopRouter.post('/products', requireUser, async (request, response) => {
    try {
        const user = getRequestUser(request);
        ok(response, await addShopProducts(user.id, request.body ?? {}));
    }
    catch (error) {
        sendError(response, toHttpError(error, {
            status: 500,
            code: 'SHOP_PRODUCTS_ADD_FAILED',
            message: '上架商品失败',
        }));
    }
});
