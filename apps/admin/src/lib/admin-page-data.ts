import type {
  GuessSummary,
  OrderSummary,
  UserSummary,
  WarehouseItem,
} from '@joy/shared';

import {
  type AdminDashboardStats,
  type AdminBrandApplyItem,
  type AdminBrandAuthApplyItem,
  type AdminBrandAuthRecordItem,
  type AdminBrandItem,
  type AdminBrandLibraryItem,
  type AdminCategoryItem,
  type AdminChatItem,
  type AdminConsignRow,
  type AdminFriendGuessItem,
  type AdminLogisticsRow,
  type AdminNotificationItem,
  type AdminPermissionMatrixData,
  type AdminPkMatchItem,
  type AdminProduct,
  type AdminProductAuthItem,
  type AdminProductAuthRecordItem,
  type AdminRoleListItem,
  type AdminShopApplyItem,
  type AdminShopItem,
  type AdminShopProductItem,
  type AdminSystemUserItem,
  type AdminTransactionRow,
  type AdminWarehouseStats,
} from './admin-data';
import {
  ApiRequestError,
  fetchAdminBrandApplies,
  fetchAdminBrandAuthApplies,
  fetchAdminBrandAuthRecords,
  fetchAdminBrandLibrary,
  fetchAdminBrands,
  fetchAdminCategories,
  fetchAdminChats,
  fetchAdminConsignRows,
  fetchAdminDashboard,
  fetchAdminFriendGuesses,
  fetchAdminGuesses,
  fetchAdminLogistics,
  fetchAdminNotifications,
  fetchAdminOrders,
  fetchAdminPermissionsMatrix,
  fetchAdminPkMatches,
  fetchAdminProductAuthRecords,
  fetchAdminProductAuthRows,
  fetchAdminProducts,
  fetchAdminRoles,
  fetchAdminShopApplies,
  fetchAdminShopProducts,
  fetchAdminShops,
  fetchAdminSystemUsers,
  fetchAdminTransactions,
  fetchAdminUsers,
  fetchAdminWarehouseItems,
  fetchWarehouseStats,
} from './api';

export interface AdminPageData {
  dashboard: AdminDashboardStats;
  dashboardIssue: string | null;
  usersIssue: string | null;
  users: UserSummary[];
  products: AdminProduct[];
  brandLibrary: AdminBrandLibraryItem[];
  guesses: GuessSummary[];
  friendGuesses: AdminFriendGuessItem[];
  pkMatches: AdminPkMatchItem[];
  orders: OrderSummary[];
  transactions: AdminTransactionRow[];
  logistics: AdminLogisticsRow[];
  consignRows: AdminConsignRow[];
  warehouseStats: AdminWarehouseStats;
  warehouseItems: WarehouseItem[];
  shops: AdminShopItem[];
  shopApplies: AdminShopApplyItem[];
  brands: AdminBrandItem[];
  brandApplies: AdminBrandApplyItem[];
  brandAuthApplies: AdminBrandAuthApplyItem[];
  brandAuthRecords: AdminBrandAuthRecordItem[];
  shopProducts: AdminShopProductItem[];
  productAuthRows: AdminProductAuthItem[];
  productAuthRecords: AdminProductAuthRecordItem[];
  notifications: AdminNotificationItem[];
  chats: AdminChatItem[];
  systemUsers: AdminSystemUserItem[];
  roles: AdminRoleListItem[];
  permissionsMatrix: AdminPermissionMatrixData | null;
  categories: AdminCategoryItem[];
  issues: string[];
  lastUpdatedAt: string;
}

const emptyDashboardStats: AdminDashboardStats = {
  generatedAt: '',
  users: 0,
  products: 0,
  activeGuesses: 0,
  orders: 0,
  todayUsers: 0,
  todayBets: 0,
  todayOrders: 0,
  todayGmv: 0,
  trend: [],
  orderDistribution: [],
  guessCategories: [],
  hotGuesses: [],
  hotProducts: [],
  pendingQueues: [],
};

const emptyWarehouseStats: AdminWarehouseStats = {
  totalVirtual: 0,
  totalPhysical: 0,
};

