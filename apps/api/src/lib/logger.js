import { mkdirSync } from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../env';
const workspaceRoot = path.resolve(process.cwd(), '../..');
const logsDir = path.join(workspaceRoot, 'logs');
mkdirSync(logsDir, { recursive: true });
const apiLogStream = pino.destination({
    dest: path.join(logsDir, 'api.log'),
    mkdir: true,
    sync: false,
});
const apiErrorLogStream = pino.destination({
    dest: path.join(logsDir, 'api-error.log'),
    mkdir: true,
    sync: false,
});
const multistream = pino.multistream([
    { stream: process.stdout },
    { stream: apiLogStream },
    { level: 'error', stream: apiErrorLogStream },
]);
export const appLogger = pino({
    level: env.logLevel,
    base: {
        service: 'joy-api',
        env: env.nodeEnv,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: ['req.headers.authorization', 'req.body.password', 'password', 'dbPassword'],
        censor: '[REDACTED]',
    },
}, multistream);
export const httpLogger = pinoHttp({
    logger: appLogger,
    customSuccessMessage(request, response) {
        return `${request.method} ${request.url} completed with ${response.statusCode}`;
    },
    customErrorMessage(request, response, error) {
        return `${request.method} ${request.url} failed with ${response.statusCode}: ${error.message}`;
    },
    customLogLevel(_request, response, error) {
        if (error || response.statusCode >= 500) {
            return 'error';
        }
        if (response.statusCode >= 400) {
            return 'warn';
        }
        return 'info';
    },
    serializers: {
        req(request) {
            return {
                method: request.method,
                url: request.url,
                origin: request.headers.origin,
                remoteAddress: request.socket?.remoteAddress ?? request.connection?.remoteAddress ?? null,
            };
        },
        res(response) {
            return {
                statusCode: response.statusCode,
            };
        },
        err(error) {
            return {
                type: error.name,
                message: error.message,
                stack: error.stack,
            };
        },
    },
});
export function registerProcessLoggers() {
    process.on('uncaughtException', (error) => {
        appLogger.fatal({ err: error }, 'Uncaught exception');
    });
    process.on('unhandledRejection', (reason) => {
        appLogger.fatal({ err: reason }, 'Unhandled rejection');
    });
}
