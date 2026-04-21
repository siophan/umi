import { Router } from 'express';
import { getBearerToken, getRequestUser, requireUser } from '../../lib/auth';
import { withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { changePassword, login, logoutByToken, register, resetPassword, sendCode, verifyCode, } from './store';
export const authRouter = Router();
authRouter.post('/login', withErrorBoundary({
    status: 400,
    code: 'AUTH_LOGIN_FAILED',
    message: '登录失败',
}, async (request, response) => {
    const body = request.body;
    ok(response, await login(body));
}));
authRouter.post('/send-code', withErrorBoundary({
    status: 400,
    code: 'AUTH_SEND_CODE_FAILED',
    message: '验证码发送失败',
}, async (request, response) => {
    const body = request.body;
    ok(response, await sendCode(body.phone, body.bizType));
}));
authRouter.post('/verify-code', withErrorBoundary({
    status: 400,
    code: 'AUTH_VERIFY_CODE_FAILED',
    message: '验证码校验失败',
}, async (request, response) => {
    const body = request.body;
    ok(response, await verifyCode(body.phone, body.code, body.bizType));
}));
authRouter.post('/register', withErrorBoundary({
    status: 400,
    code: 'AUTH_REGISTER_FAILED',
    message: '注册失败',
}, async (request, response) => {
    const body = request.body;
    ok(response, await register(body));
}));
authRouter.post('/change-password', requireUser, withErrorBoundary({
    status: 400,
    code: 'AUTH_CHANGE_PASSWORD_FAILED',
    message: '修改密码失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await changePassword(user.id, request.body));
}));
authRouter.post('/reset-password', withErrorBoundary({
    status: 400,
    code: 'AUTH_RESET_PASSWORD_FAILED',
    message: '重置密码失败',
}, async (request, response) => {
    ok(response, await resetPassword(request.body));
}));
authRouter.post('/logout', withErrorBoundary({
    status: 400,
    code: 'AUTH_LOGOUT_FAILED',
    message: '退出登录失败',
}, async (request, response) => {
    await logoutByToken(getBearerToken(request.headers.authorization));
    ok(response, { success: true });
}));
