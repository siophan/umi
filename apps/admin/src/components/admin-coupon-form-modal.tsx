import type { AdminCouponTemplateItem } from '@umi/shared';
import { ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd';

import {
  type CouponFormValues,
  RAW_STATUS_OPTIONS,
  SCOPE_OPTIONS,
  TYPE_OPTIONS,
  VALIDITY_OPTIONS,
} from '../lib/admin-coupon';
import { SEARCH_THEME } from './admin-list-controls';

interface AdminCouponFormModalProps {
  open: boolean;
  editingCoupon: AdminCouponTemplateItem | null;
  couponType?: CouponFormValues['type'];
  scopeType?: CouponFormValues['scopeType'];
  validityType?: CouponFormValues['validityType'];
  submitting: boolean;
  form: ReturnType<typeof Form.useForm<CouponFormValues>>[0];
  initialValues: Partial<CouponFormValues>;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
}

export function AdminCouponFormModal({
  open,
  editingCoupon,
  couponType,
  scopeType,
  validityType,
  submitting,
  form,
  initialValues,
  onCancel,
  onSubmit,
}: AdminCouponFormModalProps) {
  return (
    <Modal
      open={open}
      title={editingCoupon ? '编辑优惠券' : '新增优惠券'}
      okText="确定"
      cancelText="取消"
      confirmLoading={submitting}
      destroyOnClose
      onCancel={onCancel}
      onOk={() => void onSubmit()}
    >
      <ConfigProvider theme={SEARCH_THEME}>
        <Form form={form} layout="vertical" preserve={false} initialValues={initialValues}>
          <Form.Item
            label="优惠券名称"
            name="name"
            rules={[{ required: true, message: '请输入优惠券名称' }]}
          >
            <Input allowClear placeholder="优惠券名称" />
          </Form.Item>
          <Form.Item
            label="券类型"
            name="type"
            rules={[{ required: true, message: '请选择券类型' }]}
          >
            <Select options={TYPE_OPTIONS as never} placeholder="券类型" />
          </Form.Item>
          <Form.Item
            label="适用范围"
            name="scopeType"
            rules={[{ required: true, message: '请选择适用范围' }]}
          >
            <Select options={SCOPE_OPTIONS as never} placeholder="适用范围" />
          </Form.Item>
          {scopeType === 'shop' ? (
            <Form.Item
              label="指定店铺 ID"
              name="shopId"
              rules={[{ required: true, message: '请输入指定店铺 ID' }]}
            >
              <Input allowClear placeholder="指定店铺 ID" />
            </Form.Item>
          ) : null}
          <Form.Item
            label="使用门槛（元）"
            name="minAmountYuan"
            rules={[{ required: true, message: '请输入使用门槛' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="使用门槛（元）" />
          </Form.Item>
          {couponType === 'discount' ? (
            <>
              <Form.Item
                label="折扣率"
                name="discountRate"
                rules={[{ required: true, message: '请输入折扣率' }]}
              >
                <InputNumber min={0.1} max={10} precision={2} style={{ width: '100%' }} placeholder="例如 8.5" />
              </Form.Item>
              <Form.Item
                label="最高优惠金额（元）"
                name="maxDiscountAmountYuan"
                rules={[{ required: true, message: '请输入最高优惠金额' }]}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="最高优惠金额（元）" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              label={couponType === 'shipping' ? '减免金额（元）' : '优惠金额（元）'}
              name="discountAmountYuan"
              rules={[{ required: true, message: '请输入优惠金额' }]}
            >
              <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="优惠金额（元）" />
            </Form.Item>
          )}
          <Form.Item
            label="有效期类型"
            name="validityType"
            rules={[{ required: true, message: '请选择有效期类型' }]}
          >
            <Select options={VALIDITY_OPTIONS as never} placeholder="有效期类型" />
          </Form.Item>
          {validityType === 'fixed' ? (
            <>
              <Form.Item
                label="开始时间"
                name="startAt"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <Input type="datetime-local" />
              </Form.Item>
              <Form.Item
                label="结束时间"
                name="endAt"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <Input type="datetime-local" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              label="领取后有效天数"
              name="validDays"
              rules={[{ required: true, message: '请输入领取后有效天数' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="领取后有效天数" />
            </Form.Item>
          )}
          <Form.Item
            label="发放总量"
            name="totalQuantity"
            rules={[{ required: true, message: '请输入发放总量' }]}
          >
            <InputNumber min={-1} precision={0} style={{ width: '100%' }} placeholder="-1 表示不限" />
          </Form.Item>
          <Form.Item
            label="每人限领"
            name="userLimit"
            rules={[{ required: true, message: '请输入每人限领数量' }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="每人限领数量" />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select options={RAW_STATUS_OPTIONS as never} placeholder="状态" />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <Input.TextArea rows={4} placeholder="优惠券说明" />
          </Form.Item>
        </Form>
      </ConfigProvider>
    </Modal>
  );
}
