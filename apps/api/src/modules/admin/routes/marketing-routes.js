import { asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import { createAdminBanner, deleteAdminBanner, getAdminBanners, updateAdminBanner, updateAdminBannerStatus, } from '../banners';
import { createAdminCheckinRewardConfig, getAdminCheckinRewardConfigs, updateAdminCheckinRewardConfig, updateAdminCheckinRewardConfigStatus, } from '../checkin';
import { createAdminCouponGrantBatch, createAdminCouponTemplate, getAdminCouponGrantBatches, getAdminCoupons, updateAdminCouponTemplate, updateAdminCouponTemplateStatus, } from '../coupons';
import { getAdminInviteRecords, getAdminInviteRewardConfig, updateAdminInviteRewardConfig, } from '../invites';
import { getRouteParam } from '../route-helpers';
import { getRequestAdmin } from '../auth';
export function registerAdminMarketingRoutes(adminRouter) {
    adminRouter.get('/banners', asyncHandler(async (request, response) => {
        ok(response, await getAdminBanners({
            title: typeof request.query.title === 'string' ? request.query.title : undefined,
            position: typeof request.query.position === 'string' ? request.query.position : undefined,
            targetType: typeof request.query.targetType === 'string'
                ? request.query.targetType
                : undefined,
            status: typeof request.query.status === 'string'
                ? request.query.status
                : 'all',
        }));
    }));
    adminRouter.post('/banners', asyncHandler(async (request, response) => {
        ok(response, await createAdminBanner(request.body));
    }));
    adminRouter.put('/banners/:id', asyncHandler(async (request, response) => {
        ok(response, await updateAdminBanner(getRouteParam(request.params.id), request.body));
    }));
    adminRouter.put('/banners/:id/status', asyncHandler(async (request, response) => {
        ok(response, await updateAdminBannerStatus(getRouteParam(request.params.id), request.body));
    }));
    adminRouter.delete('/banners/:id', asyncHandler(async (request, response) => {
        ok(response, await deleteAdminBanner(getRouteParam(request.params.id)));
    }));
    adminRouter.get('/checkin/rewards', asyncHandler(async (request, response) => {
        ok(response, await getAdminCheckinRewardConfigs({
            dayNo: typeof request.query.dayNo === 'string' && request.query.dayNo.trim()
                ? Number(request.query.dayNo)
                : undefined,
            rewardType: typeof request.query.rewardType === 'string'
                ? request.query.rewardType
                : undefined,
            title: typeof request.query.title === 'string' ? request.query.title : undefined,
            status: typeof request.query.status === 'string'
                ? request.query.status
                : 'all',
        }));
    }));
    adminRouter.post('/checkin/rewards', asyncHandler(async (request, response) => {
        ok(response, await createAdminCheckinRewardConfig(request.body));
    }));
    adminRouter.put('/checkin/rewards/:id', asyncHandler(async (request, response) => {
        ok(response, await updateAdminCheckinRewardConfig(getRouteParam(request.params.id), request.body));
    }));
    adminRouter.put('/checkin/rewards/:id/status', asyncHandler(async (request, response) => {
        ok(response, await updateAdminCheckinRewardConfigStatus(getRouteParam(request.params.id), request.body));
    }));
    adminRouter.get('/invites/config', asyncHandler(async (_request, response) => {
        ok(response, await getAdminInviteRewardConfig());
    }));
    adminRouter.put('/invites/config', asyncHandler(async (request, response) => {
        ok(response, await updateAdminInviteRewardConfig(request.body));
    }));
    adminRouter.get('/invites/records', asyncHandler(async (request, response) => {
        ok(response, await getAdminInviteRecords({
            inviter: typeof request.query.inviter === 'string' ? request.query.inviter : undefined,
            invitee: typeof request.query.invitee === 'string' ? request.query.invitee : undefined,
            inviteCode: typeof request.query.inviteCode === 'string' ? request.query.inviteCode : undefined,
        }));
    }));
    adminRouter.get('/coupons', asyncHandler(async (request, response) => {
        ok(response, await getAdminCoupons({
            name: typeof request.query.name === 'string' ? request.query.name : undefined,
            code: typeof request.query.code === 'string' ? request.query.code : undefined,
            type: typeof request.query.type === 'string'
                ? request.query.type
                : undefined,
            scopeType: typeof request.query.scopeType === 'string'
                ? request.query.scopeType
                : undefined,
            status: typeof request.query.status === 'string'
                ? request.query.status
                : 'all',
        }));
    }));
    adminRouter.get('/coupons/:id/batches', asyncHandler(async (request, response) => {
        ok(response, await getAdminCouponGrantBatches(getRouteParam(request.params.id)));
    }));
    adminRouter.post('/coupons', asyncHandler(async (request, response) => {
        ok(response, await createAdminCouponTemplate(request.body));
    }));
    adminRouter.put('/coupons/:id', asyncHandler(async (request, response) => {
        ok(response, await updateAdminCouponTemplate(getRouteParam(request.params.id), request.body));
    }));
    adminRouter.put('/coupons/:id/status', asyncHandler(async (request, response) => {
        ok(response, await updateAdminCouponTemplateStatus(getRouteParam(request.params.id), request.body));
    }));
    adminRouter.post('/coupons/:id/grants', asyncHandler(async (request, response) => {
        ok(response, await createAdminCouponGrantBatch(getRouteParam(request.params.id), getRequestAdmin(request).id, request.body));
    }));
}
