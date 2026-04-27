import type { UploadOssImagePayload } from '@umi/shared';

import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
import { uploadOssImage } from './oss-upload';

export const uploadRouter: ExpressRouter = Router();

uploadRouter.post(
  '/oss/images',
  requireUser,
  asyncHandler(async (request, response) => {
    ok(
      response,
      await uploadOssImage(request.body as UploadOssImagePayload, getRequestUser(request).id),
    );
  }),
);
