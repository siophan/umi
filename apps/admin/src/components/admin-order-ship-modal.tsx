import { ConfigProvider, Form, Input, Modal, Select } from 'antd';
import type { FormInstance } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';

export type AdminOrderShipFormValues = {
  shippingType: 'express' | 'same_city' | 'self_pickup';
  trackingNo?: string;
};

interface AdminOrderShipModalProps {
  open: boolean;
  submitting: boolean;
  orderSn: string | null;
  form: FormInstance<AdminOrderShipFormValues>;
  onCancel: () => void;
  onSubmit: () => void;
}

const SHIPPING_TYPE_OPTIONS = [
  { label: '快递', value: 'express' },
  { label: '同城配送', value: 'same_city' },
  { label: '到店自提', value: 'self_pickup' },
];

export function AdminOrderShipModal({
  open,
  submitting,
  orderSn,
  form,
  onCancel,
  onSubmit,
}: AdminOrderShipModalProps) {
  const shippingType = Form.useWatch('shippingType', form);

  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        destroyOnClose
        open={open}
        title={`订单发货${orderSn ? ` · ${orderSn}` : ''}`}
        okText="确认发货"
        cancelText="取消"
        confirmLoading={submitting}
        onCancel={onCancel}
        onOk={onSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="物流方式"
            name="shippingType"
            rules={[{ required: true, message: '请选择物流方式' }]}
          >
            <Select options={SHIPPING_TYPE_OPTIONS} placeholder="请选择物流方式" />
          </Form.Item>
          <Form.Item
            label="物流单号"
            name="trackingNo"
            rules={
              shippingType === 'express'
                ? [{ required: true, message: '快递发货必须填写物流单号' }]
                : undefined
            }
          >
            <Input
              allowClear
              placeholder={
                shippingType === 'express' ? '请输入物流单号' : '非快递发货可留空'
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
