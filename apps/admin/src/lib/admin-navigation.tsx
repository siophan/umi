import type { ReactNode } from 'react';
import {
  ADMIN_PERMISSION_DEFINITION_BY_CODE,
  findAdminMenuPermissionByPath,
  type AdminProfile,
} from '@umi/shared';

import {
  AimOutlined,
  AudioOutlined,
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
  PlusCircleOutlined,
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

function menuAccess(path: string) {
  const definition = findAdminMenuPermissionByPath(path);

  return definition ? { permissionCodes: [definition.code] } : undefined;
}

type AdminPageMeta = {
  path: string;
  name: string;
  parentName?: string;
};

const adminMenuTree: AdminMenuNode[] = [
  {
    key: '/dashboard',
    path: '/dashboard',
    icon: <DashboardOutlined />,
    name: '仪表盘',
    access: menuAccess('/dashboard'),
  },
  {
    key: 'user-merchant-group',
    icon: <UserOutlined />,
    name: '用户与商家',
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
        key: '/shops/apply',
        path: '/shops/apply',
        icon: <FileTextOutlined />,
        name: '开店审核',
        access: menuAccess('/shops/apply'),
      },
      {
        key: '/brands/list',
        path: '/brands/list',
        icon: <TrademarkOutlined />,
        name: '品牌方列表',
        access: menuAccess('/brands/list'),
      },
      {
        key: '/brands/apply',
        path: '/brands/apply',
        icon: <FileTextOutlined />,
        name: '入驻审核',
        access: menuAccess('/brands/apply'),
      },
      {
        key: '/product-auth/list',
        path: '/product-auth/list',
        icon: <SafetyOutlined />,
        name: '商品授权',
        access: menuAccess('/product-auth/list'),
      },
      {
        key: '/product-auth/records',
        path: '/product-auth/records',
        icon: <FileTextOutlined />,
        name: '授权记录',
        access: menuAccess('/product-auth/records'),
      },
      {
        key: '/shops/products',
        path: '/shops/products',
        icon: <ShoppingOutlined />,
        name: '店铺授权商品',
        access: menuAccess('/shops/products'),
      },
    ],
  },
  {
    key: 'products-guesses-group',
    icon: <ShoppingOutlined />,
    name: '商品与竞猜',
    children: [
      {
        key: '/products/list',
        path: '/products/list',
        icon: <ShoppingOutlined />,
        name: '商品列表',
        access: menuAccess('/products/list'),
      },
      {
        key: '/products/brands',
        path: '/products/brands',
        icon: <TrademarkOutlined />,
        name: '品牌商品库',
        access: menuAccess('/products/brands'),
      },
      {
        key: '/guesses/list',
        path: '/guesses/list',
        icon: <AimOutlined />,
        name: '竞猜列表',
        access: menuAccess('/guesses/list'),
      },
      {
        key: '/guesses/create',
        path: '/guesses/create',
        icon: <PlusCircleOutlined />,
        name: '创建竞猜',
        access: menuAccess('/guesses/create'),
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
    key: 'orders-fulfillment-group',
    icon: <ShoppingCartOutlined />,
    name: '订单与履约',
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
      {
        key: '/orders/logistics',
        path: '/orders/logistics',
        icon: <CarOutlined />,
        name: '物流管理',
        access: menuAccess('/orders/logistics'),
      },
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
        key: '/live/danmaku',
        path: '/live/danmaku',
        icon: <AudioOutlined />,
        name: '弹幕管理',
        access: menuAccess('/live/danmaku'),
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
    name: '权限与系统',
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

const adminPageMeta = flattenMenu(adminMenuTree);

export function findAdminPageMeta(path: string) {
  return adminPageMeta.find((item) => item.path === path) ?? adminPageMeta[0];
}

export function getAdminMenuTree() {
  return adminMenuTree;
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
  const traverse = (items: AdminMenuNode[]): boolean => {
    for (const item of items) {
      if (item.children?.length) {
        if (traverse(item.children)) {
          return true;
        }
        continue;
      }

      if (item.path === path) {
        return hasNodeAccess(item, currentUser);
      }
    }

    return false;
  };

  return traverse(adminMenuTree);
}
