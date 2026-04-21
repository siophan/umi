import type { AdminInviteRewardConfigItem } from '@umi/shared';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';

import { AdminInviteConfigDrawer } from '../components/admin-invite-config-drawer';
import { AdminInviteConfigModal } from '../components/admin-invite-config-modal';
import { AdminInviteDetailDrawer } from '../components/admin-invite-detail-drawer';
import {
  fetchAdminInviteConfig,
  fetchAdminInviteRecords,
  updateAdminInviteConfig,
} from '../lib/api/invite';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { AdminSearchPanel } from '../components/admin-list-controls';
import {
  buildInviteColumns,
  buildInviteConfigFormValues,
  buildInviteConfigPayload,
  type InviteFilters,
  type InviteFormValues,
  type InviteRecord,
} from '../lib/admin-invite';

interface MarketingInvitePageProps {
  refreshToken?: number;
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

  const columns = buildInviteColumns({
    onView: (record) => setSelected(record),
  });

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
                configForm.setFieldsValue(buildInviteConfigFormValues(config));
                setConfigModalOpen(true);
              }}
            >
              {config ? '编辑奖励配置' : '新增奖励配置'}
            </Button>,
          ]}
        />
      </ConfigProvider>

      <AdminInviteConfigDrawer
        open={configDrawerOpen}
        config={config}
        onClose={() => setConfigDrawerOpen(false)}
      />

      <AdminInviteDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminInviteConfigModal
        open={configModalOpen}
        config={config}
        submitting={submitting}
        inviterRewardType={inviterRewardType}
        inviteeRewardType={inviteeRewardType}
        form={configForm}
        onCancel={() => setConfigModalOpen(false)}
        onSubmit={() => void handleSubmit()}
      />
    </div>
  );

  async function handleSubmit() {
    try {
      const values = await configForm.validateFields();
      const payload = buildInviteConfigPayload(values);

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
