import type { MessageInstance } from 'antd/es/message/interface';
import type { AdminCouponTemplateItem } from '@umi/shared';
import { ConfigProvider, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import {
  type CouponFormValues,
  RAW_STATUS_OPTIONS,
  SCOPE_OPTIONS,
  TYPE_OPTIONS,
  VALIDITY_OPTIONS,
} from '../lib/admin-coupon';
import { fetchAdminBrandLibrary } from '../lib/api/catalog-products';
import { fetchAdminBrands } from '../lib/api/merchant-brands';
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
  messageApi?: MessageInstance;
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
  messageApi,
  onCancel,
  onSubmit,
}: AdminCouponFormModalProps) {
  const [brandOptions, setBrandOptions] = useState<{ label: string; value: string }[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandProductOptions, setBrandProductOptions] = useState<{ label: string; value: string }[]>([]);
  const [brandProductsLoading, setBrandProductsLoading] = useState(false);

  const watchedBrandId = Form.useWatch('brandId', form);

  const loadBrandProducts = useCallback(async (brandId: string) => {
    setBrandProductsLoading(true);
    try {
      const result = await fetchAdminBrandLibrary({ brandId, status: 'active', pageSize: 500 });
      setBrandProductOptions(
        result.items.map((it) => ({ label: it.productName, value: it.id })),
      );
    } catch {
      messageApi?.error('商品列表加载失败，请重试');
    } finally {
      setBrandProductsLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    if (!open) return;
    setBrandsLoading(true);
    fetchAdminBrands()
      .then((result) => {
        setBrandOptions(
          result.items
            .filter((b) => b.status === 'active')
            .map((b) => ({ label: b.name, value: b.id })),
        );
      })
      .catch(() => {
        messageApi?.error('品牌列表加载失败，请重试');
      })
      .finally(() => setBrandsLoading(false));
  }, [open, messageApi]);

  useEffect(() => {
    // 编辑场景：弹层打开时若已有 brandId，预拉对应 SPU 列表
    if (open && editingCoupon?.brandId) {
      loadBrandProducts(String(editingCoupon.brandId));
    }
  }, [open, editingCoupon?.brandId, loadBrandProducts]);

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
          {scopeType === 'brand' ? (
            <>
              <Form.Item
                label="品牌"
                name="brandId"
                rules={[{ required: true, message: '请选择品牌' }]}
              >
                <Select
                  showSearch
                  placeholder="搜索品牌"
                  loading={brandsLoading}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={brandOptions}
                  onChange={(value) => {
                    form.setFieldValue('brandProductIds', undefined);
                    if (typeof value === 'string' && value) loadBrandProducts(value);
                    else setBrandProductOptions([]);
                  }}
                />
              </Form.Item>
              <Form.Item
                label="限定商品（不选 = 该品牌全量）"
                name="brandProductIds"
                tooltip="不勾选任何商品时，模板对该品牌下所有商品生效"
              >
                <Select
                  mode="multiple"
                  placeholder="按需限定到部分商品"
                  loading={brandProductsLoading}
                  options={brandProductOptions}
                  disabled={!watchedBrandId}
                />
              </Form.Item>
            </>
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
            <Form.Item
              label="生效时间"
              name="timeRange"
              rules={[{ required: true, message: '请选择生效时间' }]}
            >
              <DatePicker.RangePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
                placeholder={['开始时间', '结束时间']}
              />
            </Form.Item>
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
