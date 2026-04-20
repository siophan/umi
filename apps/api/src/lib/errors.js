export class HttpError extends Error {
    status;
    code;
    fields;
    constructor(status, code, message, fields) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.code = code;
        this.fields = fields;
    }
}
export function isHttpError(error) {
    return error instanceof HttpError;
}
export function toHttpError(error, defaults) {
    if (isHttpError(error)) {
        return error;
    }
    const message = error instanceof Error && error.message ? error.message : defaults.message;
    return new HttpError(defaults.status, defaults.code, message, defaults.fields);
}
export function toApiErrorEnvelope(error) {
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
export function sendError(response, error) {
    const payload = toApiErrorEnvelope(error);
    response.status(payload.status).json(payload);
}
export function withErrorBoundary(defaults, handler) {
    return asyncHandler(async (request, response, next) => {
        try {
            await handler(request, response, next);
        }
        catch (error) {
            next(toHttpError(error, defaults));
        }
    });
}
export function asyncHandler(handler) {
    return (request, response, next) => {
        Promise.resolve(handler(request, response, next)).catch(next);
    };
}
