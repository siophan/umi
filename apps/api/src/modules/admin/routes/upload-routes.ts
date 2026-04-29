import type { Router as ExpressRouter } from 'express';
import type { UploadOssImagePayload } from '@umi/shared';

import { asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import { uploadOssImage } from '../../upload/oss-upload';
import { getRequestAdmin } from '../auth';

/**
 * Admin 端的图片上传入口。
 * 登录的 admin 即可使用（已经过 requireAdmin），不再单独检查路由权限码——
 * 是否能"看到带上传的表单"由各业务页面自身的权限决定。
 */
export function registerAdminUploadRoutes(adminRouter: ExpressRouter) {
  adminRouter.post(
    '/uploads/oss/images',
    asyncHandler(async (request, response) => {
      const admin = getRequestAdmin(request);
      ok(response, await uploadOssImage(request.body as UploadOssImagePayload, admin.id));
    }),
  );
}
