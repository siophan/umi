import type { ReactNode } from 'react';

import type { AdminRuntimeData } from './admin-loader';
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
  WarningOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Progress, Space, Tag, Typography } from 'antd';

import {
  formatAmount,
  formatDateTime,
  formatNumber,
  formatPercent,
  guessReviewStatusMeta,
  guessStatusMeta,
  orderStatusMeta,
  productStatusMeta,
  roleMeta,
  warehouseStatusMeta,
} from './format';
import type {
  LegacyFeatureDefinition,
  LegacyFilterOption,
  LegacyMetric,
} from '../pages/legacy-feature-page';

type LegacyTableRecord = Record<string, unknown>;

export type LegacyLeafPage = {
  path: string;
  title: string;
  group: string;
  description: string;
  builder: (context: LegacyPageContext) => LegacyFeatureDefinition;
};

export type LegacyMenuNode = {
  key: string;
  name: string;
  icon: ReactNode;
  path?: string;
  children?: LegacyMenuNode[];
};

export type LegacyPageContext = {
  currentUserName: string;
  data: AdminRuntimeData;
  loading: boolean;
  usingFallback: boolean;
};

function coloredTag(label: string, color: string) {
  return <Tag color={color}>{label}</Tag>;
}

function buildTableFilters<TRecord>(
  entries: Array<LegacyFilterOption<TRecord>>,
) {
  return [
    {
      label: '全部',
      value: 'all',
      predicate: () => true,
    },
    ...entries,
  ];
}

function metrics(...items: LegacyMetric[]) {
  return items;
}

const legacyMenuTree: LegacyMenuNode[] = [
  { key: '/', path: '/', icon: <DashboardOutlined />, name: '仪表盘' },
  {
    key: 'users-group',
    icon: <UserOutlined />,
    name: '用户管理',
    children: [
      { key: '/users', path: '/users', icon: <TeamOutlined />, name: '用户列表' },
      {
        key: '/users/permissions',
        path: '/users/permissions',
        icon: <SafetyOutlined />,
        name: '权限管理',
      },
    ],
  },
  {
    key: 'products-group',
    icon: <ShoppingOutlined />,
    name: '商品管理',
    children: [
      { key: '/products', path: '/products', icon: <ShoppingOutlined />, name: '商品列表' },
      {
        key: '/products/brands',
        path: '/products/brands',
        icon: <TrademarkOutlined />,
        name: '品牌商品库',
      },
    ],
  },
  {
    key: 'guesses-group',
    icon: <AimOutlined />,
    name: '竞猜管理',
    children: [
      { key: '/guesses', path: '/guesses', icon: <AimOutlined />, name: '竞猜列表' },
      {
        key: '/guesses/create',
        path: '/guesses/create',
        icon: <PlusCircleOutlined />,
        name: '创建竞猜',
      },
      {
        key: '/guesses/friends',
        path: '/guesses/friends',
        icon: <UsergroupAddOutlined />,
        name: '好友竞猜',
      },
    ],
  },
  { key: '/pk', path: '/pk', icon: <SwapOutlined />, name: 'PK 对战' },
  {
    key: 'orders-group',
    icon: <ShoppingCartOutlined />,
    name: '订单管理',
    children: [
      { key: '/orders', path: '/orders', icon: <ShoppingCartOutlined />, name: '订单列表' },
      {
        key: '/orders/transactions',
        path: '/orders/transactions',
        icon: <ShareAltOutlined />,
        name: '交易流水',
      },
      {
        key: '/orders/logistics',
        path: '/orders/logistics',
        icon: <CarOutlined />,
        name: '物流管理',
      },
    ],
  },
  {
    key: 'shops-group',
    icon: <ShopOutlined />,
    name: '店铺管理',
    children: [
      { key: '/shops', path: '/shops', icon: <ShopOutlined />, name: '店铺列表' },
      {
        key: '/shops/apply',
        path: '/shops/apply',
        icon: <FileTextOutlined />,
        name: '开店审核',
      },
      {
        key: '/shops/brand-auth',
        path: '/shops/brand-auth',
        icon: <SafetyOutlined />,
        name: '品牌授权审核',
      },
      {
        key: '/shops/brand-auth/records',
        path: '/shops/brand-auth/records',
        icon: <FileTextOutlined />,
        name: '授权记录',
      },
      {
        key: '/shops/products',
        path: '/shops/products',
        icon: <ShoppingOutlined />,
        name: '店铺授权商品',
      },
    ],
  },
  {
    key: 'brands-group',
    icon: <TrademarkOutlined />,
    name: '品牌方管理',
    children: [
      { key: '/brands', path: '/brands', icon: <TrademarkOutlined />, name: '品牌方列表' },
      {
        key: '/brands/apply',
        path: '/brands/apply',
        icon: <FileTextOutlined />,
        name: '入驻审核',
      },
    ],
  },
  {
    key: 'product-auth-group',
    icon: <SafetyOutlined />,
    name: '商品授权',
    children: [
      {
        key: '/product-auth',
        path: '/product-auth',
        icon: <SafetyOutlined />,
        name: '授权管理',
      },
      {
        key: '/product-auth/records',
        path: '/product-auth/records',
        icon: <FileTextOutlined />,
        name: '授权记录',
      },
    ],
  },
  {
    key: 'warehouse-group',
    icon: <InboxOutlined />,
    name: '仓库管理',
    children: [
      { key: '/warehouse', path: '/warehouse', icon: <InboxOutlined />, name: '虚拟仓库' },
      {
        key: '/warehouse/physical',
        path: '/warehouse/physical',
        icon: <ShopOutlined />,
        name: '实体仓库',
      },
      {
        key: '/warehouse/consign',
        path: '/warehouse/consign',
        icon: <ShareAltOutlined />,
        name: '寄售市场',
      },
    ],
  },
  { key: '/equity', path: '/equity', icon: <CrownOutlined />, name: '权益金管理' },
  {
    key: 'marketing-group',
    icon: <GiftOutlined />,
    name: '营销中心',
    children: [
      {
        key: '/marketing/banners',
        path: '/marketing/banners',
        icon: <PictureOutlined />,
        name: '轮播管理',
      },
      {
        key: '/marketing/coupons',
        path: '/marketing/coupons',
        icon: <TagOutlined />,
        name: '优惠券管理',
      },
      {
        key: '/marketing/checkin',
        path: '/marketing/checkin',
        icon: <CalendarOutlined />,
        name: '签到管理',
      },
      {
        key: '/marketing/invite',
        path: '/marketing/invite',
        icon: <ShareAltOutlined />,
        name: '邀请管理',
      },
    ],
  },
  {
    key: 'community-group',
    icon: <CommentOutlined />,
    name: '社区管理',
    children: [
      { key: '/community', path: '/community', icon: <FileTextOutlined />, name: '帖子管理' },
      {
        key: '/community/comments',
        path: '/community/comments',
        icon: <CommentOutlined />,
        name: '评论管理',
      },
      {
        key: '/community/reports',
        path: '/community/reports',
        icon: <WarningOutlined />,
        name: '举报处理',
      },
    ],
  },
  {
    key: 'live-group',
    icon: <VideoCameraOutlined />,
    name: '直播管理',
    children: [
      { key: '/live', path: '/live', icon: <VideoCameraOutlined />, name: '直播列表' },
      {
        key: '/live/danmaku',
        path: '/live/danmaku',
        icon: <AudioOutlined />,
        name: '弹幕管理',
      },
    ],
  },
  {
    key: 'system-group',
    icon: <SettingOutlined />,
    name: '系统管理',
    children: [
      {
        key: '/system/notifications',
        path: '/system/notifications',
        icon: <BellOutlined />,
        name: '通知管理',
      },
      {
        key: '/system/chats',
        path: '/system/chats',
        icon: <MessageOutlined />,
        name: '聊天管理',
      },
      {
        key: '/system/rankings',
        path: '/system/rankings',
        icon: <CrownOutlined />,
        name: '排行榜配置',
      },
    ],
  },
];

function flattenMenu(
  items: LegacyMenuNode[],
  parentName?: string,
): Array<{ path: string; name: string; parentName?: string }> {
  return items.flatMap((item) => {
    if (item.children?.length) {
      return flattenMenu(item.children, item.name);
    }

    return item.path ? [{ path: item.path, name: item.name, parentName }] : [];
  });
}

function tableInfoCards(...items: Array<{ title: string; items: string[] }>) {
  return items;
}

