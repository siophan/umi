import { ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import {
  type PermissionFormValues,
  PERMISSION_ACTION_OPTIONS,
} from '../lib/admin-permissions';

interface AdminPermissionFormModalProps {
  editing: boolean;
  form: ReturnType<typeof Form.useForm<PermissionFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  parentOptions: Array<{ label: string; value: string }>;
  submitting: boolean;
}

export function AdminPermissionFormModal({
  editing,
  form,
  onCancel,
  onSubmit,
  open,
  parentOptions,
  submitting,
}: AdminPermissionFormModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        confirmLoading={submitting}
        destroyOnHidden
        open={open}
        title={editing ? '编辑权限' : '新增权限'}
        okText="保存"
        cancelText="取消"
        onCancel={onCancel}
        onOk={onSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="权限编码"
            name="code"
            rules={[{ required: true, message: '请输入权限编码' }]}
          >
            <Input allowClear placeholder="请输入权限编码" />
          </Form.Item>
          <Form.Item
            label="权限名称"
            name="name"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input allowClear placeholder="请输入权限名称" />
          </Form.Item>
          <Form.Item
            label="所属模块"
            name="module"
            rules={[{ required: true, message: '请输入所属模块' }]}
          >
            <Input allowClear placeholder="请输入所属模块" />
          </Form.Item>
          <Form.Item
            label="动作"
            name="action"
            rules={[{ required: true, message: '请选择动作' }]}
          >
            <Select options={PERMISSION_ACTION_OPTIONS} placeholder="请选择动作" />
          </Form.Item>
          <Form.Item label="父权限" name="parentId">
            <Select allowClear options={parentOptions} placeholder="请选择父权限" />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          {!editing ? (
            <Form.Item label="状态" name="status">
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
