import type {
  AdminInviteRewardConfigStatus,
  AdminInviteRewardType,
  UpdateAdminInviteRewardConfigPayload,
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
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  fetchAdminInviteConfig,
  fetchAdminInviteRecords,
  updateAdminInviteConfig,
  type AdminInviteRewardConfigItem,
} from '../lib/api/invite';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { AdminSearchPanel, SEARCH_THEME } from '../components/admin-list-controls';
import { formatDateTime, formatNumber } from '../lib/format';

interface MarketingInvitePageProps {
  refreshToken?: number;
}

type InviteFilters = {
  inviter?: string;
  invitee?: string;
  inviteCode?: string;
};

type InviteFormValues = {
  inviterRewardType: AdminInviteRewardType;
  inviterRewardValue: number;
  inviterRewardRefId?: string;
  inviteeRewardType: AdminInviteRewardType;
  inviteeRewardValue: number;
  inviteeRewardRefId?: string;
  status: AdminInviteRewardConfigStatus;
};

type InviteRecord = Awaited<ReturnType<typeof fetchAdminInviteRecords>>['items'][number];

const REWARD_TYPE_OPTIONS = [
  { label: '零食币', value: 'coin' },
  { label: '优惠券', value: 'coupon' },
  { label: '实物', value: 'physical' },
] as const;

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
] as const;

function rewardStatusColor(status: AdminInviteRewardConfigStatus) {
  return status === 'active' ? 'success' : 'default';
}

function formatRewardContent(
  rewardTypeLabel: string,
  rewardValue: number,
  rewardRefId: string | null,
) {
  return `${rewardTypeLabel} × ${formatNumber(rewardValue)}${rewardRefId ? ` · 关联ID ${rewardRefId}` : ''}`;
}

function normalizeRewardRefIdInput(value: string | undefined) {
  const text = value?.trim() ?? '';
  if (!text) {
    return null;
  }
  return /^\d+$/.test(text) ? (text as `${bigint}`) : null;
}

