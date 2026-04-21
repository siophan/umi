import { asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import { createAdminCategory, getAdminCategories, updateAdminCategory, updateAdminCategoryStatus, } from '../categories';
import { getAdminChatDetail, getAdminChats, createAdminNotification, getAdminNotifications, } from '../system';
import { getRouteParam, toRouteHttpError } from '../route-helpers';
export function registerAdminSystemOpsRoutes(adminRouter) {
    adminRouter.get('/notifications', asyncHandler(async (request, response) => {
        ok(response, await getAdminNotifications({
            page: Number(request.query.page ?? 1),
            pageSize: Number(request.query.pageSize ?? 10),
            keyword: typeof request.query.keyword === 'string' ? request.query.keyword : undefined,
            type: typeof request.query.type === 'string' ? request.query.type : undefined,
            audience: typeof request.query.audience === 'string'
                ? request.query.audience
                : undefined,
        }));
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
    adminRouter.get('/chats/:id', asyncHandler(async (request, response) => {
        try {
            ok(response, await getAdminChatDetail(getRouteParam(request.params.id)));
        }
        catch (error) {
            throw toRouteHttpError(error, {
                status: 400,
                code: 'ADMIN_CHAT_DETAIL_FETCH_FAILED',
                message: '聊天详情加载失败',
            }, [{ message: '聊天会话不存在', status: 404, code: 'ADMIN_CHAT_NOT_FOUND' }]);
        }
    }));
    adminRouter.get('/categories', asyncHandler(async (_request, response) => {
        ok(response, await getAdminCategories());
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
}
