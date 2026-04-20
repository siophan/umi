import type { TableColumnsType } from 'antd';
import { ProTable } from '@ant-design/pro-components';

import { Alert, Card, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { fetchAdminCategories, type AdminCategoryItem } from '../lib/api/categories';
import {
  fetchAdminProducts,
  type AdminProduct,
} from '../lib/api/catalog';
import { formatAmount, formatDateTime, productStatusMeta } from '../lib/format';
import { ADMIN_LIST_TABLE_THEME } from './shared/admin-page-tools';

interface ProductsPageProps {
  refreshToken?: number;
}

export function ProductsPage({ refreshToken = 0 }: ProductsPageProps) {
  const [selected, setSelected] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [filters, setFilters] = useState<{
    name?: string;
    category?: string;
    shopName?: string;
  }>({});
  const [status, setStatus] = useState<'all' | AdminProduct['status']>('all');
  const [form] = Form.useForm<{ name?: string; category?: string; shopName?: string }>();

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          fetchAdminProducts({ page: 1, pageSize: 100 }),
          fetchAdminCategories(),
        ]);
        if (!alive) {
          return;
        }
        setProducts(productsResult.items);
        setCategories(categoriesResult.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setProducts([]);
        setCategories([]);
        setIssue(error instanceof Error ? error.message : '商品列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (status !== 'all' && product.status !== status) {
        return false;
      }
      if (
        filters.name &&
        !product.name.toLowerCase().includes(filters.name.trim().toLowerCase())
      ) {
        return false;
      }
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      if (filters.shopName && product.shopName !== filters.shopName) {
        return false;
      }
      return true;
    });
  }, [filters, products, status]);

  const categoryOptions = useMemo(
    () => {
      const fullCategoryOptions = categories
        .filter((item) => item.bizType === 'product' && item.status === 'active')
        .map((item) => ({
          label: item.name,
          value: item.name,
        }));

      if (fullCategoryOptions.length > 0) {
        return fullCategoryOptions;
      }

      return Array.from(new Set(products.map((item) => item.category).filter(Boolean))).map((value) => ({
        label: value,
        value,
      }));
    },
    [categories, products],
  );

  const shopOptions = useMemo(
    () =>
      Array.from(new Set(products.map((item) => item.shopName).filter(Boolean))).map((value) => ({
        label: value,
        value,
      })),
    [products],
  );

  const columns: TableColumnsType<AdminProduct> = [
    {
      title: '商品',
      dataIndex: 'name',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.brand}</Typography.Text>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
    },
    {
      title: '店铺',
      dataIndex: 'shopName',
    },
    {
      title: '售价',
      dataIndex: 'price',
      render: (value: number) => formatAmount(value),
    },
    {
      title: '库存',
      dataIndex: 'stock',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: AdminProduct['status']) => (
        <Tag color={productStatusMeta[value].color}>{productStatusMeta[value].label}</Tag>
      ),
    },
    {
      title: '最近更新',
      dataIndex: 'updatedAt',
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={form}
        onSearch={() => {
          const values = form.getFieldsValue();
          setFilters(values);
        }}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="name">
          <Input placeholder="商品名称" allowClear />
        </Form.Item>
        <Form.Item name="category">
          <Select placeholder="分类" allowClear options={categoryOptions} />
        </Form.Item>
        <Form.Item name="shopName">
          <Select placeholder="店铺" allowClear options={shopOptions} />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: products.length },
          { key: 'active', label: '在售', count: products.filter((item) => item.status === 'active').length },
          { key: 'low_stock', label: '低库存', count: products.filter((item) => item.status === 'low_stock').length },
          { key: 'paused', label: '暂停', count: products.filter((item) => item.status === 'paused').length },
          { key: 'off_shelf', label: '下架', count: products.filter((item) => item.status === 'off_shelf').length },
          { key: 'disabled', label: '不可售', count: products.filter((item) => item.status === 'disabled').length },
        ]}
        onChange={(key) => setStatus(key as 'all' | AdminProduct['status'])}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminProduct>
          cardBordered={false}
          rowKey="id"
          columns={columns as never}
          columnsState={{}}
          dataSource={filteredProducts}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
          onRow={(record) => ({
            onClick: () => setSelected(record),
          })}
        />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        width={420}
        title={selected?.name}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: 'grid', gap: 16, width: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="品牌">{selected.brand}</Descriptions.Item>
              <Descriptions.Item label="分类">{selected.category}</Descriptions.Item>
              <Descriptions.Item label="所属店铺">{selected.shopName}</Descriptions.Item>
              <Descriptions.Item label="售价">
                {formatAmount(selected.price)}
              </Descriptions.Item>
              <Descriptions.Item label="库存">{selected.stock}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={productStatusMeta[selected.status].color}>
                  {productStatusMeta[selected.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="最近更新">
                {formatDateTime(selected.updatedAt)}
              </Descriptions.Item>
            </Descriptions>

            <Card title="标签" size="small">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selected.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
