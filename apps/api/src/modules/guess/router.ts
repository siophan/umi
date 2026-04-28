import type { CreateGuessPayload } from '@umi/shared';

import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
import { toRouteHttpError } from '../admin/route-helpers';
import { getGuessCategories } from './guess-categories';
import { createUserGuess } from './guess-create';
import { getUserHistoryResult } from './guess-history';
import { getGuessDetail, getGuessList, getGuessStats } from './guess-read';

export const guessRouter: ExpressRouter = Router();

guessRouter.get(
  '/categories',
  asyncHandler(async (_request, response) => {
    ok(response, await getGuessCategories());
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
          { message: '关联商品不存在', status: 404, code: 'GUESS_PRODUCT_NOT_FOUND' },
          { message: '关联商品不可用于创建竞猜', status: 400, code: 'GUESS_PRODUCT_INVALID' },
          { message: '关联商品所属店铺不可用于创建竞猜', status: 400, code: 'GUESS_PRODUCT_SHOP_INVALID' },
          { message: '关联商品所属品牌不可用于创建竞猜', status: 400, code: 'GUESS_PRODUCT_BRAND_INVALID' },
          { message: '关联商品所属品牌商品不可用于创建竞猜', status: 400, code: 'GUESS_PRODUCT_BRAND_PRODUCT_INVALID' },
          { message: '关联商品可用库存不足', status: 400, code: 'GUESS_PRODUCT_OUT_OF_STOCK' },
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
      }),
    );
  }),
);

guessRouter.get(
  '/:id',
  asyncHandler(async (request, response) => {
    ok(response, await getGuessDetail(request.params.id));
  }),
);

guessRouter.get(
  '/:id/stats',
  asyncHandler(async (request, response) => {
    ok(response, await getGuessStats(request.params.id));
  }),
);
