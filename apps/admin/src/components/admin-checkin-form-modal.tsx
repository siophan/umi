import { ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import type { AdminCheckinRewardConfigItem } from '../lib/api/checkin';
import {
  REWARD_TYPE_OPTIONS,
  STATUS_OPTIONS,
  type CheckinFormValues,
} from '../lib/admin-checkin';

interface AdminCheckinFormModalProps {
  open: boolean;
  editing: AdminCheckinRewardConfigItem | null;
  submitting: boolean;
  rewardType: CheckinFormValues['rewardType'] | undefined;
  form: ReturnType<typeof Form.useForm<CheckinFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
}

export function AdminCheckinFormModal({
  open,
  editing,
  submitting,
  rewardType,
  form,
  onCancel,
  onSubmit,
}: AdminCheckinFormModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        open={open}
        title={editing ? '编辑签到奖励' : '新增签到奖励'}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnHidden
        onCancel={onCancel}
        onOk={() => void onSubmit()}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="签到天数"
            name="dayNo"
            rules={[{ required: true, message: '请输入签到天数' }]}
          >
            <InputNumber min={1} max={365} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="奖励类型"
            name="rewardType"
            rules={[{ required: true, message: '请选择奖励类型' }]}
          >
            <Select options={REWARD_TYPE_OPTIONS as never} placeholder="奖励类型" />
          </Form.Item>
          <Form.Item
            label="奖励数值"
            name="rewardValue"
            rules={[{ required: true, message: '请输入奖励数值' }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="奖励数值" />
          </Form.Item>
          {rewardType === 'coupon' || rewardType === 'physical' ? (
            <Form.Item
              label="奖励关联 ID"
              name="rewardRefId"
              rules={[{ required: true, message: '请输入奖励关联 ID' }]}
            >
              <Input allowClear placeholder="奖励关联 ID" />
            </Form.Item>
          ) : null}
          <Form.Item label="奖励标题" name="title">
            <Input allowClear placeholder="奖励标题" />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="排序" />
          </Form.Item>
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
