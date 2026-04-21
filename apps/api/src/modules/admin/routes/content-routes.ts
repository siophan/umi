import type { Router as ExpressRouter } from 'express';

import type {
  AdjustAdminEquityPayload,
  CreateAdminGuessPayload,
  ReviewAdminGuessPayload,
  UpdateAdminCommunityReportPayload,
  UpdateUserBanPayload,
} from '@umi/shared';

import { HttpError, asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import { listUsersForAdmin, setUserBanned } from '../../users/admin-store';
import { getAdminDashboardStats } from '../dashboard';
import {
  deleteAdminCommunityComment,
  deleteAdminCommunityPost,
  getAdminCommunityComments,
  getAdminCommunityPosts,
  getAdminCommunityReports,
  getAdminLiveRooms,
  updateAdminCommunityReport,
} from '../content';
import { getAdminEquityAccounts, getAdminEquityDetail, adjustAdminEquity } from '../equity';
import {
  createAdminGuess,
  getAdminGuessDetail,
  getAdminFriendGuesses,
  getAdminGuesses,
  getAdminPkMatchStats,
  getAdminPkMatches,
  reviewAdminGuess,
} from '../guesses';
import { getAdminUserGuesses, getAdminUserOrders } from '../users';
import { requireExistingUserSummary, getRouteParam, toRouteHttpError } from '../route-helpers';
import { getRequestAdmin } from '../auth';
import type { AdminUserFilter } from '@umi/shared';

export function registerAdminContentRoutes(adminRouter: ExpressRouter) {
  adminRouter.get(
    '/dashboard/stats',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminDashboardStats());
    }),
  );

  adminRouter.get(
    '/community/posts',
    asyncHandler(async (request, response) => {
      ok(
        response,
        await getAdminCommunityPosts({
          title: getRouteParam(request.query.title),
          author: getRouteParam(request.query.author),
          tag: getRouteParam(request.query.tag),
        }),
      );
    }),
  );

  adminRouter.delete(
    '/community/posts/:id',
    asyncHandler(async (request, response) => {
      ok(response, await deleteAdminCommunityPost(getRouteParam(request.params.id)));
    }),
  );

  adminRouter.get(
    '/community/comments',
    asyncHandler(async (request, response) => {
      ok(
        response,
        await getAdminCommunityComments({
          content: getRouteParam(request.query.content),
          author: getRouteParam(request.query.author),
          postTitle: getRouteParam(request.query.postTitle),
        }),
      );
    }),
  );

  adminRouter.delete(
    '/community/comments/:id',
    asyncHandler(async (request, response) => {
      ok(response, await deleteAdminCommunityComment(getRouteParam(request.params.id)));
    }),
  );

  adminRouter.get(
    '/community/reports',
    asyncHandler(async (request, response) => {
      ok(
        response,
        await getAdminCommunityReports({
          reporter: getRouteParam(request.query.reporter),
          reasonType: getRouteParam(request.query.reasonType),
          targetKeyword: getRouteParam(request.query.targetKeyword),
          status: getRouteParam(request.query.status),
        }),
      );
    }),
  );

  adminRouter.put(
    '/community/reports/:id',
    asyncHandler(async (request, response) => {
      const admin = getRequestAdmin(request);
      ok(
        response,
        await updateAdminCommunityReport(
          getRouteParam(request.params.id),
          admin.id,
          request.body as UpdateAdminCommunityReportPayload,
        ),
      );
    }),
  );

  adminRouter.get(
    '/lives',
    asyncHandler(async (request, response) => {
      ok(
        response,
        await getAdminLiveRooms({
          title: getRouteParam(request.query.title),
          host: getRouteParam(request.query.host),
          guessTitle: getRouteParam(request.query.guessTitle),
        }),
      );
    }),
  );

  adminRouter.get(
    '/users',
    asyncHandler(async (request, response) => {
      ok(
        response,
        await listUsersForAdmin({
          page: Number(request.query.page ?? 1),
          pageSize: Number(request.query.pageSize ?? 20),
          keyword:
            typeof request.query.keyword === 'string'
              ? request.query.keyword
              : undefined,
          phone:
            typeof request.query.phone === 'string'
              ? request.query.phone
              : undefined,
          shopName:
            typeof request.query.shopName === 'string'
              ? request.query.shopName
              : undefined,
          role:
            typeof request.query.role === 'string'
              ? (request.query.role as AdminUserFilter)
              : undefined,
        }),
      );
    }),
  );

  adminRouter.get(
    '/users/:id',
    asyncHandler(async (request, response) => {
      ok(response, await requireExistingUserSummary(getRouteParam(request.params.id)));
    }),
  );

  adminRouter.get(
    '/users/:id/guesses',
    asyncHandler(async (request, response) => {
      const userId = getRouteParam(request.params.id);
      await requireExistingUserSummary(userId);
      ok(
        response,
        await getAdminUserGuesses(
          userId,
          Number(request.query.page ?? 1),
          Number(request.query.pageSize ?? 10),
        ),
      );
    }),
  );

  adminRouter.get(
    '/users/:id/orders',
    asyncHandler(async (request, response) => {
      const userId = getRouteParam(request.params.id);
      await requireExistingUserSummary(userId);
      ok(
        response,
        await getAdminUserOrders(
          userId,
          Number(request.query.page ?? 1),
          Number(request.query.pageSize ?? 10),
        ),
      );
    }),
  );

  adminRouter.put(
    '/users/:id/ban',
    asyncHandler(async (request, response) => {
      const payload = request.body as UpdateUserBanPayload;
      const user = await setUserBanned(
        getRouteParam(request.params.id),
        Boolean(payload.banned),
      );
      if (!user) {
        throw new HttpError(404, 'ADMIN_USER_NOT_FOUND', '用户不存在');
      }

      ok(response, { id: user.id, banned: Boolean(user.banned) });
    }),
  );

  adminRouter.get(
    '/guesses',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminGuesses());
    }),
  );

  adminRouter.get(
    '/guesses/:id',
    asyncHandler(async (request, response) => {
      try {
        ok(response, await getAdminGuessDetail(getRouteParam(request.params.id)));
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_GUESS_DETAIL_FETCH_FAILED',
            message: '竞猜详情加载失败',
          },
          [{ message: '竞猜不存在', status: 404, code: 'ADMIN_GUESS_NOT_FOUND' }],
        );
      }
    }),
  );

  adminRouter.post(
    '/guesses',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await createAdminGuess(
            request.body as CreateAdminGuessPayload,
            getRequestAdmin(request).id,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_GUESS_CREATE_FAILED',
            message: '创建竞猜失败',
          },
          [
            { message: '竞猜标题不能为空', status: 400, code: 'ADMIN_GUESS_TITLE_REQUIRED' },
            { message: '请选择竞猜分类', status: 400, code: 'ADMIN_GUESS_CATEGORY_REQUIRED' },
            { message: '竞猜分类不存在', status: 404, code: 'ADMIN_GUESS_CATEGORY_NOT_FOUND' },
            { message: '竞猜分类未启用', status: 400, code: 'ADMIN_GUESS_CATEGORY_DISABLED' },
            { message: '请选择关联商品', status: 400, code: 'ADMIN_GUESS_PRODUCT_REQUIRED' },
            { message: '关联商品不存在', status: 404, code: 'ADMIN_GUESS_PRODUCT_NOT_FOUND' },
            { message: '关联商品不可用于创建竞猜', status: 400, code: 'ADMIN_GUESS_PRODUCT_INVALID' },
            { message: '关联商品所属店铺不可用于创建竞猜', status: 400, code: 'ADMIN_GUESS_PRODUCT_SHOP_INVALID' },
            { message: '关联商品所属品牌不可用于创建竞猜', status: 400, code: 'ADMIN_GUESS_PRODUCT_BRAND_INVALID' },
            { message: '关联商品所属品牌商品不可用于创建竞猜', status: 400, code: 'ADMIN_GUESS_PRODUCT_BRAND_PRODUCT_INVALID' },
            { message: '关联商品可用库存不足', status: 400, code: 'ADMIN_GUESS_PRODUCT_OUT_OF_STOCK' },
            { message: '请设置截止时间', status: 400, code: 'ADMIN_GUESS_END_TIME_REQUIRED' },
            { message: '截止时间不合法', status: 400, code: 'ADMIN_GUESS_END_TIME_INVALID' },
            { message: '截止时间必须晚于当前时间', status: 400, code: 'ADMIN_GUESS_END_TIME_PAST' },
            { message: '至少填写两个有效选项', status: 400, code: 'ADMIN_GUESS_OPTIONS_REQUIRED' },
            { message: '竞猜选项不能重复', status: 400, code: 'ADMIN_GUESS_OPTIONS_DUPLICATED' },
          ],
        );
      }
    }),
  );

  adminRouter.put(
    '/guesses/:id/review',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await reviewAdminGuess(
            getRouteParam(request.params.id),
            getRequestAdmin(request).id,
            request.body as ReviewAdminGuessPayload,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_GUESS_REVIEW_FAILED',
            message: '竞猜审核失败',
          },
          [
            { message: '竞猜不存在', status: 404, code: 'ADMIN_GUESS_NOT_FOUND' },
            { message: '审核状态不合法', status: 400, code: 'ADMIN_GUESS_REVIEW_STATUS_INVALID' },
            { message: '请填写拒绝原因', status: 400, code: 'ADMIN_GUESS_REJECT_REASON_REQUIRED' },
            { message: '竞猜当前不可审核', status: 400, code: 'ADMIN_GUESS_NOT_REVIEWABLE' },
          ],
        );
      }
    }),
  );

  adminRouter.get(
    '/guesses/friends',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminFriendGuesses());
    }),
  );

  adminRouter.get(
    '/pk',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminPkMatches());
    }),
  );

  adminRouter.get(
    '/pk/stats',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminPkMatchStats());
    }),
  );

  adminRouter.get(
    '/equity',
    asyncHandler(async (request, response) => {
      ok(
        response,
        await getAdminEquityAccounts({
          page: Number(request.query.page ?? 1),
          pageSize: Number(request.query.pageSize ?? 20),
          userId:
            typeof request.query.userId === 'string'
              ? request.query.userId
              : undefined,
          userName:
            typeof request.query.userName === 'string'
              ? request.query.userName
              : undefined,
          phone:
            typeof request.query.phone === 'string'
              ? request.query.phone
              : undefined,
        }),
      );
    }),
  );

  adminRouter.get(
    '/equity/:id',
    asyncHandler(async (request, response) => {
      ok(response, await getAdminEquityDetail(getRouteParam(request.params.id)));
    }),
  );

  adminRouter.post(
    '/equity/adjust',
    asyncHandler(async (request, response) => {
      const payload = request.body as AdjustAdminEquityPayload;
      await requireExistingUserSummary(payload.userId);
      ok(response, await adjustAdminEquity(payload));
    }),
  );
}
