import type {
  AdminCouponGrantBatchItem,
  AdminCouponTemplateDisplayStatus,
  AdminCouponTemplateItem,
  AdminCouponTemplateRawStatus,
  CreateAdminCouponGrantBatchPayload,
  CreateAdminCouponTemplatePayload,
  UpdateAdminCouponTemplatePayload,
} from '@umi/shared';
import type { MessageInstance } from 'antd/es/message/interface';
import { useEffect, useState } from 'react';

import type { CouponFilters, CouponFormValues, GrantFormValues } from './admin-coupon';
import {
  buildCouponFormValues,
  buildDefaultCouponFormValues,
} from './admin-coupon';
import {
  buildCouponGrantPayload,
  buildCouponStatusUpdateMessage,
  buildCouponSubmitPayload,
  buildCreateGrantFormValues,
  EMPTY_COUPON_SUMMARY,
} from './admin-coupon-page';
import {
  createAdminCouponGrantBatch,
  createAdminCouponTemplate,
  fetchAdminCouponGrantBatches,
  fetchAdminCoupons,
  updateAdminCouponTemplate,
  updateAdminCouponTemplateStatus,
} from './api/marketing';
import { formatNumber } from './format';

interface UseAdminCouponPageStateOptions {
  messageApi: MessageInstance;
  couponForm: {
    resetFields: () => void;
    setFieldsValue: (values: Partial<CouponFormValues>) => void;
    validateFields: () => Promise<CouponFormValues>;
  };
  grantForm: {
    resetFields: () => void;
    setFieldsValue: (values: Partial<GrantFormValues>) => void;
    validateFields: () => Promise<GrantFormValues>;
  };
  refreshToken?: number;
}

export function useAdminCouponPageState({
  messageApi,
  couponForm,
  grantForm,
  refreshToken = 0,
}: UseAdminCouponPageStateOptions) {
  const [filters, setFilters] = useState<CouponFilters>({});
  const [status, setStatus] = useState<'all' | AdminCouponTemplateDisplayStatus>('all');
  const [rows, setRows] = useState<AdminCouponTemplateItem[]>([]);
  const [summary, setSummary] = useState(EMPTY_COUPON_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminCouponTemplateItem | null>(null);
  const [batches, setBatches] = useState<AdminCouponGrantBatchItem[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCouponTemplateItem | null>(null);
  const [grantingCoupon, setGrantingCoupon] = useState<AdminCouponTemplateItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadCoupons() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminCoupons({
          name: filters.name,
          code: filters.code,
          type: filters.type,
          scopeType: filters.scopeType,
          status,
        });
        if (!alive) {
          return;
        }
        setRows(result.items);
        setSummary(result.summary);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows([]);
        setSummary(EMPTY_COUPON_SUMMARY);
        setIssue(error instanceof Error ? error.message : '优惠券列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadCoupons();

    return () => {
      alive = false;
    };
  }, [actionSeed, filters.code, filters.name, filters.scopeType, filters.type, refreshToken, status]);

  useEffect(() => {
    if (!selected) {
      return;
    }
    const next = rows.find((item) => item.id === selected.id);
    if (next && next !== selected) {
      setSelected(next);
    }
  }, [rows, selected]);

  useEffect(() => {
    let alive = true;

    async function loadBatches() {
      if (!selected) {
        setBatches([]);
        return;
      }

      setBatchLoading(true);
      try {
        const result = await fetchAdminCouponGrantBatches(selected.id);
        if (!alive) {
          return;
        }
        setBatches(result.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setBatches([]);
        if (error instanceof Error) {
          messageApi.error(error.message);
        }
      } finally {
        if (alive) {
          setBatchLoading(false);
        }
      }
    }

    void loadBatches();

    return () => {
      alive = false;
    };
  }, [actionSeed, messageApi, selected]);

  async function handleSubmitCoupon() {
    try {
      const values = await couponForm.validateFields();
      const payload: CreateAdminCouponTemplatePayload | UpdateAdminCouponTemplatePayload =
        buildCouponSubmitPayload(values);

      setSubmitting(true);
      if (editingCoupon) {
        await updateAdminCouponTemplate(editingCoupon.id, payload);
        messageApi.success('优惠券已更新');
      } else {
        await createAdminCouponTemplate(payload);
        messageApi.success('优惠券已新增');
      }

      setFormOpen(false);
      setEditingCoupon(null);
      couponForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      messageApi.error(error instanceof Error ? error.message : '保存优惠券失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGrantCoupon() {
    if (!grantingCoupon) {
      return;
    }

    try {
      const values = await grantForm.validateFields();
      const payload: CreateAdminCouponGrantBatchPayload = buildCouponGrantPayload(values);
      setGrantSubmitting(true);
      const result = await createAdminCouponGrantBatch(grantingCoupon.id, payload);
      messageApi.success(`发券完成，共发放 ${formatNumber(result.grantedCount)} 张`);
      setGrantOpen(false);
      setGrantingCoupon(null);
      grantForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      messageApi.error(error instanceof Error ? error.message : '发券失败');
    } finally {
      setGrantSubmitting(false);
    }
  }

  async function handleToggleStatus(
    record: AdminCouponTemplateItem,
    nextStatus: AdminCouponTemplateRawStatus,
  ) {
    try {
      await updateAdminCouponTemplateStatus(record.id, { status: nextStatus });
      messageApi.success(buildCouponStatusUpdateMessage(nextStatus));
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '优惠券状态更新失败');
    }
  }

  function openCreateCoupon() {
    couponForm.resetFields();
    couponForm.setFieldsValue(buildDefaultCouponFormValues());
    setEditingCoupon(null);
    setFormOpen(true);
  }

  function openEditCoupon(record: AdminCouponTemplateItem) {
    couponForm.resetFields();
    couponForm.setFieldsValue(buildCouponFormValues(record));
    setEditingCoupon(record);
    setFormOpen(true);
  }

  function openGrantCoupon(record: AdminCouponTemplateItem) {
    grantForm.resetFields();
    grantForm.setFieldsValue(buildCreateGrantFormValues());
    setGrantingCoupon(record);
    setGrantOpen(true);
  }

  function reloadCoupons() {
    setActionSeed((value) => value + 1);
  }

  return {
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
    submitting,
    grantSubmitting,
    openCreateCoupon,
    openEditCoupon,
    openGrantCoupon,
    handleSubmitCoupon,
    handleGrantCoupon,
    handleToggleStatus,
    reloadCoupons,
  };
}
