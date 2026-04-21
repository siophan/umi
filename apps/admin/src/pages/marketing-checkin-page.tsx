import type {
  AdminCheckinRewardConfigStatus,
  AdminCheckinRewardType,
  CreateAdminCheckinRewardConfigPayload,
  UpdateAdminCheckinRewardConfigPayload,
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
  createAdminCheckinRewardConfig,
  fetchAdminCheckinRewardConfigs,
  updateAdminCheckinRewardConfig,
  updateAdminCheckinRewardConfigStatus,
  type AdminCheckinRewardConfigItem,
} from '../lib/api/checkin';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { AdminSearchPanel, AdminStatusTabs, SEARCH_THEME } from '../components/admin-list-controls';
import { formatDateTime, formatNumber } from '../lib/format';

interface MarketingCheckinPageProps {
  refreshToken?: number;
}

type CheckinFilters = {
  dayNo?: number;
  rewardType?: AdminCheckinRewardType;
  title?: string;
};

type CheckinFormValues = {
  dayNo: number;
  rewardType: AdminCheckinRewardType;
  rewardValue: number;
  rewardRefId?: string;
  title?: string;
  sort?: number;
  status: AdminCheckinRewardConfigStatus;
};

const REWARD_TYPE_OPTIONS = [
  { label: '零食币', value: 'coin' },
  { label: '优惠券', value: 'coupon' },
  { label: '实物', value: 'physical' },
] as const;

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
] as const;