export function MarketingInvitePage({ refreshToken = 0 }: MarketingInvitePageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<InviteFilters>();
  const [configForm] = Form.useForm<InviteFormValues>();
  const [rows, setRows] = useState<InviteRecord[]>([]);
  const [config, setConfig] = useState<AdminInviteRewardConfigItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<InviteFilters>({});
  const [selected, setSelected] = useState<InviteRecord | null>(null);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  const inviterRewardType = Form.useWatch('inviterRewardType', configForm);
  const inviteeRewardType = Form.useWatch('inviteeRewardType', configForm);

  useEffect(() => {
    let alive = true;

    async function loadInviteAdminData() {
      setLoading(true);
      setIssue(null);
      try {
        const [configResult, recordsResult] = await Promise.all([
          fetchAdminInviteConfig(),
          fetchAdminInviteRecords({
            inviter: filters.inviter,
            invitee: filters.invitee,
            inviteCode: filters.inviteCode,
          }),
        ]);

        if (!alive) {
          return;
        }

        setConfig(configResult);
        setRows(recordsResult.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setConfig(null);
        setRows([]);
        setIssue(error instanceof Error ? error.message : '邀请管理数据加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadInviteAdminData();

    return () => {
      alive = false;
    };
  }, [actionSeed, filters.invitee, filters.inviteCode, filters.inviter, refreshToken]);

  const columns: ProColumns<InviteRecord>[] = [
    {
      title: '邀请人',
      dataIndex: 'inviterName',
      width: 160,
    },
    {
      title: '邀请人 ID',
      dataIndex: 'inviterId',
      width: 140,
    },
    {
      title: '邀请码',
      dataIndex: 'inviteCode',
      width: 140,
      render: (_, record) => record.inviteCode || '-',
    },
    {
      title: '被邀请人',
      dataIndex: 'inviteeName',
      width: 160,
    },
    {
      title: '被邀请人 ID',
      dataIndex: 'inviteeId',
      width: 140,
    },
    {
      title: '注册时间',
      dataIndex: 'registeredAt',
      width: 180,
      render: (_, record) => formatDateTime(record.registeredAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => setSelected(record)}>
          查看
        </Button>
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
        }}
      >
        <Form.Item name="inviter">
          <Input allowClear placeholder="邀请人" />
        </Form.Item>
        <Form.Item name="invitee">
          <Input allowClear placeholder="被邀请人" />
        </Form.Item>
        <Form.Item name="inviteCode">
          <Input allowClear placeholder="邀请码" />
        </Form.Item>
      </AdminSearchPanel>

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<InviteRecord>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{
            persistenceKey: 'admin-marketing-invite-table',
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
            <Button key="view-config" onClick={() => setConfigDrawerOpen(true)}>
              查看奖励配置
            </Button>,
            <Button
              key="edit-config"
              type="primary"
              onClick={() => {
                configForm.resetFields();
                configForm.setFieldsValue({
                  inviterRewardType: config?.inviterRewardType ?? 'coin',
                  inviterRewardValue: config?.inviterRewardValue ?? 50,
                  inviterRewardRefId: config?.inviterRewardRefId ?? undefined,
                  inviteeRewardType: config?.inviteeRewardType ?? 'coin',
                  inviteeRewardValue: config?.inviteeRewardValue ?? 30,
                  inviteeRewardRefId: config?.inviteeRewardRefId ?? undefined,
                  status: config?.status ?? 'active',
                });
                setConfigModalOpen(true);
              }}
            >
              {config ? '编辑奖励配置' : '新增奖励配置'}
            </Button>,
          ]}
        />
      </ConfigProvider>

      <Drawer
        open={configDrawerOpen}
        title="邀请奖励配置"
        width={460}
        onClose={() => setConfigDrawerOpen(false)}
      >
        {config ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="邀请人奖励">
              {formatRewardContent(
                config.inviterRewardTypeLabel,
                config.inviterRewardValue,
                config.inviterRewardRefId,
              )}
            </Descriptions.Item>
            <Descriptions.Item label="被邀请人奖励">
              {formatRewardContent(
                config.inviteeRewardTypeLabel,
                config.inviteeRewardValue,
                config.inviteeRewardRefId,
              )}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={rewardStatusColor(config.status)}>{config.statusLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(config.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(config.updatedAt)}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Alert type="info" showIcon message="当前还没有邀请奖励配置，请先新增。" />
        )}
      </Drawer>

      <Drawer
        open={selected != null}
        title="邀请记录详情"
        width={460}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="邀请人">{selected.inviterName}</Descriptions.Item>
            <Descriptions.Item label="邀请人 ID">{selected.inviterId}</Descriptions.Item>
            <Descriptions.Item label="邀请人 UID">{selected.inviterUidCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="邀请人手机号">{selected.inviterPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邀请码">{selected.inviteCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="被邀请人">{selected.inviteeName}</Descriptions.Item>
            <Descriptions.Item label="被邀请人 ID">{selected.inviteeId}</Descriptions.Item>
            <Descriptions.Item label="被邀请人 UID">{selected.inviteeUidCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="被邀请人手机号">{selected.inviteePhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="注册时间">{formatDateTime(selected.registeredAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <Modal
        open={configModalOpen}
        title={config ? '编辑邀请奖励配置' : '新增邀请奖励配置'}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnClose
        onCancel={() => setConfigModalOpen(false)}
        onOk={() => void handleSubmit()}
      >
        <ConfigProvider theme={SEARCH_THEME}>
          <Form form={configForm} layout="vertical" preserve={false}>
            <Form.Item
              label="邀请人奖励类型"
              name="inviterRewardType"
              rules={[{ required: true, message: '请选择邀请人奖励类型' }]}
            >
              <Select options={REWARD_TYPE_OPTIONS as never} placeholder="邀请人奖励类型" />
            </Form.Item>
            <Form.Item
              label="邀请人奖励数值"
              name="inviterRewardValue"
              rules={[{ required: true, message: '请输入邀请人奖励数值' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="邀请人奖励数值" />
            </Form.Item>
            {inviterRewardType === 'coupon' || inviterRewardType === 'physical' ? (
              <Form.Item
                label="邀请人奖励关联 ID"
                name="inviterRewardRefId"
                rules={[{ required: true, message: '请输入邀请人奖励关联 ID' }]}
              >
                <Input allowClear placeholder="邀请人奖励关联 ID" />
              </Form.Item>
            ) : null}

            <Form.Item
              label="被邀请人奖励类型"
              name="inviteeRewardType"
              rules={[{ required: true, message: '请选择被邀请人奖励类型' }]}
            >
              <Select options={REWARD_TYPE_OPTIONS as never} placeholder="被邀请人奖励类型" />
            </Form.Item>
            <Form.Item
              label="被邀请人奖励数值"
              name="inviteeRewardValue"
              rules={[{ required: true, message: '请输入被邀请人奖励数值' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="被邀请人奖励数值" />
            </Form.Item>
            {inviteeRewardType === 'coupon' || inviteeRewardType === 'physical' ? (
              <Form.Item
                label="被邀请人奖励关联 ID"
                name="inviteeRewardRefId"
                rules={[{ required: true, message: '请输入被邀请人奖励关联 ID' }]}
              >
                <Input allowClear placeholder="被邀请人奖励关联 ID" />
              </Form.Item>
            ) : null}

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
      const payload: UpdateAdminInviteRewardConfigPayload = {
        inviterRewardType: values.inviterRewardType,
        inviterRewardValue: values.inviterRewardValue,
        inviterRewardRefId:
          values.inviterRewardType === 'coupon' || values.inviterRewardType === 'physical'
            ? normalizeRewardRefIdInput(values.inviterRewardRefId)
            : null,
        inviteeRewardType: values.inviteeRewardType,
        inviteeRewardValue: values.inviteeRewardValue,
        inviteeRewardRefId:
          values.inviteeRewardType === 'coupon' || values.inviteeRewardType === 'physical'
            ? normalizeRewardRefIdInput(values.inviteeRewardRefId)
            : null,
        status: values.status,
      };

      setSubmitting(true);
      const result = await updateAdminInviteConfig(payload);
      setConfig(result.item);
      setConfigModalOpen(false);
      configForm.resetFields();
      messageApi.success('邀请奖励配置已保存');
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      messageApi.error(error instanceof Error ? error.message : '邀请奖励配置保存失败');
    } finally {
      setSubmitting(false);
    }
  }
}
