import { ConfigProvider, Form, Input, Modal, Select } from 'antd';

import { AdminOssImageUploader } from './admin-oss-image-uploader';
import { SEARCH_THEME } from './admin-list-controls';
import type { BrandFormValues } from '../lib/admin-brands';

interface AdminBrandFormModalProps {
  categoryIdOptions: Array<{ label: string; value: string }>;
  categoryIssue: string | null;
  editing: boolean;
  form: ReturnType<typeof Form.useForm<BrandFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
  statusOptions: Array<{ label: string; value: string }>;
}

export function AdminBrandFormModal({
  categoryIdOptions,
  categoryIssue,
  editing,
  form,
  onCancel,
  onSubmit,
  open,
  statusOptions,
  submitting,
}: AdminBrandFormModalProps) {
  return (
    <Modal
      open={open}
      title={editing ? '编辑品牌' : '新增品牌'}
      okText="确定"
      cancelText="取消"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onSubmit}
      destroyOnClose
    >
      <ConfigProvider theme={SEARCH_THEME}>
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="品牌名称"
            name="name"
            rules={[{ required: true, message: '请输入品牌名称' }]}
          >
            <Input allowClear placeholder="品牌名称" />
          </Form.Item>
          <Form.Item label="品牌 Logo" name="logoUrl" valuePropName="value">
            <AdminOssImageUploader usage="brand_logo" placeholder="上传 Logo" />
          </Form.Item>
          <Form.Item
            label="类目"
            name="categoryId"
            rules={[{ required: true, message: '请选择类目' }]}
            extra={categoryIssue ? '品牌类目字典加载失败，当前只展示已加载到的品牌类目。' : undefined}
          >
            <Select
              allowClear
              disabled={categoryIdOptions.length === 0}
              options={categoryIdOptions}
              placeholder={categoryIdOptions.length > 0 ? '类目' : '暂无可用类目'}
            />
          </Form.Item>
          <Form.Item label="联系人" name="contactName">
            <Input allowClear placeholder="联系人" />
          </Form.Item>
          <Form.Item label="联系电话" name="contactPhone">
            <Input allowClear placeholder="联系电话" />
          </Form.Item>
          <Form.Item label="品牌说明" name="description">
            <Input.TextArea rows={4} placeholder="品牌说明" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={statusOptions} placeholder="状态" />
          </Form.Item>
        </Form>
      </ConfigProvider>
    </Modal>
  );
}
