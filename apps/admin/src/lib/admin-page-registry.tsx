import type { ComponentType, ReactNode } from 'react';

import { BrandLibraryPage } from '../pages/brand-library-page';
import { BrandsPage } from '../pages/brands-page';
import { CategoriesPage } from '../pages/categories-page';
import { CommunityCommentsPage } from '../pages/community-comments-page';
import { CommunityPostsPage } from '../pages/community-posts-page';
import { CommunityReportsPage } from '../pages/community-reports-page';
import { DashboardPage } from '../pages/dashboard-page';
import { EquityPage } from '../pages/equity-page';
import { FriendGuessesPage } from '../pages/friend-guesses-page';
import { GuessCreatePage } from '../pages/guess-create-page';
import { GuessDetailPage } from '../pages/guess-detail-page';
import { GuessesPage } from '../pages/guesses-page';
import { LiveListPage } from '../pages/live-list-page';
import { MarketingBannersPage } from '../pages/marketing-banners-page';
import { MarketingCheckinPage } from '../pages/marketing-checkin-page';
import { MarketingCouponsPage } from '../pages/marketing-coupons-page';
import { MarketingInvitePage } from '../pages/marketing-invite-page';
import { OrderLogisticsDetailPage } from '../pages/order-logistics-detail-page';
import { OrderDetailPage } from '../pages/order-detail-page';
import { OrderLogisticsPage } from '../pages/order-logistics-page';
import { OrdersPage } from '../pages/orders-page';
import { OrderTransactionsPage } from '../pages/order-transactions-page';
import { PermissionsPage } from '../pages/permissions-page';
import { RolesPage } from '../pages/roles-page';
import { ShopAppliesPage } from '../pages/shop-applies-page';
import { ShopBrandAuthAppliesPage } from '../pages/shop-brand-auth-applies-page';
import { ShopProductsPage } from '../pages/shop-products-page';
import { ShopsPage } from '../pages/shops-page';
import { SystemChatsPage } from '../pages/system-chats-page';
import { SystemChatDetailPage } from '../pages/system-chat-detail-page';
import { SystemNotificationsPage } from '../pages/system-notifications-page';
import { SystemRankingsPage } from '../pages/system-rankings-page';
import { SystemSettingsPage } from '../pages/system-settings-page';
import { SystemUsersPage } from '../pages/system-users-page';
import { UsersPage } from '../pages/users-page';
import { WarehouseConsignDetailPage } from '../pages/warehouse-consign-detail-page';
import { WarehouseConsignPage } from '../pages/warehouse-consign-page';
import { WarehouseItemDetailPage } from '../pages/warehouse-item-detail-page';
import { WarehousePage } from '../pages/warehouse-page';

type AdminPageProps = { refreshToken?: number };

const PAGE_COMPONENTS: Record<string, ComponentType<AdminPageProps>> = {
  '/brands/list': BrandsPage,
  '/community/comments': CommunityCommentsPage,
  '/community/posts': CommunityPostsPage,
  '/community/reports': CommunityReportsPage,
  '/dashboard': DashboardPage,
  '/equity': EquityPage,
  '/guesses/create': GuessCreatePage,
  '/guesses/friends': FriendGuessesPage,
  '/guesses/list': GuessesPage,
  '/live/list': LiveListPage,
  '/marketing/banners': MarketingBannersPage,
  '/marketing/checkin': MarketingCheckinPage,
  '/marketing/coupons': MarketingCouponsPage,
  '/marketing/invite': MarketingInvitePage,
  '/orders/list': OrdersPage,
  '/orders/logistics': OrderLogisticsPage,
  '/orders/transactions': OrderTransactionsPage,
  '/products/brands': BrandLibraryPage,
  '/shops/apply': ShopAppliesPage,
  '/shops/brand-auth': ShopBrandAuthAppliesPage,
  '/shops/list': ShopsPage,
  '/shops/products': ShopProductsPage,
  '/system/categories': CategoriesPage,
  '/system/chats': SystemChatsPage,
  '/system/notifications': SystemNotificationsPage,
  '/system/roles': RolesPage,
  '/system/rankings': SystemRankingsPage,
  '/system/settings': SystemSettingsPage,
  '/system/users': SystemUsersPage,
  '/users/permissions': PermissionsPage,
  '/users/list': UsersPage,
  '/warehouse/consign': WarehouseConsignPage,
};

export function renderAdminPage(path: string, refreshToken?: number): ReactNode | null {
  const ActivePage = PAGE_COMPONENTS[path];
  if (ActivePage) {
    return <ActivePage refreshToken={refreshToken} />;
  }

  if (path.startsWith('/orders/detail/')) {
    const orderId = path.slice('/orders/detail/'.length).trim();
    return orderId ? <OrderDetailPage orderId={orderId} refreshToken={refreshToken} /> : null;
  }

  if (path.startsWith('/orders/logistics/detail/')) {
    const logisticsId = path.slice('/orders/logistics/detail/'.length).trim();
    return logisticsId ? (
      <OrderLogisticsDetailPage logisticsId={logisticsId} refreshToken={refreshToken} />
    ) : null;
  }

  if (path.startsWith('/guesses/detail/')) {
    const guessId = path.slice('/guesses/detail/'.length).trim();
    return guessId ? <GuessDetailPage guessId={guessId} refreshToken={refreshToken} /> : null;
  }

  if (path.startsWith('/warehouse/virtual/detail/')) {
    const itemId = path.slice('/warehouse/virtual/detail/'.length).trim();
    return itemId ? (
      <WarehouseItemDetailPage itemId={itemId} refreshToken={refreshToken} warehouseType="virtual" />
    ) : null;
  }

  if (path.startsWith('/warehouse/physical/detail/')) {
    const itemId = path.slice('/warehouse/physical/detail/'.length).trim();
    return itemId ? (
      <WarehouseItemDetailPage itemId={itemId} refreshToken={refreshToken} warehouseType="physical" />
    ) : null;
  }

  if (path.startsWith('/warehouse/consign/detail/')) {
    const consignId = path.slice('/warehouse/consign/detail/'.length).trim();
    return consignId ? (
      <WarehouseConsignDetailPage consignId={consignId} refreshToken={refreshToken} />
    ) : null;
  }

  if (path.startsWith('/system/chats/detail/')) {
    const conversationId = path.slice('/system/chats/detail/'.length).trim();
    return conversationId ? (
      <SystemChatDetailPage conversationId={conversationId} refreshToken={refreshToken} />
    ) : null;
  }

  if (path === '/warehouse/virtual' || path === '/warehouse/physical') {
    return (
      <WarehousePage
        refreshToken={refreshToken}
        warehouseType={path === '/warehouse/virtual' ? 'virtual' : 'physical'}
      />
    );
  }

  return null;
}
