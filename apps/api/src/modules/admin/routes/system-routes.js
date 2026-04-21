import { registerAdminRbacRoutes } from './rbac-routes';
import { registerAdminSystemOpsRoutes } from './system-ops-routes';
import { registerAdminSystemUserRoutes } from './system-user-routes';
export function registerAdminSystemRoutes(adminRouter) {
    registerAdminSystemUserRoutes(adminRouter);
    registerAdminRbacRoutes(adminRouter);
    registerAdminSystemOpsRoutes(adminRouter);
}
