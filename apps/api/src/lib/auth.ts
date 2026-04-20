import type { NextFunction, Request, Response } from 'express';

import type { UserSummary } from '@umi/shared';

import { HttpError } from './errors';
import { getUserByToken } from '../modules/auth/store';

export function getBearerToken(authorization?: string) {
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
}

async function resolveUser(
  authorization?: string,
): Promise<UserSummary | null> {
  const token = getBearerToken(authorization);
  return token ? getUserByToken(token) : null;
}

export async function optionalUser(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    request.user = await resolveUser(request.headers.authorization);
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireUser(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const user = await resolveUser(request.headers.authorization);

    if (!user) {
      next(new HttpError(401, 'AUTH_REQUIRED', '请先登录'));
      return;
    }

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function getRequestUser(request: Request): UserSummary {
  if (!request.user) {
    throw new HttpError(401, 'AUTH_REQUIRED', '请先登录');
  }

  return request.user;
}
