import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { demoAdmin, demoGuesses, demoOrders, demoUser } from '../../lib/demo-data';
import { ok } from '../../lib/http';

export const adminRouter: ExpressRouter = Router();

adminRouter.get('/dashboard/stats', (_request, response) => {
  ok(response, {
    users: 1,
    activeGuesses: demoGuesses.length,
    orders: demoOrders.length,
  });
});

adminRouter.get('/users', (_request, response) => {
  ok(response, { items: [demoUser, demoAdmin] });
});

adminRouter.get('/guesses', (_request, response) => {
  ok(response, { items: demoGuesses });
});

adminRouter.get('/orders', (_request, response) => {
  ok(response, { items: demoOrders });
});
