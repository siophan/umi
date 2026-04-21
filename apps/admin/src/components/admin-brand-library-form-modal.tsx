import { ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import type { BrandProductFormValues } from '../lib/admin-brand-library';

interface AdminBrandLibraryFormModalProps {
  brandIdOptions: Array<{ label: string; value: string }>;
  categoryIdOptions: Array<{ label: string; value: string }>;
  editing: boolean;
  form: ReturnType<typeof Form.useForm<BrandProductFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
}

export function AdminBrandLibraryFormModal({
  brandIdOptions,
  categoryIdOptions,
  editing,
  form,
  onCancel,
  onSubmit,
  open,
  submitting,
}: AdminBrandLibraryFormModalProps) {
  return (
    <Modal
      open={open}
      title={editing ? '编辑品牌商品' : '新增品牌商品'}
      okText="确定"
      cancelText="取消"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onSubmit}
      destroyOnClose
    >
      <ConfigProvider theme={SEARCH_THEME}>
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="品牌" name="brandId" rules={[{ required: true, message: '请选择品牌' }]}>
            <Select allowClear options={brandIdOptions} placeholder="品牌" />
          </Form.Item>
          <Form.Item label="商品名称" name="name" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input allowClear placeholder="商品名称" />
          </Form.Item>
          <Form.Item label="类目" name="categoryId" rules={[{ required: true, message: '请选择类目' }]}>
            <Select allowClear options={categoryIdOptions} placeholder="类目" />
          </Form.Item>
          <Form.Item
            label="指导价（元）"
            name="guidePriceYuan"
            rules={[{ required: true, message: '请输入指导价' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="指导价（元）" />
          </Form.Item>
          <Form.Item label="供货价（元）" name="supplyPriceYuan">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="供货价（元）" />
          </Form.Item>
          <Form.Item label="封面图" name="defaultImg">
            <Input allowClear placeholder="封面图 URL" />
          </Form.Item>
          <Form.Item label="商品说明" name="description">
            <Input.TextArea rows={4} placeholder="商品说明" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'disabled' },
              ]}
              placeholder="状态"
            />
          </Form.Item>
        </Form>
      </ConfigProvider>
    </Modal>
  );
}
