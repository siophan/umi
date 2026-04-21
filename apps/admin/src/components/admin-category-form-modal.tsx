import { Form, Input, InputNumber, Modal, Select } from 'antd';

import {
  BIZ_TYPE_OPTIONS,
  type CategoryFormValues,
  STATUS_OPTIONS,
} from '../lib/admin-categories';

interface AdminCategoryFormModalProps {
  editing: boolean;
  form: ReturnType<typeof Form.useForm<CategoryFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  parentOptions: Array<{ label: string; value: string }>;
  submitting: boolean;
}

export function AdminCategoryFormModal({
  editing,
  form,
  onCancel,
  onSubmit,
  open,
  parentOptions,
  submitting,
}: AdminCategoryFormModalProps) {
  return (
    <Modal
      confirmLoading={submitting}
      open={open}
      title={editing ? '编辑分类' : '新增分类'}
      okText={editing ? '保存' : '创建'}
      cancelText="取消"
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="业务域"
          name="bizTypeCode"
          rules={[{ required: true, message: '请选择业务域' }]}
        >
          <Select
            disabled={editing}
            options={BIZ_TYPE_OPTIONS as never}
            placeholder="请选择业务域"
          />
        </Form.Item>
        <Form.Item label="父分类" name="parentId">
          <Select
            disabled={editing}
            allowClear
            options={parentOptions}
            placeholder={editing ? '当前不支持修改父分类' : '可选'}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item
          label="分类名称"
          name="name"
          rules={[{ required: true, message: '请输入分类名称' }]}
        >
          <Input placeholder="请输入分类名称" maxLength={50} />
        </Form.Item>
        <Form.Item label="排序" name="sort">
          <InputNumber min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        {!editing ? (
          <Form.Item label="初始状态" name="status">
            <Select options={STATUS_OPTIONS as never} />
          </Form.Item>
        ) : null}
        <Form.Item label="图标地址" name="iconUrl">
          <Input placeholder="可选，填写图片地址" />
        </Form.Item>
        <Form.Item label="分类说明" name="description">
          <Input.TextArea rows={3} placeholder="可选，填写分类说明" maxLength={255} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
