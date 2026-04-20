import { Router } from 'express';
import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler, withErrorBoundary } from '../../lib/errors';
import { ok } from '../../lib/http';
import { createAddress, deleteAddress, listAddresses, updateAddress, } from './store';
export const addressRouter = Router();
addressRouter.get('/', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const result = await listAddresses(user.id);
    ok(response, result.items);
}));
addressRouter.post('/', requireUser, withErrorBoundary({
    status: 400,
    code: 'ADDRESS_CREATE_FAILED',
    message: '新增地址失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await createAddress(user.id, request.body));
}));
addressRouter.put('/:id', requireUser, withErrorBoundary({
    status: 400,
    code: 'ADDRESS_UPDATE_FAILED',
    message: '更新地址失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await updateAddress(user.id, String(request.params.id), request.body));
}));
addressRouter.delete('/:id', requireUser, withErrorBoundary({
    status: 400,
    code: 'ADDRESS_DELETE_FAILED',
    message: '删除地址失败',
}, async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await deleteAddress(user.id, String(request.params.id)));
}));
