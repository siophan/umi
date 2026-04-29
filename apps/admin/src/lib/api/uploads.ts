import type { UploadOssImagePayload, UploadOssImageResult } from '@umi/shared';

import { postJson } from './shared';

export function uploadAdminOssImage(payload: UploadOssImagePayload) {
  return postJson<UploadOssImageResult, UploadOssImagePayload>(
    '/api/admin/uploads/oss/images',
    payload,
  );
}
