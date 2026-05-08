import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';

import { getMyInviteRecords } from './store';

export const inviteRouter: ExpressRouter = Router();

inviteRouter.get(
  '/records',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getMyInviteRecords(user.id));
  }),
);
