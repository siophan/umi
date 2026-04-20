import { Router } from 'express';
import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { acceptFriendRequest, getSocialOverview, rejectFriendRequest, } from './store';
export const socialRouter = Router();
socialRouter.post('/requests/:id/accept', requireUser, withErrorBoundary({
    status: 400,
    code: 'FRIEND_ACCEPT_FAILED',
    message: '接受好友申请失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await acceptFriendRequest(user.id, String(request.params.id)));
}));
socialRouter.post('/requests/:id/reject', requireUser, withErrorBoundary({
    status: 400,
    code: 'FRIEND_REJECT_FAILED',
    message: '忽略好友申请失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await rejectFriendRequest(user.id, String(request.params.id)));
}));
socialRouter.get('/', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getSocialOverview(user.id));
}));
