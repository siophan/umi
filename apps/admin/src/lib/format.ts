import type {
  GuessReviewStatus,
  GuessStatus,
  OrderStatus,
  UserRole,
  WarehouseStatus,
} from '@umi/shared';

type StatusMeta = {
  color:
    | 'success'
    | 'processing'
    | 'warning'
    | 'error'
    | 'default'
    | 'gold'
    | 'purple'
    | 'blue'
    | 'cyan'
    | 'green'
    | 'magenta';
  label: string;
};

const moneyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('zh-CN');

export const roleMeta: Record<UserRole, StatusMeta> = {
  user: { color: 'default', label: '普通用户' },
  admin: { color: 'processing', label: '管理员' },
  shop_owner: { color: 'gold', label: '认证店主' },
};

export const guessStatusMeta: Record<GuessStatus, StatusMeta> = {
  draft: { color: 'default', label: '草稿' },
  pending_review: { color: 'warning', label: '待审核' },
  active: { color: 'processing', label: '进行中' },
  pending_settle: { color: 'gold', label: '待结算' },
  settled: { color: 'success', label: '已结算' },
  abandoned: { color: 'default', label: '已作废' },
  cancelled: { color: 'error', label: '审核拒绝' },
};

export const guessReviewStatusMeta: Record<GuessReviewStatus, StatusMeta> = {
  pending: { color: 'warning', label: '待审核' },
  approved: { color: 'success', label: '已通过' },
  rejected: { color: 'error', label: '已拒绝' },
};

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  pending: { color: 'warning', label: '待支付' },
  paid: { color: 'processing', label: '已支付' },
  shipping: { color: 'blue', label: '配送中' },
  delivered: { color: 'cyan', label: '已送达' },
  completed: { color: 'success', label: '已完成' },
  refund_pending: { color: 'gold', label: '退款审核中' },
  refunded: { color: 'purple', label: '已退款' },
  cancelled: { color: 'error', label: '已关闭' },
};

export const warehouseStatusMeta: Record<WarehouseStatus, StatusMeta> = {
  stored: { color: 'processing', label: '在库' },
  locked: { color: 'warning', label: '冻结中' },
  converted: { color: 'blue', label: '已转换' },
  consigning: { color: 'gold', label: '寄售中' },
  shipping: { color: 'cyan', label: '配送中' },
  delivered: { color: 'purple', label: '已送达' },
  completed: { color: 'success', label: '已完成' },
};

export const productStatusMeta: Record<
  'active' | 'draft' | 'paused' | 'low_stock' | 'off_shelf' | 'disabled',
  StatusMeta
> = {
  active: { color: 'success', label: '在售' },
  draft: { color: 'default', label: '草稿' },
  paused: { color: 'warning', label: '已暂停' },
  low_stock: { color: 'error', label: '低库存' },
  off_shelf: { color: 'warning', label: '已下架' },
  disabled: { color: 'error', label: '不可售' },
};

export function formatAmount(value: number) {
  return moneyFormatter.format(value / 100);
}

export function formatYuanAmount(value: number) {
  return moneyFormatter.format(value);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPercent(value?: number | null) {
  if (value == null) {
    return '-';
  }

  return `${value.toFixed(1)}%`;
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatFullDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
