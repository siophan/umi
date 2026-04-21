import type {
  AdminBannerItem,
  CreateAdminBannerPayload,
  EntityId,
  UpdateAdminBannerPayload,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs, SEARCH_THEME } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  createAdminBanner,
  deleteAdminBanner,
  fetchAdminBanners,
  updateAdminBanner,
  updateAdminBannerStatus,
} from '../lib/api/marketing';
import { formatDateTime } from '../lib/format';

interface MarketingBannersPageProps {
  refreshToken?: number;
}

type BannerFilters = {
  title?: string;
  position?: string;
  targetType?: CreateAdminBannerPayload['targetType'];
};

type BannerFormValues = {
  position: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetType: CreateAdminBannerPayload['targetType'];
  targetId?: string;
  actionUrl?: string;
  sort?: number;
  status: 'active' | 'disabled';
  startAt?: string;
  endAt?: string;
};

const POSITION_OPTIONS = [
  { label: '首页轮播', value: 'home_hero' },
  { label: '商城推荐', value: 'mall_hero' },
  { label: '商城活动', value: 'mall_banner' },
] as const;

const TARGET_TYPE_OPTIONS = [
  { label: '竞猜', value: 'guess' },
  { label: '动态', value: 'post' },
  { label: '商品', value: 'product' },
  { label: '店铺', value: 'shop' },
  { label: '外部链接', value: 'external' },
] as const;

const RAW_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
] as const;

function statusColor(status: AdminBannerItem['status']) {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'scheduled') {
    return 'processing';
  }
  if (status === 'ended') {
    return 'warning';
  }
  return 'default';
}

