export const adminModules = [
  {
    key: 'dashboard',
    title: '概览',
    pageTitle: '运营总览',
    description: '运营概览、核心转化和异常监控。',
    owner: '运营',
    status: '已规划',
  },
  {
    key: 'users',
    title: '用户',
    pageTitle: '用户管理',
    description: '用户列表、角色、封禁和行为回看。',
    owner: '用户运营',
    status: '待接线',
  },
  {
    key: 'products',
    title: '商品',
    pageTitle: '商品管理',
    description: '商品列表、详情、导入和库存入口。',
    owner: '商品运营',
    status: '待接线',
  },
  {
    key: 'guesses',
    title: '竞猜',
    pageTitle: '竞猜管理',
    description: '竞猜创建、审核、开奖、取消。',
    owner: '风控 / 运营',
    status: '优先接入',
  },
  {
    key: 'orders',
    title: '订单',
    pageTitle: '订单履约',
    description: '订单列表、发货、退款审核。',
    owner: '履约',
    status: '优先接入',
  },
  {
    key: 'warehouse',
    title: '仓库',
    pageTitle: '仓库与寄售',
    description: '虚拟仓、实体仓、寄售视图。',
    owner: '仓储',
    status: '待接线',
  },
] as const;

export type AdminModuleKey = (typeof adminModules)[number]['key'];
