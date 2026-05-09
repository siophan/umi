import {
  Alert,
  Card,
  Skeleton,
  Tabs,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { formatDateTime } from '../lib/format';

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

function InviteRewardPanel() {
  return (
    <Alert
      type="info"
      showIcon
      message="邀请奖励改为多档梯度，已迁移到「营销 - 邀请管理」页签维护"
      description="按累计邀请人数（如第 1 / 3 / 10 / 30 人）配置不同档位的奖励，前往营销 → 邀请管理 进行新增 / 编辑 / 删除。"
    />
  );
}

type AdminPageProps = { refreshToken?: number };


export function SystemSettingsPage({ refreshToken }: AdminPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<PaymentSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wechat' | 'alipay' | 'invite'>('wechat');

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

  const currentChannel = activeTab !== 'invite' ? (activeTab === 'wechat' ? data.wechat : data.alipay) : null;

  return (
    <>
      {contextHolder}
      <Card
      title="参数设置"
      extra={
        currentChannel ? (
          <Typography.Text type="secondary">
            最后更新：{currentChannel.updated_at ? formatDateTime(currentChannel.updated_at) : '尚未配置'}
            {currentChannel.updated_by ? ` by ${currentChannel.updated_by.username}` : ''}
          </Typography.Text>
        ) : null
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={(next) => setActiveTab(next as 'wechat' | 'alipay' | 'invite')}
        items={[
          {
            key: 'wechat',
            label: '微信支付',
            children: (
              <PaymentSettingsWechatForm
                data={data.wechat}
                onSubmit={handleWechatSubmit}
              />
            ),
          },
          {
            key: 'alipay',
            label: '支付宝支付',
            children: (
              <PaymentSettingsAlipayForm
                data={data.alipay}
                onSubmit={handleAlipaySubmit}
              />
            ),
          },
          {
            key: 'invite',
            label: '邀请奖励',
            children: <InviteRewardPanel />,
          },
        ]}
      />
      </Card>
    </>
  );
}
