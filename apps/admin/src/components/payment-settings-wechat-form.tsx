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
  WechatPaymentScene,
  WechatPaymentSettingsData,
  UpdateWechatPaymentSettingsPayload,
} from '@umi/shared';

import { SEARCH_THEME } from './admin-list-controls';

const SCENE_OPTIONS: { label: string; value: WechatPaymentScene }[] = [
  { label: 'H5', value: 'h5' },
  { label: 'Native', value: 'native' },
];

type Values = {
  mchid: string;
  cert_serial_no: string;
  api_client_private_key: string;
  api_v3_key: string;
  platform_cert: string;
  notify_url: string;
  scenes: WechatPaymentScene[];
};

function buildInitial(data: WechatPaymentSettingsData): Values {
  const c = data.config;
  return {
    mchid: c.mchid ?? '',
    cert_serial_no: c.cert_serial_no ?? '',
    api_client_private_key: '',
    api_v3_key: '',
    platform_cert: c.platform_cert ?? '',
    notify_url: c.notify_url ?? '',
    scenes: c.scenes ?? [],
  };
}

type Props = {
  data: WechatPaymentSettingsData;
  onSubmit: (payload: UpdateWechatPaymentSettingsPayload) => Promise<void>;
};

export function PaymentSettingsWechatForm({ data, onSubmit }: Props) {
  const [form] = Form.useForm<Values>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(buildInitial(data));
  }, [data, form]);

  const masked = data.secrets_masked;
  const apiV3KeyPlaceholder = masked.api_v3_key.hasValue
    ? `${masked.api_v3_key.preview ?? '••••'}（已配置，留空保持不变）`
    : '32 字符 APIv3 密钥';
  const privateKeyPlaceholder = masked.api_client_private_key.hasValue
    ? '已配置，留空保持不变'
    : '粘贴 apiclient_key.pem 文本';

  async function handleSubmit() {
    const values = await form.validateFields();
    const payload: UpdateWechatPaymentSettingsPayload = {
      config: {
        mchid: values.mchid.trim(),
        cert_serial_no: values.cert_serial_no.trim(),
        platform_cert: values.platform_cert.trim(),
        notify_url: values.notify_url.trim(),
        scenes: values.scenes,
      },
      secrets: {
        api_v3_key: values.api_v3_key.trim() ? values.api_v3_key.trim() : null,
        api_client_private_key: values.api_client_private_key.trim()
          ? values.api_client_private_key.trim()
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
        label="商户号 mchid"
        name="mchid"
        rules={[{ required: true, message: '请填写商户号' }]}
      >
        <Input placeholder="如 1900000001" />
      </Form.Item>

      <Form.Item
        label="商户证书序列号 cert_serial_no"
        name="cert_serial_no"
        rules={[{ required: true, message: '请填写证书序列号' }]}
      >
        <Input placeholder="apiclient_cert.pem 的序列号" />
      </Form.Item>

      <Form.Item
        label={
          <Space>
            商户私钥 api_client_private_key
            {masked.api_client_private_key.hasValue ? (
              <Tag color="green">已配置</Tag>
            ) : (
              <Tag>未配置</Tag>
            )}
          </Space>
        }
        name="api_client_private_key"
        rules={[
          {
            required: !masked.api_client_private_key.hasValue,
            message: '请填写商户私钥',
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
        label={
          <Space>
            APIv3 密钥 api_v3_key
            {masked.api_v3_key.hasValue ? (
              <Tag color="green">已配置</Tag>
            ) : (
              <Tag>未配置</Tag>
            )}
          </Space>
        }
        name="api_v3_key"
        rules={[
          { required: !masked.api_v3_key.hasValue, message: '请填写 APIv3 密钥' },
        ]}
      >
        <Input.Password placeholder={apiV3KeyPlaceholder} autoComplete="off" />
      </Form.Item>

      <Form.Item
        label="平台证书 platform_cert"
        name="platform_cert"
        rules={[{ required: true, message: '请填写平台证书' }]}
      >
        <Input.TextArea
          autoSize={{ minRows: 8, maxRows: 16 }}
          spellCheck={false}
          autoCorrect="off"
          autoComplete="off"
          placeholder="-----BEGIN CERTIFICATE-----..."
        />
      </Form.Item>

      <Form.Item
        label="支付回调地址 notify_url"
        name="notify_url"
        rules={[
          { required: true, message: '请填写回调地址' },
          { type: 'url', message: '必须是 http(s) URL' },
        ]}
      >
        <Input placeholder="https://your.domain/api/payment/wechat/notify" />
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
