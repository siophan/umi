import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { demoWarehouse } from '../../lib/demo-data';
import { ok } from '../../lib/http';

export const warehouseRouter: ExpressRouter = Router();

warehouseRouter.get('/virtual', (_request, response) => {
  ok(response, {
    items: demoWarehouse.filter((item) => item.warehouseType === 'virtual'),
  });
});

warehouseRouter.get('/physical', (_request, response) => {
  ok(response, {
    items: demoWarehouse.filter((item) => item.warehouseType === 'physical'),
  });
});

warehouseRouter.get('/admin/stats', (_request, response) => {
  ok(response, {
    totalVirtual: demoWarehouse.filter((item) => item.warehouseType === 'virtual')
      .length,
    totalPhysical: demoWarehouse.filter(
      (item) => item.warehouseType === 'physical',
    ).length,
  });
});
