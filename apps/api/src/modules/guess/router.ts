import type {
  CreateGuessPayload,
  ParticipateGuessPayload,
  PostGuessCommentPayload,
} from '@umi/shared';

import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { getRequestUser, optionalUser, requireUser } from '../../lib/auth';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
import { toRouteHttpError } from '../admin/route-helpers';
import { getGuessCategories } from './guess-categories';
import { listGuessComments } from './guess-comments';
import { createUserGuess } from './guess-create';
import { getFriendPkSummary } from './friend-pk';
import { getUserHistoryResult } from './guess-history';
import { getGuessDetail, getGuessList, getGuessStats } from './guess-read';
import {
  addGuessFavorite,
  likeGuessComment,
  postGuessComment,
  removeGuessFavorite,
  unlikeGuessComment,
} from './guess-write';
import {
  cancelGuessBet,
  createGuessBetPayment,
  queryGuessBetPayStatus,
} from './guess-pay';

export const guessRouter: ExpressRouter = Router();

guessRouter.get(
  '/categories',
  asyncHandler(async (_request, response) => {
    ok(response, await getGuessCategories());
  }),
);

guessRouter.get(
  '/friend-pk',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getFriendPkSummary(user.id));
  }),
);

guessRouter.get(
  '/user/history',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getUserHistoryResult(user.id, user.name));
  }),
);

guessRouter.get(
  '/my-bets',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getUserHistoryResult(user.id, user.name));
  }),
);

guessRouter.post(
  '/',
  requireUser,
  asyncHandler(async (request, response) => {
    try {
      ok(
        response,
        await createUserGuess(request.body as CreateGuessPayload, getRequestUser(request).id),
      );
    } catch (error) {
      throw toRouteHttpError(
        error,
        {
          status: 400,
          code: 'GUESS_CREATE_FAILED',
          message: '创建竞猜失败',
        },
        [
          { message: '竞猜标题不能为空', status: 400, code: 'GUESS_TITLE_REQUIRED' },
          { message: '封面图片不能为空', status: 400, code: 'GUESS_COVER_REQUIRED' },
          { message: '竞猜分类不存在', status: 404, code: 'GUESS_CATEGORY_NOT_FOUND' },
          { message: '竞猜分类未启用', status: 400, code: 'GUESS_CATEGORY_DISABLED' },
          { message: '竞猜分类未配置', status: 500, code: 'GUESS_CATEGORY_MISSING' },
          { message: '商家创建竞猜必须选择分类', status: 400, code: 'GUESS_CATEGORY_REQUIRED' },
          { message: '请设置截止时间', status: 400, code: 'GUESS_END_TIME_REQUIRED' },
          { message: '截止时间不合法', status: 400, code: 'GUESS_END_TIME_INVALID' },
          { message: '截止时间必须晚于当前时间', status: 400, code: 'GUESS_END_TIME_PAST' },
          { message: '至少填写两个有效选项', status: 400, code: 'GUESS_OPTIONS_REQUIRED' },
          { message: '竞猜选项不能重复', status: 400, code: 'GUESS_OPTIONS_DUPLICATED' },
          { message: '好友PK必须选择参战好友', status: 400, code: 'GUESS_FRIENDS_REQUIRED' },
          { message: '竞猜必须关联商品', status: 400, code: 'GUESS_PRODUCT_REQUIRED' },
          { message: '关联商品不存在', status: 404, code: 'GUESS_PRODUCT_NOT_FOUND' },
          { message: '关联商品不可用于创建竞猜', status: 400, code: 'GUESS_PRODUCT_INVALID' },
          { message: '关联商品所属店铺不可用于创建竞猜', status: 400, code: 'GUESS_PRODUCT_SHOP_INVALID' },
          { message: '关联商品所属品牌不可用于创建竞猜', status: 400, code: 'GUESS_PRODUCT_BRAND_INVALID' },
          { message: '关联商品所属品牌商品不可用于创建竞猜', status: 400, code: 'GUESS_PRODUCT_BRAND_PRODUCT_INVALID' },
          { message: '关联商品可用库存不足', status: 400, code: 'GUESS_PRODUCT_OUT_OF_STOCK' },
          { message: '揭晓时间不合法', status: 400, code: 'GUESS_REVEAL_AT_INVALID' },
          { message: '揭晓时间必须晚于投注截止时间', status: 400, code: 'GUESS_REVEAL_AT_BEFORE_END' },
          { message: '最低参与人数必须是正整数', status: 400, code: 'GUESS_MIN_PARTICIPANTS_INVALID' },
          { message: '最低参与人数过大', status: 400, code: 'GUESS_MIN_PARTICIPANTS_TOO_LARGE' },
        ],
      );
    }
  }),
);

guessRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    ok(
      response,
      await getGuessList({
        q: request.query.q as string | undefined,
        limit: request.query.limit as string | undefined,
        cursor: request.query.cursor as string | undefined,
        categoryId: request.query.categoryId as string | undefined,
      }),
    );
  }),
);

guessRouter.post(
  '/comments/:commentId/like',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await likeGuessComment(user.id, String(request.params.commentId)));
  }),
);

guessRouter.delete(
  '/comments/:commentId/like',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await unlikeGuessComment(user.id, String(request.params.commentId)));
  }),
);

guessRouter.get(
  '/:id',
  optionalUser,
  asyncHandler(async (request, response) => {
    ok(response, await getGuessDetail(request.params.id, request.user?.id ?? null));
  }),
);

guessRouter.get(
  '/:id/stats',
  asyncHandler(async (request, response) => {
    ok(response, await getGuessStats(request.params.id));
  }),
);

guessRouter.post(
  '/:id/participate',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const clientIp =
      (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      request.socket.remoteAddress ||
      '127.0.0.1';
    ok(
      response,
      await createGuessBetPayment(
        user.id,
        String(request.params.id),
        request.body as ParticipateGuessPayload,
        clientIp,
      ),
    );
  }),
);

guessRouter.get(
  '/bets/:betId/pay-status',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await queryGuessBetPayStatus(user.id, String(request.params.betId)));
  }),
);

guessRouter.post(
  '/bets/:betId/cancel',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await cancelGuessBet(user.id, String(request.params.betId)));
  }),
);

guessRouter.post(
  '/:id/favorite',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await addGuessFavorite(user.id, String(request.params.id)));
  }),
);

guessRouter.delete(
  '/:id/favorite',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await removeGuessFavorite(user.id, String(request.params.id)));
  }),
);

guessRouter.get(
  '/:id/comments',
  optionalUser,
  asyncHandler(async (request, response) => {
    const limitRaw = request.query.limit;
    const limit = typeof limitRaw === 'string' ? Number.parseInt(limitRaw, 10) : undefined;
    ok(
      response,
      await listGuessComments(String(request.params.id), {
        limit: Number.isFinite(limit) ? limit : undefined,
        currentUserId: request.user?.id ?? null,
      }),
    );
  }),
);

guessRouter.post(
  '/:id/comments',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(
      response,
      await postGuessComment(
        user.id,
        String(request.params.id),
        request.body as PostGuessCommentPayload,
      ),
    );
  }),
);
