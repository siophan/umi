import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { requireAdmin, requireAdminRoutePermission } from './auth';
import { registerAdminCommerceRoutes } from './routes/commerce-routes';
import {
  registerAdminPublicAuthRoutes,
  registerAdminSessionRoutes,
} from './routes/auth-routes';
import { registerAdminContentRoutes } from './routes/content-routes';
import { registerAdminSystemRoutes } from './routes/system-routes';
import { registerAdminUploadRoutes } from './routes/upload-routes';

export const adminRouter: ExpressRouter = Router();

registerAdminPublicAuthRoutes(adminRouter);

adminRouter.use(requireAdmin);
registerAdminSessionRoutes(adminRouter);
registerAdminUploadRoutes(adminRouter);

adminRouter.use(requireAdminRoutePermission);
registerAdminContentRoutes(adminRouter);
registerAdminCommerceRoutes(adminRouter);
registerAdminSystemRoutes(adminRouter);
