import type { ReactNode } from 'react';

import { findAdminMenuPermissionByPath } from '@umi/shared';
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

export const adminMenuTree: AdminMenuNode[] = [
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
      {
        key: '/system/settings',
        path: '/system/settings',
        icon: <SettingOutlined />,
        name: '参数设置',
        access: menuAccess('/system/settings'),
      },
    ],
  },
];
