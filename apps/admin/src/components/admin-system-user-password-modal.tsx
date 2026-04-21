import { ConfigProvider, Form, Input, Modal } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import type { PasswordFormValues } from '../lib/admin-system-users';

interface AdminSystemUserPasswordModalProps {
  open: boolean;
  username: string | null;
  submitting: boolean;
  form: ReturnType<typeof Form.useForm<PasswordFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
}

export function AdminSystemUserPasswordModal({
  open,
  username,
  submitting,
  form,
  onCancel,
  onSubmit,
}: AdminSystemUserPasswordModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        confirmLoading={submitting}
        destroyOnHidden
        open={open}
        title={username ? `重置密码 · ${username}` : '重置密码'}
        okText="确认重置"
        cancelText="取消"
        onCancel={onCancel}
        onOk={() => void onSubmit()}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
