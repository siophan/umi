import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type {
  AdminLoginPayload,
  ChangePasswordPayload,
} from '@joy/shared';

import { demoAdmin, demoGuesses, demoOrders, demoUser } from '../../lib/demo-data';
import { ok } from '../../lib/http';
import { getAdminDashboardStats } from './dashboard';
import {
  adminLogin,
  changeAdminPassword,
  logoutAdminByToken,
  requireAdminByAuthorization,
} from './auth';

export const adminRouter: ExpressRouter = Router();

adminRouter.post('/auth/login', async (request, response) => {
  try {
    const result = await adminLogin(
      request.body as AdminLoginPayload,
      request.ip || request.socket.remoteAddress || null,
    );
    ok(response, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '后台登录失败';
    response.status(400).json({ success: false, message });
  }
});

adminRouter.get('/auth/me', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, auth.user);
});

adminRouter.post('/auth/logout', async (request, response) => {
  const token =
    request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice(7)
      : '';
  await logoutAdminByToken(token);
  ok(response, { success: true });
});

adminRouter.post('/auth/change-password', async (request, response) => {
  try {
    const auth = await requireAdminByAuthorization(request.headers.authorization);
    if (!auth.ok) {
      response.status(auth.status).json({ success: false, message: auth.message });
      return;
    }

    const result = await changeAdminPassword(
      auth.user.id,
      request.body as ChangePasswordPayload,
    );
    ok(response, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '修改密码失败';
    response.status(400).json({ success: false, message });
  }
});

adminRouter.get('/dashboard/stats', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminDashboardStats());
});

adminRouter.get('/users', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, { items: [demoUser, demoAdmin] });
});

adminRouter.get('/guesses', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, { items: demoGuesses });
});

adminRouter.get('/orders', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, { items: demoOrders });
});
