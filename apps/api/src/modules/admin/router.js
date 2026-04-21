import { Router } from 'express';
import { ok } from '../../lib/http';
import { HttpError, asyncHandler } from '../../lib/errors';
import { getUserSummaryById } from '../users/query-store';
import { listUsersForAdmin, setUserBanned } from '../users/admin-store';
import { getAdminDashboardStats } from './dashboard';
import { deleteAdminCommunityComment, deleteAdminCommunityPost, getAdminCommunityComments, getAdminCommunityPosts, getAdminCommunityReports, getAdminLiveRooms, updateAdminCommunityReport, } from './content';
import { createAdminBanner, deleteAdminBanner, getAdminBanners, updateAdminBanner, updateAdminBannerStatus, } from './banners';
import { createAdminCheckinRewardConfig, getAdminCheckinRewardConfigs, updateAdminCheckinRewardConfig, updateAdminCheckinRewardConfigStatus, } from './checkin';
import { getAdminInviteRecords, getAdminInviteRewardConfig, updateAdminInviteRewardConfig, } from './invites';
import { createAdminCouponGrantBatch, createAdminCouponTemplate, getAdminCouponGrantBatches, getAdminCoupons, updateAdminCouponTemplate, updateAdminCouponTemplateStatus, } from './coupons';
import { getAdminRankingDetail, getAdminRankings } from './rankings';
import { adjustAdminEquity, getAdminEquityAccounts, getAdminEquityDetail, } from './equity';
import { adminLogin, changeAdminPassword, getRequestAdmin, getBearerToken, logoutAdminByToken, requireAdmin, } from './auth';
import { createAdminCategory, getAdminCategories, updateAdminCategory, updateAdminCategoryStatus, } from './categories';
import { getAdminFriendGuesses, getAdminGuesses, getAdminPkMatches, reviewAdminGuess, } from './guesses';
import { getAdminBrandAuthApplies, getAdminBrandAuthRecords, getAdminBrands, getAdminShopDetail, reviewAdminBrandAuthApply, reviewAdminShopApply, getAdminShopApplies, getAdminShopProducts, getAdminShops, updateAdminShopStatus, createAdminBrand, updateAdminBrand, revokeAdminBrandAuthRecord, } from './merchant';
import { createAdminBrandProduct, getAdminBrandLibrary, getAdminProducts, updateAdminBrandProduct, } from './products';
import { getAdminChats, getAdminNotifications, getAdminPermissions, getAdminPermissionsMatrix, getAdminRoles, getAdminSystemUsers, createAdminPermission, createAdminNotification, createAdminRole, createAdminSystemUser, resetAdminSystemUserPassword, updateAdminPermission, updateAdminRole, updateAdminRolePermissions, updateAdminPermissionStatus, updateAdminSystemUser, updateAdminRoleStatus, updateAdminSystemUserStatus, } from './system';
import { getAdminUserGuesses, getAdminUserOrders } from './users';
import { getAdminConsignRows, getAdminLogistics, getAdminOrders, getAdminTransactions, } from './orders';
export const adminRouter = Router();
function toRouteHttpError(error, defaults, mappings = []) {
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
function getRouteParam(value) {
    if (Array.isArray(value)) {
        const first = value[0];
        return typeof first === 'string' ? first : '';
    }
    return typeof value === 'string' ? value : '';
}
async function requireExistingUserSummary(userId) {
    const user = await getUserSummaryById(userId);
    if (!user) {
        throw new HttpError(404, 'ADMIN_USER_NOT_FOUND', '用户不存在');
    }
    return user;
}
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
adminRouter.use(requireAdmin);
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
adminRouter.get('/dashboard/stats', asyncHandler(async (_request, response) => {
    ok(response, await getAdminDashboardStats());
}));
adminRouter.get('/community/posts', asyncHandler(async (request, response) => {
    ok(response, await getAdminCommunityPosts({
        title: getRouteParam(request.query.title),
        author: getRouteParam(request.query.author),
        tag: getRouteParam(request.query.tag),
    }));
}));
adminRouter.delete('/community/posts/:id', asyncHandler(async (request, response) => {
    ok(response, await deleteAdminCommunityPost(getRouteParam(request.params.id)));
}));
adminRouter.get('/community/comments', asyncHandler(async (request, response) => {
    ok(response, await getAdminCommunityComments({
        content: getRouteParam(request.query.content),
        author: getRouteParam(request.query.author),
        postTitle: getRouteParam(request.query.postTitle),
    }));
}));
adminRouter.delete('/community/comments/:id', asyncHandler(async (request, response) => {
    ok(response, await deleteAdminCommunityComment(getRouteParam(request.params.id)));
}));
adminRouter.get('/community/reports', asyncHandler(async (request, response) => {
    ok(response, await getAdminCommunityReports({
        reporter: getRouteParam(request.query.reporter),
        reasonType: getRouteParam(request.query.reasonType),
        targetKeyword: getRouteParam(request.query.targetKeyword),
        status: getRouteParam(request.query.status),
    }));
}));
adminRouter.put('/community/reports/:id', asyncHandler(async (request, response) => {
    const admin = getRequestAdmin(request);
    ok(response, await updateAdminCommunityReport(getRouteParam(request.params.id), admin.id, request.body));
}));
adminRouter.get('/lives', asyncHandler(async (request, response) => {
    ok(response, await getAdminLiveRooms({
        title: getRouteParam(request.query.title),
        host: getRouteParam(request.query.host),
        guessTitle: getRouteParam(request.query.guessTitle),
    }));
}));
adminRouter.get('/users', asyncHandler(async (request, response) => {
    ok(response, await listUsersForAdmin({
        page: Number(request.query.page ?? 1),
        pageSize: Number(request.query.pageSize ?? 20),
        keyword: typeof request.query.keyword === 'string'
            ? request.query.keyword
            : undefined,
        phone: typeof request.query.phone === 'string'
            ? request.query.phone
            : undefined,
        shopName: typeof request.query.shopName === 'string'
            ? request.query.shopName
            : undefined,
        role: typeof request.query.role === 'string'
            ? request.query.role
            : undefined,
    }));
}));
adminRouter.get('/users/:id', asyncHandler(async (request, response) => {
    ok(response, await requireExistingUserSummary(getRouteParam(request.params.id)));
}));
adminRouter.get('/users/:id/guesses', asyncHandler(async (request, response) => {
    const userId = getRouteParam(request.params.id);
    await requireExistingUserSummary(userId);
    ok(response, await getAdminUserGuesses(userId, Number(request.query.page ?? 1), Number(request.query.pageSize ?? 10)));
}));
adminRouter.get('/users/:id/orders', asyncHandler(async (request, response) => {
    const userId = getRouteParam(request.params.id);
    await requireExistingUserSummary(userId);
    ok(response, await getAdminUserOrders(userId, Number(request.query.page ?? 1), Number(request.query.pageSize ?? 10)));
}));
adminRouter.put('/users/:id/ban', asyncHandler(async (request, response) => {
    const payload = request.body;
    const user = await setUserBanned(getRouteParam(request.params.id), Boolean(payload.banned));
    if (!user) {
        throw new HttpError(404, 'ADMIN_USER_NOT_FOUND', '用户不存在');
    }
    ok(response, { id: user.id, banned: Boolean(user.banned) });
}));
adminRouter.put('/system-users/:id', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminSystemUser(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_SYSTEM_USER_UPDATE_FAILED',
            message: '更新系统用户失败',
        }, [
            { message: '系统用户不存在', status: 404, code: 'ADMIN_SYSTEM_USER_NOT_FOUND' },
            { message: '系统用户名不能为空', status: 400, code: 'ADMIN_SYSTEM_USER_USERNAME_REQUIRED' },
            { message: '显示名称不能为空', status: 400, code: 'ADMIN_SYSTEM_USER_DISPLAY_NAME_REQUIRED' },
            { message: '请至少选择一个角色', status: 400, code: 'ADMIN_SYSTEM_USER_ROLE_REQUIRED' },
            { message: '系统用户名已存在', status: 400, code: 'ADMIN_SYSTEM_USER_USERNAME_DUPLICATE' },
            { message: '手机号已被其他系统用户占用', status: 400, code: 'ADMIN_SYSTEM_USER_PHONE_DUPLICATE' },
            { message: '存在无效角色或停用角色', status: 400, code: 'ADMIN_SYSTEM_USER_ROLE_INVALID' },
        ]);
    }
}));
adminRouter.post('/system-users', asyncHandler(async (request, response) => {
    try {
        ok(response, await createAdminSystemUser(request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_SYSTEM_USER_CREATE_FAILED',
            message: '新增系统用户失败',
        }, [
            { message: '系统用户名不能为空', status: 400, code: 'ADMIN_SYSTEM_USER_USERNAME_REQUIRED' },
            { message: '显示名称不能为空', status: 400, code: 'ADMIN_SYSTEM_USER_DISPLAY_NAME_REQUIRED' },
            { message: '密码长度不能少于 6 位', status: 400, code: 'ADMIN_SYSTEM_USER_PASSWORD_INVALID' },
            { message: '请至少选择一个角色', status: 400, code: 'ADMIN_SYSTEM_USER_ROLE_REQUIRED' },
            { message: '系统用户名已存在', status: 400, code: 'ADMIN_SYSTEM_USER_USERNAME_DUPLICATE' },
            { message: '手机号已被其他系统用户占用', status: 400, code: 'ADMIN_SYSTEM_USER_PHONE_DUPLICATE' },
            { message: '存在无效角色或停用角色', status: 400, code: 'ADMIN_SYSTEM_USER_ROLE_INVALID' },
        ]);
    }
}));
adminRouter.post('/system-users/:id/reset-password', asyncHandler(async (request, response) => {
    try {
        ok(response, await resetAdminSystemUserPassword(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_SYSTEM_USER_PASSWORD_RESET_FAILED',
            message: '重置系统用户密码失败',
        }, [
            { message: '系统用户不存在', status: 404, code: 'ADMIN_SYSTEM_USER_NOT_FOUND' },
            { message: '密码长度不能少于 6 位', status: 400, code: 'ADMIN_SYSTEM_USER_PASSWORD_INVALID' },
        ]);
    }
}));
adminRouter.put('/system-users/:id/status', asyncHandler(async (request, response) => {
    try {
        const admin = getRequestAdmin(request);
        ok(response, await updateAdminSystemUserStatus(getRouteParam(request.params.id), request.body, admin.id));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_SYSTEM_USER_STATUS_UPDATE_FAILED',
            message: '更新系统用户状态失败',
        }, [
            { message: '系统用户不存在', status: 404, code: 'ADMIN_SYSTEM_USER_NOT_FOUND' },
            {
                message: '不能停用当前登录账号',
                status: 400,
                code: 'ADMIN_SYSTEM_USER_SELF_DISABLE_FORBIDDEN',
            },
        ]);
    }
}));
adminRouter.put('/roles/:id/permissions', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminRolePermissions(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_ROLE_PERMISSIONS_UPDATE_FAILED',
            message: '更新角色权限失败',
        }, [
            { message: '角色不存在', status: 404, code: 'ADMIN_ROLE_NOT_FOUND' },
            { message: '停用角色不允许分配权限', status: 400, code: 'ADMIN_ROLE_DISABLED_PERMISSION_FORBIDDEN' },
            { message: '存在无效权限或停用权限', status: 400, code: 'ADMIN_PERMISSION_INVALID' },
        ]);
    }
}));
adminRouter.put('/permissions/:id', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminPermission(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_PERMISSION_UPDATE_FAILED',
            message: '更新权限失败',
        }, [
            { message: '权限不存在', status: 404, code: 'ADMIN_PERMISSION_NOT_FOUND' },
            { message: '权限编码不能为空', status: 400, code: 'ADMIN_PERMISSION_CODE_REQUIRED' },
            { message: '权限名称不能为空', status: 400, code: 'ADMIN_PERMISSION_NAME_REQUIRED' },
            { message: '所属模块不能为空', status: 400, code: 'ADMIN_PERMISSION_MODULE_REQUIRED' },
            { message: '权限动作不合法', status: 400, code: 'ADMIN_PERMISSION_ACTION_INVALID' },
            { message: '权限编码已存在', status: 400, code: 'ADMIN_PERMISSION_CODE_DUPLICATE' },
            { message: '父权限不存在', status: 400, code: 'ADMIN_PERMISSION_PARENT_NOT_FOUND' },
            { message: '父权限不能是自己', status: 400, code: 'ADMIN_PERMISSION_PARENT_SELF_FORBIDDEN' },
            { message: '父权限不能是自己的子权限', status: 400, code: 'ADMIN_PERMISSION_PARENT_DESCENDANT_FORBIDDEN' },
        ]);
    }
}));
adminRouter.put('/permissions/:id/status', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminPermissionStatus(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_PERMISSION_STATUS_UPDATE_FAILED',
            message: '更新权限状态失败',
        }, [{ message: '权限不存在', status: 404, code: 'ADMIN_PERMISSION_NOT_FOUND' }]);
    }
}));
adminRouter.put('/roles/:id/status', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminRoleStatus(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_ROLE_STATUS_UPDATE_FAILED',
            message: '更新角色状态失败',
        }, [
            { message: '角色不存在', status: 404, code: 'ADMIN_ROLE_NOT_FOUND' },
            {
                message: '系统内置角色不允许停用',
                status: 400,
                code: 'ADMIN_ROLE_SYSTEM_DISABLE_FORBIDDEN',
            },
        ]);
    }
}));
adminRouter.get('/guesses', asyncHandler(async (_request, response) => {
    ok(response, await getAdminGuesses());
}));
adminRouter.put('/guesses/:id/review', asyncHandler(async (request, response) => {
    try {
        ok(response, await reviewAdminGuess(getRouteParam(request.params.id), getRequestAdmin(request).id, request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_GUESS_REVIEW_FAILED',
            message: '竞猜审核失败',
        }, [
            { message: '竞猜不存在', status: 404, code: 'ADMIN_GUESS_NOT_FOUND' },
            { message: '审核状态不合法', status: 400, code: 'ADMIN_GUESS_REVIEW_STATUS_INVALID' },
            { message: '请填写拒绝原因', status: 400, code: 'ADMIN_GUESS_REJECT_REASON_REQUIRED' },
            { message: '竞猜当前不可审核', status: 400, code: 'ADMIN_GUESS_NOT_REVIEWABLE' },
        ]);
    }
}));
adminRouter.get('/orders', asyncHandler(async (_request, response) => {
    ok(response, { items: await getAdminOrders() });
}));
adminRouter.get('/equity', asyncHandler(async (request, response) => {
    ok(response, await getAdminEquityAccounts({
        page: Number(request.query.page ?? 1),
        pageSize: Number(request.query.pageSize ?? 20),
        userId: typeof request.query.userId === 'string'
            ? request.query.userId
            : undefined,
        userName: typeof request.query.userName === 'string'
            ? request.query.userName
            : undefined,
        phone: typeof request.query.phone === 'string'
            ? request.query.phone
            : undefined,
    }));
}));
adminRouter.get('/equity/:id', asyncHandler(async (request, response) => {
    ok(response, await getAdminEquityDetail(getRouteParam(request.params.id)));
}));
adminRouter.post('/equity/adjust', asyncHandler(async (request, response) => {
    const payload = request.body;
    await requireExistingUserSummary(payload.userId);
    ok(response, await adjustAdminEquity(payload));
}));
adminRouter.get('/banners', asyncHandler(async (request, response) => {
    ok(response, await getAdminBanners({
        title: typeof request.query.title === 'string'
            ? request.query.title
            : undefined,
        position: typeof request.query.position === 'string'
            ? request.query.position
            : undefined,
        targetType: typeof request.query.targetType === 'string'
            ? request.query.targetType
            : undefined,
        status: typeof request.query.status === 'string'
            ? request.query.status
            : 'all',
    }));
}));
adminRouter.post('/banners', asyncHandler(async (request, response) => {
    ok(response, await createAdminBanner(request.body));
}));
adminRouter.put('/banners/:id', asyncHandler(async (request, response) => {
    ok(response, await updateAdminBanner(getRouteParam(request.params.id), request.body));
}));
adminRouter.put('/banners/:id/status', asyncHandler(async (request, response) => {
    ok(response, await updateAdminBannerStatus(getRouteParam(request.params.id), request.body));
}));
adminRouter.delete('/banners/:id', asyncHandler(async (request, response) => {
    ok(response, await deleteAdminBanner(getRouteParam(request.params.id)));
}));
adminRouter.get('/checkin/rewards', asyncHandler(async (request, response) => {
    ok(response, await getAdminCheckinRewardConfigs({
        dayNo: typeof request.query.dayNo === 'string' && request.query.dayNo.trim()
            ? Number(request.query.dayNo)
            : undefined,
        rewardType: typeof request.query.rewardType === 'string'
            ? request.query.rewardType
            : undefined,
        title: typeof request.query.title === 'string'
            ? request.query.title
            : undefined,
        status: typeof request.query.status === 'string'
            ? request.query.status
            : 'all',
    }));
}));
adminRouter.post('/checkin/rewards', asyncHandler(async (request, response) => {
    ok(response, await createAdminCheckinRewardConfig(request.body));
}));
adminRouter.put('/checkin/rewards/:id', asyncHandler(async (request, response) => {
    ok(response, await updateAdminCheckinRewardConfig(getRouteParam(request.params.id), request.body));
}));
adminRouter.put('/checkin/rewards/:id/status', asyncHandler(async (request, response) => {
    ok(response, await updateAdminCheckinRewardConfigStatus(getRouteParam(request.params.id), request.body));
}));
adminRouter.get('/invites/config', asyncHandler(async (_request, response) => {
    ok(response, await getAdminInviteRewardConfig());
}));
adminRouter.put('/invites/config', asyncHandler(async (request, response) => {
    ok(response, await updateAdminInviteRewardConfig(request.body));
}));
adminRouter.get('/invites/records', asyncHandler(async (request, response) => {
    ok(response, await getAdminInviteRecords({
        inviter: typeof request.query.inviter === 'string'
            ? request.query.inviter
            : undefined,
        invitee: typeof request.query.invitee === 'string'
            ? request.query.invitee
            : undefined,
        inviteCode: typeof request.query.inviteCode === 'string'
            ? request.query.inviteCode
            : undefined,
    }));
}));
adminRouter.get('/coupons', asyncHandler(async (request, response) => {
    ok(response, await getAdminCoupons({
        name: typeof request.query.name === 'string'
            ? request.query.name
            : undefined,
        code: typeof request.query.code === 'string'
            ? request.query.code
            : undefined,
        type: typeof request.query.type === 'string'
            ? request.query.type
            : undefined,
        scopeType: typeof request.query.scopeType === 'string'
            ? request.query.scopeType
            : undefined,
        status: typeof request.query.status === 'string'
            ? request.query.status
            : 'all',
    }));
}));
adminRouter.get('/coupons/:id/batches', asyncHandler(async (request, response) => {
    ok(response, await getAdminCouponGrantBatches(getRouteParam(request.params.id)));
}));
adminRouter.get('/rankings', asyncHandler(async (request, response) => {
    ok(response, await getAdminRankings({
        boardType: typeof request.query.boardType === 'string'
            ? request.query.boardType
            : undefined,
        periodType: typeof request.query.periodType === 'string'
            ? request.query.periodType
            : undefined,
        periodValue: typeof request.query.periodValue === 'string' ? request.query.periodValue : undefined,
        topUser: typeof request.query.topUser === 'string' ? request.query.topUser : undefined,
    }));
}));
adminRouter.get('/rankings/:boardType/:periodType/:periodValue', asyncHandler(async (request, response) => {
    ok(response, await getAdminRankingDetail(getRouteParam(request.params.boardType), getRouteParam(request.params.periodType), decodeURIComponent(getRouteParam(request.params.periodValue))));
}));
adminRouter.post('/coupons', asyncHandler(async (request, response) => {
    ok(response, await createAdminCouponTemplate(request.body));
}));
adminRouter.put('/coupons/:id', asyncHandler(async (request, response) => {
    ok(response, await updateAdminCouponTemplate(getRouteParam(request.params.id), request.body));
}));
adminRouter.put('/coupons/:id/status', asyncHandler(async (request, response) => {
    ok(response, await updateAdminCouponTemplateStatus(getRouteParam(request.params.id), request.body));
}));
adminRouter.post('/coupons/:id/grants', asyncHandler(async (request, response) => {
    ok(response, await createAdminCouponGrantBatch(getRouteParam(request.params.id), getRequestAdmin(request).id, request.body));
}));
adminRouter.get('/products', asyncHandler(async (request, response) => {
    ok(response, await getAdminProducts({
        page: Number(request.query.page ?? 1),
        pageSize: Number(request.query.pageSize ?? 20),
        keyword: typeof request.query.keyword === 'string'
            ? request.query.keyword
            : undefined,
        status: typeof request.query.status === 'string'
            ? request.query.status
            : undefined,
    }));
}));
adminRouter.get('/products/brand-library', asyncHandler(async (request, response) => {
    ok(response, await getAdminBrandLibrary({
        page: Number(request.query.page ?? 1),
        pageSize: Number(request.query.pageSize ?? 20),
        keyword: typeof request.query.keyword === 'string'
            ? request.query.keyword
            : undefined,
        status: typeof request.query.status === 'string'
            ? request.query.status
            : undefined,
    }));
}));
adminRouter.post('/products/brand-library', asyncHandler(async (request, response) => {
    try {
        ok(response, await createAdminBrandProduct(request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_BRAND_PRODUCT_CREATE_FAILED',
            message: '新增品牌商品失败',
        }, [
            { message: '品牌商品名称不能为空', status: 400, code: 'ADMIN_BRAND_PRODUCT_NAME_REQUIRED' },
            { message: '请选择品牌', status: 400, code: 'ADMIN_BRAND_PRODUCT_BRAND_REQUIRED' },
            { message: '请选择类目', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_REQUIRED' },
            { message: '指导价不合法', status: 400, code: 'ADMIN_BRAND_PRODUCT_GUIDE_PRICE_INVALID' },
            { message: '供货价不合法', status: 400, code: 'ADMIN_BRAND_PRODUCT_SUPPLY_PRICE_INVALID' },
            { message: '品牌不存在', status: 404, code: 'ADMIN_BRAND_PRODUCT_BRAND_NOT_FOUND' },
            { message: '品牌商品类目不存在', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_INVALID' },
            { message: '品牌商品名称已存在', status: 409, code: 'ADMIN_BRAND_PRODUCT_NAME_DUPLICATED' },
        ]);
    }
}));
adminRouter.put('/products/brand-library/:id', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminBrandProduct(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_BRAND_PRODUCT_UPDATE_FAILED',
            message: '编辑品牌商品失败',
        }, [
            { message: '品牌商品名称不能为空', status: 400, code: 'ADMIN_BRAND_PRODUCT_NAME_REQUIRED' },
            { message: '请选择品牌', status: 400, code: 'ADMIN_BRAND_PRODUCT_BRAND_REQUIRED' },
            { message: '请选择类目', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_REQUIRED' },
            { message: '指导价不合法', status: 400, code: 'ADMIN_BRAND_PRODUCT_GUIDE_PRICE_INVALID' },
            { message: '供货价不合法', status: 400, code: 'ADMIN_BRAND_PRODUCT_SUPPLY_PRICE_INVALID' },
            { message: '品牌商品不存在', status: 404, code: 'ADMIN_BRAND_PRODUCT_NOT_FOUND' },
            { message: '品牌不存在', status: 404, code: 'ADMIN_BRAND_PRODUCT_BRAND_NOT_FOUND' },
            { message: '品牌商品类目不存在', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_INVALID' },
            { message: '品牌商品名称已存在', status: 409, code: 'ADMIN_BRAND_PRODUCT_NAME_DUPLICATED' },
        ]);
    }
}));
adminRouter.get('/guesses/friends', asyncHandler(async (_request, response) => {
    ok(response, await getAdminFriendGuesses());
}));
adminRouter.get('/pk', asyncHandler(async (_request, response) => {
    ok(response, await getAdminPkMatches());
}));
adminRouter.get('/orders/transactions', asyncHandler(async (_request, response) => {
    ok(response, { items: await getAdminTransactions() });
}));
adminRouter.get('/orders/logistics', asyncHandler(async (_request, response) => {
    ok(response, { items: await getAdminLogistics() });
}));
adminRouter.get('/orders/consign', asyncHandler(async (_request, response) => {
    ok(response, { items: await getAdminConsignRows() });
}));
adminRouter.get('/shops', asyncHandler(async (_request, response) => {
    ok(response, await getAdminShops());
}));
adminRouter.put('/shops/:id/status', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminShopStatus(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_SHOP_STATUS_UPDATE_FAILED',
            message: '更新店铺状态失败',
        }, [{ message: '店铺不存在', status: 404, code: 'ADMIN_SHOP_NOT_FOUND' }]);
    }
}));
adminRouter.get('/shops/applies', asyncHandler(async (_request, response) => {
    ok(response, await getAdminShopApplies());
}));
adminRouter.put('/shops/applies/:id/review', asyncHandler(async (request, response) => {
    try {
        ok(response, await reviewAdminShopApply(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_SHOP_APPLY_REVIEW_FAILED',
            message: '开店申请审核失败',
        }, [
            { message: '开店申请不存在', status: 404, code: 'ADMIN_SHOP_APPLY_NOT_FOUND' },
            { message: '申请已审核', status: 400, code: 'ADMIN_SHOP_APPLY_ALREADY_REVIEWED' },
            { message: '审核状态不合法', status: 400, code: 'ADMIN_REVIEW_STATUS_INVALID' },
            { message: '请填写拒绝原因', status: 400, code: 'ADMIN_REJECT_REASON_REQUIRED' },
        ]);
    }
}));
adminRouter.get('/brands', asyncHandler(async (_request, response) => {
    ok(response, await getAdminBrands());
}));
adminRouter.post('/brands', asyncHandler(async (request, response) => {
    try {
        ok(response, await createAdminBrand(request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_BRAND_CREATE_FAILED',
            message: '新增品牌失败',
        }, [
            { message: '品牌名称不能为空', status: 400, code: 'ADMIN_BRAND_NAME_REQUIRED' },
            { message: '请选择类目', status: 400, code: 'ADMIN_BRAND_CATEGORY_REQUIRED' },
            { message: '品牌类目不存在', status: 400, code: 'ADMIN_BRAND_CATEGORY_INVALID' },
            { message: '品牌名称已存在', status: 409, code: 'ADMIN_BRAND_NAME_DUPLICATED' },
        ]);
    }
}));
adminRouter.put('/brands/:id', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminBrand(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_BRAND_UPDATE_FAILED',
            message: '编辑品牌失败',
        }, [
            { message: '品牌名称不能为空', status: 400, code: 'ADMIN_BRAND_NAME_REQUIRED' },
            { message: '请选择类目', status: 400, code: 'ADMIN_BRAND_CATEGORY_REQUIRED' },
            { message: '品牌类目不存在', status: 400, code: 'ADMIN_BRAND_CATEGORY_INVALID' },
            { message: '品牌名称已存在', status: 409, code: 'ADMIN_BRAND_NAME_DUPLICATED' },
            { message: '品牌不存在', status: 404, code: 'ADMIN_BRAND_NOT_FOUND' },
        ]);
    }
}));
adminRouter.get('/brands/auth-applies', asyncHandler(async (_request, response) => {
    ok(response, await getAdminBrandAuthApplies());
}));
adminRouter.put('/brands/auth-applies/:id/review', asyncHandler(async (request, response) => {
    try {
        ok(response, await reviewAdminBrandAuthApply(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_BRAND_AUTH_APPLY_REVIEW_FAILED',
            message: '品牌授权申请审核失败',
        }, [
            { message: '品牌授权申请不存在', status: 404, code: 'ADMIN_BRAND_AUTH_APPLY_NOT_FOUND' },
            { message: '申请已审核', status: 400, code: 'ADMIN_BRAND_AUTH_APPLY_ALREADY_REVIEWED' },
            { message: '审核状态不合法', status: 400, code: 'ADMIN_REVIEW_STATUS_INVALID' },
            { message: '请填写拒绝原因', status: 400, code: 'ADMIN_REJECT_REASON_REQUIRED' },
        ]);
    }
}));
adminRouter.get('/brands/auth-records', asyncHandler(async (_request, response) => {
    ok(response, await getAdminBrandAuthRecords());
}));
adminRouter.put('/brands/auth-records/:id/revoke', asyncHandler(async (request, response) => {
    try {
        ok(response, await revokeAdminBrandAuthRecord(getRouteParam(request.params.id)));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_BRAND_AUTH_RECORD_REVOKE_FAILED',
            message: '撤销品牌授权失败',
        }, [
            { message: '品牌授权记录不存在', status: 404, code: 'ADMIN_BRAND_AUTH_RECORD_NOT_FOUND' },
            { message: '当前授权不可撤销', status: 400, code: 'ADMIN_BRAND_AUTH_RECORD_NOT_REVOCABLE' },
        ]);
    }
}));
adminRouter.get('/shops/products', asyncHandler(async (_request, response) => {
    ok(response, await getAdminShopProducts());
}));
adminRouter.get('/shops/:id', asyncHandler(async (request, response) => {
    const detail = await getAdminShopDetail(getRouteParam(request.params.id));
    if (!detail) {
        throw new HttpError(404, 'ADMIN_SHOP_NOT_FOUND', '店铺不存在');
    }
    ok(response, detail);
}));
adminRouter.get('/notifications', asyncHandler(async (_request, response) => {
    ok(response, await getAdminNotifications());
}));
adminRouter.post('/notifications', asyncHandler(async (request, response) => {
    try {
        ok(response, await createAdminNotification(request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_NOTIFICATION_CREATE_FAILED',
            message: '发送通知失败',
        }, [
            { message: '通知标题不能为空', status: 400, code: 'ADMIN_NOTIFICATION_TITLE_REQUIRED' },
            { message: '通知内容不能为空', status: 400, code: 'ADMIN_NOTIFICATION_CONTENT_REQUIRED' },
            {
                message: '当前筛选人群没有可发送用户',
                status: 400,
                code: 'ADMIN_NOTIFICATION_NO_RECIPIENTS',
            },
        ]);
    }
}));
adminRouter.get('/chats', asyncHandler(async (_request, response) => {
    ok(response, await getAdminChats());
}));
adminRouter.get('/system-users', asyncHandler(async (_request, response) => {
    ok(response, await getAdminSystemUsers());
}));
adminRouter.get('/roles', asyncHandler(async (_request, response) => {
    ok(response, await getAdminRoles());
}));
adminRouter.post('/roles', asyncHandler(async (request, response) => {
    try {
        ok(response, await createAdminRole(request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, { status: 400, code: 'ADMIN_ROLE_CREATE_FAILED', message: '创建角色失败' });
    }
}));
adminRouter.put('/roles/:id', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminRole(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, { status: 400, code: 'ADMIN_ROLE_UPDATE_FAILED', message: '更新角色失败' }, [
            { message: '角色不存在', status: 404, code: 'ADMIN_ROLE_NOT_FOUND' },
            { message: '角色编码不能为空', status: 400, code: 'ADMIN_ROLE_CODE_REQUIRED' },
            { message: '角色名称不能为空', status: 400, code: 'ADMIN_ROLE_NAME_REQUIRED' },
            { message: '角色编码已存在', status: 400, code: 'ADMIN_ROLE_CODE_DUPLICATE' },
            {
                message: '系统内置角色不允许编辑',
                status: 400,
                code: 'ADMIN_ROLE_SYSTEM_EDIT_FORBIDDEN',
            },
        ]);
    }
}));
adminRouter.get('/permissions', asyncHandler(async (_request, response) => {
    ok(response, await getAdminPermissions());
}));
adminRouter.get('/permissions/matrix', asyncHandler(async (_request, response) => {
    ok(response, await getAdminPermissionsMatrix());
}));
adminRouter.get('/categories', asyncHandler(async (_request, response) => {
    ok(response, await getAdminCategories());
}));
adminRouter.post('/permissions', asyncHandler(async (request, response) => {
    try {
        ok(response, await createAdminPermission(request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_PERMISSION_CREATE_FAILED',
            message: '新增权限失败',
        }, [
            { message: '权限编码不能为空', status: 400, code: 'ADMIN_PERMISSION_CODE_REQUIRED' },
            { message: '权限名称不能为空', status: 400, code: 'ADMIN_PERMISSION_NAME_REQUIRED' },
            { message: '所属模块不能为空', status: 400, code: 'ADMIN_PERMISSION_MODULE_REQUIRED' },
            { message: '权限动作不合法', status: 400, code: 'ADMIN_PERMISSION_ACTION_INVALID' },
            { message: '权限编码已存在', status: 400, code: 'ADMIN_PERMISSION_CODE_DUPLICATE' },
            { message: '父权限不存在', status: 400, code: 'ADMIN_PERMISSION_PARENT_NOT_FOUND' },
        ]);
    }
}));
adminRouter.post('/categories', asyncHandler(async (request, response) => {
    try {
        ok(response, await createAdminCategory(request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_CATEGORY_CREATE_FAILED',
            message: '新增分类失败',
        }, [
            { message: '分类名称不能为空', status: 400, code: 'ADMIN_CATEGORY_NAME_REQUIRED' },
            { message: '排序值不合法', status: 400, code: 'ADMIN_CATEGORY_SORT_INVALID' },
            { message: '分类业务域不合法', status: 400, code: 'ADMIN_CATEGORY_BIZ_TYPE_INVALID' },
            {
                message: '父分类业务域不匹配',
                status: 400,
                code: 'ADMIN_CATEGORY_PARENT_BIZ_TYPE_MISMATCH',
            },
            {
                message: '请先启用父分类',
                status: 400,
                code: 'ADMIN_CATEGORY_PARENT_DISABLED',
            },
        ]);
    }
}));
adminRouter.put('/categories/:id', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminCategory(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_CATEGORY_UPDATE_FAILED',
            message: '更新分类失败',
        }, [
            { message: '分类不存在', status: 404, code: 'ADMIN_CATEGORY_NOT_FOUND' },
            { message: '分类名称不能为空', status: 400, code: 'ADMIN_CATEGORY_NAME_REQUIRED' },
            { message: '排序值不合法', status: 400, code: 'ADMIN_CATEGORY_SORT_INVALID' },
            { message: '分类业务域不合法', status: 400, code: 'ADMIN_CATEGORY_BIZ_TYPE_INVALID' },
            {
                message: '父分类业务域不匹配',
                status: 400,
                code: 'ADMIN_CATEGORY_PARENT_BIZ_TYPE_MISMATCH',
            },
            {
                message: '请先启用父分类',
                status: 400,
                code: 'ADMIN_CATEGORY_PARENT_DISABLED',
            },
        ]);
    }
}));
adminRouter.put('/categories/:id/status', asyncHandler(async (request, response) => {
    try {
        ok(response, await updateAdminCategoryStatus(getRouteParam(request.params.id), request.body));
    }
    catch (error) {
        throw toRouteHttpError(error, {
            status: 400,
            code: 'ADMIN_CATEGORY_STATUS_UPDATE_FAILED',
            message: '更新分类状态失败',
        }, [
            { message: '分类不存在', status: 404, code: 'ADMIN_CATEGORY_NOT_FOUND' },
            {
                message: '请先启用父分类',
                status: 400,
                code: 'ADMIN_CATEGORY_PARENT_DISABLED',
            },
        ]);
    }
}));
