import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import type {
  UpdateMePayload,
} from '@umi/shared';

import { getRequestUser, optionalUser, requireUser } from '../../lib/auth';
import { HttpError, asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import {
  getMeActivity,
  getMeSummary,
  getUserProfileById,
  getUserPublicActivity,
  followUser,
  unfollowUser,
  updateMe,
} from './store';
import { searchUsers } from '../social/store';

export const userRouter: ExpressRouter = Router();

userRouter.get(
  '/me',
  requireUser,
  asyncHandler(async (request, response) => {
    ok(response, getRequestUser(request));
  }),
);

userRouter.put(
  '/me',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'AUTH_UPDATE_PROFILE_FAILED',
      message: '更新资料失败',
    },
    async (request, response) => {
      const user = getRequestUser(request);
      ok(response, await updateMe(user.id, request.body as UpdateMePayload));
    },
  ),
);

userRouter.get(
  '/me/activity',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getMeActivity(user.id));
  }),
);

userRouter.get(
  '/me/summary',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getMeSummary(user.id));
  }),
);

userRouter.get(
  '/search',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const query = typeof request.query.q === 'string' ? request.query.q : '';
    ok(response, await searchUsers(user.id, query));
  }),
);

userRouter.get(
  '/:id/activity',
  optionalUser,
  asyncHandler(async (request, response) => {
    const activity = await getUserPublicActivity(
      String(request.params.id),
      request.user?.id ?? null,
    );

    if (!activity) {
      throw new HttpError(404, 'USER_NOT_FOUND', '用户不存在');
    }

    ok(response, activity);
  }),
);

userRouter.post(
  '/:id/follow',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'USER_FOLLOW_FAILED',
      message: '关注失败',
    },
    async (request, response) => {
      const viewer = getRequestUser(request);
      ok(response, await followUser(viewer.id, String(request.params.id)));
    },
  ),
);

userRouter.delete(
  '/:id/follow',
  requireUser,
  withErrorBoundary(
    {
      status: 400,
      code: 'USER_UNFOLLOW_FAILED',
      message: '取消关注失败',
    },
    async (request, response) => {
      const viewer = getRequestUser(request);
      ok(response, await unfollowUser(viewer.id, String(request.params.id)));
    },
  ),
);

userRouter.get(
  '/:id',
  optionalUser,
  asyncHandler(async (request, response) => {
    const user = await getUserProfileById(
      String(request.params.id),
      request.user?.id ?? null,
    );

    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', '用户不存在');
    }

    ok(response, user);
  }),
);
