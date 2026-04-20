import type { Response } from 'express';

import type { ApiEnvelope } from '@umi/shared';

export function ok<T>(response: Response, data: T) {
  const body: ApiEnvelope<T> = {
    success: true,
    data,
  };

  response.json(body);
}