function formatLocalDateTimeInput(value: string | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function MarketingBannersPage({ refreshToken = 0 }: MarketingBannersPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<BannerFilters>();
  const [bannerForm] = Form.useForm<BannerFormValues>();

  const [filters, setFilters] = useState<BannerFilters>({});
  const [status, setStatus] = useState<'all' | AdminBannerItem['status']>('all');
  const [rows, setRows] = useState<AdminBannerItem[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    paused: 0,
    ended: 0,
  });
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminBannerItem | null>(null);
  const [editingBanner, setEditingBanner] = useState<AdminBannerItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  const targetType = Form.useWatch('targetType', bannerForm);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminBanners({
          title: filters.title,
          position: filters.position,
          targetType: filters.targetType,
          status,
        });
        if (!alive) {
          return;
        }
        setRows(result.items);
        setSummary(result.summary);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows([]);
        setSummary({
          total: 0,
          active: 0,
          scheduled: 0,
          paused: 0,
          ended: 0,
        });
        setIssue(error instanceof Error ? error.message : '轮播列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      alive = false;
    };
  }, [actionSeed, filters.position, filters.targetType, filters.title, refreshToken, status]);

  const statusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: summary.total },
      { key: 'active', label: '投放中', count: summary.active },
      { key: 'scheduled', label: '待排期', count: summary.scheduled },
      { key: 'paused', label: '已暂停', count: summary.paused },
      { key: 'ended', label: '已结束', count: summary.ended },
    ],
    [summary.active, summary.ended, summary.paused, summary.scheduled, summary.total],
  );

  const columns: ProColumns<AdminBannerItem>[] = [
    {
      title: '图片',
      dataIndex: 'imageUrl',
      width: 132,
      render: (_, record) =>
        record.imageUrl ? (
          <Image
            src={record.imageUrl}
            width={108}
            height={60}
            style={{ borderRadius: 8, objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              alignItems: 'center',
              background: '#f3f5f8',
              borderRadius: 8,
              color: '#94a3b8',
              display: 'flex',
              height: 60,
              justifyContent: 'center',
              width: 108,
            }}
          >
            暂无图片
          </div>
        ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 240,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.subtitle || '-'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '投放位',
      dataIndex: 'positionLabel',
      width: 120,
    },
    {
      title: '跳转类型',
      dataIndex: 'targetTypeLabel',
      width: 110,
    },
    {
      title: '跳转目标',
      width: 220,
      render: (_, record) => {
        if (record.targetType === 'external') {
          return record.actionUrl || '-';
        }
        return record.targetName || record.targetId || '-';
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'statusLabel',
      width: 110,
      render: (_, record) => <Tag color={statusColor(record.status)}>{record.statusLabel}</Tag>,
    },
    {
      title: '有效期',
      width: 220,
      render: (_, record) => {
        if (!record.startAt && !record.endAt) {
          return '长期有效';
        }
        return `${record.startAt ? formatDateTime(record.startAt) : '不限'} ~ ${
          record.endAt ? formatDateTime(record.endAt) : '不限'
        }`;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.updatedAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => {
        const actions = [
          <Button key="view" size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>,
          <Button
            key="edit"
            size="small"
            type="link"
            onClick={() => {
              bannerForm.resetFields();
              bannerForm.setFieldsValue({
                position: record.position,
                title: record.title,
                subtitle: record.subtitle || undefined,
                imageUrl: record.imageUrl,
                targetType: record.targetType,
                targetId: record.targetId || undefined,
                actionUrl: record.actionUrl || undefined,
                sort: record.sort,
                status: record.rawStatus,
                startAt: formatLocalDateTimeInput(record.startAt),
                endAt: formatLocalDateTimeInput(record.endAt),
              });
              setEditingBanner(record);
              setFormOpen(true);
            }}
          >
            编辑
          </Button>,
        ];

        if (record.rawStatus === 'disabled') {
          actions.push(
            <Button
              key="enable"
              size="small"
              type="link"
              onClick={() => void handleToggleStatus(record, 'active')}
            >
              启用
            </Button>,
          );
        } else if (record.status !== 'ended') {
          actions.push(
            <Button
              key="pause"
              size="small"
              type="link"
              onClick={() => void handleToggleStatus(record, 'disabled')}
            >
              暂停
            </Button>,
          );
        }

        actions.push(
          <Button
            key="delete"
            danger
            size="small"
            type="link"
            onClick={() => {
              Modal.confirm({
                title: '确认删除轮播？',
                content: `删除后将无法恢复「${record.title}」`,
                okText: '删除',
                okButtonProps: { danger: true },
                cancelText: '取消',
                onOk: () => handleDelete(record),
              });
            }}
          >
            删除
          </Button>,
        );

        return <div style={{ display: 'flex', gap: 8 }}>{actions}</div>;
      },
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
        <Form.Item name="title">
          <Input allowClear placeholder="轮播标题" />
        </Form.Item>
        <Form.Item name="position">
          <Select allowClear options={POSITION_OPTIONS as never} placeholder="投放位" />
        </Form.Item>
        <Form.Item name="targetType">
          <Select allowClear options={TARGET_TYPE_OPTIONS as never} placeholder="跳转类型" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminBannerItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={rows}
          loading={loading}
          options={{
            reload: () => setActionSeed((value) => value + 1),
            density: true,
            fullScreen: false,
            setting: true,
          }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              onClick={() => {
                bannerForm.resetFields();
                bannerForm.setFieldsValue({
                  position: 'home_hero',
                  targetType: 'guess',
                  sort: 0,
                  status: 'active',
                });
                setEditingBanner(null);
                setFormOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>

      <Drawer open={selected != null} title="轮播详情" width={520} onClose={() => setSelected(null)}>
        {selected ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {selected.imageUrl ? (
              <Image
                src={selected.imageUrl}
                width="100%"
                style={{ borderRadius: 12, objectFit: 'cover' }}
              />
            ) : null}
            <Descriptions column={1} size="small">
              <Descriptions.Item label="轮播标题">{selected.title}</Descriptions.Item>
              <Descriptions.Item label="副标题">{selected.subtitle || '-'}</Descriptions.Item>
              <Descriptions.Item label="投放位">{selected.positionLabel}</Descriptions.Item>
              <Descriptions.Item label="跳转类型">{selected.targetTypeLabel}</Descriptions.Item>
              <Descriptions.Item label="跳转目标">
                {selected.targetType === 'external'
                  ? selected.actionUrl || '-'
                  : selected.targetName || selected.targetId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="图片地址">{selected.imageUrl}</Descriptions.Item>
              <Descriptions.Item label="排序">{selected.sort}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColor(selected.status)}>{selected.statusLabel}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {selected.startAt ? formatDateTime(selected.startAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {selected.endAt ? formatDateTime(selected.endAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
            </Descriptions>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={formOpen}
        title={editingBanner ? '编辑轮播' : '新增轮播'}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnClose
        onCancel={() => {
          setFormOpen(false);
          setEditingBanner(null);
        }}
        onOk={() => void handleSubmit()}
      >
        <ConfigProvider theme={SEARCH_THEME}>
          <Form form={bannerForm} layout="vertical" preserve={false}>
            <Form.Item
              label="投放位"
              name="position"
              rules={[{ required: true, message: '请选择投放位' }]}
            >
              <Select options={POSITION_OPTIONS as never} placeholder="投放位" />
            </Form.Item>
            <Form.Item
              label="轮播标题"
              name="title"
              rules={[{ required: true, message: '请输入轮播标题' }]}
            >
              <Input allowClear placeholder="轮播标题" />
            </Form.Item>
            <Form.Item label="副标题" name="subtitle">
              <Input allowClear placeholder="副标题" />
            </Form.Item>
            <Form.Item
              label="图片地址"
              name="imageUrl"
              rules={[{ required: true, message: '请输入图片地址' }]}
            >
              <Input allowClear placeholder="图片地址" />
            </Form.Item>
            <Form.Item
              label="跳转类型"
              name="targetType"
              rules={[{ required: true, message: '请选择跳转类型' }]}
            >
              <Select options={TARGET_TYPE_OPTIONS as never} placeholder="跳转类型" />
            </Form.Item>
            {targetType === 'external' ? (
              <Form.Item
                label="外部链接"
                name="actionUrl"
                rules={[{ required: true, message: '请输入外部链接' }]}
              >
                <Input allowClear placeholder="https://example.com" />
              </Form.Item>
            ) : (
              <Form.Item
                label="跳转目标ID"
                name="targetId"
                rules={[{ required: true, message: '请输入跳转目标ID' }]}
              >
                <Input allowClear placeholder="跳转目标ID" />
              </Form.Item>
            )}
            <Form.Item label="排序" name="sort">
              <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="排序" />
            </Form.Item>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select options={RAW_STATUS_OPTIONS as never} placeholder="状态" />
            </Form.Item>
            <Form.Item label="开始时间" name="startAt">
              <Input type="datetime-local" />
            </Form.Item>
            <Form.Item label="结束时间" name="endAt">
              <Input type="datetime-local" />
            </Form.Item>
          </Form>
        </ConfigProvider>
      </Modal>
    </div>
  );

  async function handleSubmit() {
    try {
      const values = await bannerForm.validateFields();
      const payload: CreateAdminBannerPayload | UpdateAdminBannerPayload = {
        position: values.position,
        title: values.title.trim(),
        subtitle: values.subtitle?.trim() || null,
        imageUrl: values.imageUrl.trim(),
        targetType: values.targetType,
        targetId:
          values.targetType === 'external'
            ? null
            : ((values.targetId?.trim() || null) as EntityId | null),
        actionUrl:
          values.targetType === 'external'
            ? values.actionUrl?.trim() || null
            : null,
        sort: values.sort ?? 0,
        status: values.status,
        startAt: values.startAt || null,
        endAt: values.endAt || null,
      };

      setSubmitting(true);
      if (editingBanner) {
        await updateAdminBanner(editingBanner.id, payload);
        messageApi.success('轮播已更新');
      } else {
        await createAdminBanner(payload);
        messageApi.success('轮播已新增');
      }

      setFormOpen(false);
      setEditingBanner(null);
      bannerForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(
    record: AdminBannerItem,
    nextStatus: 'active' | 'disabled',
  ) {
    try {
      await updateAdminBannerStatus(record.id, { status: nextStatus });
      messageApi.success(nextStatus === 'active' ? '轮播已启用' : '轮播已暂停');
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    }
  }

  async function handleDelete(record: AdminBannerItem) {
    try {
      await deleteAdminBanner(record.id);
      messageApi.success('轮播已删除');
      if (selected?.id === record.id) {
        setSelected(null);
      }
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    }
  }
}
