import type { CreateAdminNotificationPayload } from '@umi/shared';
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
  Modal,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, SEARCH_THEME } from '../components/admin-list-controls';
import {
  createAdminNotification,
  fetchAdminNotifications,
  type AdminNotificationItem,
} from '../lib/api/system';
import { formatDateTime, formatPercent } from '../lib/format';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface SystemNotificationsPageProps {
  refreshToken?: number;
}

type NotificationFilters = {
  keyword?: string;
  type?: AdminNotificationItem['type'];
  audience?: AdminNotificationItem['audience'];
};

type NotificationFormValues = {
  title: string;
  content: string;
  type: CreateAdminNotificationPayload['type'];
  audience: CreateAdminNotificationPayload['audience'];
  actionUrl?: string;
};

const TYPE_OPTIONS = [
  { label: '系统通知', value: 'system' },
  { label: '订单通知', value: 'order' },
  { label: '竞猜通知', value: 'guess' },
  { label: '社交通知', value: 'social' },
] as const;

const AUDIENCE_OPTIONS = [
  { label: '全部用户', value: 'all_users' },
  { label: '订单用户', value: 'order_users' },
  { label: '竞猜用户', value: 'guess_users' },
  { label: '动态用户', value: 'post_users' },
  { label: '聊天用户', value: 'chat_users' },
] as const;

const TYPE_LABELS: Record<AdminNotificationItem['type'], string> = {
  system: '系统通知',
  order: '订单通知',
  guess: '竞猜通知',
  social: '社交通知',
};

const AUDIENCE_LABELS: Record<AdminNotificationItem['audience'], string> = {
  all_users: '全部用户',
  order_users: '订单用户',
  guess_users: '竞猜用户',
  post_users: '动态用户',
  chat_users: '聊天用户',
  targeted_users: '指定用户',
};

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
  const [selected, setSelected] = useState<AdminNotificationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    setIssue(null);
    try {
      const result = await fetchAdminNotifications();
      setRows(result.items);
    } catch (error) {
      setRows([]);
      setIssue(error instanceof Error ? error.message : '通知批次加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, [refreshToken]);

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (
          filters.keyword &&
          !record.title.toLowerCase().includes(filters.keyword.trim().toLowerCase())
        ) {
          return false;
        }
        if (filters.type && record.type !== filters.type) {
          return false;
        }
        if (filters.audience && record.audience !== filters.audience) {
          return false;
        }
        return true;
      }),
    [filters, rows],
  );

  const columns: ProColumns<AdminNotificationItem>[] = [
    {
      title: '通知标题',
      dataIndex: 'title',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {TYPE_LABELS[record.type]}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '目标人群',
      dataIndex: 'audience',
      width: 140,
      render: (_, record) => AUDIENCE_LABELS[record.audience] ?? record.audience,
    },
    {
      title: '接收人数',
      dataIndex: 'recipientCount',
      width: 120,
    },
    {
      title: '已读率',
      width: 120,
      render: (_, record) =>
        formatPercent(
          record.recipientCount === 0 ? 0 : record.readCount / record.recipientCount,
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: () => <Tag color="success">已发送</Tag>,
    },
    {
      title: '发送时间',
      dataIndex: 'sentAt',
      width: 180,
      render: (_, record) => formatDateTime(record.sentAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
        </div>
      ),
    },
  ];

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
      await loadNotifications();
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
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
        }}
      >
        <Form.Item name="keyword">
          <Input allowClear placeholder="通知标题" />
        </Form.Item>
        <Form.Item name="type">
          <Select allowClear options={TYPE_OPTIONS as never} placeholder="消息类型" />
        </Form.Item>
        <Form.Item name="audience">
          <Select allowClear options={AUDIENCE_OPTIONS as never} placeholder="目标人群" />
        </Form.Item>
      </AdminSearchPanel>

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminNotificationItem>
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
                modalForm.resetFields();
                modalForm.setFieldsValue({
                  type: 'system',
                  audience: 'all_users',
                });
                setModalOpen(true);
              }}
            >
              发送通知
            </Button>,
          ]}
        />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        width={460}
        title={selected?.title}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="通知标题">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="通知正文">
              <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {selected.content || '-'}
              </Typography.Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="消息类型">
              {TYPE_LABELS[selected.type]}
            </Descriptions.Item>
            <Descriptions.Item label="目标人群">
              {AUDIENCE_LABELS[selected.audience] ?? selected.audience}
            </Descriptions.Item>
            <Descriptions.Item label="接收人数">
              {selected.recipientCount}
            </Descriptions.Item>
            <Descriptions.Item label="已读数">{selected.readCount}</Descriptions.Item>
            <Descriptions.Item label="未读数">{selected.unreadCount}</Descriptions.Item>
            <Descriptions.Item label="跳转链接">
              {selected.actionUrl || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="目标类型">
              {selected.targetType === 'unknown' ? '-' : selected.targetType}
            </Descriptions.Item>
            <Descriptions.Item label="目标 ID">
              {selected.targetId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(selected.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="发送时间">
              {formatDateTime(selected.sentAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          destroyOnHidden
          open={modalOpen}
          title="发送通知"
          okText="发送"
          cancelText="取消"
          confirmLoading={submitting}
          onOk={() => void handleCreateNotification()}
          onCancel={() => {
            setModalOpen(false);
            modalForm.resetFields();
          }}
        >
          <Form form={modalForm} layout="vertical">
            <Form.Item
              label="通知标题"
              name="title"
              rules={[{ required: true, message: '请输入通知标题' }]}
            >
              <Input allowClear maxLength={60} placeholder="例如：系统维护通知" />
            </Form.Item>
            <Form.Item
              label="通知内容"
              name="content"
              rules={[{ required: true, message: '请输入通知内容' }]}
            >
              <Input.TextArea
                allowClear
                maxLength={500}
                placeholder="请输入要发送的通知内容"
                rows={4}
                showCount
              />
            </Form.Item>
            <Form.Item
              label="消息类型"
              name="type"
              rules={[{ required: true, message: '请选择消息类型' }]}
            >
              <Select options={TYPE_OPTIONS as never} placeholder="请选择消息类型" />
            </Form.Item>
            <Form.Item
              label="目标人群"
              name="audience"
              rules={[{ required: true, message: '请选择目标人群' }]}
            >
              <Select options={AUDIENCE_OPTIONS as never} placeholder="请选择目标人群" />
            </Form.Item>
            <Form.Item label="跳转链接" name="actionUrl">
              <Input allowClear placeholder="可选，例如：/orders 或 /guess/123" />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
}
