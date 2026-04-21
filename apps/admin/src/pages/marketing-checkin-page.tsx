import type { AdminCheckinRewardConfigStatus } from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Form,
  Input,
  InputNumber,
  Select,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import { AdminCheckinDetailDrawer } from '../components/admin-checkin-detail-drawer';
import { AdminCheckinFormModal } from '../components/admin-checkin-form-modal';
import {
  createAdminCheckinRewardConfig,
  fetchAdminCheckinRewardConfigs,
  updateAdminCheckinRewardConfig,
  updateAdminCheckinRewardConfigStatus,
  type AdminCheckinRewardConfigItem,
} from '../lib/api/checkin';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import {
  buildCheckinColumns,
  buildCheckinPayload,
  buildCheckinStatusItems,
  buildCreateCheckinFormValues,
  buildEditCheckinFormValues,
  REWARD_TYPE_OPTIONS,
  type CheckinFilters,
  type CheckinFormValues,
} from '../lib/admin-checkin';

interface MarketingCheckinPageProps {
  refreshToken?: number;
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

  const statusItems = buildCheckinStatusItems(rows);
  const columns: ProColumns<AdminCheckinRewardConfigItem>[] = buildCheckinColumns({
    onView: (record) => setSelected(record),
    onEdit: (record) => {
      configForm.resetFields();
      configForm.setFieldsValue(buildEditCheckinFormValues(record));
      setEditingItem(record);
      setModalOpen(true);
    },
    onToggleStatus: (record) => void handleToggleStatus(record),
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
                configForm.setFieldsValue(buildCreateCheckinFormValues(rows));
                setEditingItem(null);
                setModalOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>

      <AdminCheckinDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminCheckinFormModal
        open={modalOpen}
        editing={editingItem}
        rewardType={rewardType}
        form={configForm}
        submitting={submitting}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={() => void handleSubmit()}
      />
    </div>
  );

  async function handleSubmit() {
    try {
      const values = await configForm.validateFields();
      const payload = buildCheckinPayload(values, editingItem != null);

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
