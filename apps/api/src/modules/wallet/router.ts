import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { demoLedger, demoUser } from '../../lib/demo-data';
import { ok } from '../../lib/http';

export const walletRouter: ExpressRouter = Router();

walletRouter.get('/ledger', (_request, response) => {
  ok(response, {
    balance: demoUser.coins,
    items: demoLedger,
  });
});
