import type { ProColumns } from '@ant-design/pro-components';
import { Button, Descriptions, Popconfirm, Table, Tag, Typography } from 'antd';

import type { AdminCategoryItem } from './api/categories';
import type { AdminShopItem } from './api/merchant';
import { formatDateTime, formatNumber } from './format';

type ShopDetail = Awaited<ReturnType<typeof import('./api/merchant')['fetchAdminShopDetail']>>;

export interface ShopsPageData {
  categories: AdminCategoryItem[];
  shops: AdminShopItem[];
}

export type ShopFilters = {
  name?: string;
  category?: string;
  ownerName?: string;
};

export const EMPTY_SHOPS_DATA: ShopsPageData = { categories: [], shops: [] };

export function buildShopCategoryOptions(data: ShopsPageData) {
  const referencedCategories = new Set(
    data.shops.map((item) => item.category).filter((value): value is string => Boolean(value)),
  );
  const knownOptions = data.categories
    .filter((item) => item.bizType === 'shop')
    .filter((item) => item.status === 'active' || referencedCategories.has(item.name))
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === 'active' ? -1 : 1;
      }
      return left.name.localeCompare(right.name, 'zh-CN');
    })
    .map((item) => ({
      label: item.status === 'active' ? item.name : `${item.name}（已停用）`,
      value: item.name,
    }));

  const missingOptions = Array.from(referencedCategories)
    .filter((value) => !data.categories.some((item) => item.bizType === 'shop' && item.name === value))
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
    .map((value) => ({ label: `${value}（历史类目）`, value }));

  return [...knownOptions, ...missingOptions];
}

export function buildShopStatusItems(shops: AdminShopItem[]) {
  return [
    { key: 'all', label: '全部', count: shops.length },
    {
      key: 'active',
      label: '营业中',
      count: shops.filter((item) => item.status === 'active').length,
    },
    {
      key: 'paused',
      label: '暂停营业',
      count: shops.filter((item) => item.status === 'paused').length,
    },
    {
      key: 'closed',
      label: '已关闭',
      count: shops.filter((item) => item.status === 'closed').length,
    },
  ];
}

