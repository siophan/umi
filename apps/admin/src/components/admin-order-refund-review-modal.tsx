import { ConfigProvider, Form, Input, Modal, Radio } from 'antd';
import type { FormInstance } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';

export type AdminOrderRefundReviewFormValues = {
  status: 'approved' | 'rejected';
  reviewNote?: string;
};

interface AdminOrderRefundReviewModalProps {
  open: boolean;
  submitting: boolean;
  refundNo: string | null;
  form: FormInstance<AdminOrderRefundReviewFormValues>;
  onCancel: () => void;
  onSubmit: () => void;
}

export function AdminOrderRefundReviewModal({
  open,
  submitting,
  refundNo,
  form,
  onCancel,
  onSubmit,
}: AdminOrderRefundReviewModalProps) {
  const status = Form.useWatch('status', form);

  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        destroyOnClose
        open={open}
        title={`退款审核${refundNo ? ` · ${refundNo}` : ''}`}
        okText="保存审核"
        cancelText="取消"
        confirmLoading={submitting}
        onCancel={onCancel}
        onOk={onSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="审核结果"
            name="status"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Radio.Group
              options={[
                { label: '通过', value: 'approved' },
                { label: '拒绝', value: 'rejected' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={status === 'rejected' ? '拒绝原因' : '审核备注'}
            name="reviewNote"
            rules={
              status === 'rejected'
                ? [{ required: true, message: '请填写拒绝原因' }]
                : undefined
            }
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 5 }}
              placeholder={status === 'rejected' ? '请填写拒绝原因' : '可选填写审核备注'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
