import type { Router as ExpressRouter } from 'express';

import type {
  CreateAdminSystemUserPayload,
  ResetAdminSystemUserPasswordPayload,
  UpdateAdminSystemUserPayload,
  UpdateAdminSystemUserStatusPayload,
} from '@umi/shared';

import { asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import {
  createAdminSystemUser,
  getAdminSystemUsers,
  resetAdminSystemUserPassword,
  updateAdminSystemUser,
  updateAdminSystemUserStatus,
} from '../system';
import { getRequestAdmin } from '../auth';
import { getRouteParam, toRouteHttpError } from '../route-helpers';

export function registerAdminSystemUserRoutes(adminRouter: ExpressRouter) {
  adminRouter.put(
    '/system-users/:id',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await updateAdminSystemUser(
            getRouteParam(request.params.id),
            request.body as UpdateAdminSystemUserPayload,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_SYSTEM_USER_UPDATE_FAILED',
            message: '更新系统用户失败',
          },
          [
            { message: '系统用户不存在', status: 404, code: 'ADMIN_SYSTEM_USER_NOT_FOUND' },
            { message: '系统用户名不能为空', status: 400, code: 'ADMIN_SYSTEM_USER_USERNAME_REQUIRED' },
            { message: '显示名称不能为空', status: 400, code: 'ADMIN_SYSTEM_USER_DISPLAY_NAME_REQUIRED' },
            { message: '请至少选择一个角色', status: 400, code: 'ADMIN_SYSTEM_USER_ROLE_REQUIRED' },
            { message: '系统用户名已存在', status: 400, code: 'ADMIN_SYSTEM_USER_USERNAME_DUPLICATE' },
            { message: '手机号已被其他系统用户占用', status: 400, code: 'ADMIN_SYSTEM_USER_PHONE_DUPLICATE' },
            { message: '存在无效角色或停用角色', status: 400, code: 'ADMIN_SYSTEM_USER_ROLE_INVALID' },
          ],
        );
      }
    }),
  );

  adminRouter.post(
    '/system-users',
    asyncHandler(async (request, response) => {
      try {
        ok(response, await createAdminSystemUser(request.body as CreateAdminSystemUserPayload));
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_SYSTEM_USER_CREATE_FAILED',
            message: '新增系统用户失败',
          },
          [
            { message: '系统用户名不能为空', status: 400, code: 'ADMIN_SYSTEM_USER_USERNAME_REQUIRED' },
            { message: '显示名称不能为空', status: 400, code: 'ADMIN_SYSTEM_USER_DISPLAY_NAME_REQUIRED' },
            { message: '密码长度不能少于 6 位', status: 400, code: 'ADMIN_SYSTEM_USER_PASSWORD_INVALID' },
            { message: '请至少选择一个角色', status: 400, code: 'ADMIN_SYSTEM_USER_ROLE_REQUIRED' },
            { message: '系统用户名已存在', status: 400, code: 'ADMIN_SYSTEM_USER_USERNAME_DUPLICATE' },
            { message: '手机号已被其他系统用户占用', status: 400, code: 'ADMIN_SYSTEM_USER_PHONE_DUPLICATE' },
            { message: '存在无效角色或停用角色', status: 400, code: 'ADMIN_SYSTEM_USER_ROLE_INVALID' },
          ],
        );
      }
    }),
  );

  adminRouter.post(
    '/system-users/:id/reset-password',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await resetAdminSystemUserPassword(
            getRouteParam(request.params.id),
            request.body as ResetAdminSystemUserPasswordPayload,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_SYSTEM_USER_PASSWORD_RESET_FAILED',
            message: '重置系统用户密码失败',
          },
          [
            { message: '系统用户不存在', status: 404, code: 'ADMIN_SYSTEM_USER_NOT_FOUND' },
            { message: '密码长度不能少于 6 位', status: 400, code: 'ADMIN_SYSTEM_USER_PASSWORD_INVALID' },
          ],
        );
      }
    }),
  );

  adminRouter.put(
    '/system-users/:id/status',
    asyncHandler(async (request, response) => {
      try {
        const admin = getRequestAdmin(request);
        ok(
          response,
          await updateAdminSystemUserStatus(
            getRouteParam(request.params.id),
            request.body as UpdateAdminSystemUserStatusPayload,
            admin.id,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_SYSTEM_USER_STATUS_UPDATE_FAILED',
            message: '更新系统用户状态失败',
          },
          [
            { message: '系统用户不存在', status: 404, code: 'ADMIN_SYSTEM_USER_NOT_FOUND' },
            {
              message: '不能停用当前登录账号',
              status: 400,
              code: 'ADMIN_SYSTEM_USER_SELF_DISABLE_FORBIDDEN',
            },
          ],
        );
      }
    }),
  );

  adminRouter.get(
    '/system-users',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminSystemUsers());
    }),
  );
}
