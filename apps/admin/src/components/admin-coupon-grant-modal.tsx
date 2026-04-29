import { ConfigProvider, Form, Input, Modal, Select } from 'antd';

import { type GrantFormValues, GRANT_AUDIENCE_OPTIONS } from '../lib/admin-coupon';
import { SEARCH_THEME } from './admin-list-controls';

interface AdminCouponGrantModalProps {
  open: boolean;
  couponName: string | null;
  submitting: boolean;
  form: ReturnType<typeof Form.useForm<GrantFormValues>>[0];
  initialValues: Partial<GrantFormValues>;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
}

export function AdminCouponGrantModal({
  open,
  couponName,
  submitting,
  form,
  initialValues,
  onCancel,
  onSubmit,
}: AdminCouponGrantModalProps) {
  return (
    <Modal
      open={open}
      title={couponName ? `发券：${couponName}` : '发券'}
      okText="确定"
      cancelText="取消"
      confirmLoading={submitting}
      destroyOnClose
      onCancel={onCancel}
      onOk={() => void onSubmit()}
    >
      <ConfigProvider theme={SEARCH_THEME}>
        <Form form={form} layout="vertical" preserve={false} initialValues={initialValues}>
          <Form.Item
            label="目标人群"
            name="audience"
            rules={[{ required: true, message: '请选择目标人群' }]}
          >
            <Select options={GRANT_AUDIENCE_OPTIONS as never} placeholder="目标人群" />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={4} placeholder="发券备注" />
          </Form.Item>
        </Form>
      </ConfigProvider>
    </Modal>
  );
}
