import {
  Alert,
  Card,
  Skeleton,
  Space,
  Tabs,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

import type {
  PaymentSettingsResponse,
  UpdateAlipayPaymentSettingsPayload,
  UpdateWechatPaymentSettingsPayload,
} from '@umi/shared';

import { PaymentSettingsAlipayForm } from '../components/payment-settings-alipay-form';
import { PaymentSettingsWechatForm } from '../components/payment-settings-wechat-form';
import {
  fetchPaymentSettings,
  updateAlipayPaymentSettings,
  updateWechatPaymentSettings,
} from '../lib/api/system-settings';

type AdminPageProps = { refreshToken?: number };

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return '尚未配置';
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return iso;
  return date.toLocaleString('zh-CN', { hour12: false });
}

export function SystemSettingsPage({ refreshToken }: AdminPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<PaymentSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wechat' | 'alipay'>('wechat');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchPaymentSettings();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  const handleWechatSubmit = useCallback(
    async (payload: UpdateWechatPaymentSettingsPayload) => {
      try {
        const next = await updateWechatPaymentSettings(payload);
        setData(next);
        messageApi.success('已保存');
      } catch (err) {
        messageApi.error(err instanceof Error ? err.message : '保存失败');
        throw err;
      }
    },
    [messageApi],
  );

  const handleAlipaySubmit = useCallback(
    async (payload: UpdateAlipayPaymentSettingsPayload) => {
      try {
        const next = await updateAlipayPaymentSettings(payload);
        setData(next);
        messageApi.success('已保存');
      } catch (err) {
        messageApi.error(err instanceof Error ? err.message : '保存失败');
        throw err;
      }
    },
    [messageApi],
  );

  if (loading && !data) {
    return (
      <>
        {contextHolder}
        <Card>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        {contextHolder}
        <Alert type="error" showIcon message="加载失败" description={error} />
      </>
    );
  }

  if (!data) return contextHolder;

  const currentChannel = activeTab === 'wechat' ? data.wechat : data.alipay;

  return (
    <>
      {contextHolder}
      <Card
      title="参数设置"
      extra={
        <Typography.Text type="secondary">
          最后更新：{formatUpdatedAt(currentChannel.updated_at)}
          {currentChannel.updated_by ? ` by ${currentChannel.updated_by.username}` : ''}
        </Typography.Text>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={(next) => setActiveTab(next as 'wechat' | 'alipay')}
        items={[
          {
            key: 'wechat',
            label: '微信支付',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Alert
                  type="info"
                  showIcon
                  message="参数仅供平台支付链路使用，密钥/私钥落库前会经 AES-256-GCM 加密。"
                />
                <PaymentSettingsWechatForm
                  data={data.wechat}
                  onSubmit={handleWechatSubmit}
                />
              </Space>
            ),
          },
          {
            key: 'alipay',
            label: '支付宝支付',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Alert
                  type="info"
                  showIcon
                  message="参数仅供平台支付链路使用，密钥/私钥落库前会经 AES-256-GCM 加密。"
                />
                <PaymentSettingsAlipayForm
                  data={data.alipay}
                  onSubmit={handleAlipaySubmit}
                />
              </Space>
            ),
          },
        ]}
      />
      </Card>
    </>
  );
}
