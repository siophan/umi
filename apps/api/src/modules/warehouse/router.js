import { Router } from 'express';
import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
import { requireAdmin } from '../admin/auth';
import { getAdminPhysicalWarehouseItemDetail, getAdminPhysicalWarehouseItems, getAdminVirtualWarehouseItemDetail, getAdminVirtualWarehouseItems, getAdminWarehouseStats, } from './warehouse-admin';
import { cancelPhysicalWarehouseConsign, consignPhysicalWarehouseItem } from './warehouse-consign';
import { getUserPhysicalWarehouseItems, getUserVirtualWarehouseItems } from './warehouse-user';
export const warehouseRouter = Router();
warehouseRouter.get('/virtual', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, { items: await getUserVirtualWarehouseItems(user.id) });
}));
warehouseRouter.get('/physical', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, { items: await getUserPhysicalWarehouseItems(user.id) });
}));
warehouseRouter.post('/physical/:id/consign', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const body = request.body;
    ok(response, await consignPhysicalWarehouseItem(user.id, String(request.params.id), body.price));
}));
warehouseRouter.post('/physical/:id/cancel-consign', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await cancelPhysicalWarehouseConsign(user.id, String(request.params.id)));
}));
warehouseRouter.get('/admin/stats', requireAdmin, asyncHandler(async (_request, response) => {
    ok(response, await getAdminWarehouseStats());
}));
warehouseRouter.get('/admin/virtual', requireAdmin, asyncHandler(async (_request, response) => {
    ok(response, { items: await getAdminVirtualWarehouseItems() });
}));
warehouseRouter.get('/admin/virtual/:id', requireAdmin, asyncHandler(async (request, response) => {
    ok(response, await getAdminVirtualWarehouseItemDetail(String(request.params.id)));
}));
warehouseRouter.get('/admin/physical', requireAdmin, asyncHandler(async (_request, response) => {
    ok(response, { items: await getAdminPhysicalWarehouseItems() });
}));
warehouseRouter.get('/admin/physical/:id', requireAdmin, asyncHandler(async (request, response) => {
    ok(response, await getAdminPhysicalWarehouseItemDetail(String(request.params.id)));
}));
