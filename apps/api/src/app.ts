import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';

import { env } from './env';
import { HttpError, sendError } from './lib/errors';
import { appLogger, httpLogger } from './lib/logger';
import { registerHealthRoutes } from './routes/health';
import { registerOpenApiRoutes } from './routes/openapi';
import { adminRouter } from './modules/admin/router';
import { addressRouter } from './modules/address/router';
import { authRouter } from './modules/auth/router';
import { bannerRouter } from './modules/banner/router';
import { cartRouter } from './modules/cart/router';
import { chatRouter } from './modules/chat/router';
import { communityRouter } from './modules/community/router';
import { couponRouter } from './modules/coupon/router';
import { liveRouter } from './modules/live/router';
import { notificationRouter } from './modules/notifications/router';
import { rankingRouter } from './modules/ranking/router';
import { searchRouter } from './modules/search/router';
import { userRouter } from './modules/users/router';
import { socialRouter } from './modules/social/router';
import { guessRouter } from './modules/guess/router';
import { orderRouter } from './modules/order/router';
import { productRouter } from './modules/product/router';
import { shopRouter } from './modules/shop/router';
import { walletRouter } from './modules/wallet/router';
import { warehouseRouter } from './modules/warehouse/router';

export function createApp(): Express {
  const app = express();

  app.use(httpLogger);

  app.use((request, response, next) => {
    const origin = request.headers.origin;

    if (origin && env.corsOrigins.includes(origin)) {
      response.header('Access-Control-Allow-Origin', origin);
      response.header('Vary', 'Origin');
    }

    response.header(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    response.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );

    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json());

  registerHealthRoutes(app);
  registerOpenApiRoutes(app);
  app.use('/api/auth', authRouter);
  app.use('/api/banners', bannerRouter);
  app.use('/api/rankings', rankingRouter);
  app.use('/api/lives', liveRouter);
  app.use('/api/users', userRouter);
  app.use('/api/social', socialRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/community', communityRouter);
  app.use('/api/chats', chatRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/addresses', addressRouter);
  app.use('/api/coupons', couponRouter);
  app.use('/api/guesses', guessRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/products', productRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/shops', shopRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/warehouse', warehouseRouter);
  app.use('/api/admin', adminRouter);

  app.use((request, response) => {
    const logger =
      (request as Request & { log?: typeof appLogger }).log ?? appLogger;
    logger.warn({ route: request.originalUrl }, 'Route not found');
    sendError(
      response,
      new HttpError(404, 'ROUTE_NOT_FOUND', 'Route not found'),
    );
  });

  app.use(
    (
      error: Error,
      request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      const logger =
        (request as Request & { log?: typeof appLogger }).log ?? appLogger;
      const status =
        error instanceof HttpError ? error.status : 500;
      const log = status >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
      log({ err: error, route: request.originalUrl }, 'Handled application error');
      sendError(response, error);
    },
  );

  return app;
}
