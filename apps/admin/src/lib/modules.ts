export const adminModules = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    description: '运营概览、核心转化和异常监控。',
  },
  {
    key: 'users',
    title: 'Users',
    description: '用户列表、角色、封禁和行为回看。',
  },
  {
    key: 'products',
    title: 'Products',
    description: '商品列表、详情、导入和库存入口。',
  },
  {
    key: 'guesses',
    title: 'Guesses',
    description: '竞猜创建、审核、开奖、取消。',
  },
  {
    key: 'orders',
    title: 'Orders',
    description: '订单列表、发货、退款审核。',
  },
  {
    key: 'warehouse',
    title: 'Warehouse',
    description: '虚拟仓、实体仓、寄售视图。',
  },
] as const;
