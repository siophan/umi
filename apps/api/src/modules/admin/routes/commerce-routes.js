import { registerAdminCatalogRoutes } from './catalog-routes';
import { registerAdminMarketingRoutes } from './marketing-routes';
import { registerAdminMerchantRoutes } from './merchant-routes';
import { registerAdminOrderRoutes } from './order-routes';
export function registerAdminCommerceRoutes(adminRouter) {
    registerAdminOrderRoutes(adminRouter);
    registerAdminMarketingRoutes(adminRouter);
    registerAdminCatalogRoutes(adminRouter);
    registerAdminMerchantRoutes(adminRouter);
}
