import { ConfigProvider, Form, Input, Modal } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';

interface AdminGuessRejectModalProps {
  form: ReturnType<typeof Form.useForm<{ rejectReason: string }>>[0];
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
}

export function AdminGuessRejectModal({
  form,
  onCancel,
  onSubmit,
  open,
  submitting,
}: AdminGuessRejectModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        confirmLoading={submitting}
        destroyOnHidden
        open={open}
        title="拒绝竞猜审核"
        onCancel={onCancel}
        onOk={onSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="拒绝原因"
            name="rejectReason"
            rules={[{ required: true, message: '请填写拒绝原因' }]}
          >
            <Input.TextArea maxLength={200} rows={4} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
