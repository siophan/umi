import type { Router as ExpressRouter } from 'express';

import { registerAdminRbacRoutes } from './rbac-routes';
import { registerAdminSystemOpsRoutes } from './system-ops-routes';
import { registerAdminSystemUserRoutes } from './system-user-routes';

export function registerAdminSystemRoutes(adminRouter: ExpressRouter) {
  registerAdminSystemUserRoutes(adminRouter);
  registerAdminRbacRoutes(adminRouter);
  registerAdminSystemOpsRoutes(adminRouter);
}
