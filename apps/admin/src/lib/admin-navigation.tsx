import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';
import {
  ADMIN_PERMISSION_DEFINITION_BY_CODE,
  findAdminMenuPermissionByPath,
  type AdminProfile,
} from '@umi/shared';

import {
  AimOutlined,
  BellOutlined,
  CalendarOutlined,
  CarOutlined,
  CommentOutlined,
  CrownOutlined,
  DashboardOutlined,
  FileTextOutlined,
  GiftOutlined,
  InboxOutlined,
  MessageOutlined,
  PictureOutlined,
  SafetyOutlined,
  SettingOutlined,
  ShareAltOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  SwapOutlined,
  TagOutlined,
  TeamOutlined,
  TrademarkOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

export type AdminMenuNode = {
  key: string;
  name: string;
  icon: ReactNode;
  path?: string;
  children?: AdminMenuNode[];
  access?: {
    permissionCodes?: string[];
  };
};

export const DASHBOARD_PATH = '/dashboard';

const PATH_ALIASES: Record<string, string> = {
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

const ADMIN_DETAIL_ROUTE_META = [
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

const ADMIN_HIDDEN_PAGE_META = [
  {
    path: '/orders/logistics',
    selectedPath: '/orders/list',
    accessPath: '/orders/logistics',
    name: '物流管理',
    parentName: '订单管理',
  },
] as const;

function menuAccess(path: string) {
  const definition = findAdminMenuPermissionByPath(path);

  return definition ? { permissionCodes: [definition.code] } : undefined;
}

type AdminPageMeta = {
  path: string;
  name: string;
  parentName?: string;
};

function findAdminDetailRoute(path: string) {
  return ADMIN_DETAIL_ROUTE_META.find(
    (item) => path.startsWith(item.prefix) && path.length > item.prefix.length,
  );
}

export function resolveAdminSelectedPath(path: string) {
  const detailRoute = findAdminDetailRoute(path);
  if (detailRoute) {
    return detailRoute.selectedPath;
  }

  return (
    ADMIN_HIDDEN_PAGE_META.find((item) => item.path === path)?.selectedPath ?? path
  );
}

function resolveAdminAccessPath(path: string) {
  const detailRoute = findAdminDetailRoute(path);
  if (detailRoute) {
    return detailRoute.accessPath;
  }

  return ADMIN_HIDDEN_PAGE_META.find((item) => item.path === path)?.accessPath ?? path;
}

const adminMenuTree: AdminMenuNode[] = [
  {
    key: '/dashboard',
    path: '/dashboard',
    icon: <DashboardOutlined />,
    name: '仪表盘',
    access: menuAccess('/dashboard'),
  },
  {
    key: 'user-management-group',
    icon: <UserOutlined />,
    name: '用户管理',
    children: [
      {
        key: '/users/list',
        path: '/users/list',
        icon: <TeamOutlined />,
        name: '用户列表',
        access: menuAccess('/users/list'),
      },
      {
        key: '/shops/list',
        path: '/shops/list',
        icon: <ShopOutlined />,
        name: '店铺列表',
        access: menuAccess('/shops/list'),
      },
      {
        key: '/shops/products',
        path: '/shops/products',
        icon: <ShoppingOutlined />,
        name: '店铺商品',
        access: menuAccess('/shops/products'),
      },
      {
        key: '/shops/apply',
        path: '/shops/apply',
        icon: <FileTextOutlined />,
        name: '开店审核',
        access: menuAccess('/shops/apply'),
      },
    ],
  },
  {
    key: 'brand-management-group',
    icon: <TrademarkOutlined />,
    name: '品牌管理',
    children: [
      {
        key: '/brands/list',
        path: '/brands/list',
        icon: <TrademarkOutlined />,
        name: '品牌列表',
        access: menuAccess('/brands/list'),
      },
      {
        key: '/products/brands',
        path: '/products/brands',
        icon: <TrademarkOutlined />,
        name: '品牌商品',
        access: menuAccess('/products/brands'),
      },
      {
        key: '/shops/brand-auth',
        path: '/shops/brand-auth',
        icon: <SafetyOutlined />,
        name: '品牌授权',
        access: menuAccess('/shops/brand-auth'),
      },
    ],
  },
  {
    key: 'products-guesses-group',
    icon: <ShoppingOutlined />,
    name: '竞猜管理',
    children: [
      {
        key: '/guesses/list',
        path: '/guesses/list',
        icon: <AimOutlined />,
        name: '竞猜列表',
        access: menuAccess('/guesses/list'),
      },
      {
        key: '/guesses/friends',
        path: '/guesses/friends',
        icon: <UsergroupAddOutlined />,
        name: '好友竞猜',
        access: menuAccess('/guesses/friends'),
      },
      {
        key: '/pk',
        path: '/pk',
        icon: <SwapOutlined />,
        name: 'PK 对战',
        access: menuAccess('/pk'),
      },
    ],
  },
  {
    key: 'orders-group',
    icon: <ShoppingCartOutlined />,
    name: '订单管理',
    children: [
      {
        key: '/orders/list',
        path: '/orders/list',
        icon: <ShoppingCartOutlined />,
        name: '订单列表',
        access: menuAccess('/orders/list'),
      },
      {
        key: '/orders/transactions',
        path: '/orders/transactions',
        icon: <ShareAltOutlined />,
        name: '交易流水',
        access: menuAccess('/orders/transactions'),
      },
    ],
  },
  {
    key: 'fulfillment-group',
    icon: <CarOutlined />,
    name: '履约管理',
    children: [
      {
        key: '/warehouse/virtual',
        path: '/warehouse/virtual',
        icon: <InboxOutlined />,
        name: '虚拟仓库',
        access: menuAccess('/warehouse/virtual'),
      },
      {
        key: '/warehouse/physical',
        path: '/warehouse/physical',
        icon: <ShopOutlined />,
        name: '实体仓库',
        access: menuAccess('/warehouse/physical'),
      },
      {
        key: '/warehouse/consign',
        path: '/warehouse/consign',
        icon: <ShareAltOutlined />,
        name: '寄售市场',
        access: menuAccess('/warehouse/consign'),
      },
    ],
  },
  {
    key: 'marketing-group',
    icon: <GiftOutlined />,
    name: '营销中心',
    children: [
      {
        key: '/equity',
        path: '/equity',
        icon: <CrownOutlined />,
        name: '权益金管理',
        access: menuAccess('/equity'),
      },
      {
        key: '/marketing/banners',
        path: '/marketing/banners',
        icon: <PictureOutlined />,
        name: '轮播管理',
        access: menuAccess('/marketing/banners'),
      },
      {
        key: '/marketing/coupons',
        path: '/marketing/coupons',
        icon: <TagOutlined />,
        name: '优惠券管理',
        access: menuAccess('/marketing/coupons'),
      },
      {
        key: '/marketing/checkin',
        path: '/marketing/checkin',
        icon: <CalendarOutlined />,
        name: '签到管理',
        access: menuAccess('/marketing/checkin'),
      },
      {
        key: '/marketing/invite',
        path: '/marketing/invite',
        icon: <ShareAltOutlined />,
        name: '邀请管理',
        access: menuAccess('/marketing/invite'),
      },
      {
        key: '/system/rankings',
        path: '/system/rankings',
        icon: <CrownOutlined />,
        name: '排行榜配置',
        access: menuAccess('/system/rankings'),
      },
    ],
  },
  {
    key: 'content-group',
    icon: <CommentOutlined />,
    name: '内容管理',
    children: [
      {
        key: '/community/posts',
        path: '/community/posts',
        icon: <FileTextOutlined />,
        name: '帖子管理',
        access: menuAccess('/community/posts'),
      },
      {
        key: '/community/comments',
        path: '/community/comments',
        icon: <CommentOutlined />,
        name: '评论管理',
        access: menuAccess('/community/comments'),
      },
      {
        key: '/community/reports',
        path: '/community/reports',
        icon: <FileTextOutlined />,
        name: '举报处理',
        access: menuAccess('/community/reports'),
      },
      {
        key: '/live/list',
        path: '/live/list',
        icon: <VideoCameraOutlined />,
        name: '直播列表',
        access: menuAccess('/live/list'),
      },
      {
        key: '/system/chats',
        path: '/system/chats',
        icon: <MessageOutlined />,
        name: '聊天管理',
        access: menuAccess('/system/chats'),
      },
    ],
  },
  {
    key: 'system-group',
    icon: <SettingOutlined />,
    name: '系统设置',
    children: [
      {
        key: '/system/users',
        path: '/system/users',
        icon: <TeamOutlined />,
        name: '系统用户',
        access: menuAccess('/system/users'),
      },
      {
        key: '/system/roles',
        path: '/system/roles',
        icon: <SafetyOutlined />,
        name: '角色管理',
        access: menuAccess('/system/roles'),
      },
      {
        key: '/users/permissions',
        path: '/users/permissions',
        icon: <SafetyOutlined />,
        name: '权限管理',
        access: menuAccess('/users/permissions'),
      },
      {
        key: '/system/categories',
        path: '/system/categories',
        icon: <TagOutlined />,
        name: '分类管理',
        access: menuAccess('/system/categories'),
      },
      {
        key: '/system/notifications',
        path: '/system/notifications',
        icon: <BellOutlined />,
        name: '通知管理',
        access: menuAccess('/system/notifications'),
      },
    ],
  },
];

function flattenMenu(items: AdminMenuNode[], parentName?: string): AdminPageMeta[] {
  return items.flatMap((item) => {
    if (item.children?.length) {
      return flattenMenu(item.children, item.name);
    }

    return item.path ? [{ path: item.path, name: item.name, parentName }] : [];
  });
}

const adminPageMeta = [
  ...flattenMenu(adminMenuTree),
  ...ADMIN_HIDDEN_PAGE_META.map((item) => ({
    path: item.path,
    name: item.name,
    parentName: item.parentName,
  })),
];

export function findAdminPageMeta(path: string) {
  const detailRoute = findAdminDetailRoute(path);
  if (detailRoute) {
    return { path, name: detailRoute.name, parentName: detailRoute.parentName };
  }

  return adminPageMeta.find((item) => item.path === path) ?? adminPageMeta[0];
}

export function getAdminMenuTree() {
  return adminMenuTree;
}

export function normalizeAdminPath(hash: string) {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw || raw === '/') {
    return DASHBOARD_PATH;
  }

  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return PATH_ALIASES[normalized] ?? normalized;
}

export function toAdminMenuItems(
  nodes: AdminMenuNode[],
): NonNullable<MenuProps['items']> {
  return nodes.map((node) => {
    if (node.children?.length) {
      return {
        key: node.key,
        icon: node.icon,
        label: node.name,
        children: toAdminMenuItems(node.children),
      };
    }

    const path = node.path ?? node.key;
    return {
      key: path,
      icon: node.icon,
      label: node.name,
    };
  });
}

export function findAdminMenuOpenKeys(
  nodes: AdminMenuNode[],
  targetPath: string,
  parentKeys: string[] = [],
): string[] {
  const resolvedTargetPath = resolveAdminSelectedPath(targetPath);

  for (const node of nodes) {
    if (node.path === resolvedTargetPath) {
      return parentKeys;
    }

    if (node.children?.length) {
      const nextKeys = findAdminMenuOpenKeys(node.children, targetPath, [
        ...parentKeys,
        node.key,
      ]);
      if (nextKeys.length > 0) {
        return nextKeys;
      }
    }
  }

  return [];
}

export function sameAdminKeys(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((key, index) => key === right[index]);
}

function hasNodeAccess(node: AdminMenuNode, currentUser: AdminProfile) {
  const permissions = currentUser.permissions ?? [];
  const access = node.access;

  if (!access) {
    return true;
  }

  return (
    access.permissionCodes?.some((code) => {
      if (permissions.includes(code)) {
        return true;
      }

      const definition = ADMIN_PERMISSION_DEFINITION_BY_CODE[code];
      return Boolean(definition?.parentCode && permissions.includes(definition.parentCode));
    }) ?? false
  );
}

export function filterAdminMenuTreeByAccess(
  items: AdminMenuNode[],
  currentUser: AdminProfile,
): AdminMenuNode[] {
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = filterAdminMenuTreeByAccess(item.children, currentUser);
        return children.length > 0 ? { ...item, children } : null;
      }

      return hasNodeAccess(item, currentUser) ? item : null;
    })
    .filter(Boolean) as AdminMenuNode[];
}

export function findFirstAccessibleAdminPath(items: AdminMenuNode[]): string | null {
  for (const item of items) {
    if (item.children?.length) {
      const childPath = findFirstAccessibleAdminPath(item.children);
      if (childPath) {
        return childPath;
      }
      continue;
    }

    if (item.path) {
      return item.path;
    }
  }

  return null;
}

export function isAdminPathAccessible(
  path: string,
  currentUser: AdminProfile,
): boolean {
  const resolvedPath = resolveAdminAccessPath(path);
  const permissions = currentUser.permissions ?? [];
  const definition = findAdminMenuPermissionByPath(resolvedPath);

  if (definition) {
    return (
      permissions.includes(definition.code) ||
      Boolean(definition.parentCode && permissions.includes(definition.parentCode))
    );
  }

  const traverse = (items: AdminMenuNode[]): boolean => {
    for (const item of items) {
      if (item.children?.length) {
        if (traverse(item.children)) {
          return true;
        }
        continue;
      }

      if (item.path === resolvedPath) {
        return hasNodeAccess(item, currentUser);
      }
    }

    return false;
  };

  return traverse(adminMenuTree);
}
