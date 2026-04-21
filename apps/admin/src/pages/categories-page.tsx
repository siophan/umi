import type {
  CategoryId,
  CreateAdminCategoryPayload,
  UpdateAdminCategoryPayload,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import {
  createAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
  updateAdminCategoryStatus,
  type AdminCategoryItem,
} from '../lib/api/categories';
import { formatDateTime, formatNumber } from '../lib/format';

interface CategoriesPageProps {
  refreshToken?: number;
}

type CategoryFilters = {
  name?: string;
  bizTypeCode?: number;
  parentId?: CategoryId;
};

type CategoryFormValues = {
  bizTypeCode: 10 | 20 | 30 | 40;
  parentId?: CategoryId;
  name: string;
  sort?: number;
  iconUrl?: string;
  description?: string;
  status?: 'active' | 'disabled';
};

const BIZ_TYPE_OPTIONS = [
  { label: '品牌分类', value: 10 },
  { label: '店铺经营分类', value: 20 },
  { label: '商品分类', value: 30 },
  { label: '竞猜分类', value: 40 },
] as const;

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
] as const;

const CATEGORY_TABLE_THEME = {
  token: {
    borderRadius: 6,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
    },
  },
} as const;

function getCategoryStatusColor(status: AdminCategoryItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

function toCategoryPayload(values: CategoryFormValues): CreateAdminCategoryPayload {
  return {
    bizTypeCode: values.bizTypeCode,
    parentId: values.parentId || null,
    name: values.name.trim(),
    iconUrl: values.iconUrl?.trim() || null,
    description: values.description?.trim() || null,
    sort: Number(values.sort ?? 0),
    status: values.status ?? 'active',
  };
}

function toCategoryUpdatePayload(values: CategoryFormValues): UpdateAdminCategoryPayload {
  return {
    name: values.name.trim(),
    iconUrl: values.iconUrl?.trim() || null,
    description: values.description?.trim() || null,
    sort: Number(values.sort ?? 0),
  };
}

export function CategoriesPage({ refreshToken = 0 }: CategoriesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<CategoryFilters>();
  const [modalForm] = Form.useForm<CategoryFormValues>();
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>({});
  const [status, setStatus] = useState<'all' | AdminCategoryItem['status']>('all');
  const [selected, setSelected] = useState<AdminCategoryItem | null>(null);
  const [editing, setEditing] = useState<AdminCategoryItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const watchedBizTypeCode = Form.useWatch('bizTypeCode', modalForm);

  useEffect(() => {
    let alive = true;

    async function loadCategories() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminCategories();
        if (!alive) {
          return;
        }
        setCategories(result.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setCategories([]);
        setIssue(error instanceof Error ? error.message : '分类列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const parentOptions = useMemo(
    () =>
      categories
        .filter((item) =>
          watchedBizTypeCode ? item.bizTypeCode === watchedBizTypeCode : true,
        )
        .filter((item) => item.status === 'active')
        .map((item) => ({
          label: `${item.name}${item.parentName ? ` / ${item.parentName}` : ''}`,
          value: item.id,
        })),
    [categories, watchedBizTypeCode],
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter((item) => {
        if (status !== 'all' && item.status !== status) {
          return false;
        }
        if (
          filters.name &&
          !item.name.toLowerCase().includes(filters.name.trim().toLowerCase())
        ) {
          return false;
        }
        if (filters.bizTypeCode && item.bizTypeCode !== Number(filters.bizTypeCode)) {
          return false;
        }
        if (filters.parentId && item.parentId !== filters.parentId) {
          return false;
        }
        return true;
      }),
    [categories, filters, status],
  );

  const columns: ProColumns<AdminCategoryItem>[] = [
    {
      title: '分类名称',
      dataIndex: 'name',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.bizTypeLabel}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '父分类',
      dataIndex: 'parentName',
      width: 180,
      render: (_, record) => record.parentName || '-',
    },
    {
      title: '层级',
      dataIndex: 'level',
      width: 100,
      render: (_, record) => formatNumber(record.level),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 100,
      render: (_, record) => formatNumber(record.sort),
    },
    {
      title: '引用量',
      dataIndex: 'usageCount',
      width: 120,
      render: (_, record) => formatNumber(record.usageCount),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={getCategoryStatusColor(record.status)}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.updatedAt),
    },
    {
      title: '路径',
      dataIndex: 'path',
      width: 220,
      render: (_, record) => record.path || '-',
    },
    {
      title: '图标地址',
      dataIndex: 'iconUrl',
      width: 220,
      render: (_, record) => record.iconUrl || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
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
              setEditing(record);
              modalForm.resetFields();
              modalForm.setFieldsValue({
                bizTypeCode: record.bizTypeCode as 10 | 20 | 30 | 40,
                parentId: record.parentId ?? undefined,
                name: record.name,
                sort: record.sort,
                iconUrl: record.iconUrl ?? undefined,
                description: record.description ?? undefined,
              });
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title={record.status === 'active' ? '停用分类' : '启用分类'}
            description={
              record.status === 'active'
                ? '停用后当前分类及其子分类都会变成停用状态。'
                : '确认启用当前分类？'
            }
            okText="确认"
            cancelText="取消"
            onConfirm={() => void handleToggleStatus(record)}
          >
            <Button size="small" type="link">
              {record.status === 'active' ? '停用' : '启用'}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  async function reloadCategories() {
    setLoading(true);
    setIssue(null);
    try {
      const result = await fetchAdminCategories();
      setCategories(result.items);
    } catch (error) {
      setCategories([]);
      setIssue(error instanceof Error ? error.message : '分类列表加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(record: AdminCategoryItem) {
    try {
      await updateAdminCategoryStatus(record.id, {
        status: record.status === 'active' ? 'disabled' : 'active',
      });
      messageApi.success(
        record.status === 'active' ? '分类已停用' : '分类已启用',
      );
      await reloadCategories();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '更新分类状态失败');
    }
  }

  async function handleSubmit() {
    try {
      const values = await modalForm.validateFields();
      setSubmitting(true);

      if (editing) {
        await updateAdminCategory(editing.id, toCategoryUpdatePayload(values));
        messageApi.success('分类已更新');
      } else {
        await createAdminCategory(toCategoryPayload(values));
        messageApi.success('分类已创建');
      }

      setModalOpen(false);
      setEditing(null);
      modalForm.resetFields();
      await reloadCategories();
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openCreateModal() {
    setEditing(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({
      bizTypeCode: 10,
      parentId: undefined,
      name: '',
      sort: 0,
      iconUrl: undefined,
      description: undefined,
      status: 'active',
    });
    setModalOpen(true);
  }

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={form}
        onSearch={() => setFilters(form.getFieldsValue())}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="name">
          <Input allowClear placeholder="分类名称" />
        </Form.Item>
        <Form.Item name="bizTypeCode">
          <Select allowClear options={BIZ_TYPE_OPTIONS as never} placeholder="业务域" />
        </Form.Item>
        <Form.Item name="parentId">
          <Select
            allowClear
            options={categories.map((item) => ({ label: item.name, value: item.id }))}
            placeholder="父分类"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: categories.length },
          {
            key: 'active',
            label: '启用',
            count: categories.filter((item) => item.status === 'active').length,
          },
          {
            key: 'disabled',
            label: '停用',
            count: categories.filter((item) => item.status === 'disabled').length,
          },
        ]}
        onChange={(key) => setStatus(key as 'all' | AdminCategoryItem['status'])}
      />

      <ConfigProvider theme={CATEGORY_TABLE_THEME}>
        <ProTable<AdminCategoryItem>
          cardBordered={false}
          columns={columns}
          dataSource={filteredCategories}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          rowKey="id"
          search={false}
          scroll={{ x: 1320 }}
          toolBarRender={() => [
            <Button key="add" type="primary" onClick={openCreateModal}>
              新增
            </Button>,
          ]}
          columnsState={{
            defaultValue: {
              path: { show: false },
              iconUrl: { show: false },
            },
          }}
        />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        title={selected?.name}
        width={480}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: 'grid', gap: 16, width: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="业务域">{selected.bizTypeLabel}</Descriptions.Item>
              <Descriptions.Item label="父分类">
                {selected.parentName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="层级">{selected.level}</Descriptions.Item>
              <Descriptions.Item label="路径">{selected.path || '-'}</Descriptions.Item>
              <Descriptions.Item label="排序">{selected.sort}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getCategoryStatusColor(selected.status)}>
                  {selected.statusLabel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="图标地址">
                {selected.iconUrl || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="说明">
                {selected.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(selected.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatDateTime(selected.updatedAt)}
              </Descriptions.Item>
            </Descriptions>

            <Card title="引用明细" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="品牌">{selected.usageBreakdown.brands}</Descriptions.Item>
                <Descriptions.Item label="品牌商品">
                  {selected.usageBreakdown.brandProducts}
                </Descriptions.Item>
                <Descriptions.Item label="店铺">{selected.usageBreakdown.shops}</Descriptions.Item>
                <Descriptions.Item label="开店申请">
                  {selected.usageBreakdown.shopApplies}
                </Descriptions.Item>
                <Descriptions.Item label="竞猜">{selected.usageBreakdown.guesses}</Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        ) : null}
      </Drawer>

      <Modal
        confirmLoading={submitting}
        open={modalOpen}
        title={editing ? '编辑分类' : '新增分类'}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          modalForm.resetFields();
        }}
        onOk={() => void handleSubmit()}
      >
        <Form
          form={modalForm}
          layout="vertical"
          initialValues={{
            bizTypeCode: 10,
            sort: 0,
            status: 'active',
          }}
        >
          <Form.Item
            label="业务域"
            name="bizTypeCode"
            rules={[{ required: true, message: '请选择业务域' }]}
          >
            <Select
              disabled={editing != null}
              options={BIZ_TYPE_OPTIONS as never}
              placeholder="请选择业务域"
            />
          </Form.Item>
          <Form.Item label="父分类" name="parentId">
            <Select
              disabled={editing != null}
              allowClear
              options={parentOptions}
              placeholder={editing ? '当前不支持修改父分类' : '可选'}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" maxLength={50} />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          {!editing ? (
            <Form.Item label="初始状态" name="status">
              <Select options={STATUS_OPTIONS as never} />
            </Form.Item>
          ) : null}
          <Form.Item label="图标地址" name="iconUrl">
            <Input placeholder="可选，填写图片地址" />
          </Form.Item>
          <Form.Item label="分类说明" name="description">
            <Input.TextArea rows={3} placeholder="可选，填写分类说明" maxLength={255} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
