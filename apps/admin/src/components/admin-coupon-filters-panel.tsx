import type { FormInstance } from 'antd';
import { Form, Input, Select } from 'antd';

import { AdminSearchPanel, AdminStatusTabs } from './admin-list-controls';
import type { CouponFilters } from '../lib/admin-coupon';
import { SCOPE_OPTIONS, TYPE_OPTIONS } from '../lib/admin-coupon';
import type { CouponStatusKey } from '../lib/admin-coupon-page';

interface AdminCouponFiltersPanelProps {
  form: FormInstance<CouponFilters>;
  activeStatus: CouponStatusKey;
  statusItems: Array<{ key: CouponStatusKey; label: string; count: number }>;
  onSearch: () => void;
  onReset: () => void;
  onStatusChange: (status: CouponStatusKey) => void;
}

export function AdminCouponFiltersPanel({
  form,
  activeStatus,
  statusItems,
  onSearch,
  onReset,
  onStatusChange,
}: AdminCouponFiltersPanelProps) {
  return (
    <>
      <AdminSearchPanel form={form} onSearch={onSearch} onReset={onReset}>
        <Form.Item name="name">
          <Input allowClear placeholder="优惠券名称" />
        </Form.Item>
        <Form.Item name="code">
          <Input allowClear placeholder="优惠券编码" />
        </Form.Item>
        <Form.Item name="type">
          <Select allowClear options={TYPE_OPTIONS as never} placeholder="券类型" />
        </Form.Item>
        <Form.Item name="scopeType">
          <Select allowClear options={SCOPE_OPTIONS as never} placeholder="适用范围" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={activeStatus}
        items={statusItems}
        onChange={(key) => onStatusChange(key as CouponStatusKey)}
      />
    </>
  );
}
