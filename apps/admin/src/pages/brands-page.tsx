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
  Modal,
  Select,
  Tag,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  AdminSearchPanel,
  AdminStatusTabs,
  SEARCH_THEME,
} from '../components/admin-list-controls';
import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminBrandItem } from '../lib/api/merchant';
import { createAdminBrand, fetchAdminBrands, updateAdminBrand } from '../lib/api/merchant';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDate, formatNumber } from '../lib/format';

interface BrandsPageProps {
  refreshToken?: number;
}

interface BrandsPageData {
  brands: AdminBrandItem[];
  categories: AdminCategoryItem[];
}

type BrandFilters = {
  name?: string;
  category?: string;
};

type BrandFormValues = {
  name: string;
  categoryId: EntityId;
  contactName?: string;
  contactPhone?: string;
  description?: string;
  status: AdminBrandItem['status'];
};

const emptyData: BrandsPageData = { brands: [], categories: [] };

export function BrandsPage({ refreshToken = 0 }: BrandsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<BrandFilters>();
  const [brandForm] = Form.useForm<BrandFormValues>();
  const [data, setData] = useState<BrandsPageData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrandFilters>({});
  const [status, setStatus] = useState<'all' | AdminBrandItem['status']>('all');
  const [selected, setSelected] = useState<AdminBrandItem | null>(null);
  const [editingBrand, setEditingBrand] = useState<AdminBrandItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const [brands, categories] = await Promise.all([
          fetchAdminBrands().then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
        ]);
        if (!alive) {
          return;
        }
        setData({ brands, categories });
      } catch (error) {
        if (!alive) {
          return;
        }
        setData(emptyData);
        setIssue(error instanceof Error ? error.message : '品牌列表加载失败');
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
      .filter((item) => item.bizType === 'brand' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));

    if (activeCategories.length > 0) {
      return activeCategories;
    }

    return Array.from(new Set(data.brands.map((item) => item.category).filter(Boolean))).map(
      (value) => ({ label: String(value), value: String(value) }),
    );
  }, [data.brands, data.categories]);

  const categoryIdOptions = useMemo(
    () =>
      data.categories
        .filter((item) => item.bizType === 'brand' && item.status === 'active')
        .map((item) => ({ label: item.name, value: item.id })),
    [data.categories],
  );

  const statusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: data.brands.length },
      {
        key: 'active',
        label: '合作中',
        count: data.brands.filter((item) => item.status === 'active').length,
      },
      {
        key: 'disabled',
        label: '停用',
        count: data.brands.filter((item) => item.status === 'disabled').length,
      },
    ],
    [data.brands],
  );

  const filteredRows = useMemo(
    () =>
      data.brands.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.name && !record.name.toLowerCase().includes(filters.name.trim().toLowerCase())) {
          return false;
        }
        if (filters.category && record.category !== filters.category) {
          return false;
        }
        return true;
      }),
    [data.brands, filters, status],
  );

  const statusOptions = [
    { label: '合作中', value: 'active' },
    { label: '停用', value: 'disabled' },
  ] as const;

  const columns: ProColumns<AdminBrandItem>[] = [
    { title: '品牌', dataIndex: 'name', width: 220 },
    { title: '类目', dataIndex: 'category', width: 180, render: (_, record) => record.category || '-' },
    { title: '合作店铺', dataIndex: 'shopCount', width: 120, render: (_, record) => formatNumber(record.shopCount) },
    { title: '标准商品', dataIndex: 'goodsCount', width: 120, render: (_, record) => formatNumber(record.goodsCount) },
    { title: '联系人', dataIndex: 'contactName', width: 140, render: (_, record) => record.contactName || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => <Tag color={record.status === 'active' ? 'success' : 'default'}>{record.statusLabel}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => formatDate(record.createdAt),
    },
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
              brandForm.setFieldsValue({
                name: record.name,
                categoryId: record.categoryId as EntityId,
                contactName: record.contactName || undefined,
                contactPhone: record.contactPhone || undefined,
                description: record.description || undefined,
                status: record.status,
              });
              setEditingBrand(record);
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
        <Form.Item name="name">
          <Input allowClear placeholder="品牌名称" />
        </Form.Item>
        <Form.Item name="category">
          <Select allowClear options={categoryOptions} placeholder="类目" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs activeKey={status} items={statusItems} onChange={(key) => setStatus(key as typeof status)} />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminBrandItem>
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
                brandForm.resetFields();
                brandForm.setFieldsValue({ status: 'active' });
                setEditingBrand(null);
                setFormOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>

      <Drawer open={selected != null} title="品牌管理" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="品牌">{selected.name}</Descriptions.Item>
            <Descriptions.Item label="类目">{selected.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="合作店铺">{formatNumber(selected.shopCount)}</Descriptions.Item>
            <Descriptions.Item label="标准商品">{formatNumber(selected.goodsCount)}</Descriptions.Item>
            <Descriptions.Item label="联系人">{selected.contactName || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selected.contactPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selected.status === 'active' ? 'success' : 'default'}>
                {selected.statusLabel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDate(selected.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <Modal
        open={formOpen}
        title={editingBrand ? '编辑品牌' : '新增品牌'}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        onCancel={() => {
          setFormOpen(false);
          setEditingBrand(null);
        }}
        onOk={() => void handleSubmitBrand()}
        destroyOnClose
      >
        <ConfigProvider theme={SEARCH_THEME}>
          <Form form={brandForm} layout="vertical" preserve={false}>
            <Form.Item
              label="品牌名称"
              name="name"
              rules={[{ required: true, message: '请输入品牌名称' }]}
            >
              <Input allowClear placeholder="品牌名称" />
            </Form.Item>
            <Form.Item
              label="类目"
              name="categoryId"
              rules={[{ required: true, message: '请选择类目' }]}
            >
              <Select allowClear options={categoryIdOptions} placeholder="类目" />
            </Form.Item>
            <Form.Item label="联系人" name="contactName">
              <Input allowClear placeholder="联系人" />
            </Form.Item>
            <Form.Item label="联系电话" name="contactPhone">
              <Input allowClear placeholder="联系电话" />
            </Form.Item>
            <Form.Item label="品牌说明" name="description">
              <Input.TextArea rows={4} placeholder="品牌说明" />
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={statusOptions as unknown as { label: string; value: string }[]} placeholder="状态" />
            </Form.Item>
          </Form>
        </ConfigProvider>
      </Modal>
    </div>
  );

  async function handleSubmitBrand() {
    try {
      const values = await brandForm.validateFields();
      setSubmitting(true);
      if (editingBrand) {
        await updateAdminBrand(editingBrand.id, {
          name: values.name,
          categoryId: values.categoryId,
          contactName: values.contactName || null,
          contactPhone: values.contactPhone || null,
          description: values.description || null,
          status: values.status,
        });
        messageApi.success('品牌已更新');
      } else {
        await createAdminBrand({
          name: values.name,
          categoryId: values.categoryId,
          contactName: values.contactName || null,
          contactPhone: values.contactPhone || null,
          description: values.description || null,
          status: values.status,
        });
        messageApi.success('品牌已新增');
      }
      setFormOpen(false);
      setEditingBrand(null);
      brandForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }
}
