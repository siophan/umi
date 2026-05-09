import type { AdminInviteRewardConfigItem } from '@umi/shared';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, Modal, message } from 'antd';
import { useEffect, useState } from 'react';

import { AdminInviteConfigDrawer } from '../components/admin-invite-config-drawer';
import { AdminInviteConfigModal } from '../components/admin-invite-config-modal';
import { AdminInviteDetailDrawer } from '../components/admin-invite-detail-drawer';
import {
  createAdminInviteRewardConfig,
  deleteAdminInviteRewardConfig,
  fetchAdminInviteRecords,
  fetchAdminInviteRewardConfigs,
  updateAdminInviteRewardConfig,
} from '../lib/api/invite';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { AdminSearchPanel } from '../components/admin-list-controls';
import {
  buildInviteColumns,
  buildInviteConfigFormValues,
  buildInviteConfigPayload,
  buildInviteRewardConfigColumns,
  type InviteFilters,
  type InviteFormValues,
  type InviteRecord,
} from '../lib/admin-invite';

interface MarketingInvitePageProps {
  refreshToken?: number;
}

export function MarketingInvitePage({ refreshToken = 0 }: MarketingInvitePageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [searchForm] = Form.useForm<InviteFilters>();
  const [configForm] = Form.useForm<InviteFormValues>();
  const [rows, setRows] = useState<InviteRecord[]>([]);
  const [configs, setConfigs] = useState<AdminInviteRewardConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<InviteFilters>({});
  const [selected, setSelected] = useState<InviteRecord | null>(null);
  const [previewConfig, setPreviewConfig] = useState<AdminInviteRewardConfigItem | null>(null);
  const [editingConfig, setEditingConfig] = useState<AdminInviteRewardConfigItem | null>(null);
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
        const [configsResult, recordsResult] = await Promise.all([
          fetchAdminInviteRewardConfigs(),
          fetchAdminInviteRecords({
            inviter: filters.inviter,
            invitee: filters.invitee,
            inviteCode: filters.inviteCode,
          }),
        ]);

        if (!alive) {
          return;
        }

        setConfigs(configsResult.items);
        setRows(recordsResult.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setConfigs([]);
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

  const recordColumns = buildInviteColumns({
    onView: (record) => setSelected(record),
  });

  const configColumns = buildInviteRewardConfigColumns({
    onEdit: (record) => {
      setEditingConfig(record);
      configForm.resetFields();
      configForm.setFieldsValue(buildInviteConfigFormValues(record));
      setConfigModalOpen(true);
    },
    onDelete: (record) => {
      void modalApi.confirm({
        title: '删除邀请奖励档位？',
        content: `第 ${record.threshold} 人触发档位将被永久删除。`,
        okType: 'danger',
        okText: '删除',
        cancelText: '取消',
        async onOk() {
          try {
            await deleteAdminInviteRewardConfig(record.id);
            messageApi.success('档位已删除');
            setActionSeed((value) => value + 1);
          } catch (error) {
            messageApi.error(error instanceof Error ? error.message : '档位删除失败');
          }
        },
      });
    },
  });

  return (
    <div className="page-stack">
      {contextHolder}
      {modalContextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminInviteRewardConfigItem>
          cardBordered={false}
          headerTitle="邀请奖励档位"
          rowKey="id"
          columns={configColumns}
          dataSource={configs}
          loading={loading}
          options={{
            reload: () => setActionSeed((value) => value + 1),
            density: false,
            fullScreen: false,
            setting: false,
          }}
          pagination={false}
          search={false}
          toolBarRender={() => [
            <Button
              key="add-tier"
              type="primary"
              onClick={() => {
                setEditingConfig(null);
                configForm.resetFields();
                configForm.setFieldsValue(buildInviteConfigFormValues(null));
                setConfigModalOpen(true);
              }}
            >
              新增奖励档位
            </Button>,
          ]}
          onRow={(record) => ({
            onClick: () => setPreviewConfig(record),
          })}
        />
      </ConfigProvider>

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
          headerTitle="邀请记录"
          rowKey="id"
          columns={recordColumns}
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
        />
      </ConfigProvider>

      <AdminInviteConfigDrawer
        open={previewConfig != null}
        config={previewConfig}
        onClose={() => setPreviewConfig(null)}
      />

      <AdminInviteDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminInviteConfigModal
        open={configModalOpen}
        config={editingConfig}
        submitting={submitting}
        inviterRewardType={inviterRewardType}
        inviteeRewardType={inviteeRewardType}
        form={configForm}
        onCancel={() => {
          setConfigModalOpen(false);
          setEditingConfig(null);
        }}
        onSubmit={() => void handleSubmit()}
      />
    </div>
  );

  async function handleSubmit() {
    try {
      const values = await configForm.validateFields();
      const payload = buildInviteConfigPayload(values);

      setSubmitting(true);
      if (editingConfig) {
        await updateAdminInviteRewardConfig(editingConfig.id, payload);
        messageApi.success('档位已保存');
      } else {
        await createAdminInviteRewardConfig(payload);
        messageApi.success('档位已新增');
      }
      setConfigModalOpen(false);
      setEditingConfig(null);
      configForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      messageApi.error(error instanceof Error ? error.message : '档位保存失败');
    } finally {
      setSubmitting(false);
    }
  }
}
