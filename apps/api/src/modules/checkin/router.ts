import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler, HttpError } from '../../lib/errors';
import { ok } from '../../lib/http';

import { getCheckinStatus, performCheckin } from './store';

export const checkinRouter: ExpressRouter = Router();

checkinRouter.get(
  '/status',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getCheckinStatus(user.id));
  }),
);

checkinRouter.post(
  '/',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const result = await performCheckin(user.id);
    if (result.alreadyChecked) {
      throw new HttpError(400, 'CHECKIN_ALREADY_DONE', '今日已签到');
    }
    ok(response, result);
  }),
);
