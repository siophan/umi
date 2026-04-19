import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import type {
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  SendCodePayload,
  SendChatMessagePayload,
  UpdateMePayload,
} from '@joy/shared';

import { ok } from '../../lib/http';
import {
  changePassword,
  getMeActivity,
  getNotifications,
  getSocialOverview,
  getChatConversations,
  getChatDetail,
  getUserByToken,
  getUserProfileById,
  login,
  markAllNotificationsRead,
  logoutByToken,
  register,
  sendCode,
  sendChatMessage,
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

authRouter.get('/users/:id', async (request, response) => {
  const user = await getUserProfileById(String(request.params.id));

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

authRouter.get('/social', async (request, response) => {
  const token = getBearerToken(request.headers.authorization);
  const user = token ? await getUserByToken(token) : null;

  if (!user) {
    response.status(401).json({ success: false, message: '请先登录' });
    return;
  }

  ok(response, await getSocialOverview(user.id));
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