export function filterShops(
  shops: AdminShopItem[],
  filters: ShopFilters,
  status: 'all' | AdminShopItem['status'],
) {
  return shops.filter((record) => {
    if (status !== 'all' && record.status !== status) {
      return false;
    }
    if (filters.name && !record.name.toLowerCase().includes(filters.name.trim().toLowerCase())) {
      return false;
    }
    if (filters.category && record.category !== filters.category) {
      return false;
    }
    if (
      filters.ownerName &&
      !record.ownerName.toLowerCase().includes(filters.ownerName.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

export function buildShopColumns(args: {
  onOpenDetail: (shopId: string) => void;
  onUpdateStatus: (record: AdminShopItem, nextStatus: 'active' | 'paused' | 'closed') => void;
  updatingId: string | null;
}): ProColumns<AdminShopItem>[] {
  return [
    {
      title: '店铺',
      dataIndex: 'name',
      width: 220,
      render: (_, record) => <Typography.Text strong>{record.name}</Typography.Text>,
    },
    { title: '店主', dataIndex: 'ownerName', width: 140, render: (_, record) => record.ownerName || '-' },
    { title: '主营类目', dataIndex: 'category', width: 180, render: (_, record) => record.category || '-' },
    { title: '商品数', dataIndex: 'products', width: 100, render: (_, record) => formatNumber(record.products) },
    { title: '履约单量', dataIndex: 'orders', width: 120, render: (_, record) => formatNumber(record.orders) },
    {
      title: '生效授权',
      dataIndex: 'brandAuthCount',
      width: 120,
      render: (_, record) => formatNumber(record.brandAuthCount),
    },
    {
      title: '评分',
      dataIndex: 'score',
      width: 100,
      render: (_, record) => (record.score ? record.score.toFixed(2) : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : record.status === 'paused' ? 'warning' : 'default'}>
          {record.statusLabel}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => args.onOpenDetail(record.id)}>
            查看
          </Button>
          {record.status === 'active' ? (
            <>
              <Popconfirm
                okButtonProps={{ loading: args.updatingId === record.id }}
                title="确认暂停该店铺？"
                onConfirm={() => args.onUpdateStatus(record, 'paused')}
              >
                <Button size="small" type="link">
                  暂停
                </Button>
              </Popconfirm>
              <Popconfirm
                okButtonProps={{ danger: true, loading: args.updatingId === record.id }}
                title="确认关闭该店铺？"
                description="关闭后店铺商品将自动下架；重新启用店铺时，不会自动恢复商品上架。"
                onConfirm={() => args.onUpdateStatus(record, 'closed')}
              >
                <Button danger size="small" type="link">
                  关闭
                </Button>
              </Popconfirm>
            </>
          ) : record.status === 'paused' ? (
            <>
              <Popconfirm
                okButtonProps={{ loading: args.updatingId === record.id }}
                title="确认启用该店铺？"
                onConfirm={() => args.onUpdateStatus(record, 'active')}
              >
                <Button size="small" type="link">
                  启用
                </Button>
              </Popconfirm>
              <Popconfirm
                okButtonProps={{ danger: true, loading: args.updatingId === record.id }}
                title="确认关闭该店铺？"
                description="关闭后店铺商品将自动下架；重新启用店铺时，不会自动恢复商品上架。"
                onConfirm={() => args.onUpdateStatus(record, 'closed')}
              >
                <Button danger size="small" type="link">
                  关闭
                </Button>
              </Popconfirm>
            </>
          ) : (
            <Popconfirm
              okButtonProps={{ loading: args.updatingId === record.id }}
              title="确认启用该店铺？"
              description="重新启用店铺后，之前因关闭而下架的商品不会自动恢复上架。"
              onConfirm={() => args.onUpdateStatus(record, 'active')}
            >
              <Button size="small" type="link">
                启用
              </Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];
}

const ORDER_STATUS_LABEL_MAP: Record<number, string> = {
  10: '待支付/待确认',
  20: '已支付',
  30: '已履约',
  40: '已关闭',
  90: '已退款',
};

const GUESS_STATUS_LABEL_MAP: Record<number, string> = {
  10: '草稿',
  20: '待审核',
  30: '进行中',
  40: '已结算',
  90: '已拒绝',
};

export function buildShopDetailTabs(detail: ShopDetail) {
  return [
    {
      key: 'overview',
      label: '基础信息',
      children: (
        <Descriptions column={2} size="small">
          <Descriptions.Item label="店铺名称">{detail.shop.name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag
              color={
                detail.shop.status === 'active'
                  ? 'success'
                  : detail.shop.status === 'paused'
                    ? 'warning'
                    : 'default'
              }
            >
              {detail.shop.statusLabel}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="店主">{detail.shop.ownerName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{detail.shop.ownerPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="主营类目">{detail.shop.category || '-'}</Descriptions.Item>
          <Descriptions.Item label="商品均分">
            {detail.shop.score ? detail.shop.score.toFixed(2) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="商品数">{formatNumber(detail.shop.products)}</Descriptions.Item>
          <Descriptions.Item label="履约单量">{formatNumber(detail.shop.orders)}</Descriptions.Item>
          <Descriptions.Item label="累计销量">{formatNumber(detail.shop.totalSales)}</Descriptions.Item>
          <Descriptions.Item label="生效授权">{formatNumber(detail.shop.brandAuthCount)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(detail.shop.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(detail.shop.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="店铺简介" span={2}>
            {detail.shop.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'products',
      label: `商品 (${detail.products.length})`,
      children: (
        <Table<(typeof detail.products)[number]>
          pagination={{ pageSize: 5 }}
          rowKey="id"
          size="small"
          dataSource={detail.products}
          columns={[
            {
              title: '商品',
              dataIndex: 'name',
              render: (_, record) => (
                <div>
                  <Typography.Text strong>{record.name}</Typography.Text>
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>{record.brandName || '-'}</div>
                </div>
              ),
            },
            { title: '价格', dataIndex: 'price', width: 120, render: (value: number) => `¥${value.toFixed(2)}` },
            { title: '销量', dataIndex: 'sales', width: 90, render: (value: number) => formatNumber(value) },
            {
              title: '库存',
              dataIndex: 'stock',
              width: 90,
              render: (value: number, record) => `${formatNumber(value)} / 冻结 ${formatNumber(record.frozenStock)}`,
            },
            {
              title: '状态',
              dataIndex: 'statusLabel',
              width: 100,
              render: (value: string, record) => (
                <Tag color={record.status === 'active' ? 'success' : record.status === 'off_shelf' ? 'warning' : 'default'}>
                  {value}
                </Tag>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'orders',
      label: `订单 (${detail.orders.length})`,
      children: (
        <Table<(typeof detail.orders)[number]>
          pagination={{ pageSize: 5 }}
          rowKey="id"
          size="small"
          dataSource={detail.orders}
          columns={[
            { title: '订单号', dataIndex: 'orderNo', render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
            { title: '买家', dataIndex: 'buyerName' },
            { title: '金额', dataIndex: 'amount', width: 100, render: (value: number) => `¥${value.toFixed(2)}` },
            { title: '状态', dataIndex: 'statusCode', width: 120, render: (value: number) => ORDER_STATUS_LABEL_MAP[value] ?? String(value) },
            { title: '下单时间', dataIndex: 'createdAt', width: 180, render: (value: string | null) => formatDateTime(value) },
          ]}
        />
      ),
    },
    {
      key: 'guesses',
      label: `竞猜 (${detail.guesses.length})`,
      children: (
        <Table<(typeof detail.guesses)[number]>
          pagination={{ pageSize: 5 }}
          rowKey="id"
          size="small"
          dataSource={detail.guesses}
          columns={[
            { title: '标题', dataIndex: 'title' },
            { title: '状态', dataIndex: 'statusCode', width: 120, render: (value: number) => GUESS_STATUS_LABEL_MAP[value] ?? String(value) },
            { title: '下注数', dataIndex: 'betCount', width: 100, render: (value: number) => formatNumber(value) },
            { title: '截止时间', dataIndex: 'endTime', width: 180, render: (value: string | null) => formatDateTime(value) },
          ]}
        />
      ),
    },
    {
      key: 'brandAuths',
      label: `品牌授权 (${detail.brandAuths.length})`,
      children: (
        <Table<(typeof detail.brandAuths)[number]>
          pagination={{ pageSize: 5 }}
          rowKey="id"
          size="small"
          dataSource={detail.brandAuths}
          columns={[
            { title: '授权单号', dataIndex: 'authNo', render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
            { title: '品牌', dataIndex: 'brandName' },
            { title: '授权类型', dataIndex: 'authTypeLabel', width: 120 },
            { title: '授权范围', dataIndex: 'authScopeLabel', width: 140 },
            {
              title: '状态',
              dataIndex: 'statusLabel',
              width: 100,
              render: (value: string, record) => (
                <Tag color={record.status === 'active' ? 'success' : record.status === 'expired' ? 'default' : 'warning'}>
                  {value}
                </Tag>
              ),
            },
            { title: '生效时间', dataIndex: 'grantedAt', width: 180, render: (value: string | null) => formatDateTime(value) },
          ]}
        />
      ),
    },
  ];
}