function buildLegacyPages(context: LegacyPageContext): Record<string, LegacyLeafPage> {
  const { data, currentUserName } = context;
  const users = data.users;
  const products = data.products;
  const guesses = data.guesses;
  const orders = data.orders;
  const warehouseItems = data.warehouseItems;

  const transactions = orders.map((order, index) => ({
    id: `txn-${index + 1}`,
    orderId: order.id,
    userId: order.userId,
    channel: order.orderType === 'guess_reward' ? '竞猜扣币' : '商城支付',
    amount: order.amount,
    status:
      order.status === 'refund_pending' || order.status === 'refunded'
        ? '退款链路'
        : '已入账',
    createdAt: order.createdAt,
  }));

  const logistics = orders
    .filter((order) => ['shipping', 'completed'].includes(order.status))
    .map((order, index) => ({
      id: `lg-${index + 1}`,
      orderId: order.id,
      carrier: index % 2 === 0 ? '顺丰' : '京东物流',
      trackingNo: `SF20260419${index + 10}`,
      status: order.status === 'shipping' ? '运输中' : '已妥投',
      receiver: order.userId,
      createdAt: order.createdAt,
    }));

  const friendGuesses = [
    {
      id: 'friend-1',
      roomName: 'Panda 好友局',
      inviter: 'Kiki Shop',
      participants: 8,
      reward: '限量鞋盒',
      status: '进行中',
      endTime: '2026-04-20T12:00:00.000Z',
    },
    {
      id: 'friend-2',
      roomName: 'FOG 价格竞猜房',
      inviter: 'Rex Brand',
      participants: 5,
      reward: '优惠券礼包',
      status: '待开赛',
      endTime: '2026-04-22T09:30:00.000Z',
    },
  ];

  const pkMatches = [
    {
      id: 'pk-1',
      title: 'Jordan 对战局',
      leftUser: 'Joy User',
      rightUser: 'Mia Collector',
      stake: 5000,
      result: 'Joy User 领先',
      status: '进行中',
    },
    {
      id: 'pk-2',
      title: 'Panda 闪电局',
      leftUser: 'Kiki Shop',
      rightUser: 'Rex Brand',
      stake: 12000,
      result: '已结算',
      status: '完成',
    },
  ];

  const shops = [
    {
      id: 'shop-1',
      name: 'Kiki Sneaker Lab',
      owner: 'Kiki Shop',
      category: '球鞋',
      status: '营业中',
      products: 24,
      orders: 188,
      score: 4.8,
    },
    {
      id: 'shop-2',
      name: 'Rex Lab',
      owner: 'Rex Brand',
      category: '服饰',
      status: '营业中',
      products: 16,
      orders: 132,
      score: 4.7,
    },
    {
      id: 'shop-3',
      name: 'Archive Select',
      owner: 'Mia Collector',
      category: '配件',
      status: '审核中',
      products: 6,
      orders: 14,
      score: 4.3,
    },
  ];

  const shopApplies = [
    {
      id: 'apply-1',
      applicant: 'Archive Select',
      category: '配件',
      contact: '13600000002',
      status: '待审核',
      submittedAt: '2026-04-19T05:20:00.000Z',
    },
    {
      id: 'apply-2',
      applicant: 'Mono Studio',
      category: '潮玩',
      contact: '13600000088',
      status: '补材料',
      submittedAt: '2026-04-18T03:10:00.000Z',
    },
  ];

  const brandAuthApplies = [
    {
      id: 'auth-1',
      shopName: 'Kiki Sneaker Lab',
      brandName: 'Nike',
      scope: '全品牌授权',
      status: '待审核',
      submittedAt: '2026-04-18T11:00:00.000Z',
    },
    {
      id: 'auth-2',
      shopName: 'Rex Lab',
      brandName: 'FOG',
      scope: '指定商品授权',
      status: '已通过',
      submittedAt: '2026-04-17T07:20:00.000Z',
    },
  ];

  const authRecords = [
    {
      id: 'record-1',
      subject: 'Nike -> Kiki Sneaker Lab',
      scope: '全品牌授权',
      operator: currentUserName,
      status: '生效中',
      createdAt: '2026-04-17T12:00:00.000Z',
    },
    {
      id: 'record-2',
      subject: 'FOG -> Rex Lab',
      scope: '指定商品授权',
      operator: 'Ops Admin',
      status: '已归档',
      createdAt: '2026-04-14T08:00:00.000Z',
    },
  ];

  const brands = [
    {
      id: 'brand-1',
      name: 'Nike',
      category: '球鞋',
      shopCount: 14,
      status: '合作中',
      goodsCount: 68,
    },
    {
      id: 'brand-2',
      name: 'Jordan',
      category: '球鞋',
      shopCount: 7,
      status: '合作中',
      goodsCount: 21,
    },
    {
      id: 'brand-3',
      name: 'BAPE',
      category: '服饰',
      shopCount: 5,
      status: '待扩展',
      goodsCount: 13,
    },
  ];

  const brandApplies = [
    {
      id: 'brand-apply-1',
      name: 'Stone Island',
      category: '服饰',
      applicant: 'Stone CN',
      status: '待审核',
      submittedAt: '2026-04-19T06:20:00.000Z',
    },
  ];

  const productAuthRows = [
    {
      id: 'pa-1',
      brandName: 'Nike',
      productName: 'Nike Dunk Low Panda',
      shopName: 'Kiki Sneaker Lab',
      mode: '长期',
      status: '生效中',
    },
    {
      id: 'pa-2',
      brandName: 'FOG',
      productName: 'Essentials Hoodie',
      shopName: 'Rex Lab',
      mode: '试运营',
      status: '待审核',
    },
  ];

  const consignRows = warehouseItems
    .filter((item) => item.warehouseType === 'virtual')
    .map((item) => ({
      id: item.id,
      productName: item.productName,
      userId: item.userId,
      price: item.consignPrice ?? 0,
      status:
        item.status === 'consigning'
          ? '寄售中'
          : item.status === 'stored'
            ? '待上架'
            : '冻结中',
      createdAt: item.createdAt,
    }));

  const equityRows = users.map((user, index) => ({
    id: `eq-${index + 1}`,
    userId: user.id,
    userName: user.name,
    balance: user.coins / 2,
    frozen: Math.round(user.coins * 0.15),
    status: user.role === 'admin' ? '系统账户' : '正常',
  }));

  const banners = [
    {
      id: 'banner-1',
      title: 'Panda 限时竞猜季',
      position: '首页头图',
      status: '投放中',
      clickRate: '8.4%',
    },
    {
      id: 'banner-2',
      title: '新店入驻奖励',
      position: '商城二屏',
      status: '待上线',
      clickRate: '预计 4.1%',
    },
  ];

  const coupons = [
    {
      id: 'coupon-1',
      name: '满 199 减 20',
      scope: '平台',
      stock: 1200,
      claimed: 840,
      status: '发放中',
    },
    {
      id: 'coupon-2',
      name: '新客免邮券',
      scope: '平台',
      stock: 5000,
      claimed: 2240,
      status: '发放中',
    },
  ];

  const checkinRules = [
    {
      id: 'checkin-1',
      cycle: '连续 7 天',
      reward: '200 优米币',
      target: '全体用户',
      status: '启用中',
    },
    {
      id: 'checkin-2',
      cycle: '连续 30 天',
      reward: '随机免单券',
      target: '高活跃用户',
      status: '启用中',
    },
  ];

  const invites = [
    {
      id: 'invite-1',
      campaign: '春季拉新',
      invitedUsers: 428,
      rewardCost: 226000,
      status: '进行中',
    },
    {
      id: 'invite-2',
      campaign: '店主裂变',
      invitedUsers: 86,
      rewardCost: 98000,
      status: '复盘中',
    },
  ];

  const communityPosts = [
    {
      id: 'post-1',
      author: 'Joy User',
      title: 'Panda 上脚图分享',
      likes: 184,
      comments: 42,
      status: '正常',
      createdAt: '2026-04-19T05:00:00.000Z',
    },
    {
      id: 'post-2',
      author: 'Mia Collector',
      title: 'Jordan 本周入手建议',
      likes: 120,
      comments: 19,
      status: '待复核',
      createdAt: '2026-04-18T11:40:00.000Z',
    },
  ];

  const comments = [
    {
      id: 'comment-1',
      author: 'Rex Brand',
      target: 'Panda 上脚图分享',
      content: '这波发售节奏确实快',
      status: '正常',
      createdAt: '2026-04-19T06:30:00.000Z',
    },
    {
      id: 'comment-2',
      author: 'User 2026',
      target: 'Jordan 本周入手建议',
      content: '这条评论触发了风控关键词',
      status: '待审核',
      createdAt: '2026-04-18T12:20:00.000Z',
    },
  ];

  const reports = [
    {
      id: 'report-1',
      reporter: 'Joy User',
      targetType: '帖子',
      target: 'Jordan 本周入手建议',
      reason: '疑似引流',
      status: '待处理',
    },
    {
      id: 'report-2',
      reporter: 'Mia Collector',
      targetType: '评论',
      target: '这条评论触发了风控关键词',
      reason: '辱骂',
      status: '处理中',
    },
  ];

  const lives = [
    {
      id: 'live-1',
      roomName: 'Sneaker 夜聊',
      host: 'Kiki Shop',
      viewers: 3200,
      status: '直播中',
      createdAt: '2026-04-19T03:00:00.000Z',
    },
    {
      id: 'live-2',
      roomName: 'FOG 新品开箱',
      host: 'Rex Brand',
      viewers: 840,
      status: '预告中',
      createdAt: '2026-04-20T10:00:00.000Z',
    },
  ];

  const danmakuRows = [
    {
      id: 'dm-1',
      roomName: 'Sneaker 夜聊',
      sender: 'Joy User',
      content: 'Panda 明天还会补货吗',
      status: '正常',
      createdAt: '2026-04-19T03:14:00.000Z',
    },
    {
      id: 'dm-2',
      roomName: 'Sneaker 夜聊',
      sender: 'User 2026',
      content: '这条弹幕被风控标记',
      status: '拦截',
      createdAt: '2026-04-19T03:16:00.000Z',
    },
  ];

  const notifications = [
    {
      id: 'notice-1',
      title: '系统维护通知',
      audience: '全体用户',
      type: '系统',
      status: '已发送',
      createdAt: '2026-04-18T08:00:00.000Z',
    },
    {
      id: 'notice-2',
      title: '竞猜开奖提醒',
      audience: '参与用户',
      type: '竞猜',
      status: '草稿',
      createdAt: '2026-04-19T05:00:00.000Z',
    },
  ];

  const chats = [
    {
      id: 'chat-1',
      userA: 'Joy User',
      userB: 'Kiki Shop',
      messages: 48,
      riskLevel: '低',
      status: '正常',
    },
    {
      id: 'chat-2',
      userA: 'User 2026',
      userB: 'Rex Brand',
      messages: 12,
      riskLevel: '中',
      status: '待抽检',
    },
  ];

  const rankings = [
    {
      id: 'ranking-1',
      name: '本周猜中榜',
      dimension: '胜率',
      refreshRule: '每日 00:10',
      status: '启用中',
    },
    {
      id: 'ranking-2',
      name: '店铺成交榜',
      dimension: 'GMV',
      refreshRule: '每小时',
      status: '启用中',
    },
  ];

  const shopProducts = products.map((product) => ({
    id: product.id,
    shopName: product.shopName,
    productName: product.name,
    brandName: product.brand,
    status: product.status,
    stock: product.stock,
  }));

  const brandProducts = products.map((product) => ({
    id: product.id,
    brandName: product.brand,
    productName: product.name,
    category: product.category,
    guidePrice: product.price,
    status: product.status,
  }));

  const permissionRows = [
    {
      key: 'perm-1',
      module: '用户管理',
      admin: coloredTag('全部', 'success'),
      ops: coloredTag('查看/编辑', 'processing'),
      audit: coloredTag('查看', 'default'),
      service: coloredTag('查看', 'default'),
    },
    {
      key: 'perm-2',
      module: '竞猜管理',
      admin: coloredTag('全部', 'success'),
      ops: coloredTag('审核/开奖', 'gold'),
      audit: coloredTag('审核', 'processing'),
      service: coloredTag('查看', 'default'),
    },
    {
      key: 'perm-3',
      module: '订单履约',
      admin: coloredTag('全部', 'success'),
      ops: coloredTag('查看', 'default'),
      audit: coloredTag('退款审核', 'gold'),
      service: coloredTag('发货/售后', 'processing'),
    },
  ];

  const dashboardRows = [
    {
      id: 'dash-1',
      item: '待审核竞猜',
      owner: '运营',
      value: 6,
      status: '需要处理',
      updatedAt: '2026-04-19T07:40:00.000Z',
    },
    {
      id: 'dash-2',
      item: '退款工单',
      owner: '履约',
      value: 3,
      status: '处理中',
      updatedAt: '2026-04-19T06:55:00.000Z',
    },
    {
      id: 'dash-3',
      item: '举报单',
      owner: '社区风控',
      value: 2,
      status: '待复核',
      updatedAt: '2026-04-19T06:10:00.000Z',
    },
  ];

  const leafPages: Record<string, LegacyLeafPage> = {
    '/': {
      path: '/',
      title: '仪表盘',
      group: '概览',
      description: '老系统的首页偏运营驾驶舱，新后台先把待处理事项、规模数据和模块入口对齐。',
      builder: () => ({
        kind: 'table',
        title: '运营驾驶舱',
        summary: '按老系统后台的组织方式，首页先看规模、待办、风险和模块入口。',
        bannerTags: ['Legacy Dashboard', '老系统菜单对齐'],
        metrics: metrics(
          { label: '总用户数', value: formatNumber(data.dashboard.users) },
          { label: '进行中竞猜', value: formatNumber(data.dashboard.activeGuesses) },
          {
            label: '订单量',
            value: formatNumber(data.dashboard.orders),
          },
          {
            label: '虚拟仓物品',
            value: formatNumber(data.warehouseStats.totalVirtual),
          },
        ),
        quickActions: ['待审核队列', '退款处理', '举报复核', '直播巡检'],
        searchPlaceholder: '搜索事项 / owner',
        searchKeys: ['item', 'owner', 'status'],
        columns: [
          { title: '事项', dataIndex: 'item' },
          { title: '负责人', dataIndex: 'owner' },
          { title: '数量', dataIndex: 'value' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: string) => (
              <Tag color={value === '需要处理' ? 'error' : 'warning'}>{value}</Tag>
            ),
          },
          {
            title: '更新时间',
            dataIndex: 'updatedAt',
            render: (value: string) => formatDateTime(value),
          },
        ],
        data: dashboardRows,
        rowKey: 'id',
        detailTitle: (record) => String(record.item),
        detailFields: [
          { label: '事项', render: (record) => String(record.item) },
          { label: '负责人', render: (record) => String(record.owner) },
          { label: '数量', render: (record) => String(record.value) },
          { label: '状态', render: (record) => String(record.status) },
        ],
        infoCards: tableInfoCards(
          {
            title: '今天重点',
            items: ['先消化待审核竞猜与开店审核', '对齐交易流水和物流台账', '补齐系统通知与聊天抽检'],
          },
          {
            title: '老系统模块',
            items: ['用户 / 商品 / 竞猜 / 订单 / 仓库', '营销 / 社区 / 直播 / 系统管理'],
          },
        ),
      }),
    },
    '/users': {
      path: '/users',
      title: '用户列表',
      group: '用户管理',
      description: '用户列表、基础画像和角色查看。',
      builder: () => ({
        kind: 'table',
        title: '用户列表',
        summary: '对齐老系统用户管理入口，支持搜索、角色筛选和侧边详情。',
        bannerTags: ['Users'],
        metrics: metrics(
          { label: '用户总数', value: users.length },
          {
            label: '店主',
            value: users.filter((user) => user.role === 'shop_owner').length,
          },
          {
            label: '管理员',
            value: users.filter((user) => user.role === 'admin').length,
          },
        ),
        searchPlaceholder: '搜索昵称 / UID / 手机号',
        searchKeys: ['name', 'uid', 'phone', 'shopName'],
        filterOptions: buildTableFilters([
          {
            label: '普通用户',
            value: 'user',
            predicate: (record) => record.role === 'user',
          },
          {
            label: '店主',
            value: 'shop_owner',
            predicate: (record) => record.role === 'shop_owner',
          },
          {
            label: '管理员',
            value: 'admin',
            predicate: (record) => record.role === 'admin',
          },
        ]),
        columns: [
          {
            title: '用户',
            dataIndex: 'name',
            render: (_, record: (typeof users)[number]) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.name}</Typography.Text>
                <Typography.Text type="secondary">UID {record.uid}</Typography.Text>
              </Space>
            ),
          },
          { title: '手机号', dataIndex: 'phone' },
          {
            title: '角色',
            dataIndex: 'role',
            render: (value: (typeof users)[number]['role']) => (
              <Tag color={roleMeta[value].color}>{roleMeta[value].label}</Tag>
            ),
          },
          {
            title: '余额',
            dataIndex: 'coins',
            render: (value: number) => formatAmount(value),
          },
          {
            title: '胜率',
            dataIndex: 'winRate',
            render: (value?: number) => formatPercent(value),
          },
          {
            title: '加入时间',
            dataIndex: 'joinDate',
            render: (value?: string | null) => formatDateTime(value),
          },
        ],
        data: users,
        rowKey: 'id',
        detailTitle: (record) => String(record.name),
        detailFields: [
          { label: 'UID', render: (record) => String(record.uid) },
          { label: '手机号', render: (record) => String(record.phone) },
          {
            label: '角色',
            render: (record) =>
              roleMeta[record.role as keyof typeof roleMeta].label,
          },
          { label: '地区', render: (record) => String(record.region ?? '-') },
          {
            label: '余额',
            render: (record) => formatAmount(Number(record.coins ?? 0)),
          },
          {
            label: '店铺',
            render: (record) => String(record.shopName ?? '-'),
          },
        ],
        infoCards: tableInfoCards({
          title: '待补操作',
          items: ['封禁 / 解封', '角色切换', '查看用户详情页', '关联订单和聊天记录'],
        }),
      }),
    },
    '/users/permissions': {
      path: '/users/permissions',
      title: '权限管理',
      group: '用户管理',
      description: '角色与模块权限矩阵。',
      builder: () => ({
        kind: 'matrix',
        title: '权限矩阵',
        summary: '对齐老系统“权限管理”页面，先把角色分层和模块权限边界在前端表达清楚。',
        bannerTags: ['Permissions'],
        metrics: metrics(
          { label: '角色层级', value: 4 },
          { label: '核心模块', value: 3 },
          { label: '可审计动作', value: 9 },
        ),
        quickActions: ['角色分层', '操作审计', '审批链路'],
        roleCards: [
          {
            title: '超级管理员',
            description: '拥有全量配置与审核权限，负责权限下发。',
            tags: ['全量读写', '配置', '审计'],
          },
          {
            title: '运营',
            description: '负责竞猜、营销、内容、品牌入驻等运营类动作。',
            tags: ['竞猜审核', '营销投放', '内容管理'],
          },
          {
            title: '审核 / 客服',
            description: '负责退款、举报、聊天抽检等风控与客服操作。',
            tags: ['退款审核', '举报处理', '聊天抽检'],
          },
        ],
        columns: [
          { title: '模块', dataIndex: 'module' },
          { title: '管理员', dataIndex: 'admin' },
          { title: '运营', dataIndex: 'ops' },
          { title: '审核', dataIndex: 'audit' },
          { title: '客服', dataIndex: 'service' },
        ] as TableColumnsType<Record<string, ReactNode>>,
        data: permissionRows,
        infoCards: tableInfoCards({
          title: '下一步',
          items: ['把权限矩阵接到真实角色枚举', '补菜单级权限开关', '补操作日志与审批记录'],
        }),
      }),
    },
    '/products': {
      path: '/products',
      title: '商品列表',
      group: '商品管理',
      description: '店铺商品运营、上下架和库存查看。',
      builder: () => ({
        kind: 'table',
        title: '商品列表',
        summary: '按老系统的商品管理结构，展示商品、店铺、库存和状态。',
        bannerTags: ['Products'],
        metrics: metrics(
          { label: '商品数', value: products.length },
          {
            label: '低库存',
            value: products.filter((product) => product.status === 'low_stock').length,
          },
          {
            label: '在售',
            value: products.filter((product) => product.status === 'active').length,
          },
        ),
        searchPlaceholder: '搜索商品 / 品牌 / 店铺',
        searchKeys: ['name', 'brand', 'shopName'],
        filterOptions: buildTableFilters([
          {
            label: '在售',
            value: 'active',
            predicate: (record) => record.status === 'active',
          },
          {
            label: '低库存',
            value: 'low_stock',
            predicate: (record) => record.status === 'low_stock',
          },
          {
            label: '待处理',
            value: 'draft',
            predicate: (record) => ['draft', 'paused'].includes(String(record.status)),
          },
        ]),
        columns: [
          { title: '商品', dataIndex: 'name' },
          { title: '品牌', dataIndex: 'brand' },
          { title: '店铺', dataIndex: 'shopName' },
          {
            title: '售价',
            dataIndex: 'price',
            render: (value: number) => formatAmount(value),
          },
          { title: '库存', dataIndex: 'stock' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: keyof typeof productStatusMeta) => (
              <Tag color={productStatusMeta[value].color}>
                {productStatusMeta[value].label}
              </Tag>
            ),
          },
        ],
        data: products,
        rowKey: 'id',
        detailTitle: (record) => String(record.name),
        detailFields: [
          { label: '品牌', render: (record) => String(record.brand) },
          { label: '店铺', render: (record) => String(record.shopName) },
          { label: '价格', render: (record) => formatAmount(Number(record.price ?? 0)) },
          { label: '库存', render: (record) => String(record.stock) },
          { label: '标签', render: (record) => String((record.tags as string[]).join(' / ')) },
        ],
      }),
    },
    '/products/brands': {
      path: '/products/brands',
      title: '品牌商品库',
      group: '商品管理',
      description: '老系统的标准品牌商品库入口。',
      builder: () => ({
        kind: 'table',
        title: '品牌商品库',
        summary: '标准商品池先按品牌、类目、指导价和状态做前端对齐。',
        bannerTags: ['Brand Library'],
        metrics: metrics(
          { label: '品牌数', value: brands.length },
          { label: '标准商品', value: brandProducts.length },
          { label: '待扩展品牌', value: brands.filter((brand) => brand.status !== '合作中').length },
        ),
        searchPlaceholder: '搜索品牌 / 商品',
        searchKeys: ['brandName', 'productName', 'category'],
        columns: [
          { title: '品牌', dataIndex: 'brandName' },
          { title: '商品', dataIndex: 'productName' },
          { title: '类目', dataIndex: 'category' },
          {
            title: '指导价',
            dataIndex: 'guidePrice',
            render: (value: number) => formatAmount(value),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: keyof typeof productStatusMeta) => (
              <Tag color={productStatusMeta[value].color}>
                {productStatusMeta[value].label}
              </Tag>
            ),
          },
        ],
        data: brandProducts,
        rowKey: 'id',
      }),
    },
    '/guesses': {
      path: '/guesses',
      title: '竞猜列表',
      group: '竞猜管理',
      description: '竞猜审核、开奖和状态管理。',
      builder: () => ({
        kind: 'table',
        title: '竞猜列表',
        summary: '对齐老系统竞猜主列表，保留审核状态、进行状态和选项热度入口。',
        bannerTags: ['Guesses'],
        metrics: metrics(
          { label: '进行中', value: guesses.filter((guess) => guess.status === 'active').length },
          { label: '待审核', value: guesses.filter((guess) => guess.reviewStatus === 'pending').length },
          { label: '已结算', value: guesses.filter((guess) => guess.status === 'settled').length },
        ),
        searchPlaceholder: '搜索竞猜 / 商品 / 分类',
        searchKeys: ['title', 'category'],
        filterOptions: buildTableFilters([
          {
            label: '待审核',
            value: 'pending',
            predicate: (record) => record.reviewStatus === 'pending',
          },
          {
            label: '进行中',
            value: 'active',
            predicate: (record) => record.status === 'active',
          },
          {
            label: '已结算',
            value: 'settled',
            predicate: (record) => record.status === 'settled',
          },
        ]),
        columns: [
          { title: '竞猜标题', dataIndex: 'title' },
          { title: '商品', render: (_, record: (typeof guesses)[number]) => record.product.name },
          { title: '分类', dataIndex: 'category' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: keyof typeof guessStatusMeta) => (
              <Tag color={guessStatusMeta[value].color}>{guessStatusMeta[value].label}</Tag>
            ),
          },
          {
            title: '审核',
            dataIndex: 'reviewStatus',
            render: (value: keyof typeof guessReviewStatusMeta) => (
              <Tag color={guessReviewStatusMeta[value].color}>
                {guessReviewStatusMeta[value].label}
              </Tag>
            ),
          },
          {
            title: '参与',
            render: (_, record: (typeof guesses)[number]) =>
              record.options.reduce((sum, option) => sum + option.voteCount, 0),
          },
        ],
        data: guesses,
        rowKey: 'id',
        detailTitle: (record) => String(record.title),
        detailFields: [
          { label: '关联商品', render: (record) => String((record.product as { name: string }).name) },
          {
            label: '竞猜成本',
            render: (record) =>
              formatAmount(Number((record.product as { guessPrice: number }).guessPrice)),
          },
          {
            label: '选项热度',
            render: (record) => (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {((record.options as Array<{ optionText: string; voteCount: number }>) ?? []).map(
                  (option) => {
                    const total = (record.options as Array<{ voteCount: number }>).reduce(
                      (sum, item) => sum + item.voteCount,
                      0,
                    );
                    const percent = total ? (option.voteCount / total) * 100 : 0;

                    return (
                      <div key={option.optionText}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Typography.Text>{option.optionText}</Typography.Text>
                          <Typography.Text type="secondary">
                            {option.voteCount} 票
                          </Typography.Text>
                        </Space>
                        <Progress percent={Number(percent.toFixed(1))} size="small" />
                      </div>
                    );
                  },
                )}
              </Space>
            ),
          },
        ],
      }),
    },
    '/guesses/create': {
      path: '/guesses/create',
      title: '创建竞猜',
      group: '竞猜管理',
      description: '老系统里的创建竞猜页。',
      builder: () => ({
        kind: 'editor',
        title: '创建竞猜',
        summary: '先把老系统的创建页要素对齐出来，后续再接真实 ProForm 提交链路。',
        bannerTags: ['Create Guess'],
        metrics: metrics(
          { label: '草稿字段组', value: 4 },
          { label: '选项数', value: 2 },
          { label: '审核节点', value: 2 },
        ),
        quickActions: ['保存草稿', '提交审核', '关联奖品', '设置开奖规则'],
        submitLabel: '保存竞猜草稿',
        formSections: [
          {
            title: '基础信息',
            fields: [
              { type: 'input', name: 'title', label: '竞猜标题', placeholder: '例如：今晚 Panda 会不会 60 秒售罄' },
              { type: 'select', name: 'category', label: '竞猜分类', options: ['球鞋', '服饰', '配件', '行情'] },
            ],
          },
          {
            title: '奖品与成本',
            fields: [
              { type: 'input', name: 'product', label: '关联商品', placeholder: '选择标准商品或店铺商品' },
              { type: 'number', name: 'guessPrice', label: '竞猜成本(分)', placeholder: '例如 4900' },
            ],
          },
          {
            title: '选项设置',
            fields: [
              { type: 'input', name: 'optionA', label: '选项 A', placeholder: '例如 会' },
              { type: 'input', name: 'optionB', label: '选项 B', placeholder: '例如 不会' },
            ],
          },
          {
            title: '时间与说明',
            fields: [
              { type: 'date', name: 'endTime', label: '截止时间' },
              { type: 'textarea', name: 'rule', label: '规则说明', placeholder: '补充开奖说明、风控规则、证据来源等' },
            ],
          },
        ],
        infoCards: tableInfoCards(
          {
            title: '审核提示',
            items: ['标题避免绝对化承诺', '开奖规则必须可验证', '奖品需要有映射商品'],
          },
          {
            title: '后续对齐',
            items: ['补 Oracle 证据', '补好友竞猜派生能力', '补开奖与取消动作'],
          },
        ),
      }),
    },
    '/guesses/friends': {
      path: '/guesses/friends',
      title: '好友竞猜',
      group: '竞猜管理',
      description: '好友房间和邀请链路。',
      builder: () => ({
        kind: 'table',
        title: '好友竞猜房间',
        summary: '对齐老系统好友竞猜页，先把房间列表、人数、奖励和状态视图补上。',
        bannerTags: ['Friend Guesses'],
        metrics: metrics(
          { label: '进行中房间', value: friendGuesses.filter((item) => item.status === '进行中').length },
          { label: '待开赛', value: friendGuesses.filter((item) => item.status === '待开赛').length },
          { label: '参与用户', value: friendGuesses.reduce((sum, item) => sum + item.participants, 0) },
        ),
        searchPlaceholder: '搜索房间 / 发起人',
        searchKeys: ['roomName', 'inviter'],
        columns: [
          { title: '房间', dataIndex: 'roomName' },
          { title: '发起人', dataIndex: 'inviter' },
          { title: '参与人数', dataIndex: 'participants' },
          { title: '奖励', dataIndex: 'reward' },
          { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={value === '进行中' ? 'processing' : 'default'}>{value}</Tag> },
          { title: '截止', dataIndex: 'endTime', render: (value: string) => formatDateTime(value) },
        ],
        data: friendGuesses,
        rowKey: 'id',
      }),
    },
    '/pk': {
      path: '/pk',
      title: 'PK 对战',
      group: '竞猜生态',
      description: '对战房间与结算视图。',
      builder: () => ({
        kind: 'table',
        title: 'PK 对战',
        summary: '老系统有独立的 PK 页面，新后台先把比赛记录、押注和结果看板补齐。',
        bannerTags: ['PK'],
        metrics: metrics(
          { label: '对战数', value: pkMatches.length },
          {
            label: '总押注额',
            value: formatAmount(pkMatches.reduce((sum, item) => sum + item.stake, 0)),
          },
          {
            label: '已完成',
            value: pkMatches.filter((item) => item.status === '完成').length,
          },
        ),
        columns: [
          { title: '对战', dataIndex: 'title' },
          { title: '左侧', dataIndex: 'leftUser' },
          { title: '右侧', dataIndex: 'rightUser' },
          { title: '押注', dataIndex: 'stake', render: (value: number) => formatAmount(value) },
          { title: '结果', dataIndex: 'result' },
          { title: '状态', dataIndex: 'status' },
        ],
        data: pkMatches,
        rowKey: 'id',
      }),
    },
    '/orders': {
      path: '/orders',
      title: '订单列表',
      group: '订单管理',
      description: '订单列表和履约状态视图。',
      builder: () => ({
        kind: 'table',
        title: '订单列表',
        summary: '对齐老系统订单页，订单状态、商品明细、退款态全部在前端可看。',
        bannerTags: ['Orders'],
        metrics: metrics(
          { label: '订单数', value: orders.length },
          {
            label: '配送中',
            value: orders.filter((order) => order.status === 'shipping').length,
          },
          {
            label: 'GMV',
            value: formatAmount(orders.reduce((sum, order) => sum + order.amount, 0)),
          },
        ),
        searchPlaceholder: '搜索订单号 / 用户 ID',
        searchKeys: ['id', 'userId', 'guessTitle'],
        filterOptions: buildTableFilters([
          {
            label: '已支付',
            value: 'paid',
            predicate: (record) => record.status === 'paid',
          },
          {
            label: '配送中',
            value: 'shipping',
            predicate: (record) => record.status === 'shipping',
          },
          {
            label: '退款',
            value: 'refund',
            predicate: (record) => ['refund_pending', 'refunded'].includes(String(record.status)),
          },
        ]),
        columns: [
          { title: '订单号', dataIndex: 'id' },
          { title: '用户', dataIndex: 'userId' },
          {
            title: '金额',
            dataIndex: 'amount',
            render: (value: number) => formatAmount(value),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: keyof typeof orderStatusMeta) => (
              <Tag color={orderStatusMeta[value].color}>{orderStatusMeta[value].label}</Tag>
            ),
          },
          { title: '创建时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
        ],
        data: orders,
        rowKey: 'id',
      }),
    },
    '/orders/transactions': {
      path: '/orders/transactions',
      title: '交易流水',
      group: '订单管理',
      description: '交易台账和支付渠道概览。',
      builder: () => ({
        kind: 'table',
        title: '交易流水',
        summary: '对齐老系统“交易流水”页，先看金额流、订单号、渠道和状态。',
        bannerTags: ['Transactions'],
        metrics: metrics(
          { label: '流水条数', value: transactions.length },
          {
            label: '流水总额',
            value: formatAmount(transactions.reduce((sum, item) => sum + item.amount, 0)),
          },
          {
            label: '退款链路',
            value: transactions.filter((item) => item.status === '退款链路').length,
          },
        ),
        searchPlaceholder: '搜索订单号 / 用户 / 渠道',
        searchKeys: ['orderId', 'userId', 'channel'],
        columns: [
          { title: '流水号', dataIndex: 'id' },
          { title: '订单号', dataIndex: 'orderId' },
          { title: '用户', dataIndex: 'userId' },
          { title: '渠道', dataIndex: 'channel' },
          { title: '金额', dataIndex: 'amount', render: (value: number) => formatAmount(value) },
          { title: '状态', dataIndex: 'status' },
          { title: '创建时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
        ],
        data: transactions,
        rowKey: 'id',
      }),
    },
    '/orders/logistics': {
      path: '/orders/logistics',
      title: '物流管理',
      group: '订单管理',
      description: '物流单、承运商和追踪号。',
      builder: () => ({
        kind: 'table',
        title: '物流管理',
        summary: '对齐老系统物流页，发货后状态、承运商、追踪号先在前端成型。',
        bannerTags: ['Logistics'],
        metrics: metrics(
          { label: '物流单', value: logistics.length },
          { label: '运输中', value: logistics.filter((item) => item.status === '运输中').length },
          { label: '已妥投', value: logistics.filter((item) => item.status === '已妥投').length },
        ),
        columns: [
          { title: '物流单', dataIndex: 'id' },
          { title: '订单号', dataIndex: 'orderId' },
          { title: '承运商', dataIndex: 'carrier' },
          { title: '运单号', dataIndex: 'trackingNo' },
          { title: '收件人', dataIndex: 'receiver' },
          { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={value === '运输中' ? 'processing' : 'success'}>{value}</Tag> },
        ],
        data: logistics,
        rowKey: 'id',
      }),
    },
    '/shops': {
      path: '/shops',
      title: '店铺列表',
      group: '店铺管理',
      description: '店铺主体、经营类目和评分。',
      builder: () => ({
        kind: 'table',
        title: '店铺列表',
        summary: '按老系统菜单对齐店铺管理入口，先看主体、店主、经营类目、评分和订单规模。',
        bannerTags: ['Shops'],
        metrics: metrics(
          { label: '店铺数', value: shops.length },
          { label: '营业中', value: shops.filter((shop) => shop.status === '营业中').length },
          { label: '审核中', value: shops.filter((shop) => shop.status !== '营业中').length },
        ),
        searchPlaceholder: '搜索店铺 / 店主',
        searchKeys: ['name', 'owner', 'category'],
        columns: [
          { title: '店铺', dataIndex: 'name' },
          { title: '店主', dataIndex: 'owner' },
          { title: '类目', dataIndex: 'category' },
          { title: '商品数', dataIndex: 'products' },
          { title: '订单量', dataIndex: 'orders' },
          { title: '评分', dataIndex: 'score' },
          { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={value === '营业中' ? 'success' : 'warning'}>{value}</Tag> },
        ],
        data: shops,
        rowKey: 'id',
      }),
    },
    '/shops/apply': {
      path: '/shops/apply',
      title: '开店审核',
      group: '店铺管理',
      description: '开店申请队列。',
      builder: () => ({
        kind: 'table',
        title: '开店审核',
        summary: '老系统有独立开店审核页，这里先把申请队列、联系方式、状态和时间补齐。',
        bannerTags: ['Shop Apply'],
        metrics: metrics(
          { label: '申请数', value: shopApplies.length },
          { label: '待审核', value: shopApplies.filter((item) => item.status === '待审核').length },
          { label: '补材料', value: shopApplies.filter((item) => item.status === '补材料').length },
        ),
        columns: [
          { title: '申请单', dataIndex: 'id' },
          { title: '申请店铺', dataIndex: 'applicant' },
          { title: '经营类目', dataIndex: 'category' },
          { title: '联系方式', dataIndex: 'contact' },
          { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={value === '待审核' ? 'warning' : 'default'}>{value}</Tag> },
          { title: '提交时间', dataIndex: 'submittedAt', render: (value: string) => formatDateTime(value) },
        ],
        data: shopApplies,
        rowKey: 'id',
      }),
    },
    '/shops/brand-auth': {
      path: '/shops/brand-auth',
      title: '品牌授权审核',
      group: '店铺管理',
      description: '店铺侧品牌授权申请审核。',
      builder: () => ({
        kind: 'table',
        title: '品牌授权审核',
        summary: '对齐老系统品牌授权审核页，先把申请主体、品牌、授权范围和状态呈现出来。',
        bannerTags: ['Brand Auth Review'],
        metrics: metrics(
          { label: '申请数', value: brandAuthApplies.length },
          { label: '待审核', value: brandAuthApplies.filter((item) => item.status === '待审核').length },
          { label: '已通过', value: brandAuthApplies.filter((item) => item.status === '已通过').length },
        ),
        columns: [
          { title: '申请单', dataIndex: 'id' },
          { title: '店铺', dataIndex: 'shopName' },
          { title: '品牌', dataIndex: 'brandName' },
          { title: '授权范围', dataIndex: 'scope' },
          { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={value === '待审核' ? 'warning' : 'success'}>{value}</Tag> },
          { title: '提交时间', dataIndex: 'submittedAt', render: (value: string) => formatDateTime(value) },
        ],
        data: brandAuthApplies,
        rowKey: 'id',
      }),
    },
    '/shops/brand-auth/records': {
      path: '/shops/brand-auth/records',
      title: '授权记录',
      group: '店铺管理',
      description: '授权历史记录页。',
      builder: () => ({
        kind: 'table',
        title: '授权记录',
        summary: '老系统把店铺品牌授权记录单独列页，这里也先独立出来。',
        bannerTags: ['Auth Records'],
        metrics: metrics(
          { label: '记录数', value: authRecords.length },
          { label: '生效中', value: authRecords.filter((item) => item.status === '生效中').length },
          { label: '归档', value: authRecords.filter((item) => item.status === '已归档').length },
        ),
        columns: [
          { title: '记录号', dataIndex: 'id' },
          { title: '主体', dataIndex: 'subject' },
          { title: '范围', dataIndex: 'scope' },
          { title: '操作人', dataIndex: 'operator' },
          { title: '状态', dataIndex: 'status' },
          { title: '时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
        ],
        data: authRecords,
        rowKey: 'id',
      }),
    },
    '/shops/products': {
      path: '/shops/products',
      title: '店铺授权商品',
      group: '店铺管理',
      description: '店铺实际可售商品列表。',
      builder: () => ({
        kind: 'table',
        title: '店铺授权商品',
        summary: '对齐老系统“店铺授权商品”页，连接店铺与授权商品池。',
        bannerTags: ['Shop Products'],
        metrics: metrics(
          { label: '商品数', value: shopProducts.length },
          { label: '店铺数', value: new Set(shopProducts.map((item) => item.shopName)).size },
          { label: '低库存', value: shopProducts.filter((item) => item.status === 'low_stock').length },
        ),
        columns: [
          { title: '店铺', dataIndex: 'shopName' },
          { title: '商品', dataIndex: 'productName' },
          { title: '品牌', dataIndex: 'brandName' },
          { title: '库存', dataIndex: 'stock' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: keyof typeof productStatusMeta) => (
              <Tag color={productStatusMeta[value].color}>
                {productStatusMeta[value].label}
              </Tag>
            ),
          },
        ],
        data: shopProducts,
        rowKey: 'id',
      }),
    },
    '/brands': {
      path: '/brands',
      title: '品牌方列表',
      group: '品牌方管理',
      description: '品牌主体与合作规模。',
      builder: () => ({
        kind: 'table',
        title: '品牌方列表',
        summary: '对齐老系统品牌方列表页，重点展示合作规模和标准商品数。',
        bannerTags: ['Brands'],
        metrics: metrics(
          { label: '品牌数', value: brands.length },
          { label: '合作中', value: brands.filter((brand) => brand.status === '合作中').length },
          { label: '覆盖商品', value: brands.reduce((sum, brand) => sum + brand.goodsCount, 0) },
        ),
        columns: [
          { title: '品牌', dataIndex: 'name' },
          { title: '类目', dataIndex: 'category' },
          { title: '合作店铺', dataIndex: 'shopCount' },
          { title: '标准商品', dataIndex: 'goodsCount' },
          { title: '状态', dataIndex: 'status' },
        ],
        data: brands,
        rowKey: 'id',
      }),
    },
    '/brands/apply': {
      path: '/brands/apply',
      title: '入驻审核',
      group: '品牌方管理',
      description: '品牌入驻申请。',
      builder: () => ({
        kind: 'table',
        title: '品牌入驻审核',
        summary: '对齐老系统品牌入驻审核页，展示申请主体、类目和审批状态。',
        bannerTags: ['Brand Apply'],
        metrics: metrics(
          { label: '申请数', value: brandApplies.length },
          { label: '待审核', value: brandApplies.filter((item) => item.status === '待审核').length },
        ),
        columns: [
          { title: '申请单', dataIndex: 'id' },
          { title: '品牌名', dataIndex: 'name' },
          { title: '类目', dataIndex: 'category' },
          { title: '申请方', dataIndex: 'applicant' },
          { title: '状态', dataIndex: 'status' },
          { title: '提交时间', dataIndex: 'submittedAt', render: (value: string) => formatDateTime(value) },
        ],
        data: brandApplies,
        rowKey: 'id',
      }),
    },
    '/product-auth': {
      path: '/product-auth',
      title: '授权管理',
      group: '商品授权',
      description: '品牌到商品级的授权管理。',
      builder: () => ({
        kind: 'table',
        title: '商品授权管理',
        summary: '老系统有独立商品授权页，这里先把品牌、商品、店铺和授权模式做出来。',
        bannerTags: ['Product Auth'],
        metrics: metrics(
          { label: '授权数', value: productAuthRows.length },
          { label: '待审核', value: productAuthRows.filter((item) => item.status === '待审核').length },
          { label: '生效中', value: productAuthRows.filter((item) => item.status === '生效中').length },
        ),
        columns: [
          { title: '品牌', dataIndex: 'brandName' },
          { title: '商品', dataIndex: 'productName' },
          { title: '店铺', dataIndex: 'shopName' },
          { title: '模式', dataIndex: 'mode' },
          { title: '状态', dataIndex: 'status' },
        ],
        data: productAuthRows,
        rowKey: 'id',
      }),
    },
    '/product-auth/records': {
      path: '/product-auth/records',
      title: '授权记录',
      group: '商品授权',
      description: '商品授权历史记录。',
      builder: () => ({
        kind: 'table',
        title: '商品授权记录',
        summary: '沿用记录型页面，方便后续接审计日志与审批历史。',
        bannerTags: ['Product Auth Records'],
        metrics: metrics(
          { label: '记录数', value: authRecords.length },
          { label: '操作人', value: new Set(authRecords.map((item) => item.operator)).size },
        ),
        columns: [
          { title: '记录号', dataIndex: 'id' },
          { title: '主体', dataIndex: 'subject' },
          { title: '范围', dataIndex: 'scope' },
          { title: '操作人', dataIndex: 'operator' },
          { title: '状态', dataIndex: 'status' },
        ],
        data: authRecords,
        rowKey: 'id',
      }),
    },
    '/warehouse': {
      path: '/warehouse',
      title: '虚拟仓库',
      group: '仓库管理',
      description: '虚拟仓明细和状态。',
      builder: () => ({
        kind: 'table',
        title: '虚拟仓库',
        summary: '对齐老系统虚拟仓页，重点看在库、寄售中、冻结中三类状态。',
        bannerTags: ['Virtual Warehouse'],
        metrics: metrics(
          { label: '总量', value: data.warehouseStats.totalVirtual },
          {
            label: '寄售中',
            value: warehouseItems.filter(
              (item) =>
                item.warehouseType === 'virtual' && item.status === 'consigning',
            ).length,
          },
          {
            label: '冻结中',
            value: warehouseItems.filter(
              (item) => item.warehouseType === 'virtual' && item.status === 'locked',
            ).length,
          },
        ),
        columns: [
          { title: '商品', dataIndex: 'productName' },
          { title: '用户', dataIndex: 'userId' },
          { title: '数量', dataIndex: 'quantity' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: keyof typeof warehouseStatusMeta) => (
              <Tag color={warehouseStatusMeta[value].color}>
                {warehouseStatusMeta[value].label}
              </Tag>
            ),
          },
          {
            title: '寄售价',
            dataIndex: 'consignPrice',
            render: (value?: number | null) => (value ? formatAmount(value) : '-'),
          },
        ],
        data: warehouseItems.filter((item) => item.warehouseType === 'virtual'),
        rowKey: 'id',
      }),
    },
    '/warehouse/physical': {
      path: '/warehouse/physical',
      title: '实体仓库',
      group: '仓库管理',
      description: '实体仓配送和签收状态。',
      builder: () => ({
        kind: 'table',
        title: '实体仓库',
        summary: '对齐老系统实体仓页，重点看运输状态、预计天数和收货完成。',
        bannerTags: ['Physical Warehouse'],
        metrics: metrics(
          { label: '总量', value: data.warehouseStats.totalPhysical },
          {
            label: '配送中',
            value: warehouseItems.filter(
              (item) =>
                item.warehouseType === 'physical' && item.status === 'shipping',
            ).length,
          },
          {
            label: '已签收',
            value: warehouseItems.filter(
              (item) =>
                item.warehouseType === 'physical' &&
                ['delivered', 'completed'].includes(item.status),
            ).length,
          },
        ),
        columns: [
          { title: '商品', dataIndex: 'productName' },
          { title: '用户', dataIndex: 'userId' },
          { title: '数量', dataIndex: 'quantity' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: keyof typeof warehouseStatusMeta) => (
              <Tag color={warehouseStatusMeta[value].color}>
                {warehouseStatusMeta[value].label}
              </Tag>
            ),
          },
          { title: '预计天数', dataIndex: 'estimateDays', render: (value?: number | null) => value ?? '-' },
        ],
        data: warehouseItems.filter((item) => item.warehouseType === 'physical'),
        rowKey: 'id',
      }),
    },
    '/warehouse/consign': {
      path: '/warehouse/consign',
      title: '寄售市场',
      group: '仓库管理',
      description: '寄售列表与价格监控。',
      builder: () => ({
        kind: 'table',
        title: '寄售市场',
        summary: '老系统把寄售市场单列；这里先看商品、用户、寄售价和状态。',
        bannerTags: ['Consign'],
        metrics: metrics(
          { label: '寄售商品', value: consignRows.length },
          { label: '在售', value: consignRows.filter((item) => item.status === '寄售中').length },
          { label: '待上架', value: consignRows.filter((item) => item.status === '待上架').length },
        ),
        columns: [
          { title: '商品', dataIndex: 'productName' },
          { title: '用户', dataIndex: 'userId' },
          { title: '寄售价', dataIndex: 'price', render: (value: number) => formatAmount(value) },
          { title: '状态', dataIndex: 'status' },
          { title: '入库时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
        ],
        data: consignRows,
        rowKey: 'id',
      }),
    },
    '/equity': {
      path: '/equity',
      title: '权益金管理',
      group: '资金管理',
      description: '权益账户和冻结余额。',
      builder: () => ({
        kind: 'table',
        title: '权益金管理',
        summary: '对齐老系统资金页面，先展示账户余额、冻结额和账户状态。',
        bannerTags: ['Equity'],
        metrics: metrics(
          {
            label: '账户数',
            value: equityRows.length,
          },
          {
            label: '总余额',
            value: formatAmount(equityRows.reduce((sum, item) => sum + item.balance, 0)),
          },
          {
            label: '冻结额',
            value: formatAmount(equityRows.reduce((sum, item) => sum + item.frozen, 0)),
          },
        ),
        columns: [
          { title: '用户', dataIndex: 'userName' },
          { title: '用户 ID', dataIndex: 'userId' },
          { title: '余额', dataIndex: 'balance', render: (value: number) => formatAmount(value) },
          { title: '冻结', dataIndex: 'frozen', render: (value: number) => formatAmount(value) },
          { title: '状态', dataIndex: 'status' },
        ],
        data: equityRows,
        rowKey: 'id',
      }),
    },
    '/marketing/banners': {
      path: '/marketing/banners',
      title: '轮播管理',
      group: '营销中心',
      description: 'Banner 配置和投放状态。',
      builder: () => ({
        kind: 'table',
        title: '轮播管理',
        summary: '对齐老系统轮播管理页，先看位置、投放状态与点击率。',
        bannerTags: ['Marketing'],
        metrics: metrics(
          { label: 'Banner 数', value: banners.length },
          { label: '投放中', value: banners.filter((item) => item.status === '投放中').length },
        ),
        columns: [
          { title: '标题', dataIndex: 'title' },
          { title: '投放位置', dataIndex: 'position' },
          { title: '状态', dataIndex: 'status' },
          { title: '点击率', dataIndex: 'clickRate' },
        ],
        data: banners,
        rowKey: 'id',
      }),
    },
    '/marketing/coupons': {
      path: '/marketing/coupons',
      title: '优惠券管理',
      group: '营销中心',
      description: '优惠券模板、发放与库存。',
      builder: () => ({
        kind: 'table',
        title: '优惠券管理',
        summary: '对应老系统优惠券页，先把模板信息、库存、领取和发放状态做出来。',
        bannerTags: ['Coupons'],
        metrics: metrics(
          { label: '模板数', value: coupons.length },
          { label: '库存', value: coupons.reduce((sum, item) => sum + item.stock, 0) },
          { label: '已领取', value: coupons.reduce((sum, item) => sum + item.claimed, 0) },
        ),
        columns: [
          { title: '券名', dataIndex: 'name' },
          { title: '适用范围', dataIndex: 'scope' },
          { title: '库存', dataIndex: 'stock' },
          { title: '已领取', dataIndex: 'claimed' },
          { title: '状态', dataIndex: 'status' },
        ],
        data: coupons,
        rowKey: 'id',
      }),
    },
    '/marketing/checkin': {
      path: '/marketing/checkin',
      title: '签到管理',
      group: '营销中心',
      description: '签到规则和奖励配置。',
      builder: () => ({
        kind: 'table',
        title: '签到管理',
        summary: '老系统有独立签到配置页；这里先对齐奖励规则和目标人群。',
        bannerTags: ['Checkin'],
        metrics: metrics(
          { label: '规则数', value: checkinRules.length },
          { label: '启用中', value: checkinRules.filter((item) => item.status === '启用中').length },
        ),
        columns: [
          { title: '周期', dataIndex: 'cycle' },
          { title: '奖励', dataIndex: 'reward' },
          { title: '目标', dataIndex: 'target' },
          { title: '状态', dataIndex: 'status' },
        ],
        data: checkinRules,
        rowKey: 'id',
      }),
    },
    '/marketing/invite': {
      path: '/marketing/invite',
      title: '邀请管理',
      group: '营销中心',
      description: '裂变活动和成本视图。',
      builder: () => ({
        kind: 'table',
        title: '邀请管理',
        summary: '按老系统邀请管理页组织，先看活动人数、奖励成本和状态。',
        bannerTags: ['Invite'],
        metrics: metrics(
          { label: '活动数', value: invites.length },
          { label: '邀请人数', value: invites.reduce((sum, item) => sum + item.invitedUsers, 0) },
          { label: '奖励成本', value: formatAmount(invites.reduce((sum, item) => sum + item.rewardCost, 0)) },
        ),
        columns: [
          { title: '活动', dataIndex: 'campaign' },
          { title: '邀请人数', dataIndex: 'invitedUsers' },
          { title: '奖励成本', dataIndex: 'rewardCost', render: (value: number) => formatAmount(value) },
          { title: '状态', dataIndex: 'status' },
        ],
        data: invites,
        rowKey: 'id',
      }),
    },
    '/community': {
      path: '/community',
      title: '帖子管理',
      group: '社区管理',
      description: '帖子内容和互动数据。',
      builder: () => ({
        kind: 'table',
        title: '帖子管理',
        summary: '对齐老系统社区帖子页，按作者、标题、互动和状态看内容池。',
        bannerTags: ['Community'],
        metrics: metrics(
          { label: '帖子数', value: communityPosts.length },
          { label: '总点赞', value: communityPosts.reduce((sum, item) => sum + item.likes, 0) },
          { label: '待复核', value: communityPosts.filter((item) => item.status !== '正常').length },
        ),
        columns: [
          { title: '作者', dataIndex: 'author' },
          { title: '标题', dataIndex: 'title' },
          { title: '点赞', dataIndex: 'likes' },
          { title: '评论', dataIndex: 'comments' },
          { title: '状态', dataIndex: 'status' },
          { title: '发布时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
        ],
        data: communityPosts,
        rowKey: 'id',
      }),
    },
    '/community/comments': {
      path: '/community/comments',
      title: '评论管理',
      group: '社区管理',
      description: '评论内容审核与回看。',
      builder: () => ({
        kind: 'table',
        title: '评论管理',
        summary: '老系统评论页先用列表方式对齐评论主体、目标内容、时间和审核态。',
        bannerTags: ['Comments'],
        metrics: metrics(
          { label: '评论数', value: comments.length },
          { label: '待审核', value: comments.filter((item) => item.status !== '正常').length },
        ),
        columns: [
          { title: '作者', dataIndex: 'author' },
          { title: '目标', dataIndex: 'target' },
          { title: '内容', dataIndex: 'content' },
          { title: '状态', dataIndex: 'status' },
          { title: '时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
        ],
        data: comments,
        rowKey: 'id',
      }),
    },
    '/community/reports': {
      path: '/community/reports',
      title: '举报处理',
      group: '社区管理',
      description: '举报单队列。',
      builder: () => ({
        kind: 'table',
        title: '举报处理',
        summary: '对齐老系统举报处理页，先把举报人、目标、原因和状态做成队列。',
        bannerTags: ['Reports'],
        metrics: metrics(
          { label: '举报单', value: reports.length },
          { label: '待处理', value: reports.filter((item) => item.status === '待处理').length },
          { label: '处理中', value: reports.filter((item) => item.status === '处理中').length },
        ),
        columns: [
          { title: '举报单', dataIndex: 'id' },
          { title: '举报人', dataIndex: 'reporter' },
          { title: '目标类型', dataIndex: 'targetType' },
          { title: '目标', dataIndex: 'target' },
          { title: '原因', dataIndex: 'reason' },
          { title: '状态', dataIndex: 'status' },
        ],
        data: reports,
        rowKey: 'id',
      }),
    },
    '/live': {
      path: '/live',
      title: '直播列表',
      group: '直播管理',
      description: '直播场次与状态。',
      builder: () => ({
        kind: 'table',
        title: '直播列表',
        summary: '按老系统直播页组织，先展示房间、主播、观看数和状态。',
        bannerTags: ['Live'],
        metrics: metrics(
          { label: '直播场次', value: lives.length },
          { label: '直播中', value: lives.filter((item) => item.status === '直播中').length },
          { label: '总观看', value: lives.reduce((sum, item) => sum + item.viewers, 0) },
        ),
        columns: [
          { title: '房间', dataIndex: 'roomName' },
          { title: '主播', dataIndex: 'host' },
          { title: '观看', dataIndex: 'viewers' },
          { title: '状态', dataIndex: 'status' },
          { title: '时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
        ],
        data: lives,
        rowKey: 'id',
      }),
    },
    '/live/danmaku': {
      path: '/live/danmaku',
      title: '弹幕管理',
      group: '直播管理',
      description: '直播弹幕与风控状态。',
      builder: () => ({
        kind: 'table',
        title: '弹幕管理',
        summary: '对齐老系统弹幕管理页，支持看房间、发送者、内容和风控状态。',
        bannerTags: ['Danmaku'],
        metrics: metrics(
          { label: '弹幕条数', value: danmakuRows.length },
          { label: '拦截数', value: danmakuRows.filter((item) => item.status === '拦截').length },
        ),
        columns: [
          { title: '房间', dataIndex: 'roomName' },
          { title: '发送者', dataIndex: 'sender' },
          { title: '内容', dataIndex: 'content' },
          { title: '状态', dataIndex: 'status' },
          { title: '时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
        ],
        data: danmakuRows,
        rowKey: 'id',
      }),
    },
    '/system/notifications': {
      path: '/system/notifications',
      title: '通知管理',
      group: '系统管理',
      description: '系统通知发送与草稿。',
      builder: () => ({
        kind: 'table',
        title: '通知管理',
        summary: '对齐老系统通知管理页，先把目标人群、消息类型、状态和时间补齐。',
        bannerTags: ['Notifications'],
        metrics: metrics(
          { label: '消息数', value: notifications.length },
          { label: '已发送', value: notifications.filter((item) => item.status === '已发送').length },
          { label: '草稿', value: notifications.filter((item) => item.status === '草稿').length },
        ),
        columns: [
          { title: '标题', dataIndex: 'title' },
          { title: '目标人群', dataIndex: 'audience' },
          { title: '类型', dataIndex: 'type' },
          { title: '状态', dataIndex: 'status' },
          { title: '创建时间', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
        ],
        data: notifications,
        rowKey: 'id',
        infoCards: tableInfoCards({
          title: '通知能力待接',
          items: ['发送草稿', '定时发送', '模板变量', '发送结果统计'],
        }),
      }),
    },
    '/system/chats': {
      path: '/system/chats',
      title: '聊天管理',
      group: '系统管理',
      description: '会话抽检与风险。',
      builder: () => ({
        kind: 'table',
        title: '聊天管理',
        summary: '老系统有单独聊天管理页，新后台先把会话量、风险等级和状态统一放进来。',
        bannerTags: ['Chats'],
        metrics: metrics(
          { label: '会话数', value: chats.length },
          { label: '待抽检', value: chats.filter((item) => item.status !== '正常').length },
        ),
        columns: [
          { title: '用户 A', dataIndex: 'userA' },
          { title: '用户 B', dataIndex: 'userB' },
          { title: '消息数', dataIndex: 'messages' },
          { title: '风险等级', dataIndex: 'riskLevel' },
          { title: '状态', dataIndex: 'status' },
        ],
        data: chats,
        rowKey: 'id',
      }),
    },
    '/system/rankings': {
      path: '/system/rankings',
      title: '排行榜配置',
      group: '系统管理',
      description: '排行榜规则配置。',
      builder: () => ({
        kind: 'table',
        title: '排行榜配置',
        summary: '对齐老系统排行榜配置页，先把榜单维度、刷新规则和启用状态补齐。',
        bannerTags: ['Rankings'],
        metrics: metrics(
          { label: '榜单数', value: rankings.length },
          { label: '启用中', value: rankings.filter((item) => item.status === '启用中').length },
        ),
        columns: [
          { title: '榜单名', dataIndex: 'name' },
          { title: '维度', dataIndex: 'dimension' },
          { title: '刷新规则', dataIndex: 'refreshRule' },
          { title: '状态', dataIndex: 'status' },
        ],
        data: rankings,
        rowKey: 'id',
      }),
    },
  };

  return leafPages;
}

export const legacyLeafMeta = flattenMenu(legacyMenuTree);

export function findLegacyPageMeta(path: string) {
  return legacyLeafMeta.find((item) => item.path === path) ?? legacyLeafMeta[0];
}

export function getLegacyPage(
  path: string,
  context: LegacyPageContext,
): LegacyLeafPage {
  const pages = buildLegacyPages(context);

  return pages[path] ?? pages['/'];
}

export function getLegacyMenuTree() {
  return legacyMenuTree;
}
