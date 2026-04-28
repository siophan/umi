export type AdminPermissionAction = 'view' | 'create' | 'edit' | 'manage';

export interface AdminPermissionDefinition {
  code: string;
  name: string;
  module: string;
  action: AdminPermissionAction;
  parentCode?: string | null;
  sort: number;
  path?: string;
}

type MenuPermissionInput = {
  code: string;
  name: string;
  module: string;
  path: string;
  sort: number;
  actions?: Array<Exclude<AdminPermissionAction, 'view'>>;
};

function menuPermission(input: MenuPermissionInput): AdminPermissionDefinition[] {
  const viewCode = `${input.code}.view`;
  const actionDefinitions = (input.actions ?? []).map((action, index) => ({
    code: `${input.code}.${action}`,
    name: input.name,
    module: input.module,
    action,
    parentCode: viewCode,
    sort: input.sort + index + 1,
  }));

  return [
    {
      code: viewCode,
      name: input.name,
      module: input.module,
      action: 'view',
      sort: input.sort,
      path: input.path,
    },
    ...actionDefinitions,
  ];
}

export const ADMIN_PERMISSION_DEFINITIONS: AdminPermissionDefinition[] = [
  ...menuPermission({ code: 'dashboard', name: '仪表盘', module: 'dashboard', sort: 100, path: '/dashboard' }),
  ...menuPermission({ code: 'user.list', name: '用户列表', module: 'user', sort: 210, path: '/users/list', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'shop.list', name: '店铺列表', module: 'shop', sort: 310, path: '/shops/list', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'shop.apply', name: '开店审核', module: 'shop', sort: 320, path: '/shops/apply', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'shop.products', name: '店铺商品', module: 'shop', sort: 330, path: '/shops/products', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'brand.list', name: '品牌列表', module: 'brand', sort: 410, path: '/brands/list', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'brand.auth', name: '品牌授权', module: 'brand', sort: 430, path: '/shops/brand-auth', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'product.brands', name: '品牌商品', module: 'product', sort: 510, path: '/products/brands', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'guess.list', name: '竞猜列表', module: 'guess', sort: 610, path: '/guesses/list', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'guess.friends', name: '好友竞猜', module: 'guess', sort: 630, path: '/guesses/friends', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'guess.pk', name: 'PK 对战', module: 'guess', sort: 640, path: '/pk', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'order.list', name: '订单列表', module: 'order', sort: 710, path: '/orders/list', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'order.transactions', name: '交易流水', module: 'order', sort: 720, path: '/orders/transactions', actions: ['manage'] }),
  ...menuPermission({ code: 'order.warehouse.virtual', name: '虚拟仓库', module: 'order', sort: 740, path: '/warehouse/virtual', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'order.warehouse.physical', name: '实体仓库', module: 'order', sort: 750, path: '/warehouse/physical', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'order.warehouse.consign', name: '寄售市场', module: 'order', sort: 760, path: '/warehouse/consign', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'marketing.equity', name: '权益金管理', module: 'marketing', sort: 810, path: '/equity', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'marketing.banners', name: '轮播管理', module: 'marketing', sort: 820, path: '/marketing/banners', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'marketing.coupons', name: '优惠券管理', module: 'marketing', sort: 830, path: '/marketing/coupons', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'marketing.checkin', name: '签到管理', module: 'marketing', sort: 840, path: '/marketing/checkin', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'marketing.invite', name: '邀请管理', module: 'marketing', sort: 850, path: '/marketing/invite', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'marketing.rankings', name: '排行榜配置', module: 'marketing', sort: 860, path: '/system/rankings', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'community.posts', name: '帖子管理', module: 'community', sort: 910, path: '/community/posts', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'community.comments', name: '评论管理', module: 'community', sort: 920, path: '/community/comments', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'community.reports', name: '举报处理', module: 'community', sort: 930, path: '/community/reports', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'community.live.list', name: '直播列表', module: 'community', sort: 940, path: '/live/list', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'community.chats', name: '聊天管理', module: 'community', sort: 950, path: '/system/chats', actions: ['edit', 'manage'] }),
  ...menuPermission({ code: 'system.users', name: '系统用户', module: 'system', sort: 1010, path: '/system/users', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'system.roles', name: '角色管理', module: 'system', sort: 1020, path: '/system/roles', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'system.permissions', name: '权限管理', module: 'system', sort: 1030, path: '/users/permissions', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'system.categories', name: '分类管理', module: 'system', sort: 1040, path: '/system/categories', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'system.notifications', name: '通知管理', module: 'system', sort: 1050, path: '/system/notifications', actions: ['create', 'edit', 'manage'] }),
  ...menuPermission({ code: 'system.settings', name: '参数设置', module: 'system', sort: 1060, path: '/system/settings', actions: ['edit', 'manage'] }),
];

export const ADMIN_MENU_PERMISSION_DEFINITIONS = ADMIN_PERMISSION_DEFINITIONS.filter(
  (item): item is AdminPermissionDefinition & { path: string } => Boolean(item.path),
);

export const ADMIN_PERMISSION_DEFINITION_BY_CODE = Object.fromEntries(
  ADMIN_PERMISSION_DEFINITIONS.map((item) => [item.code, item]),
) as Record<string, AdminPermissionDefinition>;

export const ADMIN_MENU_PERMISSION_BY_PATH = Object.fromEntries(
  ADMIN_MENU_PERMISSION_DEFINITIONS.map((item) => [item.path, item]),
) as Record<string, AdminPermissionDefinition & { path: string }>;

export function findAdminPermissionDefinitionByCode(code: string) {
  return ADMIN_PERMISSION_DEFINITION_BY_CODE[code] ?? null;
}

export function findAdminMenuPermissionByPath(path: string) {
  return ADMIN_MENU_PERMISSION_BY_PATH[path] ?? null;
}

export function getAdminPermissionChildren(parentCode: string) {
  return ADMIN_PERMISSION_DEFINITIONS.filter((item) => item.parentCode === parentCode);
}
