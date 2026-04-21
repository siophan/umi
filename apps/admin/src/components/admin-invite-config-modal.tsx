import { ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import type { AdminInviteRewardConfigItem } from '../lib/api/invite';
import {
  REWARD_TYPE_OPTIONS,
  STATUS_OPTIONS,
  type InviteFormValues,
} from '../lib/admin-invite';

interface AdminInviteConfigModalProps {
  open: boolean;
  config: AdminInviteRewardConfigItem | null;
  submitting: boolean;
  inviterRewardType: InviteFormValues['inviterRewardType'] | undefined;
  inviteeRewardType: InviteFormValues['inviteeRewardType'] | undefined;
  form: ReturnType<typeof Form.useForm<InviteFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
}

export function AdminInviteConfigModal({
  open,
  config,
  submitting,
  inviterRewardType,
  inviteeRewardType,
  form,
  onCancel,
  onSubmit,
}: AdminInviteConfigModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        open={open}
        title={config ? '编辑邀请奖励配置' : '新增邀请奖励配置'}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnHidden
        onCancel={onCancel}
        onOk={() => void onSubmit()}
      >
        <Form form={form} layout="vertical" preserve={false}>
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
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="邀请人奖励数值" />
          </Form.Item>
          {inviterRewardType === 'coupon' || inviterRewardType === 'physical' ? (
            <Form.Item
              label="邀请人奖励关联 ID"
              name="inviterRewardRefId"
              rules={[{ required: true, message: '请输入邀请人奖励关联 ID' }]}
            >
              <Input allowClear placeholder="邀请人奖励关联 ID" />
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
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="被邀请人奖励数值" />
          </Form.Item>
          {inviteeRewardType === 'coupon' || inviteeRewardType === 'physical' ? (
            <Form.Item
              label="被邀请人奖励关联 ID"
              name="inviteeRewardRefId"
              rules={[{ required: true, message: '请输入被邀请人奖励关联 ID' }]}
            >
              <Input allowClear placeholder="被邀请人奖励关联 ID" />
            </Form.Item>
          ) : null}

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select options={STATUS_OPTIONS as never} placeholder="状态" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}

