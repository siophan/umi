import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { EntityId } from '@umi/shared';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  AdminSearchPanel,
  AdminStatusTabs,
  SEARCH_THEME,
} from '../components/admin-list-controls';
import type { AdminBrandLibraryItem } from '../lib/api/catalog';
import {
  createAdminBrandProduct,
  fetchAdminBrandLibrary,
  updateAdminBrandProduct,
} from '../lib/api/catalog';
import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminBrandItem } from '../lib/api/merchant';
import { fetchAdminBrands } from '../lib/api/merchant';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatAmount, formatDate, formatDateTime, formatNumber } from '../lib/format';

interface BrandLibraryPageProps {
  refreshToken?: number;
}

interface BrandLibraryPageData {
  brandLibrary: AdminBrandLibraryItem[];
  brands: AdminBrandItem[];
  categories: AdminCategoryItem[];
}

type BrandLibraryFilters = {
  productName?: string;
  brandName?: string;
  category?: string;
};

type BrandProductFormValues = {
  brandId: EntityId;
  name: string;
  categoryId: EntityId;
  guidePriceYuan: number;
  supplyPriceYuan?: number;
  defaultImg?: string;
  description?: string;
  status: AdminBrandLibraryItem['status'];
};

const emptyData: BrandLibraryPageData = { brandLibrary: [], brands: [], categories: [] };

function centsToYuan(value: number) {
  return value / 100;
}

function yuanToCents(value?: number | null) {
  if (value == null) {
    return null;
  }

  return Math.round(value * 100);
}

