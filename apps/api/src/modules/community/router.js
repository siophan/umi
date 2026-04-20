import { Router } from 'express';
import { getRequestUser, requireUser } from '../../lib/auth';
import { HttpError, asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { bookmarkCommunityPost, createCommunityComment, createCommunityPost, getCommunityDiscovery, getCommunityFeed, getCommunityPostDetail, likeCommunityComment, likeCommunityPost, repostCommunityPost, searchCommunity, unlikeCommunityComment, unlikeCommunityPost, unbookmarkCommunityPost, } from './store';
export const communityRouter = Router();
communityRouter.get('/feed', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const tab = request.query.tab === 'follow' ? 'follow' : 'recommend';
    ok(response, await getCommunityFeed(user.id, tab));
}));
communityRouter.get('/discovery', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getCommunityDiscovery(user.id));
}));
communityRouter.get('/search', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const query = typeof request.query.q === 'string' ? request.query.q : '';
    ok(response, await searchCommunity(user.id, query));
}));
communityRouter.post('/posts', requireUser, withErrorBoundary({
    status: 400,
    code: 'COMMUNITY_POST_CREATE_FAILED',
    message: '发布动态失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await createCommunityPost(user.id, request.body));
}));
communityRouter.post('/posts/:id/repost', requireUser, withErrorBoundary({
    status: 400,
    code: 'COMMUNITY_POST_REPOST_FAILED',
    message: '转发失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await repostCommunityPost(user.id, String(request.params.id), request.body));
}));
communityRouter.get('/posts/:id', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const post = await getCommunityPostDetail(user.id, String(request.params.id));
    if (!post) {
        throw new HttpError(404, 'COMMUNITY_POST_NOT_FOUND', '动态不存在或不可见');
    }
    ok(response, post);
}));
communityRouter.post('/posts/:id/comments', requireUser, withErrorBoundary({
    status: 400,
    code: 'COMMUNITY_COMMENT_CREATE_FAILED',
    message: '发表评论失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await createCommunityComment(user.id, String(request.params.id), request.body));
}));
communityRouter.post('/comments/:id/like', requireUser, withErrorBoundary({
    status: 400,
    code: 'COMMUNITY_COMMENT_LIKE_FAILED',
    message: '评论点赞失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await likeCommunityComment(user.id, String(request.params.id)));
}));
communityRouter.delete('/comments/:id/like', requireUser, withErrorBoundary({
    status: 400,
    code: 'COMMUNITY_COMMENT_UNLIKE_FAILED',
    message: '取消评论点赞失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await unlikeCommunityComment(user.id, String(request.params.id)));
}));
communityRouter.post('/posts/:id/like', requireUser, withErrorBoundary({
    status: 400,
    code: 'COMMUNITY_POST_LIKE_FAILED',
    message: '点赞失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await likeCommunityPost(user.id, String(request.params.id)));
}));
communityRouter.delete('/posts/:id/like', requireUser, withErrorBoundary({
    status: 400,
    code: 'COMMUNITY_POST_UNLIKE_FAILED',
    message: '取消点赞失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await unlikeCommunityPost(user.id, String(request.params.id)));
}));
communityRouter.post('/posts/:id/bookmark', requireUser, withErrorBoundary({
    status: 400,
    code: 'COMMUNITY_POST_BOOKMARK_FAILED',
    message: '收藏失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await bookmarkCommunityPost(user.id, String(request.params.id)));
}));
communityRouter.delete('/posts/:id/bookmark', requireUser, withErrorBoundary({
    status: 400,
    code: 'COMMUNITY_POST_UNBOOKMARK_FAILED',
    message: '取消收藏失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await unbookmarkCommunityPost(user.id, String(request.params.id)));
}));
