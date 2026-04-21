import { asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import { createAdminPermission, createAdminRole, getAdminPermissions, getAdminPermissionsMatrix, getAdminRoles, updateAdminPermission, updateAdminPermissionStatus, updateAdminRole, updateAdminRolePermissions, updateAdminRoleStatus, } from '../system';
import { getRouteParam, toRouteHttpError } from '../route-helpers';
export function registerAdminRbacRoutes(adminRouter) {
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
}
