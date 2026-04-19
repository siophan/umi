import type { ReactNode } from 'react';

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
};

type AdminPageMeta = {
  path: string;
  name: string;
  parentName?: string;
};

const adminMenuTree: AdminMenuNode[] = [
  { key: '/dashboard', path: '/dashboard', icon: <DashboardOutlined />, name: '仪表盘' },
  {
    key: 'user-merchant-group',
    icon: <UserOutlined />,
    name: '用户与商家',
    children: [
      { key: '/users/list', path: '/users/list', icon: <TeamOutlined />, name: '用户列表' },
      { key: '/shops/list', path: '/shops/list', icon: <ShopOutlined />, name: '店铺列表' },
      { key: '/shops/apply', path: '/shops/apply', icon: <FileTextOutlined />, name: '开店审核' },
      { key: '/brands/list', path: '/brands/list', icon: <TrademarkOutlined />, name: '品牌方列表' },
      { key: '/brands/apply', path: '/brands/apply', icon: <FileTextOutlined />, name: '入驻审核' },
      { key: '/product-auth/list', path: '/product-auth/list', icon: <SafetyOutlined />, name: '商品授权' },
      { key: '/product-auth/records', path: '/product-auth/records', icon: <FileTextOutlined />, name: '授权记录' },
      { key: '/shops/products', path: '/shops/products', icon: <ShoppingOutlined />, name: '店铺授权商品' },
    ],
  },
  {
    key: 'products-guesses-group',
    icon: <ShoppingOutlined />,
    name: '商品与竞猜',
    children: [
      { key: '/products/list', path: '/products/list', icon: <ShoppingOutlined />, name: '商品列表' },
      { key: '/products/brands', path: '/products/brands', icon: <TrademarkOutlined />, name: '品牌商品库' },
      { key: '/guesses/list', path: '/guesses/list', icon: <AimOutlined />, name: '竞猜列表' },
      { key: '/guesses/create', path: '/guesses/create', icon: <PlusCircleOutlined />, name: '创建竞猜' },
      { key: '/guesses/friends', path: '/guesses/friends', icon: <UsergroupAddOutlined />, name: '好友竞猜' },
      { key: '/pk', path: '/pk', icon: <SwapOutlined />, name: 'PK 对战' },
    ],
  },
  {
    key: 'orders-fulfillment-group',
    icon: <ShoppingCartOutlined />,
    name: '订单与履约',
    children: [
      { key: '/orders/list', path: '/orders/list', icon: <ShoppingCartOutlined />, name: '订单列表' },
      { key: '/orders/transactions', path: '/orders/transactions', icon: <ShareAltOutlined />, name: '交易流水' },
      { key: '/orders/logistics', path: '/orders/logistics', icon: <CarOutlined />, name: '物流管理' },
      { key: '/warehouse/virtual', path: '/warehouse/virtual', icon: <InboxOutlined />, name: '虚拟仓库' },
      { key: '/warehouse/physical', path: '/warehouse/physical', icon: <ShopOutlined />, name: '实体仓库' },
      { key: '/warehouse/consign', path: '/warehouse/consign', icon: <ShareAltOutlined />, name: '寄售市场' },
    ],
  },
  {
    key: 'marketing-group',
    icon: <GiftOutlined />,
    name: '营销中心',
    children: [
      { key: '/equity', path: '/equity', icon: <CrownOutlined />, name: '权益金管理' },
      { key: '/marketing/banners', path: '/marketing/banners', icon: <PictureOutlined />, name: '轮播管理' },
      { key: '/marketing/coupons', path: '/marketing/coupons', icon: <TagOutlined />, name: '优惠券管理' },
      { key: '/marketing/checkin', path: '/marketing/checkin', icon: <CalendarOutlined />, name: '签到管理' },
      { key: '/marketing/invite', path: '/marketing/invite', icon: <ShareAltOutlined />, name: '邀请管理' },
      { key: '/system/rankings', path: '/system/rankings', icon: <CrownOutlined />, name: '排行榜配置' },
    ],
  },
  {
    key: 'content-group',
    icon: <CommentOutlined />,
    name: '内容管理',
    children: [
      { key: '/community/posts', path: '/community/posts', icon: <FileTextOutlined />, name: '帖子管理' },
      { key: '/community/comments', path: '/community/comments', icon: <CommentOutlined />, name: '评论管理' },
      { key: '/community/reports', path: '/community/reports', icon: <FileTextOutlined />, name: '举报处理' },
      { key: '/live/list', path: '/live/list', icon: <VideoCameraOutlined />, name: '直播列表' },
      { key: '/live/danmaku', path: '/live/danmaku', icon: <AudioOutlined />, name: '弹幕管理' },
      { key: '/system/chats', path: '/system/chats', icon: <MessageOutlined />, name: '聊天管理' },
    ],
  },
  {
    key: 'system-group',
    icon: <SettingOutlined />,
    name: '权限与系统',
    children: [
      { key: '/system/users', path: '/system/users', icon: <TeamOutlined />, name: '系统用户' },
      { key: '/system/roles', path: '/system/roles', icon: <SafetyOutlined />, name: '角色管理' },
      { key: '/users/permissions', path: '/users/permissions', icon: <SafetyOutlined />, name: '权限管理' },
      { key: '/system/categories', path: '/system/categories', icon: <TagOutlined />, name: '分类管理' },
      { key: '/system/notifications', path: '/system/notifications', icon: <BellOutlined />, name: '通知管理' },
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
