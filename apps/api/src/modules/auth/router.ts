import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import type {
  ChangePasswordPayload,
  CreateCommunityCommentPayload,
  CreateCommunityPostPayload,
  LoginPayload,
  RegisterPayload,
  SendCodePayload,
  SendChatMessagePayload,
  UpdateMePayload,
} from '@joy/shared';

import { ok } from '../../lib/http';
import {
  acceptFriendRequest,
  bookmarkCommunityPost,
  changePassword,
  createCommunityComment,
  createCommunityPost,
  getCommunityFeed,
  getCommunityDiscovery,
  getCommunityPostDetail,
  getMeActivity,
  getMeSummary,
  getNotifications,
  getSocialOverview,
  getChatConversations,
  getChatDetail,
  getUserPublicActivity,
  getUserByToken,
  getUserProfileById,
  followUser,
  likeCommunityComment,
  likeCommunityPost,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  logoutByToken,
  register,
  repostCommunityPost,
  rejectFriendRequest,
  searchUsers,
  searchCommunity,
  sendCode,
  sendChatMessage,
  unlikeCommunityPost,
  unlikeCommunityComment,
  unfollowUser,
  unbookmarkCommunityPost,
  updateMe,
} from './store';

export const authRouter: ExpressRouter = Router();

function getBearerToken(authorization?: string) {
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
}

authRouter.post('/login', async (request, response) => {
  try {
    const body = request.body as LoginPayload;
    const result = await login(body);
    ok(response, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/send-code', async (request, response) => {
  try {
    const body = request.body as SendCodePayload;
    const result = await sendCode(body.phone, body.bizType);
    ok(response, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '验证码发送失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/register', async (request, response) => {
  try {
    const body = request.body as RegisterPayload;
    const result = await register(body);
    ok(response, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.get('/me', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, user);
});

authRouter.put('/me', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    const result = await updateMe(user.id, request.body as UpdateMePayload);
    ok(response, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新资料失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/change-password', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    const result = await changePassword(
      user.id,
      request.body as ChangePasswordPayload,
    );
    ok(response, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '修改密码失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/logout', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  await logoutByToken(token);
  ok(response, { success: true });
});

authRouter.get('/me/activity', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, await getMeActivity(user.id));
});

authRouter.get('/me/summary', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, await getMeSummary(user.id));
});

authRouter.get('/users/search', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, await searchUsers(user.id, typeof request.query.q === 'string' ? request.query.q : ''));
});

authRouter.get('/users/:id/activity', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const viewer = token ? await getUserByToken(token) : null;
  const activity = await getUserPublicActivity(String(request.params.id), viewer?.id ?? null);

  if (!activity) {
    response.status(404).json({ success: false, message: '用户不存在' });
    return;
  }

  ok(response, activity);
});

authRouter.post('/users/:id/follow', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const viewer = token ? await getUserByToken(token) : null;

    if (!viewer) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await followUser(viewer.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '关注失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.delete('/users/:id/follow', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const viewer = token ? await getUserByToken(token) : null;

    if (!viewer) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await unfollowUser(viewer.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '取消关注失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/friends/requests/:id/accept', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const viewer = token ? await getUserByToken(token) : null;

    if (!viewer) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await acceptFriendRequest(viewer.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '接受好友申请失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/friends/requests/:id/reject', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const viewer = token ? await getUserByToken(token) : null;

    if (!viewer) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await rejectFriendRequest(viewer.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '忽略好友申请失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.get('/users/:id', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const viewer = token ? await getUserByToken(token) : null;
  const user = await getUserProfileById(String(request.params.id), viewer?.id ?? null);

  if (!user) {
    response.status(404).json({ success: false, message: '用户不存在' });
    return;
  }

  ok(response, user);
});

authRouter.get('/notifications', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, await getNotifications(user.id));
});

authRouter.post('/notifications/read-all', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  await markAllNotificationsRead(user.id);
  ok(response, { success: true });
});

authRouter.post('/notifications/:id/read', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  await markNotificationRead(user.id, String(request.params.id));
  ok(response, { success: true });
});

authRouter.get('/social', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, await getSocialOverview(user.id));
});

authRouter.get('/community/feed', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  const tab = request.query.tab === 'follow' ? 'follow' : 'recommend';
  ok(response, await getCommunityFeed(user.id, tab));
});

authRouter.get('/community/discovery', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, await getCommunityDiscovery(user.id));
});

authRouter.get('/community/search', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, await searchCommunity(user.id, typeof request.query.q === 'string' ? request.query.q : ''));
});

authRouter.post('/community/posts', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await createCommunityPost(user.id, request.body as CreateCommunityPostPayload));
  } catch (error) {
    const message = error instanceof Error ? error.message : '发布动态失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/community/posts/:id/repost', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await repostCommunityPost(user.id, String(request.params.id), request.body as CreateCommunityPostPayload));
  } catch (error) {
    const message = error instanceof Error ? error.message : '转发失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.get('/community/posts/:id', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  const post = await getCommunityPostDetail(user.id, String(request.params.id));
  if (!post) {
    response.status(404).json({ success: false, message: '动态不存在或不可见' });
    return;
  }

  ok(response, post);
});

authRouter.post('/community/posts/:id/comments', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await createCommunityComment(user.id, String(request.params.id), request.body as CreateCommunityCommentPayload));
  } catch (error) {
    const message = error instanceof Error ? error.message : '发表评论失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/community/comments/:id/like', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await likeCommunityComment(user.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '评论点赞失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.delete('/community/comments/:id/like', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await unlikeCommunityComment(user.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '取消评论点赞失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/community/posts/:id/like', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await likeCommunityPost(user.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '点赞失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.delete('/community/posts/:id/like', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await unlikeCommunityPost(user.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '取消点赞失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/community/posts/:id/bookmark', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await bookmarkCommunityPost(user.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '收藏失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.delete('/community/posts/:id/bookmark', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await unbookmarkCommunityPost(user.id, String(request.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '取消收藏失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.get('/chats', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, await getChatConversations(user.id));
});

authRouter.get('/chats/:userId', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await getChatDetail(user.id, String(request.params.userId)));
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取聊天记录失败';
    response.status(400).json({ success: false, message });
  }
});

authRouter.post('/chats/:userId', async (request, response) => {
  try {
    const token = getBearerToken(request.headers.authorization);
    const user = token ? await getUserByToken(token) : null;

    if (!user) {
      response.status(401).json({ success: false, message: '请先登录' });
      return;
    }

    ok(response, await sendChatMessage(user.id, String(request.params.userId), request.body as SendChatMessagePayload));
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送消息失败';
    response.status(400).json({ success: false, message });
  }
});