export function BrandLibraryPage({ refreshToken = 0 }: BrandLibraryPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<BrandLibraryFilters>();
  const [brandProductForm] = Form.useForm<BrandProductFormValues>();
  const [data, setData] = useState<BrandLibraryPageData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrandLibraryFilters>({});
  const [status, setStatus] = useState<'all' | AdminBrandLibraryItem['status']>('all');
  const [selected, setSelected] = useState<AdminBrandLibraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<AdminBrandLibraryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const [brandLibrary, brands, categories] = await Promise.all([
          fetchAdminBrandLibrary({ page: 1, pageSize: 100 }).then((result) => result.items),
          fetchAdminBrands().then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
        ]);
        if (!alive) return;
        setData({ brandLibrary, brands, categories });
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
  }, [actionSeed, refreshToken]);

  const brandOptions = useMemo(() => {
    const activeBrands = data.brands
      .filter((item) => item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));
    if (activeBrands.length > 0) {
      return activeBrands;
    }
    return buildOptions(data.brandLibrary, 'brandName');
  }, [data.brandLibrary, data.brands]);
  const categoryOptions = useMemo(() => {
    const activeCategories = data.categories
      .filter((item) => item.bizType === 'product' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));
    if (activeCategories.length > 0) return activeCategories;
    return buildOptions(data.brandLibrary, 'category');
  }, [data.brandLibrary, data.categories]);
  const brandIdOptions = useMemo(
    () =>
      data.brands
        .filter((item) => item.status === 'active')
        .map((item) => ({ label: item.name, value: item.id })),
    [data.brands],
  );
  const categoryIdOptions = useMemo(
    () =>
      data.categories
        .filter((item) => item.bizType === 'product' && item.status === 'active')
        .map((item) => ({ label: item.name, value: item.id })),
    [data.categories],
  );
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
    { title: '供货价', dataIndex: 'supplyPrice', width: 120, render: (_, record) => formatAmount(record.supplyPrice) },
    { title: '挂载商品', dataIndex: 'productCount', width: 120, render: (_, record) => formatNumber(record.productCount) },
    { title: '在售商品', dataIndex: 'activeProductCount', width: 120, render: (_, record) => formatNumber(record.activeProductCount) },
    {
      title: '状态',
      width: 120,
      render: (_, record) => <Tag color={record.status === 'active' ? 'success' : 'default'}>{record.status === 'active' ? '启用' : '停用'}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 120, render: (_, record) => formatDate(record.createdAt) },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: (_, record) => formatDateTime(record.updatedAt) },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => {
              brandProductForm.setFieldsValue({
                brandId: record.brandId as EntityId,
                name: record.productName,
                categoryId: record.categoryId as EntityId,
                guidePriceYuan: centsToYuan(record.guidePrice),
                supplyPriceYuan: centsToYuan(record.supplyPrice),
                defaultImg: record.imageUrl || undefined,
                description: record.description || undefined,
                status: record.status,
              });
              setEditingItem(record);
              setFormOpen(true);
            }}
          >
            编辑
          </Button>
        </div>
      ),
    },
  ];

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
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              onClick={() => {
                brandProductForm.resetFields();
                brandProductForm.setFieldsValue({ status: 'active' });
                setEditingItem(null);
                setFormOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>
      <Drawer open={selected != null} title="品牌商品详情" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="商品">{selected.productName}</Descriptions.Item>
            <Descriptions.Item label="品牌">{selected.brandName}</Descriptions.Item>
            <Descriptions.Item label="分类">{selected.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="指导价">{formatAmount(selected.guidePrice)}</Descriptions.Item>
            <Descriptions.Item label="供货价">{formatAmount(selected.supplyPrice)}</Descriptions.Item>
            <Descriptions.Item label="挂载商品">{formatNumber(selected.productCount)}</Descriptions.Item>
            <Descriptions.Item label="在售商品">{formatNumber(selected.activeProductCount)}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status === 'active' ? '启用' : '停用'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDate(selected.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
            <Descriptions.Item label="商品说明">{selected.description || '-'}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <Modal
        open={formOpen}
        title={editingItem ? '编辑品牌商品' : '新增品牌商品'}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        onCancel={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onOk={() => void handleSubmitBrandProduct()}
        destroyOnClose
      >
        <ConfigProvider theme={SEARCH_THEME}>
          <Form form={brandProductForm} layout="vertical" preserve={false}>
            <Form.Item label="品牌" name="brandId" rules={[{ required: true, message: '请选择品牌' }]}>
              <Select allowClear options={brandIdOptions} placeholder="品牌" />
            </Form.Item>
            <Form.Item label="商品名称" name="name" rules={[{ required: true, message: '请输入商品名称' }]}>
              <Input allowClear placeholder="商品名称" />
            </Form.Item>
            <Form.Item label="类目" name="categoryId" rules={[{ required: true, message: '请选择类目' }]}>
              <Select allowClear options={categoryIdOptions} placeholder="类目" />
            </Form.Item>
            <Form.Item
              label="指导价（元）"
              name="guidePriceYuan"
              rules={[{ required: true, message: '请输入指导价' }]}
            >
              <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="指导价（元）" />
            </Form.Item>
            <Form.Item label="供货价（元）" name="supplyPriceYuan">
              <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="供货价（元）" />
            </Form.Item>
            <Form.Item label="封面图" name="defaultImg">
              <Input allowClear placeholder="封面图 URL" />
            </Form.Item>
            <Form.Item label="商品说明" name="description">
              <Input.TextArea rows={4} placeholder="商品说明" />
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select
                options={[
                  { label: '启用', value: 'active' },
                  { label: '停用', value: 'disabled' },
                ]}
                placeholder="状态"
              />
            </Form.Item>
          </Form>
        </ConfigProvider>
      </Modal>
    </div>
  );

  async function handleSubmitBrandProduct() {
    try {
      const values = await brandProductForm.validateFields();
      setSubmitting(true);
      const payload = {
        brandId: values.brandId,
        name: values.name,
        categoryId: values.categoryId,
        guidePrice: yuanToCents(values.guidePriceYuan) ?? 0,
        supplyPrice: yuanToCents(values.supplyPriceYuan),
        defaultImg: values.defaultImg || null,
        description: values.description || null,
        status: values.status,
      } as const;

      if (editingItem) {
        await updateAdminBrandProduct(editingItem.id, payload);
        messageApi.success('品牌商品已更新');
      } else {
        await createAdminBrandProduct(payload);
        messageApi.success('品牌商品已新增');
      }

      setFormOpen(false);
      setEditingItem(null);
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error && 'errorFields' in error) {
        return;
      }
      messageApi.error(error instanceof Error ? error.message : '保存品牌商品失败');
    } finally {
      setSubmitting(false);
    }
  }
}
