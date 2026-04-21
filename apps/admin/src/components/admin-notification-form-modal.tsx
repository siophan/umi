import { ConfigProvider, Form, Input, Modal, Select } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import {
  NOTIFICATION_AUDIENCE_OPTIONS,
  type NotificationFormValues,
  NOTIFICATION_TYPE_OPTIONS,
} from '../lib/admin-notifications';

interface AdminNotificationFormModalProps {
  form: ReturnType<typeof Form.useForm<NotificationFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
}

export function AdminNotificationFormModal({
  form,
  onCancel,
  onSubmit,
  open,
  submitting,
}: AdminNotificationFormModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        confirmLoading={submitting}
        destroyOnHidden
        open={open}
        title="发送通知"
        okText="发送"
        cancelText="取消"
        onCancel={onCancel}
        onOk={onSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="通知标题" name="title" rules={[{ required: true, message: '请输入通知标题' }]}>
            <Input allowClear placeholder="请输入通知标题" />
          </Form.Item>
          <Form.Item label="通知内容" name="content" rules={[{ required: true, message: '请输入通知内容' }]}>
            <Input.TextArea rows={4} maxLength={500} showCount placeholder="请输入通知内容" />
          </Form.Item>
          <Form.Item label="通知类型" name="type" rules={[{ required: true, message: '请选择通知类型' }]}>
            <Select options={NOTIFICATION_TYPE_OPTIONS as never} placeholder="请选择通知类型" />
          </Form.Item>
          <Form.Item label="目标人群" name="audience" rules={[{ required: true, message: '请选择目标人群' }]}>
            <Select options={NOTIFICATION_AUDIENCE_OPTIONS as never} placeholder="请选择目标人群" />
          </Form.Item>
          <Form.Item label="跳转链接" name="actionUrl">
            <Input allowClear placeholder="可选，填写站内或站外跳转链接" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
