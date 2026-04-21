import { ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import {
  type AdjustFormValues,
  EQUITY_SUB_TYPE_OPTIONS,
} from '../lib/admin-equity';

interface AdminEquityAdjustModalProps {
  form: ReturnType<typeof Form.useForm<AdjustFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
  title: string;
}

export function AdminEquityAdjustModal({
  form,
  onCancel,
  onSubmit,
  open,
  submitting,
  title,
}: AdminEquityAdjustModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        cancelText="取消"
        confirmLoading={submitting}
        okText="确认调账"
        open={open}
        title={title}
        onCancel={onCancel}
        onOk={onSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="子账户类型"
            name="subType"
            rules={[{ required: true, message: '请选择子账户类型' }]}
          >
            <Select
              options={EQUITY_SUB_TYPE_OPTIONS as unknown as { label: string; value: string }[]}
            />
          </Form.Item>
          <Form.Item
            label="金额（正数增加，负数扣减）"
            name="amount"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea placeholder="请输入调账原因" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
