import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useState } from 'react';

import { AdminNotificationDetailDrawer } from '../components/admin-notification-detail-drawer';
import { AdminNotificationFormModal } from '../components/admin-notification-form-modal';
import { AdminSearchPanel } from '../components/admin-list-controls';
import {
  buildNotificationColumns,
  type NotificationFilters,
  type NotificationFormValues,
  NOTIFICATION_AUDIENCE_OPTIONS,
  NOTIFICATION_TYPE_OPTIONS,
} from '../lib/admin-notifications';
import {
  createAdminNotification,
  fetchAdminNotifications,
  type AdminNotificationItem,
} from '../lib/api/system';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface SystemNotificationsPageProps {
  refreshToken?: number;
}

export function SystemNotificationsPage({
  refreshToken = 0,
}: SystemNotificationsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<NotificationFilters>();
  const [modalForm] = Form.useForm<NotificationFormValues>();
  const [rows, setRows] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [selected, setSelected] = useState<AdminNotificationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    void loadNotifications();
  }, [filters.audience, filters.keyword, filters.type, page, pageSize, refreshToken, reloadToken]);

  const columns = buildNotificationColumns({
    onView: (record) => setSelected(record),
  });

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={form}
        onSearch={() => {
          setPage(1);
          setFilters(form.getFieldsValue());
        }}
        onReset={() => {
          form.resetFields();
          setPage(1);
          setFilters({});
        }}
      >
        <Form.Item name="keyword">
          <Input allowClear placeholder="通知标题" />
        </Form.Item>
        <Form.Item name="type">
          <Select allowClear options={NOTIFICATION_TYPE_OPTIONS as never} placeholder="通知类型" />
        </Form.Item>
        <Form.Item name="audience">
          <Select allowClear options={NOTIFICATION_AUDIENCE_OPTIONS as never} placeholder="目标人群" />
        </Form.Item>
      </AdminSearchPanel>

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminNotificationItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={rows}
          loading={loading}
          options={{
            reload: () => setReloadToken((current) => current + 1),
            density: true,
            fullScreen: false,
            setting: true,
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPage(1);
                setPageSize(nextPageSize);
                return;
              }
              setPage(nextPage);
            },
            pageSizeOptions: [10, 20, 50],
          }}
          search={false}
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              onClick={() => {
                modalForm.resetFields();
                setModalOpen(true);
              }}
            >
              发送通知
            </Button>,
          ]}
        />
      </ConfigProvider>

      <AdminNotificationDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminNotificationFormModal
        form={modalForm}
        open={modalOpen}
        submitting={submitting}
        onCancel={() => {
          setModalOpen(false);
          modalForm.resetFields();
        }}
        onSubmit={() => void handleCreateNotification()}
      />
    </div>
  );

  async function loadNotifications() {
    setLoading(true);
    setIssue(null);
    try {
      const result = await fetchAdminNotifications({
        page,
        pageSize,
        keyword: filters.keyword,
        type: filters.type,
        audience: filters.audience,
      });
      setRows(result.items);
      setTotal(result.total);
    } catch (error) {
      setRows([]);
      setTotal(0);
      setIssue(error instanceof Error ? error.message : '通知批次加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNotification() {
    try {
      const values = await modalForm.validateFields();
      setSubmitting(true);
      const result = await createAdminNotification({
        title: values.title.trim(),
        content: values.content.trim(),
        type: values.type,
        audience: values.audience,
        actionUrl: values.actionUrl?.trim() || null,
      });
      messageApi.success(`通知已发送，共 ${result.sentCount} 人`);
      setModalOpen(false);
      modalForm.resetFields();
      if (page !== 1) {
        setPage(1);
      } else {
        setReloadToken((current) => current + 1);
      }
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }
}
