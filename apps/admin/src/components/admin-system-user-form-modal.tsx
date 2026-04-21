import type { AdminSystemUserItem } from '../lib/api/system';
import { ConfigProvider, Form, Input, Modal, Select } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import type { SystemUserFormValues } from '../lib/admin-system-users';

interface AdminSystemUserFormModalProps {
  open: boolean;
  editing: AdminSystemUserItem | null;
  submitting: boolean;
  form: ReturnType<typeof Form.useForm<SystemUserFormValues>>[0];
  activeRoleOptions: Array<{ label: string; value: string }>;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
}

export function AdminSystemUserFormModal({
  open,
  editing,
  submitting,
  form,
  activeRoleOptions,
  onCancel,
  onSubmit,
}: AdminSystemUserFormModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        confirmLoading={submitting}
        destroyOnHidden
        open={open}
        title={editing ? '编辑系统用户' : '新增系统用户'}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
        onCancel={onCancel}
        onOk={() => void onSubmit()}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="系统用户名"
            name="username"
            rules={[{ required: true, message: '请输入系统用户名' }]}
          >
            <Input maxLength={50} placeholder="请输入系统用户名" />
          </Form.Item>
          <Form.Item
            label="显示名称"
            name="displayName"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input maxLength={50} placeholder="请输入显示名称" />
          </Form.Item>
          {!editing ? (
            <Form.Item
              label="登录密码"
              name="password"
              rules={[
                { required: true, message: '请输入登录密码' },
                { min: 6, message: '密码长度不能少于 6 位' },
              ]}
            >
              <Input.Password placeholder="请输入登录密码" />
            </Form.Item>
          ) : null}
          <Form.Item
            label="角色"
            name="roleIds"
            rules={[{ required: true, message: '请至少选择一个角色' }]}
          >
            <Select mode="multiple" options={activeRoleOptions} placeholder="请选择角色" />
          </Form.Item>
          <Form.Item label="手机号" name="phoneNumber">
            <Input maxLength={20} placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input maxLength={100} placeholder="请输入邮箱" />
          </Form.Item>
          {!editing ? (
            <Form.Item label="初始状态" name="status">
              <Select
                options={[
                  { label: '启用', value: 'active' },
                  { label: '停用', value: 'disabled' },
                ]}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
