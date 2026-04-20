import { Router } from 'express';
import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { getChatConversations, getChatDetail, sendChatMessage, } from './store';
export const chatRouter = Router();
chatRouter.get('/', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getChatConversations(user.id));
}));
chatRouter.get('/:userId', requireUser, withErrorBoundary({
    status: 400,
    code: 'CHAT_DETAIL_FAILED',
    message: '获取聊天记录失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getChatDetail(user.id, String(request.params.userId)));
}));
chatRouter.post('/:userId', requireUser, withErrorBoundary({
    status: 400,
    code: 'CHAT_SEND_FAILED',
    message: '发送消息失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await sendChatMessage(user.id, String(request.params.userId), request.body));
}));