function rewardStatusColor(status: AdminCheckinRewardConfigItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

function formatRewardContent(record: AdminCheckinRewardConfigItem) {
  if (record.rewardType === 'coin') {
    return `${formatNumber(record.rewardValue)} 零食币`;
  }
  if (record.rewardType === 'coupon') {
    return `优惠券 × ${formatNumber(record.rewardValue)}${record.rewardRefId ? ` · 模板ID ${record.rewardRefId}` : ''}`;
  }
  return `实物 × ${formatNumber(record.rewardValue)}${record.rewardRefId ? ` · 奖品ID ${record.rewardRefId}` : ''}`;
}

function normalizeRewardRefIdInput(value: string | undefined) {
  const text = value?.trim() ?? '';
  if (!text) {
    return null;
  }
  return /^\d+$/.test(text) ? (text as `${bigint}`) : null;
}

export function MarketingCheckinPage({ refreshToken = 0 }: MarketingCheckinPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<CheckinFilters>();
  const [configForm] = Form.useForm<CheckinFormValues>();
  const [rows, setRows] = useState<AdminCheckinRewardConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<CheckinFilters>({});
  const [status, setStatus] = useState<'all' | AdminCheckinRewardConfigStatus>('all');
  const [selected, setSelected] = useState<AdminCheckinRewardConfigItem | null>(null);
  const [editingItem, setEditingItem] = useState<AdminCheckinRewardConfigItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  const rewardType = Form.useWatch('rewardType', configForm);

  useEffect(() => {
    let alive = true;

    async function loadRewardConfigs() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminCheckinRewardConfigs({
          dayNo: filters.dayNo,
          rewardType: filters.rewardType,
          title: filters.title,
          status,
        });
        if (!alive) {
          return;
        }
        setRows(result.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows([]);
        setIssue(error instanceof Error ? error.message : '签到奖励配置加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadRewardConfigs();

    return () => {
      alive = false;
    };
  }, [actionSeed, filters.dayNo, filters.rewardType, filters.title, refreshToken, status]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((item) => item.status === 'active').length,
      disabled: rows.filter((item) => item.status === 'disabled').length,
    }),
    [rows],
  );

  const statusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: summary.total },
      { key: 'active', label: '启用', count: summary.active },
      { key: 'disabled', label: '停用', count: summary.disabled },
    ],
    [summary],
  );

  const columns: ProColumns<AdminCheckinRewardConfigItem>[] = [
    {
      title: '签到天数',
      dataIndex: 'dayNo',
      width: 120,
      render: (_, record) => <Typography.Text strong>第 {formatNumber(record.dayNo)} 天</Typography.Text>,
    },
    {
      title: '奖励类型',
      dataIndex: 'rewardTypeLabel',
      width: 120,
    },
    {
      title: '奖励内容',
      width: 240,
      render: (_, record) => formatRewardContent(record),
    },
    {
      title: '奖励标题',
      dataIndex: 'title',
      width: 180,
      render: (_, record) => record.title || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 100,
      render: (_, record) => formatNumber(record.sort),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={rewardStatusColor(record.status)}>{record.statusLabel}</Tag>
      ),
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
              configForm.resetFields();
              configForm.setFieldsValue({
                dayNo: record.dayNo,
                rewardType: record.rewardType,
                rewardValue: record.rewardValue,
                rewardRefId: record.rewardRefId ?? undefined,
                title: record.title ?? undefined,
                sort: record.sort,
                status: record.status,
              });
              setEditingItem(record);
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => void handleToggleStatus(record)}
          >
            {record.status === 'active' ? '停用' : '启用'}
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
        <Form.Item name="dayNo">
          <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="签到天数" />
        </Form.Item>
        <Form.Item name="rewardType">
          <Select allowClear options={REWARD_TYPE_OPTIONS as never} placeholder="奖励类型" />
        </Form.Item>
        <Form.Item name="title">
          <Input allowClear placeholder="奖励标题" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminCheckinRewardConfigItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{
            persistenceKey: 'admin-marketing-checkin-table',
            persistenceType: 'localStorage',
          }}
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
                configForm.resetFields();
                configForm.setFieldsValue({
                  dayNo: rows.length + 1,
                  rewardType: 'coin',
                  rewardValue: 10,
                  sort: rows.length + 1,
                  status: 'active',
                });
                setEditingItem(null);
                setModalOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        title="签到奖励详情"
        width={460}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="签到天数">第 {formatNumber(selected.dayNo)} 天</Descriptions.Item>
            <Descriptions.Item label="奖励类型">{selected.rewardTypeLabel}</Descriptions.Item>
            <Descriptions.Item label="奖励数值">{formatNumber(selected.rewardValue)}</Descriptions.Item>
            <Descriptions.Item label="奖励关联 ID">{selected.rewardRefId ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="奖励标题">{selected.title || '-'}</Descriptions.Item>
            <Descriptions.Item label="排序">{formatNumber(selected.sort)}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={rewardStatusColor(selected.status)}>{selected.statusLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <Modal
        open={modalOpen}
        title={editingItem ? '编辑签到奖励' : '新增签到奖励'}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnClose
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onOk={() => void handleSubmit()}
      >
        <ConfigProvider theme={SEARCH_THEME}>
          <Form form={configForm} layout="vertical" preserve={false}>
            <Form.Item
              label="签到天数"
              name="dayNo"
              rules={[{ required: true, message: '请输入签到天数' }]}
            >
              <InputNumber min={1} max={365} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="奖励类型"
              name="rewardType"
              rules={[{ required: true, message: '请选择奖励类型' }]}
            >
              <Select options={REWARD_TYPE_OPTIONS as never} placeholder="奖励类型" />
            </Form.Item>
            <Form.Item
              label="奖励数值"
              name="rewardValue"
              rules={[{ required: true, message: '请输入奖励数值' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="奖励数值" />
            </Form.Item>
            {rewardType === 'coupon' || rewardType === 'physical' ? (
              <Form.Item
                label="奖励关联 ID"
                name="rewardRefId"
                rules={[{ required: true, message: '请输入奖励关联 ID' }]}
              >
                <Input allowClear placeholder="奖励关联 ID" />
              </Form.Item>
            ) : null}
            <Form.Item label="奖励标题" name="title">
              <Input allowClear placeholder="奖励标题" />
            </Form.Item>
            <Form.Item label="排序" name="sort">
              <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="排序" />
            </Form.Item>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select options={STATUS_OPTIONS as never} placeholder="状态" />
            </Form.Item>
          </Form>
        </ConfigProvider>
      </Modal>
    </div>
  );

  async function handleSubmit() {
    try {
      const values = await configForm.validateFields();
      const payload: CreateAdminCheckinRewardConfigPayload | UpdateAdminCheckinRewardConfigPayload = {
        dayNo: values.dayNo,
        rewardType: values.rewardType,
        rewardValue: values.rewardValue,
        rewardRefId:
          values.rewardType === 'coupon' || values.rewardType === 'physical'
            ? normalizeRewardRefIdInput(values.rewardRefId)
            : null,
        title: values.title?.trim() || null,
        sort: values.sort ?? values.dayNo,
        ...(editingItem ? {} : { status: values.status }),
      };

      setSubmitting(true);
      if (editingItem) {
        await updateAdminCheckinRewardConfig(editingItem.id, payload);
        messageApi.success('签到奖励已更新');
      } else {
        await createAdminCheckinRewardConfig(payload);
        messageApi.success('签到奖励已新增');
      }

      setModalOpen(false);
      setEditingItem(null);
      configForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      messageApi.error(error instanceof Error ? error.message : '保存签到奖励失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(record: AdminCheckinRewardConfigItem) {
    try {
      const nextStatus: AdminCheckinRewardConfigStatus =
        record.status === 'active' ? 'disabled' : 'active';
      await updateAdminCheckinRewardConfigStatus(record.id, { status: nextStatus });
      messageApi.success(nextStatus === 'active' ? '签到奖励已启用' : '签到奖励已停用');
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '签到奖励状态更新失败');
    }
  }
}
