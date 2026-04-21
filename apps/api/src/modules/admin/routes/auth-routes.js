import { asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import { adminLogin, changeAdminPassword, getBearerToken, getRequestAdmin, logoutAdminByToken, } from '../auth';
import { toRouteHttpError } from '../route-helpers';
export function registerAdminPublicAuthRoutes(adminRouter) {
    adminRouter.post('/auth/login', asyncHandler(async (request, response) => {
        try {
            const result = await adminLogin(request.body, request.ip || request.socket.remoteAddress || null);
            ok(response, result);
        }
        catch (error) {
            throw toRouteHttpError(error, {
                status: 400,
                code: 'ADMIN_LOGIN_FAILED',
                message: '后台登录失败',
            }, [
                { message: '请输入后台用户名', status: 400, code: 'ADMIN_USERNAME_REQUIRED' },
                { message: '请输入密码', status: 400, code: 'ADMIN_PASSWORD_REQUIRED' },
                { message: '用户名或密码错误', status: 401, code: 'ADMIN_INVALID_CREDENTIALS' },
                { message: '管理员账号不存在', status: 401, code: 'ADMIN_INVALID_CREDENTIALS' },
                { message: '管理员账号已停用', status: 403, code: 'ADMIN_ACCOUNT_DISABLED' },
            ]);
        }
    }));
}
export function registerAdminSessionRoutes(adminRouter) {
    adminRouter.get('/auth/me', asyncHandler(async (request, response) => {
        ok(response, getRequestAdmin(request));
    }));
    adminRouter.post('/auth/logout', asyncHandler(async (request, response) => {
        await logoutAdminByToken(getBearerToken(request.headers.authorization));
        ok(response, { success: true });
    }));
    adminRouter.post('/auth/change-password', asyncHandler(async (request, response) => {
        try {
            const admin = getRequestAdmin(request);
            const result = await changeAdminPassword(admin.id, request.body);
            ok(response, result);
        }
        catch (error) {
            throw toRouteHttpError(error, {
                status: 400,
                code: 'ADMIN_PASSWORD_CHANGE_FAILED',
                message: '修改密码失败',
            }, [
                { message: '当前密码不能为空', status: 400, code: 'ADMIN_CURRENT_PASSWORD_REQUIRED' },
                { message: '新密码长度至少6位', status: 400, code: 'ADMIN_NEW_PASSWORD_TOO_SHORT' },
                { message: '当前密码错误', status: 400, code: 'ADMIN_CURRENT_PASSWORD_INVALID' },
                { message: '新密码不能与当前密码相同', status: 400, code: 'ADMIN_PASSWORD_UNCHANGED' },
                { message: '管理员账号不存在', status: 404, code: 'ADMIN_USER_NOT_FOUND' },
                { message: '管理员账号已停用', status: 403, code: 'ADMIN_ACCOUNT_DISABLED' },
            ]);
        }
    }));
}
