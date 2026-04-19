import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';

import { env } from './env';
import { appLogger, httpLogger } from './lib/logger';
import { registerHealthRoutes } from './routes/health';
import { registerOpenApiRoutes } from './routes/openapi';
import { adminRouter } from './modules/admin/router';
import { authRouter } from './modules/auth/router';
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
  app.use('/api/guesses', guessRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/products', productRouter);
  app.use('/api/shops', shopRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/warehouse', warehouseRouter);
  app.use('/api/admin', adminRouter);

  app.use((request, response) => {
    const logger =
      (request as Request & { log?: typeof appLogger }).log ?? appLogger;
    logger.warn({ route: request.originalUrl }, 'Route not found');
    response.status(404).json({
      success: false,
      message: 'Route not found',
    });
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
      logger.error(
        { err: error, route: request.originalUrl },
        'Unhandled application error',
      );
      response.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    },
  );

  return app;
}
