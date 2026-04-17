import express from 'express';
import type { Express } from 'express';

import { registerHealthRoutes } from './routes/health';
import { adminRouter } from './modules/admin/router';
import { authRouter } from './modules/auth/router';
import { guessRouter } from './modules/guess/router';
import { orderRouter } from './modules/order/router';
import { walletRouter } from './modules/wallet/router';
import { warehouseRouter } from './modules/warehouse/router';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  registerHealthRoutes(app);
  app.use('/api/auth', authRouter);
  app.use('/api/guesses', guessRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/warehouse', warehouseRouter);
  app.use('/api/admin', adminRouter);

  return app;
}
