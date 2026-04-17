import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { demoOrders } from '../../lib/demo-data';
import { ok } from '../../lib/http';

export const orderRouter: ExpressRouter = Router();

orderRouter.get('/', (_request, response) => {
  ok(response, { items: demoOrders });
});

orderRouter.get('/:id', (request, response) => {
  const order = demoOrders.find((item) => item.id === request.params.id);

  if (!order) {
    response.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  ok(response, order);
});

orderRouter.get('/admin/stats/overview', (_request, response) => {
  ok(response, {
    totalOrders: demoOrders.length,
    paidOrders: demoOrders.filter((item) => item.status === 'paid').length,
  });
});
