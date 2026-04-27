import type { UploadOssImagePayload, UploadOssImageResult } from '@umi/shared';

import { postJson } from './shared';

export function uploadOssImage(payload: UploadOssImagePayload) {
  return postJson<UploadOssImageResult, UploadOssImagePayload>('/api/uploads/oss/images', payload);
}
