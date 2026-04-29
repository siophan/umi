import type {
  UploadOssImagePayload,
  UploadOssImageResult,
  UploadOssVideoPayload,
  UploadOssVideoResult,
} from '@umi/shared';

import { postJson } from './shared';

export function uploadAdminOssImage(payload: UploadOssImagePayload) {
  return postJson<UploadOssImageResult, UploadOssImagePayload>(
    '/api/admin/uploads/oss/images',
    payload,
  );
}

export function uploadAdminOssVideo(payload: UploadOssVideoPayload) {
  return postJson<UploadOssVideoResult, UploadOssVideoPayload>(
    '/api/admin/uploads/oss/videos',
    payload,
  );
}
