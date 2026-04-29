import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { getRequestUser, optionalUser, requireUser } from '../../lib/auth';
import { asyncHandler, HttpError, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import {
  claimCouponFromTemplate,
  listClaimableCouponTemplates,
  listCoupons,
} from './store';

export const couponRouter: ExpressRouter = Router();

couponRouter.get(
  '/',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const result = await listCoupons(user.id);
    ok(response, result.items);
  }),
);

couponRouter.get(
  '/templates',
  optionalUser,
  asyncHandler(async (request, response) => {
    const shopId =
      typeof request.query.shopId === 'string' ? request.query.shopId : undefined;
    const result = await listClaimableCouponTemplates(request.user?.id ?? null, { shopId });
    ok(response, result);
  }),
);

couponRouter.post(
  '/claim/:templateId',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'COUPON_CLAIM_FAILED',
      message: '领取失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      try {
        ok(
          response,
          await claimCouponFromTemplate(user.id, String(request.params.templateId)),
        );
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === '优惠券模板不存在') {
            throw new HttpError(404, 'COUPON_TEMPLATE_NOT_FOUND', '优惠券模板不存在');
          }
          if (error.message === '已达领取上限') {
            throw new HttpError(400, 'COUPON_USER_LIMIT_REACHED', '已达领取上限');
          }
          if (error.message === '优惠券已被领完') {
            throw new HttpError(400, 'COUPON_DEPLETED', '优惠券已被领完');
          }
          if (error.message === '优惠券已停用' || error.message === '优惠券已过期' || error.message === '活动尚未开始') {
            throw new HttpError(400, 'COUPON_NOT_AVAILABLE', error.message);
          }
        }
        throw error;
      }
    },
  ),
);
