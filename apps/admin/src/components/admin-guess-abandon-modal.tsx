import { Alert, ConfigProvider, Form, Input, Modal } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';

interface AdminGuessAbandonModalProps {
  open: boolean;
  guessTitle: string | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}

export function AdminGuessAbandonModal({
  open,
  guessTitle,
  submitting,
  onCancel,
  onSubmit,
}: AdminGuessAbandonModalProps) {
  const [form] = Form.useForm<{ reason: string }>();

  async function handleOk() {
    const values = await form.validateFields();
    onSubmit(values.reason.trim());
  }

  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        title="作废竞猜"
        open={open}
        confirmLoading={submitting}
        onOk={() => void handleOk()}
        onCancel={() => {
          if (submitting) return;
          form.resetFields();
          onCancel();
        }}
        okText="确认作废"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        destroyOnHidden
        afterClose={() => form.resetFields()}
      >
        <Alert
          type="warning"
          showIcon
          message="作废后所有已支付投注将原路全额退款（含手续费），未付投注将取消。已结算的竞猜不能作废。"
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          {guessTitle ? (
            <Form.Item label="竞猜">
              <span>{guessTitle}</span>
            </Form.Item>
          ) : null}
          <Form.Item
            label="作废理由"
            name="reason"
            rules={[
              { required: true, message: '请填写作废理由' },
              { whitespace: true, message: '请填写作废理由' },
            ]}
          >
            <Input.TextArea
              rows={3}
              maxLength={200}
              showCount
              placeholder="例如：某选项 0 投注无法正常结算"
            />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
