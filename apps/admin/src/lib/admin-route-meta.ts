export const DASHBOARD_PATH = '/dashboard';

export const PATH_ALIASES: Record<string, string> = {
  '/users': '/users/list',
  '/guesses': '/guesses/list',
  '/orders': '/orders/list',
  '/shops': '/shops/list',
  '/shops/brand-auth/records': '/shops/brand-auth',
  '/brands': '/brands/list',
  '/warehouse': '/warehouse/virtual',
  '/community': '/community/posts',
  '/live': '/live/list',
};

export const ADMIN_DETAIL_ROUTE_META = [
  {
    prefix: '/orders/detail/',
    selectedPath: '/orders/list',
    accessPath: '/orders/list',
    name: '订单详情',
    parentName: '订单管理',
  },
  {
    prefix: '/orders/logistics/detail/',
    selectedPath: '/orders/list',
    accessPath: '/orders/logistics',
    name: '物流详情',
    parentName: '订单管理',
  },
  {
    prefix: '/guesses/detail/',
    selectedPath: '/guesses/list',
    accessPath: '/guesses/list',
    name: '竞猜详情',
    parentName: '竞猜管理',
  },
  {
    prefix: '/warehouse/virtual/detail/',
    selectedPath: '/warehouse/virtual',
    accessPath: '/warehouse/virtual',
    name: '虚拟仓详情',
    parentName: '履约管理',
  },
  {
    prefix: '/warehouse/physical/detail/',
    selectedPath: '/warehouse/physical',
    accessPath: '/warehouse/physical',
    name: '实体仓详情',
    parentName: '履约管理',
  },
  {
    prefix: '/warehouse/consign/detail/',
    selectedPath: '/warehouse/consign',
    accessPath: '/warehouse/consign',
    name: '寄售详情',
    parentName: '履约管理',
  },
  {
    prefix: '/system/chats/detail/',
    selectedPath: '/system/chats',
    accessPath: '/system/chats',
    name: '聊天详情',
    parentName: '内容管理',
  },
] as const;

export const ADMIN_HIDDEN_PAGE_META = [
  {
    path: '/orders/logistics',
    selectedPath: '/orders/list',
    accessPath: '/orders/logistics',
    name: '物流管理',
    parentName: '订单管理',
  },
] as const;

export type AdminPageMeta = {
  path: string;
  name: string;
  parentName?: string;
};

export function findAdminDetailRoute(path: string) {
  return ADMIN_DETAIL_ROUTE_META.find(
    (item) => path.startsWith(item.prefix) && path.length > item.prefix.length,
  );
}

export function resolveAdminSelectedPath(path: string) {
  const detailRoute = findAdminDetailRoute(path);
  if (detailRoute) {
    return detailRoute.selectedPath;
  }

  return ADMIN_HIDDEN_PAGE_META.find((item) => item.path === path)?.selectedPath ?? path;
}

export function resolveAdminAccessPath(path: string) {
  const detailRoute = findAdminDetailRoute(path);
  if (detailRoute) {
    return detailRoute.accessPath;
  }

  return ADMIN_HIDDEN_PAGE_META.find((item) => item.path === path)?.accessPath ?? path;
}

export function normalizeAdminPath(hash: string) {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw || raw === '/') {
    return DASHBOARD_PATH;
  }

  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return PATH_ALIASES[normalized] ?? normalized;
}
