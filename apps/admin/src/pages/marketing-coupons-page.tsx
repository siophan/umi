import { Alert, Form, message } from 'antd';
import { useMemo } from 'react';

import { AdminCouponDetailDrawer } from '../components/admin-coupon-detail-drawer';
import { AdminCouponFiltersPanel } from '../components/admin-coupon-filters-panel';
import { AdminCouponFormModal } from '../components/admin-coupon-form-modal';
import { AdminCouponGrantModal } from '../components/admin-coupon-grant-modal';
import { AdminCouponTable } from '../components/admin-coupon-table';
import {
  type CouponFilters,
  type CouponFormValues,
  type GrantFormValues,
} from '../lib/admin-coupon';
import {
  buildCouponColumns,
  buildCouponStatusItems,
} from '../lib/admin-coupon-page';
import { useAdminCouponPageState } from '../lib/admin-coupon-page-state';

interface MarketingCouponsPageProps {
  refreshToken?: number;
}

export function MarketingCouponsPage({ refreshToken = 0 }: MarketingCouponsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<CouponFilters>();
  const [couponForm] = Form.useForm<CouponFormValues>();
  const [grantForm] = Form.useForm<GrantFormValues>();

  const couponType = Form.useWatch('type', couponForm);
  const scopeType = Form.useWatch('scopeType', couponForm);
  const validityType = Form.useWatch('validityType', couponForm);

  const {
    filters,
    setFilters,
    status,
    setStatus,
    rows,
    summary,
    loading,
    issue,
    selected,
    setSelected,
    batches,
    batchLoading,
    editingCoupon,
    setEditingCoupon,
    grantingCoupon,
    setGrantingCoupon,
    formOpen,
    setFormOpen,
    grantOpen,
    setGrantOpen,
    couponInitialValues,
    grantInitialValues,
    submitting,
    grantSubmitting,
    openCreateCoupon,
    openEditCoupon,
    openGrantCoupon,
    handleSubmitCoupon,
    handleGrantCoupon,
    handleToggleStatus,
    reloadCoupons,
  } = useAdminCouponPageState({
    messageApi,
    couponForm,
    grantForm,
    refreshToken,
  });

  const statusItems = buildCouponStatusItems(summary);
  const columns = useMemo(
    () =>
      buildCouponColumns({
        onView: setSelected,
        onEdit: openEditCoupon,
        onGrant: openGrantCoupon,
        onToggleStatus: handleToggleStatus,
      }),
    [handleToggleStatus, openEditCoupon, openGrantCoupon, setSelected],
  );

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminCouponFiltersPanel
        form={searchForm}
        activeStatus={status}
        statusItems={statusItems}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={handleResetFilters}
        onStatusChange={(key) => setStatus(key)}
      />

      <AdminCouponTable
        rows={rows}
        columns={columns}
        loading={loading}
        onReload={reloadCoupons}
        onCreate={openCreateCoupon}
      />

      <AdminCouponDetailDrawer
        open={selected != null}
        coupon={selected}
        batches={batches}
        batchLoading={batchLoading}
        onClose={() => setSelected(null)}
      />

      <AdminCouponFormModal
        open={formOpen}
        editingCoupon={editingCoupon}
        couponType={couponType}
        scopeType={scopeType}
        validityType={validityType}
        submitting={submitting}
        form={couponForm}
        initialValues={couponInitialValues}
        onCancel={() => {
          setFormOpen(false);
          setEditingCoupon(null);
        }}
        onSubmit={() => void handleSubmitCoupon()}
      />

      <AdminCouponGrantModal
        open={grantOpen}
        couponName={grantingCoupon?.name ?? null}
        submitting={grantSubmitting}
        form={grantForm}
        initialValues={grantInitialValues}
        onCancel={() => {
          setGrantOpen(false);
          setGrantingCoupon(null);
        }}
        onSubmit={() => void handleGrantCoupon()}
      />
    </div>
  );

  function handleResetFilters() {
    searchForm.resetFields();
    setFilters({});
    setStatus('all');
  }
}
