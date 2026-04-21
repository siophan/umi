import { HttpError } from '../../lib/errors';
import { getUserSummaryById } from '../users/query-store';
export function toRouteHttpError(error, defaults, mappings = []) {
    if (error instanceof HttpError) {
        return error;
    }
    if (error instanceof Error) {
        const matched = mappings.find((item) => item.message === error.message);
        if (matched) {
            return new HttpError(matched.status, matched.code, matched.message);
        }
        return new HttpError(defaults.status, defaults.code, error.message);
    }
    return new HttpError(defaults.status, defaults.code, defaults.message);
}
export function getRouteParam(value) {
    if (Array.isArray(value)) {
        const first = value[0];
        return typeof first === 'string' ? first : '';
    }
    return typeof value === 'string' ? value : '';
}
export async function requireExistingUserSummary(userId) {
    const user = await getUserSummaryById(userId);
    if (!user) {
        throw new HttpError(404, 'ADMIN_USER_NOT_FOUND', '用户不存在');
    }
    return user;
}