export const emptyAdminPageData: AdminPageData = {
  dashboard: emptyDashboardStats,
  dashboardIssue: null,
  usersIssue: null,
  users: [],
  products: [],
  brandLibrary: [],
  guesses: [],
  friendGuesses: [],
  pkMatches: [],
  orders: [],
  transactions: [],
  logistics: [],
  consignRows: [],
  warehouseStats: emptyWarehouseStats,
  warehouseItems: [],
  shops: [],
  shopApplies: [],
  brands: [],
  brandApplies: [],
  brandAuthApplies: [],
  brandAuthRecords: [],
  shopProducts: [],
  productAuthRows: [],
  productAuthRecords: [],
  notifications: [],
  chats: [],
  systemUsers: [],
  roles: [],
  permissionsMatrix: null,
  categories: [],
  issues: [],
  lastUpdatedAt: new Date(0).toISOString(),
};

function withBaseTimestamp() {
  return {
    ...emptyAdminPageData,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function normalizeIssue(scope: string, reason: unknown) {
  if (reason instanceof ApiRequestError) {
    return `${scope}: ${reason.message}（HTTP ${reason.status}）`;
  }

  if (reason instanceof Error) {
    return `${scope}: ${reason.message}`;
  }

  return `${scope}: 请求失败`;
}

function fromSettled<T>(
  scope: string,
  result: PromiseSettledResult<T>,
  emptyValue: T,
) {
  if (result.status === 'fulfilled') {
    return { value: result.value, issue: null };
  }

  return {
    value: emptyValue,
    issue: normalizeIssue(scope, result.reason),
  };
}

export async function loadAdminPageData(path: string): Promise<AdminPageData> {
  const base = withBaseTimestamp();

  if (path === '/dashboard') {
    const dashboard = fromSettled('仪表盘', await Promise.allSettled([fetchAdminDashboard()]).then(([result]) => result), emptyDashboardStats);
    return {
      ...base,
      dashboard: dashboard.value,
      dashboardIssue: dashboard.issue,
      issues: dashboard.issue ? [dashboard.issue] : [],
      lastUpdatedAt: dashboard.value.generatedAt || base.lastUpdatedAt,
    };
  }

  if (path === '/users/list') {
    return base;
  }

  if (path === '/products/list') {
    const [productsResult, categoriesResult] = await Promise.allSettled([
      fetchAdminProducts({ page: 1, pageSize: 100 }).then((result) => result.items),
      fetchAdminCategories().then((result) => result.items),
    ]);
    const products = fromSettled('商品列表', productsResult, []);
    const categories = fromSettled('分类管理', categoriesResult, []);
    const issues = [products.issue, categories.issue].filter((issue): issue is string => Boolean(issue));
    return {
      ...base,
      products: products.value,
      categories: categories.value,
      issues,
    };
  }

  if (path === '/guesses/list') {
    const [guessesResult, categoriesResult] = await Promise.allSettled([
      fetchAdminGuesses().then((result) => result.items),
      fetchAdminCategories().then((result) => result.items),
    ]);
    const guesses = fromSettled('竞猜列表', guessesResult, []);
    const categories = fromSettled('分类管理', categoriesResult, []);
    const issues = [guesses.issue, categories.issue].filter((issue): issue is string => Boolean(issue));
    return {
      ...base,
      guesses: guesses.value,
      categories: categories.value,
      issues,
    };
  }

  if (path === '/orders/list') {
    const orders = fromSettled('订单列表', await Promise.allSettled([fetchAdminOrders().then((result) => result.items)]).then(([result]) => result), []);
    return {
      ...base,
      orders: orders.value,
      issues: orders.issue ? [orders.issue] : [],
    };
  }

  if (path === '/warehouse/virtual' || path === '/warehouse/physical') {
    const type = path === '/warehouse/virtual' ? 'virtual' : 'physical';
    const [warehouseStatsResult, warehouseItemsResult] = await Promise.allSettled([
      fetchWarehouseStats(),
      fetchAdminWarehouseItems(type).then((result) => result.items),
    ]);
    const warehouseStats = fromSettled('仓库统计', warehouseStatsResult, emptyWarehouseStats);
    const warehouseItems = fromSettled(type === 'virtual' ? '虚拟仓列表' : '实体仓列表', warehouseItemsResult, []);
    const issues = [warehouseStats.issue, warehouseItems.issue].filter((issue): issue is string => Boolean(issue));
    return {
      ...base,
      warehouseStats: warehouseStats.value,
      warehouseItems: warehouseItems.value,
      issues,
    };
  }

  if (path === '/products/brands') {
    const brandLibrary = fromSettled('品牌商品库', await Promise.allSettled([fetchAdminBrandLibrary({ page: 1, pageSize: 100 }).then((result) => result.items)]).then(([result]) => result), []);
    return {
      ...base,
      brandLibrary: brandLibrary.value,
      issues: brandLibrary.issue ? [brandLibrary.issue] : [],
    };
  }

  if (path === '/guesses/friends') {
    const friendGuesses = fromSettled('好友竞猜', await Promise.allSettled([fetchAdminFriendGuesses().then((result) => result.items)]).then(([result]) => result), []);
    return {
      ...base,
      friendGuesses: friendGuesses.value,
      issues: friendGuesses.issue ? [friendGuesses.issue] : [],
    };
  }

  if (path === '/pk') {
    const pkMatches = fromSettled('PK 对战', await Promise.allSettled([fetchAdminPkMatches().then((result) => result.items)]).then(([result]) => result), []);
    return {
      ...base,
      pkMatches: pkMatches.value,
      issues: pkMatches.issue ? [pkMatches.issue] : [],
    };
  }

  if (path === '/guesses/create') {
    const [guessesResult, productsResult, categoriesResult, friendGuessesResult] = await Promise.allSettled([
      fetchAdminGuesses().then((result) => result.items),
      fetchAdminProducts({ page: 1, pageSize: 100 }).then((result) => result.items),
      fetchAdminCategories().then((result) => result.items),
      fetchAdminFriendGuesses().then((result) => result.items),
    ]);
    const guesses = fromSettled('竞猜列表', guessesResult, []);
    const products = fromSettled('商品列表', productsResult, []);
    const categories = fromSettled('分类管理', categoriesResult, []);
    const friendGuesses = fromSettled('好友竞猜', friendGuessesResult, []);
    const issues = [guesses.issue, products.issue, categories.issue, friendGuesses.issue].filter((issue): issue is string => Boolean(issue));
    return {
      ...base,
      guesses: guesses.value,
      products: products.value,
      categories: categories.value,
      friendGuesses: friendGuesses.value,
      issues,
    };
  }

  if (path === '/orders/transactions') {
    const transactions = fromSettled('交易流水', await Promise.allSettled([fetchAdminTransactions().then((result) => result.items)]).then(([result]) => result), []);
    return {
      ...base,
      transactions: transactions.value,
      issues: transactions.issue ? [transactions.issue] : [],
    };
  }

  if (path === '/orders/logistics') {
    const logistics = fromSettled('物流管理', await Promise.allSettled([fetchAdminLogistics().then((result) => result.items)]).then(([result]) => result), []);
    return {
      ...base,
      logistics: logistics.value,
      issues: logistics.issue ? [logistics.issue] : [],
    };
  }

  if (path === '/warehouse/consign') {
    const consignRows = fromSettled('寄售市场', await Promise.allSettled([fetchAdminConsignRows().then((result) => result.items)]).then(([result]) => result), []);
    return {
      ...base,
      consignRows: consignRows.value,
      issues: consignRows.issue ? [consignRows.issue] : [],
    };
  }

  if (path === '/shops/list') {
    const [shopsResult, categoriesResult] = await Promise.allSettled([
      fetchAdminShops().then((result) => result.items),
      fetchAdminCategories().then((result) => result.items),
    ]);
    const shops = fromSettled('店铺列表', shopsResult, []);
    const categories = fromSettled('分类管理', categoriesResult, []);
    const issues = [shops.issue, categories.issue].filter((issue): issue is string => Boolean(issue));
    return { ...base, shops: shops.value, categories: categories.value, issues };
  }
  if (path === '/shops/apply') {
    const [shopAppliesResult, categoriesResult] = await Promise.allSettled([
      fetchAdminShopApplies().then((result) => result.items),
      fetchAdminCategories().then((result) => result.items),
    ]);
    const shopApplies = fromSettled('开店审核', shopAppliesResult, []);
    const categories = fromSettled('分类管理', categoriesResult, []);
    const issues = [shopApplies.issue, categories.issue].filter((issue): issue is string => Boolean(issue));
    return { ...base, shopApplies: shopApplies.value, categories: categories.value, issues };
  }
  if (path === '/brands/list') {
    const [brandsResult, categoriesResult] = await Promise.allSettled([
      fetchAdminBrands().then((result) => result.items),
      fetchAdminCategories().then((result) => result.items),
    ]);
    const brands = fromSettled('品牌方列表', brandsResult, []);
    const categories = fromSettled('分类管理', categoriesResult, []);
    const issues = [brands.issue, categories.issue].filter((issue): issue is string => Boolean(issue));
    return { ...base, brands: brands.value, categories: categories.value, issues };
  }
  if (path === '/brands/apply') {
    const [brandAppliesResult, categoriesResult] = await Promise.allSettled([
      fetchAdminBrandApplies().then((result) => result.items),
      fetchAdminCategories().then((result) => result.items),
    ]);
    const brandApplies = fromSettled('品牌入驻审核', brandAppliesResult, []);
    const categories = fromSettled('分类管理', categoriesResult, []);
    const issues = [brandApplies.issue, categories.issue].filter((issue): issue is string => Boolean(issue));
    return { ...base, brandApplies: brandApplies.value, categories: categories.value, issues };
  }
  if (path === '/shops/brand-auth') {
    const brandAuthApplies = fromSettled('品牌授权审核', await Promise.allSettled([fetchAdminBrandAuthApplies().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, brandAuthApplies: brandAuthApplies.value, issues: brandAuthApplies.issue ? [brandAuthApplies.issue] : [] };
  }
  if (path === '/shops/brand-auth/records') {
    const brandAuthRecords = fromSettled('品牌授权记录', await Promise.allSettled([fetchAdminBrandAuthRecords().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, brandAuthRecords: brandAuthRecords.value, issues: brandAuthRecords.issue ? [brandAuthRecords.issue] : [] };
  }
  if (path === '/shops/products') {
    const shopProducts = fromSettled('店铺授权商品', await Promise.allSettled([fetchAdminShopProducts().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, shopProducts: shopProducts.value, issues: shopProducts.issue ? [shopProducts.issue] : [] };
  }
  if (path === '/product-auth/list') {
    const productAuthRows = fromSettled('商品授权', await Promise.allSettled([fetchAdminProductAuthRows().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, productAuthRows: productAuthRows.value, issues: productAuthRows.issue ? [productAuthRows.issue] : [] };
  }
  if (path === '/product-auth/records') {
    const productAuthRecords = fromSettled('商品授权记录', await Promise.allSettled([fetchAdminProductAuthRecords().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, productAuthRecords: productAuthRecords.value, issues: productAuthRecords.issue ? [productAuthRecords.issue] : [] };
  }

  if (path === '/equity') {
    const users = fromSettled('用户列表', await Promise.allSettled([fetchAdminUsers().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, users: users.value, issues: users.issue ? [users.issue] : [] };
  }

  if (path === '/system/chats') {
    const chats = fromSettled('聊天管理', await Promise.allSettled([fetchAdminChats().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, chats: chats.value, issues: chats.issue ? [chats.issue] : [] };
  }
  if (path === '/system/users') {
    const systemUsers = fromSettled('系统用户', await Promise.allSettled([fetchAdminSystemUsers().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, systemUsers: systemUsers.value, issues: systemUsers.issue ? [systemUsers.issue] : [] };
  }
  if (path === '/system/roles') {
    const roles = fromSettled('角色管理', await Promise.allSettled([fetchAdminRoles().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, roles: roles.value, issues: roles.issue ? [roles.issue] : [] };
  }
  if (path === '/users/permissions') {
    const permissionsMatrix = fromSettled('权限矩阵', await Promise.allSettled([fetchAdminPermissionsMatrix()]).then(([result]) => result), null);
    return { ...base, permissionsMatrix: permissionsMatrix.value, issues: permissionsMatrix.issue ? [permissionsMatrix.issue] : [] };
  }
  if (path === '/system/categories') {
    const categories = fromSettled('分类管理', await Promise.allSettled([fetchAdminCategories().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, categories: categories.value, issues: categories.issue ? [categories.issue] : [] };
  }
  if (path === '/system/notifications') {
    const notifications = fromSettled('通知管理', await Promise.allSettled([fetchAdminNotifications().then((result) => result.items)]).then(([result]) => result), []);
    return { ...base, notifications: notifications.value, issues: notifications.issue ? [notifications.issue] : [] };
  }

  return base;
}
