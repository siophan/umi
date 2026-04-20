import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminBrandLibraryItem } from '../lib/api/catalog';
import { fetchAdminBrandLibrary } from '../lib/api/catalog';
import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatAmount, formatDateTime, formatNumber } from '../lib/format';

interface BrandLibraryPageProps {
  refreshToken?: number;
}

interface BrandLibraryPageData {
  brandLibrary: AdminBrandLibraryItem[];
  categories: AdminCategoryItem[];
}

type BrandLibraryFilters = {
  productName?: string;
  brandName?: string;
  category?: string;
};

const emptyData: BrandLibraryPageData = { brandLibrary: [], categories: [] };

export function BrandLibraryPage({ refreshToken = 0 }: BrandLibraryPageProps) {
  const [searchForm] = Form.useForm<BrandLibraryFilters>();
  const [data, setData] = useState<BrandLibraryPageData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrandLibraryFilters>({});
  const [status, setStatus] = useState<'all' | AdminBrandLibraryItem['status']>('all');
  const [selected, setSelected] = useState<AdminBrandLibraryItem | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const [brandLibrary, categories] = await Promise.all([
          fetchAdminBrandLibrary({ page: 1, pageSize: 100 }).then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
        ]);
        if (!alive) return;
        setData({ brandLibrary, categories });
      } catch (error) {
        if (!alive) return;
        setData(emptyData);
        setIssue(error instanceof Error ? error.message : '品牌商品加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const brandOptions = useMemo(() => buildOptions(data.brandLibrary, 'brandName'), [data.brandLibrary]);
  const categoryOptions = useMemo(() => {
    const activeCategories = data.categories
      .filter((item) => item.bizType === 'product' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));
    if (activeCategories.length > 0) return activeCategories;
    return buildOptions(data.brandLibrary, 'category');
  }, [data.brandLibrary, data.categories]);
  const filteredRows = useMemo(
    () =>
      data.brandLibrary.filter((record) => {
        if (status !== 'all' && record.status !== status) return false;
        if (filters.productName && !record.productName.toLowerCase().includes(filters.productName.trim().toLowerCase())) return false;
        if (filters.brandName && record.brandName !== filters.brandName) return false;
        if (filters.category && record.category !== filters.category) return false;
        return true;
      }),
    [data.brandLibrary, filters.brandName, filters.category, filters.productName, status],
  );

  const columns: ProColumns<AdminBrandLibraryItem>[] = [
    {
      title: '品牌商品',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.productName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.brandName}</Typography.Text>
        </div>
      ),
    },
    { title: '分类', dataIndex: 'category', width: 160, render: (_, record) => record.category || '-' },
    { title: '指导价', dataIndex: 'guidePrice', width: 120, render: (_, record) => formatAmount(record.guidePrice) },
    { title: '挂载商品', dataIndex: 'productCount', width: 120, render: (_, record) => formatNumber(record.productCount) },
    { title: '在售商品', dataIndex: 'activeProductCount', width: 120, render: (_, record) => formatNumber(record.activeProductCount) },
    {
      title: '状态',
      width: 120,
      render: (_, record) => <Tag color={record.status === 'active' ? 'success' : 'default'}>{record.status === 'active' ? '启用' : '停用'}</Tag>,
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: (_, record) => formatDateTime(record.updatedAt) },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => <Button size="small" type="link" onClick={() => setSelected(record)}>查看</Button>,
    },
  ];

  return (
    <div className="page-stack">
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
        <Form.Item name="productName">
          <Input allowClear placeholder="商品名称" />
        </Form.Item>
        <Form.Item name="brandName">
          <Select allowClear options={brandOptions} placeholder="品牌" />
        </Form.Item>
        <Form.Item name="category">
          <Select allowClear options={categoryOptions} placeholder="分类" />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: data.brandLibrary.length },
          { key: 'active', label: '启用', count: data.brandLibrary.filter((item) => item.status === 'active').length },
          { key: 'disabled', label: '停用', count: data.brandLibrary.filter((item) => item.status === 'disabled').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminBrandLibraryItem>
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
      <Drawer open={selected != null} title="品牌商品详情" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="商品">{selected.productName}</Descriptions.Item>
            <Descriptions.Item label="品牌">{selected.brandName}</Descriptions.Item>
            <Descriptions.Item label="分类">{selected.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="指导价">{formatAmount(selected.guidePrice)}</Descriptions.Item>
            <Descriptions.Item label="挂载商品">{formatNumber(selected.productCount)}</Descriptions.Item>
            <Descriptions.Item label="在售商品">{formatNumber(selected.activeProductCount)}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status === 'active' ? '启用' : '停用'}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
