import { Form, Input, Modal } from 'antd';
import type { FormInstance } from 'antd';

import type { ChangePasswordPayload } from '@umi/shared';

type PasswordFormValues = ChangePasswordPayload & { confirmPassword: string };

interface AdminPasswordModalProps {
  confirmLoading: boolean;
  form: FormInstance<PasswordFormValues>;
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function AdminPasswordModal({
  confirmLoading,
  form,
  open,
  onCancel,
  onSubmit,
}: AdminPasswordModalProps) {
  return (
    <Modal
      confirmLoading={confirmLoading}
      open={open}
      title="修改密码"
      okText="确认修改"
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
      >
        <Form.Item
          extra="当前账号已登录，将校验旧密码后修改。"
          label="当前密码"
          name="currentPassword"
        >
          <Input.Password placeholder="请输入当前密码" />
        </Form.Item>
        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '新密码至少 6 位' },
          ]}
        >
          <Input.Password placeholder="至少 6 位" />
        </Form.Item>
        <Form.Item
          label="确认新密码"
          name="confirmPassword"
          rules={[{ required: true, message: '请再次输入新密码' }]}
        >
          <Input.Password placeholder="再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
