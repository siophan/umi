import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './store';

export const notificationRouter: ExpressRouter = Router();

notificationRouter.get(
  '/',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getNotifications(user.id));
  }),
);

notificationRouter.post(
  '/read-all',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    await markAllNotificationsRead(user.id);
    ok(response, { success: true });
  }),
);

notificationRouter.post(
  '/:id/read',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    await markNotificationRead(user.id, String(request.params.id));
    ok(response, { success: true });
  }),
);
