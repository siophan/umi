import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Space,
  Tabs,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { formatDateTime } from '../lib/format';

import type {
  AdminInviteRewardConfigItem,
  PaymentSettingsResponse,
  UpdateAlipayPaymentSettingsPayload,
  UpdateWechatPaymentSettingsPayload,
} from '@umi/shared';

import { PaymentSettingsAlipayForm } from '../components/payment-settings-alipay-form';
import { PaymentSettingsWechatForm } from '../components/payment-settings-wechat-form';
import {
  REWARD_TYPE_OPTIONS,
  STATUS_OPTIONS,
  buildInviteConfigFormValues,
  buildInviteConfigPayload,
  type InviteFormValues,
} from '../lib/admin-invite';
import {
  fetchAdminInviteConfig,
  updateAdminInviteConfig,
} from '../lib/api/invite';
import {
  fetchPaymentSettings,
  updateAlipayPaymentSettings,
  updateWechatPaymentSettings,
} from '../lib/api/system-settings';

function InviteRewardPanel() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<InviteFormValues>();
  const [config, setConfig] = useState<AdminInviteRewardConfigItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inviterRewardType = Form.useWatch('inviterRewardType', form);
  const inviteeRewardType = Form.useWatch('inviteeRewardType', form);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchAdminInviteConfig()
      .then((result) => {
        if (!alive) return;
        setConfig(result);
        form.setFieldsValue(buildInviteConfigFormValues(result));
      })
      .catch(() => {
        if (alive) messageApi.error('加载邀请奖励配置失败');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [form, messageApi]);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const result = await updateAdminInviteConfig(buildInviteConfigPayload(values));
      setConfig(result.item);
      messageApi.success('邀请奖励配置已保存');
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      messageApi.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
        <Form.Item
          label="邀请人奖励类型"
          name="inviterRewardType"
          rules={[{ required: true, message: '请选择邀请人奖励类型' }]}
        >
          <Select options={REWARD_TYPE_OPTIONS as never} placeholder="邀请人奖励类型" />
        </Form.Item>
        <Form.Item
          label="邀请人奖励数值"
          name="inviterRewardValue"
          rules={[{ required: true, message: '请输入邀请人奖励数值' }]}
        >
          <InputNumber min={1} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        {inviterRewardType === 'coupon' || inviterRewardType === 'physical' ? (
          <Form.Item
            label="邀请人奖励关联 ID"
            name="inviterRewardRefId"
            rules={[{ required: true, message: '请输入邀请人奖励关联 ID' }]}
          >
            <Input allowClear />
          </Form.Item>
        ) : null}
        <Form.Item
          label="被邀请人奖励类型"
          name="inviteeRewardType"
          rules={[{ required: true, message: '请选择被邀请人奖励类型' }]}
        >
          <Select options={REWARD_TYPE_OPTIONS as never} placeholder="被邀请人奖励类型" />
        </Form.Item>
        <Form.Item
          label="被邀请人奖励数值"
          name="inviteeRewardValue"
          rules={[{ required: true, message: '请输入被邀请人奖励数值' }]}
        >
          <InputNumber min={1} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        {inviteeRewardType === 'coupon' || inviteeRewardType === 'physical' ? (
          <Form.Item
            label="被邀请人奖励关联 ID"
            name="inviteeRewardRefId"
            rules={[{ required: true, message: '请输入被邀请人奖励关联 ID' }]}
          >
            <Input allowClear />
          </Form.Item>
        ) : null}
        <Form.Item
          label="状态"
          name="status"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select options={STATUS_OPTIONS as never} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
              保存
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                form.setFieldsValue(buildInviteConfigFormValues(config));
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
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
