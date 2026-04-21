import type { WarehouseItem } from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Typography } from 'antd';

import { formatAmount, formatDateTime, warehouseStatusMeta } from './format';

export type WarehouseFilters = {
  productName?: string;
  sourceType?: string;
  userId?: string;
};

export type WarehouseStatusFilter = 'all' | WarehouseItem['status'];

export const virtualSourceTypeOptions = [
  { label: '竞猜奖励', value: '竞猜奖励' },
  { label: '订单入仓', value: '订单入仓' },
  { label: '兑换入仓', value: '兑换入仓' },
  { label: '手工入仓', value: '手工入仓' },
];

export const physicalSourceTypeOptions = [
  { label: '商家发货', value: '商家发货' },
  { label: '竞猜奖励', value: '竞猜奖励' },
  { label: '仓库商品', value: '仓库商品' },
  { label: '仓库调入', value: '仓库调入' },
];

export function buildWarehouseSourceTypeOptions(warehouseType: WarehouseItem['warehouseType']) {
  return warehouseType === 'virtual' ? virtualSourceTypeOptions : physicalSourceTypeOptions;
}

export function filterWarehouseItems(
  items: WarehouseItem[],
  filters: WarehouseFilters,
  status: WarehouseStatusFilter,
  warehouseType: WarehouseItem['warehouseType'],
) {
  const visibleItems =
    warehouseType === 'physical'
      ? items.filter((item) => item.status !== 'consigning')
      : items;

  return visibleItems.filter((item) => {
    if (status !== 'all' && item.status !== status) {
      return false;
    }
    if (
      filters.productName &&
      !item.productName.toLowerCase().includes(filters.productName.trim().toLowerCase())
    ) {
      return false;
    }
    if (filters.sourceType && item.sourceType !== filters.sourceType) {
      return false;
    }
    if (
      filters.userId &&
      !String(item.userId).toLowerCase().includes(filters.userId.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

export function buildWarehouseStatusItems(
  items: WarehouseItem[],
  warehouseType: WarehouseItem['warehouseType'],
) {
  if (warehouseType === 'virtual') {
    return [
      { key: 'all', label: '全部', count: items.length },
      { key: 'stored', label: '在库', count: items.filter((item) => item.status === 'stored').length },
      { key: 'locked', label: '冻结中', count: items.filter((item) => item.status === 'locked').length },
      { key: 'converted', label: '已转换', count: items.filter((item) => item.status === 'converted').length },
    ];
  }

  const pageItems = items.filter((item) => item.status !== 'consigning');

  return [
    { key: 'all', label: '全部', count: pageItems.length },
    { key: 'stored', label: '在库', count: pageItems.filter((item) => item.status === 'stored').length },
    { key: 'shipping', label: '配送中', count: pageItems.filter((item) => item.status === 'shipping').length },
    { key: 'delivered', label: '已送达', count: pageItems.filter((item) => item.status === 'delivered').length },
    { key: 'completed', label: '已完成', count: pageItems.filter((item) => item.status === 'completed').length },
  ];
}

type BuildWarehouseColumnsOptions = {
  warehouseType: WarehouseItem['warehouseType'];
  onView: (record: WarehouseItem) => void;
};

export function buildWarehouseColumns({
  warehouseType,
  onView,
}: BuildWarehouseColumnsOptions): ProColumns<WarehouseItem>[] {
  const baseColumns: ProColumns<WarehouseItem>[] = [
    {
      title: '商品',
      dataIndex: 'productName',
      width: 240,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {record.productImg ? (
            <img
              src={record.productImg}
              alt={record.productName}
              style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
            />
          ) : null}
          <Typography.Text strong>{record.productName}</Typography.Text>
        </div>
      ),
    },
    {
      title: '用户 ID',
      dataIndex: 'userId',
      width: 160,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={warehouseStatusMeta[record.status].color}>
          {warehouseStatusMeta[record.status].label}
        </Tag>
      ),
    },
    {
      title: '入库时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => formatDateTime(record.createdAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => onView(record)}>
          查看
        </Button>
      ),
    },
  ];

  if (warehouseType === 'virtual') {
    baseColumns.splice(
      3,
      0,
      {
        title: '单价',
        dataIndex: 'price',
        width: 120,
        render: (_, record) => formatAmount((record.price ?? 0) * 100),
      },
      {
        title: '总价值',
        key: 'totalAmount',
        width: 130,
        render: (_, record) => formatAmount((record.price ?? 0) * record.quantity * 100),
      },
    );
  } else {
    baseColumns.splice(3, 0, {
      title: '原价值',
      dataIndex: 'price',
      width: 120,
      render: (_, record) => formatAmount((record.price ?? 0) * 100),
    });
  }

  return baseColumns;
}
