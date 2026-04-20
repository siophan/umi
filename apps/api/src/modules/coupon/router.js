import { Router } from 'express';
import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
import { listCoupons } from './store';
export const couponRouter = Router();
couponRouter.get('/', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const result = await listCoupons(user.id);
    ok(response, result.items);
}));
