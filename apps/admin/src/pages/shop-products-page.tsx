import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, message, Popconfirm, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminShopProductItem } from '../lib/api/merchant';
import { fetchAdminShopProducts, updateAdminShopProductStatus } from '../lib/api/merchant';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatAmount, formatNumber, productStatusMeta } from '../lib/format';

interface ShopProductsPageProps {
  refreshToken?: number;
}

type ShopProductFilters = {
  shopName?: string;
  productName?: string;
  brandName?: string;
};

const emptyRows: AdminShopProductItem[] = [];

function renderStock(value: number) {
  return Number.isFinite(value) ? formatNumber(value) : '-';
}

export function ShopProductsPage({ refreshToken = 0 }: ShopProductsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<ShopProductFilters>();
  const [rows, setRows] = useState<AdminShopProductItem[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<ShopProductFilters>({});
  const [status, setStatus] = useState<'all' | AdminShopProductItem['status']>('all');
  const [selected, setSelected] = useState<AdminShopProductItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<{ total: number; byStatus: Record<string, number> }>({
    total: 0,
    byStatus: {},
  });

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminShopProducts({
          page,
          pageSize,
          shopName: filters.shopName,
          productName: filters.productName,
          brandName: filters.brandName,
          status,
        });
        if (!alive) {
          return;
        }
        setRows(result.items);
        setTotal(result.total);
        setSummary(result.summary);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows(emptyRows);
        setTotal(0);
        setSummary({ total: 0, byStatus: {} });
        setIssue(error instanceof Error ? error.message : '店铺商品加载失败');
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
  }, [actionSeed, filters.brandName, filters.productName, filters.shopName, page, pageSize, refreshToken, status]);

  const statusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: summary.total },
      { key: 'active', label: '在售', count: summary.byStatus.active ?? 0 },
      { key: 'disabled', label: '不可售', count: summary.byStatus.disabled ?? 0 },
      { key: 'off_shelf', label: '已下架', count: summary.byStatus.off_shelf ?? 0 },
    ],
    [summary],
  );

  const columns: ProColumns<AdminShopProductItem>[] = [
    { title: '店铺', dataIndex: 'shopName', width: 200 },
    { title: '商品', dataIndex: 'productName', width: 220 },
    { title: '品牌', dataIndex: 'brandName', width: 180, render: (_, record) => record.brandName || '-' },
    { title: '售价', dataIndex: 'price', width: 120, render: (_, record) => formatAmount(record.price) },
    { title: '可用库存', dataIndex: 'availableStock', width: 120, render: (_, record) => renderStock(record.availableStock) },
    { title: '销量', dataIndex: 'sales', width: 120, render: (_, record) => formatNumber(record.sales) },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => <Tag color={productStatusMeta[record.status].color}>{record.statusLabel}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => {
        const canActivate = record.status === 'off_shelf';
        const canOffShelf = record.status === 'active';

        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" type="link" onClick={() => setSelected(record)}>
              查看
            </Button>
            {canActivate ? (
              <Popconfirm
                okButtonProps={{ loading: updatingId === record.id }}
                title="确认上架该商品？"
                onConfirm={() => void handleUpdateStatus(record, 'active')}
              >
                <Button size="small" type="link">
                  上架
                </Button>
              </Popconfirm>
            ) : null}
            {canOffShelf ? (
              <Popconfirm
                okButtonProps={{ loading: updatingId === record.id }}
                title="确认下架该商品？"
                onConfirm={() => void handleUpdateStatus(record, 'off_shelf')}
              >
                <Button size="small" type="link">
                  下架
                </Button>
              </Popconfirm>
            ) : null}
          </div>
        );
      },
    },
  ];

  async function handleUpdateStatus(
    record: AdminShopProductItem,
    nextStatus: 'active' | 'off_shelf',
  ) {
    setUpdatingId(record.id);
    try {
      await updateAdminShopProductStatus(record.id, { status: nextStatus });
      messageApi.success(nextStatus === 'active' ? '商品已上架' : '商品已下架');
      setActionSeed((value) => value + 1);
      if (selected?.id === record.id) {
        setSelected(null);
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '更新商品状态失败');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={searchForm}
        onSearch={() => {
          setFilters(searchForm.getFieldsValue());
          setPage(1);
        }}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
          setPage(1);
          setPageSize(10);
        }}
      >
        <Form.Item name="shopName">
          <Input allowClear placeholder="店铺" />
        </Form.Item>
        <Form.Item name="productName">
          <Input allowClear placeholder="商品名称" />
        </Form.Item>
        <Form.Item name="brandName">
          <Input allowClear placeholder="品牌" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => {
          setStatus(key as typeof status);
          setPage(1);
        }}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminShopProductItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={rows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              if (nextPageSize !== pageSize) {
                setPageSize(nextPageSize);
              }
            },
          }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <Drawer open={selected != null} title="店铺商品详情" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="店铺">{selected.shopName}</Descriptions.Item>
            <Descriptions.Item label="商品">{selected.productName}</Descriptions.Item>
            <Descriptions.Item label="品牌">{selected.brandName || '-'}</Descriptions.Item>
            <Descriptions.Item label="售价">{formatAmount(selected.price)}</Descriptions.Item>
            <Descriptions.Item label="可用库存">{renderStock(selected.availableStock)}</Descriptions.Item>
            <Descriptions.Item label="销量">{formatNumber(selected.sales)}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={productStatusMeta[selected.status].color}>{selected.statusLabel}</Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
