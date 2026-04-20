import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { ApiErrorEnvelope } from '@umi/shared';

type ErrorDefaults = {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export class HttpError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function toHttpError(
  error: unknown,
  defaults: ErrorDefaults,
): HttpError {
  if (isHttpError(error)) {
    return error;
  }

  const message =
    error instanceof Error && error.message ? error.message : defaults.message;

  return new HttpError(
    defaults.status,
    defaults.code,
    message,
    defaults.fields,
  );
}

export function toApiErrorEnvelope(error: unknown): ApiErrorEnvelope {
  if (isHttpError(error)) {
    return {
      success: false,
      code: error.code,
      message: error.message,
      status: error.status,
      fields: error.fields,
    };
  }

  return {
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    status: 500,
  };
}

export function sendError(response: Response, error: unknown) {
  const payload = toApiErrorEnvelope(error);
  response.status(payload.status).json(payload);
}

export function withErrorBoundary(
  defaults: ErrorDefaults,
  handler: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<void> | void,
): RequestHandler {
  return asyncHandler(async (request, response, next) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      next(toHttpError(error, defaults));
    }
  });
}

export function asyncHandler(
  handler: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<void> | void,
): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
