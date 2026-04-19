import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type {
  AdminUserFilter,
  AdminLoginPayload,
  ChangePasswordPayload,
  UpdateUserBanPayload,
} from '@joy/shared';

import { ok } from '../../lib/http';
import { getUserSummaryById, listUsersForAdmin, setUserBanned } from '../auth/store';
import { getAdminUserGuesses, getAdminUserOrders } from './users';
import { getAdminDashboardStats } from './dashboard';
import { getAdminCategories } from './categories';
import { getAdminGuesses, getAdminFriendGuesses, getAdminPkMatches } from './guesses';
import { getAdminOrders, getAdminTransactions, getAdminLogistics, getAdminConsignRows } from './orders';
import { getAdminProducts, getAdminBrandLibrary } from './products';
import {
  getAdminShops,
  getAdminShopApplies,
  getAdminBrandApplies,
  getAdminBrandAuthApplies,
  getAdminBrandAuthRecords,
  getAdminShopProducts,
  getAdminBrands,
  getAdminProductAuthRows,
  getAdminProductAuthRecords,
} from './merchant';
import {
  getAdminNotifications,
  getAdminChats,
  getAdminSystemUsers,
  getAdminRoles,
  getAdminPermissionsMatrix,
} from './system';
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

  ok(
    response,
    await listUsersForAdmin({
      page: Number(request.query.page ?? 1),
      pageSize: Number(request.query.pageSize ?? 20),
      keyword:
        typeof request.query.keyword === 'string' ? request.query.keyword : undefined,
      role:
        typeof request.query.role === 'string'
          ? (request.query.role as AdminUserFilter)
          : undefined,
    }),
  );
});

adminRouter.get('/users/:id', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  const user = await getUserSummaryById(request.params.id);
  if (!user) {
    response.status(404).json({ success: false, message: '用户不存在' });
    return;
  }

  ok(response, user);
});

adminRouter.get('/users/:id/guesses', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  const user = await getUserSummaryById(request.params.id);
  if (!user) {
    response.status(404).json({ success: false, message: '用户不存在' });
    return;
  }

  ok(
    response,
    await getAdminUserGuesses(
      request.params.id,
      Number(request.query.page ?? 1),
      Number(request.query.pageSize ?? 10),
    ),
  );
});

adminRouter.get('/users/:id/orders', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  const user = await getUserSummaryById(request.params.id);
  if (!user) {
    response.status(404).json({ success: false, message: '用户不存在' });
    return;
  }

  ok(
    response,
    await getAdminUserOrders(
      request.params.id,
      Number(request.query.page ?? 1),
      Number(request.query.pageSize ?? 10),
    ),
  );
});

adminRouter.put('/users/:id/ban', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  const payload = request.body as UpdateUserBanPayload;
  const user = await setUserBanned(request.params.id, Boolean(payload.banned));
  if (!user) {
    response.status(404).json({ success: false, message: '用户不存在' });
    return;
  }

  ok(response, { id: user.id, banned: Boolean(user.banned) });
});

adminRouter.get('/guesses', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminGuesses());
});

adminRouter.get('/orders', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, { items: await getAdminOrders() });
});

adminRouter.get('/products', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(
    response,
    await getAdminProducts({
      page: Number(request.query.page ?? 1),
      pageSize: Number(request.query.pageSize ?? 20),
      keyword:
        typeof request.query.keyword === 'string' ? request.query.keyword : undefined,
      status:
        typeof request.query.status === 'string'
          ? (request.query.status as
              | 'all'
              | 'active'
              | 'low_stock'
              | 'paused'
              | 'off_shelf'
              | 'disabled')
          : undefined,
    }),
  );
});

adminRouter.get('/products/brand-library', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(
    response,
    await getAdminBrandLibrary({
      page: Number(request.query.page ?? 1),
      pageSize: Number(request.query.pageSize ?? 20),
      keyword:
        typeof request.query.keyword === 'string' ? request.query.keyword : undefined,
      status:
        typeof request.query.status === 'string'
          ? (request.query.status as 'all' | 'active' | 'disabled')
          : undefined,
    }),
  );
});

adminRouter.get('/guesses/friends', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminFriendGuesses());
});

adminRouter.get('/pk', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminPkMatches());
});

adminRouter.get('/orders/transactions', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, { items: await getAdminTransactions() });
});

adminRouter.get('/orders/logistics', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, { items: await getAdminLogistics() });
});

adminRouter.get('/orders/consign', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, { items: await getAdminConsignRows() });
});

adminRouter.get('/shops', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminShops());
});

adminRouter.get('/shops/applies', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminShopApplies());
});

adminRouter.get('/brands', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminBrands());
});

adminRouter.get('/brands/applies', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminBrandApplies());
});

adminRouter.get('/brands/auth-applies', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminBrandAuthApplies());
});

adminRouter.get('/brands/auth-records', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminBrandAuthRecords());
});

adminRouter.get('/shops/products', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminShopProducts());
});

adminRouter.get('/product-auth', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminProductAuthRows());
});

adminRouter.get('/product-auth/records', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminProductAuthRecords());
});

adminRouter.get('/notifications', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminNotifications());
});

adminRouter.get('/chats', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminChats());
});

adminRouter.get('/system-users', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminSystemUsers());
});

adminRouter.get('/roles', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminRoles());
});

adminRouter.get('/permissions/matrix', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminPermissionsMatrix());
});

adminRouter.get('/categories', async (request, response) => {
  const auth = await requireAdminByAuthorization(request.headers.authorization);
  if (!auth.ok) {
    response.status(auth.status).json({ success: false, message: auth.message });
    return;
  }

  ok(response, await getAdminCategories());
});
