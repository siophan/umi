import {
  Button,
  Checkbox,
  ConfigProvider,
  Form,
  Input,
  Space,
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';

import type {
  AlipayPaymentScene,
  AlipayPaymentSettingsData,
  UpdateAlipayPaymentSettingsPayload,
} from '@umi/shared';

import { SEARCH_THEME } from './admin-list-controls';

const SCENE_OPTIONS: { label: string; value: AlipayPaymentScene }[] = [
  { label: '手机网站 (WAP)', value: 'wap' },
];

type Values = {
  app_id: string;
  app_private_key: string;
  app_public_cert: string;
  alipay_public_cert: string;
  alipay_root_cert: string;
  notify_url: string;
  return_url: string;
  scenes: AlipayPaymentScene[];
};

function buildInitial(data: AlipayPaymentSettingsData): Values {
  const c = data.config;
  return {
    app_id: c.app_id ?? '',
    app_private_key: '',
    app_public_cert: c.app_public_cert ?? '',
    alipay_public_cert: c.alipay_public_cert ?? '',
    alipay_root_cert: c.alipay_root_cert ?? '',
    notify_url: c.notify_url ?? '',
    return_url: c.return_url ?? '',
    scenes: c.scenes ?? [],
  };
}

type Props = {
  data: AlipayPaymentSettingsData;
  onSubmit: (payload: UpdateAlipayPaymentSettingsPayload) => Promise<void>;
};

export function PaymentSettingsAlipayForm({ data, onSubmit }: Props) {
  const [form] = Form.useForm<Values>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(buildInitial(data));
  }, [data, form]);

  const masked = data.secrets_masked;
  const privateKeyPlaceholder = masked.app_private_key.hasValue
    ? '已配置，留空保持不变'
    : '粘贴应用私钥（PKCS8 PEM）';

  async function handleSubmit() {
    const values = await form.validateFields();
    const payload: UpdateAlipayPaymentSettingsPayload = {
      config: {
        app_id: values.app_id.trim(),
        app_public_cert: values.app_public_cert.trim(),
        alipay_public_cert: values.alipay_public_cert.trim(),
        alipay_root_cert: values.alipay_root_cert.trim(),
        notify_url: values.notify_url.trim(),
        return_url: values.return_url.trim(),
        scenes: values.scenes,
      },
      secrets: {
        app_private_key: values.app_private_key.trim()
          ? values.app_private_key.trim()
          : null,
      },
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch {
      // page handles message; nothing to do here
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    form.resetFields();
    form.setFieldsValue(buildInitial(data));
  }

  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Form form={form} layout="vertical" autoComplete="off">
      <Form.Item
        label="AppID"
        name="app_id"
        rules={[{ required: true, message: '请填写 AppID' }]}
      >
        <Input placeholder="如 2021000000000000" />
      </Form.Item>

      <Form.Item
        label={
          <Space>
            应用私钥 app_private_key
            {masked.app_private_key.hasValue ? (
              <Tag color="green">已配置</Tag>
            ) : (
              <Tag>未配置</Tag>
            )}
          </Space>
        }
        name="app_private_key"
        rules={[
          {
            required: !masked.app_private_key.hasValue,
            message: '请填写应用私钥',
          },
        ]}
      >
        <Input.TextArea
          autoSize={{ minRows: 8, maxRows: 16 }}
          spellCheck={false}
          autoCorrect="off"
          autoComplete="off"
          placeholder={privateKeyPlaceholder}
        />
      </Form.Item>

      <Form.Item
        label="应用公钥证书 appCertPublicKey.crt"
        name="app_public_cert"
        rules={[{ required: true, message: '请填写应用公钥证书' }]}
      >
        <Input.TextArea
          autoSize={{ minRows: 6, maxRows: 12 }}
          spellCheck={false}
          placeholder="-----BEGIN CERTIFICATE-----..."
        />
      </Form.Item>

      <Form.Item
        label="支付宝公钥证书 alipayCertPublicKey_RSA2.crt"
        name="alipay_public_cert"
        rules={[{ required: true, message: '请填写支付宝公钥证书' }]}
      >
        <Input.TextArea
          autoSize={{ minRows: 6, maxRows: 12 }}
          spellCheck={false}
          placeholder="-----BEGIN CERTIFICATE-----..."
        />
      </Form.Item>

      <Form.Item
        label="支付宝根证书 alipayRootCert.crt"
        name="alipay_root_cert"
        rules={[{ required: true, message: '请填写支付宝根证书' }]}
      >
        <Input.TextArea
          autoSize={{ minRows: 6, maxRows: 12 }}
          spellCheck={false}
          placeholder="-----BEGIN CERTIFICATE-----..."
        />
      </Form.Item>

      <Form.Item
        label="支付通知地址 notify_url"
        name="notify_url"
        rules={[
          { required: true, message: '请填写通知地址' },
          { type: 'url', message: '必须是 http(s) URL' },
        ]}
      >
        <Input placeholder="https://your.domain/api/payment/alipay/notify" />
      </Form.Item>

      <Form.Item
        label="同步返回地址 return_url"
        name="return_url"
        rules={[
          { required: true, message: '请填写同步返回地址' },
          { type: 'url', message: '必须是 http(s) URL' },
        ]}
      >
        <Input placeholder="https://your.domain/payment/return/alipay" />
      </Form.Item>

      <Form.Item
        label="启用支付场景 scenes"
        name="scenes"
        rules={[{ required: true, message: '至少启用一个场景' }]}
      >
        <Checkbox.Group options={SCENE_OPTIONS} />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            保存
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
      </Form>
    </ConfigProvider>
  );
}
