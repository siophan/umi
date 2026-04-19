export const adminModules = [
  {
    key: 'dashboard',
    title: '概览',
    pageTitle: '首页概览',
    description: '运营概览、核心转化和异常监控。',
  },
  {
    key: 'users',
    title: '用户',
    pageTitle: '用户管理',
    description: '用户列表、角色、封禁和行为回看。',
  },
  {
    key: 'products',
    title: '商品',
    pageTitle: '商品管理',
    description: '商品列表、详情、导入和库存入口。',
  },
  {
    key: 'guesses',
    title: '竞猜',
    pageTitle: '竞猜管理',
    description: '竞猜创建、审核、开奖、取消。',
  },
  {
    key: 'orders',
    title: '订单',
    pageTitle: '订单履约',
    description: '订单列表、发货、退款审核。',
  },
  {
    key: 'warehouse',
    title: '仓库',
    pageTitle: '仓库与寄售',
    description: '虚拟仓、实体仓、寄售视图。',
  },
] as const;

export type AdminModuleKey = (typeof adminModules)[number]['key'];
