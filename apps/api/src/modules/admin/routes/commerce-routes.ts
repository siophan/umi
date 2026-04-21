import type { Router as ExpressRouter } from 'express';

import { registerAdminCatalogRoutes } from './catalog-routes';
import { registerAdminMarketingRoutes } from './marketing-routes';
import { registerAdminMerchantRoutes } from './merchant-routes';
import { registerAdminOrderRoutes } from './order-routes';

export function registerAdminCommerceRoutes(adminRouter: ExpressRouter) {
  registerAdminOrderRoutes(adminRouter);
  registerAdminMarketingRoutes(adminRouter);
  registerAdminCatalogRoutes(adminRouter);
  registerAdminMerchantRoutes(adminRouter);
}
