import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Table,
  Tag,
  Tabs,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminShopItem } from '../lib/api/merchant';
import { fetchAdminShopDetail, fetchAdminShops, updateAdminShopStatus } from '../lib/api/merchant';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDateTime, formatNumber } from '../lib/format';

interface ShopsPageProps {
  refreshToken?: number;
}

interface ShopsPageData {
  categories: AdminCategoryItem[];
  shops: AdminShopItem[];
}

type ShopFilters = {
  name?: string;
  category?: string;
  ownerName?: string;
};

const emptyData: ShopsPageData = { categories: [], shops: [] };

export function ShopsPage({ refreshToken = 0 }: ShopsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<ShopFilters>();
  const [data, setData] = useState<ShopsPageData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<ShopFilters>({});
  const [status, setStatus] = useState<'all' | AdminShopItem['status']>('all');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailIssue, setDetailIssue] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchAdminShopDetail>> | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const [shops, categories] = await Promise.all([
          fetchAdminShops().then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
        ]);
        if (!alive) {
          return;
        }
        setData({ categories, shops });
      } catch (error) {
        if (!alive) {
          return;
        }
        setData(emptyData);
        setIssue(error instanceof Error ? error.message : '店铺列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPageData();

    return () => {
      alive = false;
    };
  }, [refreshToken, actionSeed]);

  const categoryOptions = useMemo(() => {
    const activeCategories = data.categories
      .filter((item) => item.bizType === 'shop' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));

    if (activeCategories.length > 0) {
      return activeCategories;
    }

    return Array.from(new Set(data.shops.map((item) => item.category).filter(Boolean))).map(
      (value) => ({ label: String(value), value: String(value) }),
    );
  }, [data.categories, data.shops]);

  const statusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: data.shops.length },
      {
        key: 'active',
        label: '营业中',
        count: data.shops.filter((item) => item.status === 'active').length,
      },
      {
        key: 'paused',
        label: '暂停营业',
        count: data.shops.filter((item) => item.status === 'paused').length,
      },
      {
        key: 'closed',
        label: '已关闭',
        count: data.shops.filter((item) => item.status === 'closed').length,
      },
    ],
    [data.shops],
  );

  const filteredRows = useMemo(
    () =>
      data.shops.filter((record) => {
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
      }),
    [data.shops, filters, status],
  );

  const columns: ProColumns<AdminShopItem>[] = [
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
    { title: '生效授权', dataIndex: 'brandAuthCount', width: 120, render: (_, record) => formatNumber(record.brandAuthCount) },
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
          <Button size="small" type="link" onClick={() => void handleOpenDetail(record.id)}>
            查看
          </Button>
          {record.status === 'active' ? (
            <>
              <Popconfirm
                okButtonProps={{ loading: updatingId === record.id }}
                title="确认暂停该店铺？"
                onConfirm={() => void handleUpdateStatus(record, 'paused')}
              >
                <Button size="small" type="link">
                  暂停
                </Button>
              </Popconfirm>
              <Popconfirm
                okButtonProps={{ danger: true, loading: updatingId === record.id }}
                title="确认关闭该店铺？"
                description="关闭后店铺商品将自动下架；重新启用店铺时，不会自动恢复商品上架。"
                onConfirm={() => void handleUpdateStatus(record, 'closed')}
              >
                <Button danger size="small" type="link">
                  关闭
                </Button>
              </Popconfirm>
            </>
          ) : record.status === 'paused' ? (
            <>
              <Popconfirm
                okButtonProps={{ loading: updatingId === record.id }}
                title="确认启用该店铺？"
                onConfirm={() => void handleUpdateStatus(record, 'active')}
              >
                <Button size="small" type="link">
                  启用
                </Button>
              </Popconfirm>
              <Popconfirm
                okButtonProps={{ danger: true, loading: updatingId === record.id }}
                title="确认关闭该店铺？"
                description="关闭后店铺商品将自动下架；重新启用店铺时，不会自动恢复商品上架。"
                onConfirm={() => void handleUpdateStatus(record, 'closed')}
              >
                <Button danger size="small" type="link">
                  关闭
                </Button>
              </Popconfirm>
            </>
          ) : (
            <Popconfirm
              okButtonProps={{ loading: updatingId === record.id }}
              title="确认启用该店铺？"
              description="重新启用店铺后，之前因关闭而下架的商品不会自动恢复上架。"
              onConfirm={() => void handleUpdateStatus(record, 'active')}
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

  async function handleUpdateStatus(
    record: AdminShopItem,
    nextStatus: 'active' | 'paused' | 'closed',
  ) {
    setUpdatingId(record.id);
    try {
      await updateAdminShopStatus(record.id, { status: nextStatus });
      messageApi.success(
        nextStatus === 'active' ? '店铺已启用' : nextStatus === 'paused' ? '店铺已暂停' : '店铺已关闭',
      );
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '更新店铺状态失败');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleOpenDetail(shopId: string) {
    setSelectedShopId(shopId);
    setDetail(null);
    setDetailIssue(null);
    setDetailLoading(true);
    try {
      setDetail(await fetchAdminShopDetail(shopId));
    } catch (error) {
      setDetailIssue(error instanceof Error ? error.message : '店铺详情加载失败');
    } finally {
      setDetailLoading(false);
    }
  }

  const orderStatusLabelMap: Record<number, string> = {
    10: '待支付/待确认',
    20: '已支付',
    30: '已履约',
    40: '已关闭',
    90: '已退款',
  };

  const guessStatusLabelMap: Record<number, string> = {
    10: '草稿',
    20: '待审核',
    30: '进行中',
    40: '已结算',
    90: '已拒绝',
  };

  const detailTabs = detail
    ? [
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
            <Table
              pagination={{ pageSize: 5 }}
              rowKey="id"
              size="small"
              dataSource={detail.products}
              columns={[
                { title: '商品', dataIndex: 'name', render: (_, record) => (
                  <div>
                    <Typography.Text strong>{record.name}</Typography.Text>
                    <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>{record.brandName || '-'}</div>
                  </div>
                )},
                { title: '价格', dataIndex: 'price', width: 120, render: (value: number) => `¥${value.toFixed(2)}` },
                { title: '销量', dataIndex: 'sales', width: 90, render: (value: number) => formatNumber(value) },
                { title: '库存', dataIndex: 'stock', width: 90, render: (value: number, record) => `${formatNumber(value)} / 冻结 ${formatNumber(record.frozenStock)}` },
                { title: '状态', dataIndex: 'statusLabel', width: 100, render: (value: string, record) => (
                  <Tag color={record.status === 'active' ? 'success' : record.status === 'off_shelf' ? 'warning' : 'default'}>
                    {value}
                  </Tag>
                )},
              ]}
            />
          ),
        },
        {
          key: 'orders',
          label: `订单 (${detail.orders.length})`,
          children: (
            <Table
              pagination={{ pageSize: 5 }}
              rowKey="id"
              size="small"
              dataSource={detail.orders}
              columns={[
                { title: '订单号', dataIndex: 'orderNo', render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
                { title: '买家', dataIndex: 'buyerName' },
                { title: '金额', dataIndex: 'amount', width: 100, render: (value: number) => `¥${value.toFixed(2)}` },
                { title: '状态', dataIndex: 'statusCode', width: 120, render: (value: number) => orderStatusLabelMap[value] ?? String(value) },
                { title: '下单时间', dataIndex: 'createdAt', width: 180, render: (value: string | null) => formatDateTime(value) },
              ]}
            />
          ),
        },
        {
          key: 'guesses',
          label: `竞猜 (${detail.guesses.length})`,
          children: (
            <Table
              pagination={{ pageSize: 5 }}
              rowKey="id"
              size="small"
              dataSource={detail.guesses}
              columns={[
                { title: '标题', dataIndex: 'title' },
                { title: '状态', dataIndex: 'statusCode', width: 120, render: (value: number) => guessStatusLabelMap[value] ?? String(value) },
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
            <Table
              pagination={{ pageSize: 5 }}
              rowKey="id"
              size="small"
              dataSource={detail.brandAuths}
              columns={[
                { title: '授权单号', dataIndex: 'authNo', render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
                { title: '品牌', dataIndex: 'brandName' },
                { title: '授权类型', dataIndex: 'authTypeLabel', width: 120 },
                { title: '授权范围', dataIndex: 'authScopeLabel', width: 140 },
                { title: '状态', dataIndex: 'statusLabel', width: 100, render: (value: string, record) => (
                  <Tag color={record.status === 'active' ? 'success' : record.status === 'expired' ? 'default' : 'warning'}>
                    {value}
                  </Tag>
                )},
                { title: '生效时间', dataIndex: 'grantedAt', width: 180, render: (value: string | null) => formatDateTime(value) },
              ]}
            />
          ),
        },
      ]
    : [];

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="name">
          <Input allowClear placeholder="店铺名称" />
        </Form.Item>
        <Form.Item name="category">
          <Select allowClear options={categoryOptions} placeholder="主营类目" />
        </Form.Item>
        <Form.Item name="ownerName">
          <Input allowClear placeholder="店主" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs activeKey={status} items={statusItems} onChange={(key) => setStatus(key as typeof status)} />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminShopItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <Drawer
        open={selectedShopId != null}
        title="店铺详情"
        width={960}
        onClose={() => {
          setSelectedShopId(null);
          setDetail(null);
          setDetailIssue(null);
        }}
      >
        {detailIssue ? <Alert showIcon type="error" message={detailIssue} style={{ marginBottom: 16 }} /> : null}
        {detailLoading ? (
          <div style={{ padding: '48px 0' }}>
            <Typography.Text type="secondary">店铺详情加载中...</Typography.Text>
          </div>
        ) : detail ? (
          <Tabs items={detailTabs} />
        ) : (
          <Empty description="暂无店铺详情" />
        )}
      </Drawer>
    </div>
  );
}
