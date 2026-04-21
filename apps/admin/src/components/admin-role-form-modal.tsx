import type { FormInstance } from 'antd';
import { ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import type { CreateRoleFormValues, RoleFormValues } from '../lib/admin-roles';

interface AdminRoleFormModalProps {
  create: boolean;
  form: FormInstance;
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
  title: string;
}

export function AdminRoleFormModal({
  create,
  form,
  onCancel,
  onSubmit,
  open,
  submitting,
  title,
}: AdminRoleFormModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        destroyOnHidden
        open={open}
        title={title}
        okText={create ? '创建' : '保存'}
        cancelText="取消"
        confirmLoading={submitting}
        onOk={onSubmit}
        onCancel={onCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="角色编码" name="code" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input allowClear placeholder="例如：operator" />
          </Form.Item>
          <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input allowClear placeholder="例如：运营" />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <Input.TextArea allowClear placeholder="可选" rows={2} />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          {create ? (
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
