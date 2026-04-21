import { ConfigProvider, Form, Input, Modal } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';

interface AdminBrandAuthRejectModalProps {
  form: ReturnType<typeof Form.useForm<{ rejectReason: string }>>[0];
  onCancel: () => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
}

export function AdminBrandAuthRejectModal({
  form,
  onCancel,
  onSubmit,
  open,
  submitting,
}: AdminBrandAuthRejectModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        destroyOnHidden
        okButtonProps={{ loading: submitting }}
        open={open}
        title="拒绝品牌授权"
        onCancel={onCancel}
        onOk={onSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="拒绝原因"
            name="rejectReason"
            rules={[{ required: true, message: '请填写拒绝原因' }]}
          >
            <Input.TextArea rows={4} maxLength={200} showCount placeholder="请输入拒绝原因" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
