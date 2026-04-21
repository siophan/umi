import type {
  AdminCouponGrantAudience,
  AdminCouponGrantBatchItem,
  AdminCouponTemplateDisplayStatus,
  AdminCouponTemplateItem,
  AdminCouponTemplateRawStatus,
  AdminCouponTemplateScopeType,
  AdminCouponTemplateType,
  CreateAdminCouponGrantBatchPayload,
  CreateAdminCouponTemplatePayload,
  EntityId,
  UpdateAdminCouponTemplatePayload,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs, SEARCH_THEME } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  createAdminCouponGrantBatch,
  createAdminCouponTemplate,
  fetchAdminCouponGrantBatches,
  fetchAdminCoupons,
  updateAdminCouponTemplate,
  updateAdminCouponTemplateStatus,
} from '../lib/api/marketing';
import { formatAmount, formatDateTime, formatNumber } from '../lib/format';

interface MarketingCouponsPageProps {
  refreshToken?: number;
}

type CouponFilters = {
  name?: string;
  code?: string;
  type?: AdminCouponTemplateType;
  scopeType?: AdminCouponTemplateScopeType;
};

type CouponFormValues = {
  name: string;
  type: AdminCouponTemplateType;
  scopeType: AdminCouponTemplateScopeType;
  shopId?: string;
  description?: string;
  minAmountYuan: number;
  discountAmountYuan?: number;
  discountRate?: number;
  maxDiscountAmountYuan?: number;
  validityType: CreateAdminCouponTemplatePayload['validityType'];
  startAt?: string;
  endAt?: string;
  validDays?: number;
  totalQuantity: number;
  userLimit: number;
  status: AdminCouponTemplateRawStatus;
};

type GrantFormValues = {
  audience: AdminCouponGrantAudience;
  note?: string;
};

const TYPE_OPTIONS = [
  { label: '满减券', value: 'cash' },
  { label: '折扣券', value: 'discount' },
  { label: '运费券', value: 'shipping' },
] as const;

const SCOPE_OPTIONS = [
  { label: '平台通用', value: 'platform' },
  { label: '指定店铺', value: 'shop' },
] as const;

const VALIDITY_OPTIONS = [
  { label: '固定时间段', value: 'fixed' },
  { label: '领取后 N 天', value: 'relative' },
] as const;

const RAW_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '暂停', value: 'paused' },
  { label: '停用', value: 'disabled' },
] as const;

const GRANT_AUDIENCE_OPTIONS = [
  { label: '全部用户', value: 'all_users' },
  { label: '下单用户', value: 'order_users' },
  { label: '竞猜用户', value: 'guess_users' },
  { label: '店主用户', value: 'shop_users' },
] as const;

function couponStatusColor(status: AdminCouponTemplateDisplayStatus) {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'scheduled') {
    return 'processing';
  }
  if (status === 'paused') {
    return 'warning';
  }
  if (status === 'ended') {
    return 'default';
  }
  return 'error';
}

function grantStatusColor(status: AdminCouponGrantBatchItem['status']) {
  if (status === 'completed') {
    return 'success';
  }
  if (status === 'processing') {
    return 'processing';
  }
  if (status === 'pending') {
    return 'warning';
  }
  return 'error';
}

function centsToYuan(value: number) {
  return Number((value / 100).toFixed(2));
}

function yuanToCents(value?: number | null) {
  if (value == null) {
    return undefined;
  }
  return Math.round(value * 100);
}

function formatLocalDateTimeInput(value: string | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function MarketingCouponsPage({ refreshToken = 0 }: MarketingCouponsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<CouponFilters>();
  const [couponForm] = Form.useForm<CouponFormValues>();
  const [grantForm] = Form.useForm<GrantFormValues>();

  const [filters, setFilters] = useState<CouponFilters>({});
  const [status, setStatus] = useState<'all' | AdminCouponTemplateDisplayStatus>('all');
  const [rows, setRows] = useState<AdminCouponTemplateItem[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    paused: 0,
    disabled: 0,
    ended: 0,
  });
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

  const couponType = Form.useWatch('type', couponForm);
  const scopeType = Form.useWatch('scopeType', couponForm);
  const validityType = Form.useWatch('validityType', couponForm);

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
        setSummary({
          total: 0,
          active: 0,
          scheduled: 0,
          paused: 0,
          disabled: 0,
          ended: 0,
        });
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

  const statusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: summary.total },
      { key: 'active', label: '启用', count: summary.active },
      { key: 'scheduled', label: '待开始', count: summary.scheduled },
      { key: 'paused', label: '已暂停', count: summary.paused },
      { key: 'disabled', label: '已停用', count: summary.disabled },
      { key: 'ended', label: '已结束', count: summary.ended },
    ],
    [summary],
  );

  const columns: ProColumns<AdminCouponTemplateItem>[] = [
    {
      title: '优惠券名称',
      dataIndex: 'name',
      width: 240,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '券类型',
      dataIndex: 'typeLabel',
      width: 120,
    },
    {
      title: '适用范围',
      width: 180,
      render: (_, record) => {
        if (record.scopeType === 'shop') {
          return record.shopName
            ? `${record.scopeTypeLabel} · ${record.shopName}`
            : `${record.scopeTypeLabel} · 店铺ID ${record.shopId ?? '-'}`;
        }
        return record.scopeTypeLabel;
      },
    },
    {
      title: '优惠内容',
      width: 220,
      render: (_, record) => {
        if (record.type === 'cash') {
          return `满 ${formatAmount(record.minAmount)} 减 ${formatAmount(record.discountAmount)}`;
        }
        if (record.type === 'discount') {
          return `${record.discountRate ?? 0} 折 / 封顶 ${formatAmount(record.maxDiscountAmount)}`;
        }
        return `满 ${formatAmount(record.minAmount)} 免运费`;
      },
    },
    {
      title: '已发放 / 剩余',
      width: 140,
      render: (_, record) =>
        `${formatNumber(record.grantedCount)} / ${
          record.remainingQuantity == null ? '不限' : formatNumber(record.remainingQuantity)
        }`,
    },
    {
      title: '每人限领',
      dataIndex: 'userLimit',
      width: 100,
      render: (_, record) => formatNumber(record.userLimit),
    },
    {
      title: '状态',
      dataIndex: 'statusLabel',
      width: 120,
      render: (_, record) => (
        <Tag color={couponStatusColor(record.status)}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '有效期',
      width: 220,
      render: (_, record) =>
        record.validityType === 'fixed'
          ? `${formatDateTime(record.startAt)} ~ ${formatDateTime(record.endAt)}`
          : `领取后 ${formatNumber(record.validDays)} 天`,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.updatedAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => {
        const actions = [
          <Button key="view" size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>,
          <Button
            key="edit"
            size="small"
            type="link"
            onClick={() => {
              couponForm.resetFields();
              couponForm.setFieldsValue({
                name: record.name,
                type: record.type,
                scopeType: record.scopeType,
                shopId: record.shopId ?? undefined,
                description: record.description || undefined,
                minAmountYuan: centsToYuan(record.minAmount),
                discountAmountYuan: centsToYuan(record.discountAmount),
                discountRate: record.discountRate ?? undefined,
                maxDiscountAmountYuan: centsToYuan(record.maxDiscountAmount),
                validityType: record.validityType,
                startAt: formatLocalDateTimeInput(record.startAt),
                endAt: formatLocalDateTimeInput(record.endAt),
                validDays: record.validDays || undefined,
                totalQuantity: record.totalQuantity,
                userLimit: record.userLimit,
                status: record.rawStatus,
              });
              setEditingCoupon(record);
              setFormOpen(true);
            }}
          >
            编辑
          </Button>,
        ];

        if (record.rawStatus === 'active' && record.status !== 'ended') {
          actions.push(
            <Button
              key="grant"
              size="small"
              type="link"
              onClick={() => {
                grantForm.resetFields();
                grantForm.setFieldsValue({ audience: 'all_users' });
                setGrantingCoupon(record);
                setGrantOpen(true);
              }}
            >
              发券
            </Button>,
          );
        }

        if (record.status === 'active' || record.status === 'scheduled') {
          actions.push(
            <Button
              key="pause"
              size="small"
              type="link"
              onClick={() => void handleToggleStatus(record, 'paused')}
            >
              暂停
            </Button>,
          );
          actions.push(
            <Button
              key="disable"
              size="small"
              type="link"
              onClick={() => void handleToggleStatus(record, 'disabled')}
            >
              停用
            </Button>,
          );
        } else if (record.status === 'paused') {
          actions.push(
            <Button
              key="enable"
              size="small"
              type="link"
              onClick={() => void handleToggleStatus(record, 'active')}
            >
              启用
            </Button>,
          );
          actions.push(
            <Button
              key="disable"
              size="small"
              type="link"
              onClick={() => void handleToggleStatus(record, 'disabled')}
            >
              停用
            </Button>,
          );
        } else if (record.status === 'disabled') {
          actions.push(
            <Button
              key="enable"
              size="small"
              type="link"
              onClick={() => void handleToggleStatus(record, 'active')}
            >
              启用
            </Button>,
          );
        }

        return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>;
      },
    },
  ];

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
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
        activeKey={status}
        items={statusItems}
        onChange={(key) => setStatus(key as 'all' | AdminCouponTemplateDisplayStatus)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminCouponTemplateItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{
            persistenceKey: 'admin-marketing-coupons-table',
            persistenceType: 'localStorage',
          }}
          dataSource={rows}
          loading={loading}
          options={{
            reload: () => setActionSeed((value) => value + 1),
            density: true,
            fullScreen: false,
            setting: true,
          }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              onClick={() => {
                couponForm.resetFields();
                couponForm.setFieldsValue({
                  type: 'cash',
                  scopeType: 'platform',
                  validityType: 'fixed',
                  minAmountYuan: 0,
                  discountAmountYuan: 0,
                  totalQuantity: 100,
                  userLimit: 1,
                  status: 'active',
                });
                setEditingCoupon(null);
                setFormOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        title="优惠券详情"
        width={560}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="优惠券名称">{selected.name}</Descriptions.Item>
              <Descriptions.Item label="优惠券编码">{selected.code}</Descriptions.Item>
              <Descriptions.Item label="券类型">{selected.typeLabel}</Descriptions.Item>
              <Descriptions.Item label="适用范围">
                {selected.scopeType === 'shop'
                  ? selected.shopName
                    ? `${selected.scopeTypeLabel} · ${selected.shopName}`
                    : `${selected.scopeTypeLabel} · 店铺ID ${selected.shopId ?? '-'}`
                  : selected.scopeTypeLabel}
              </Descriptions.Item>
              {selected.scopeType === 'shop' ? (
                <Descriptions.Item label="指定店铺 ID">{selected.shopId ?? '-'}</Descriptions.Item>
              ) : null}
              <Descriptions.Item label="来源">{selected.sourceTypeLabel}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={couponStatusColor(selected.status)}>{selected.statusLabel}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="使用门槛">{formatAmount(selected.minAmount)}</Descriptions.Item>
              {selected.type === 'discount' ? (
                <>
                  <Descriptions.Item label="折扣率">
                    {selected.discountRate == null ? '-' : `${selected.discountRate} 折`}
                  </Descriptions.Item>
                  <Descriptions.Item label="最高优惠">
                    {formatAmount(selected.maxDiscountAmount)}
                  </Descriptions.Item>
                </>
              ) : (
                <Descriptions.Item label={selected.type === 'shipping' ? '减免金额' : '优惠金额'}>
                  {formatAmount(selected.discountAmount)}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="有效期">
                {selected.validityType === 'fixed'
                  ? `${formatDateTime(selected.startAt)} ~ ${formatDateTime(selected.endAt)}`
                  : `领取后 ${selected.validDays} 天`}
              </Descriptions.Item>
              <Descriptions.Item label="发放总量">
                {selected.totalQuantity < 0 ? '不限' : formatNumber(selected.totalQuantity)}
              </Descriptions.Item>
              <Descriptions.Item label="每人限领">
                {formatNumber(selected.userLimit)}
              </Descriptions.Item>
              <Descriptions.Item label="已发放">
                {formatNumber(selected.grantedCount)}
              </Descriptions.Item>
              <Descriptions.Item label="剩余数量">
                {selected.remainingQuantity == null ? '不限' : formatNumber(selected.remainingQuantity)}
              </Descriptions.Item>
              <Descriptions.Item label="说明">{selected.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
            </Descriptions>

            <div style={{ display: 'grid', gap: 12 }}>
              <Typography.Text strong>最近发券批次</Typography.Text>
              {batchLoading ? (
                <Typography.Text type="secondary">发券批次加载中...</Typography.Text>
              ) : batches.length === 0 ? (
                <Typography.Text type="secondary">暂无发券批次</Typography.Text>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      style={{
                        border: '1px solid #f1f5f9',
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          alignItems: 'center',
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <Typography.Text strong>{batch.batchNo}</Typography.Text>
                        <Tag color={grantStatusColor(batch.status)}>{batch.statusLabel}</Tag>
                      </div>
                      <Typography.Text style={{ display: 'block' }} type="secondary">
                        目标用户 {formatNumber(batch.targetUserCount)} / 实发{' '}
                        {formatNumber(batch.grantedCount)}
                      </Typography.Text>
                      <Typography.Text style={{ display: 'block' }} type="secondary">
                        发起人 {batch.operatorName || '-'} · {formatDateTime(batch.createdAt)}
                      </Typography.Text>
                      <Typography.Text style={{ display: 'block' }} type="secondary">
                        备注 {batch.note || '-'}
                      </Typography.Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={formOpen}
        title={editingCoupon ? '编辑优惠券' : '新增优惠券'}
        okText="确定"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnClose
        onCancel={() => {
          setFormOpen(false);
          setEditingCoupon(null);
        }}
        onOk={() => void handleSubmitCoupon()}
      >
        <ConfigProvider theme={SEARCH_THEME}>
          <Form form={couponForm} layout="vertical" preserve={false}>
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

      <Modal
        open={grantOpen}
        title={grantingCoupon ? `发券：${grantingCoupon.name}` : '发券'}
        okText="确定"
        cancelText="取消"
        confirmLoading={grantSubmitting}
        destroyOnClose
        onCancel={() => {
          setGrantOpen(false);
          setGrantingCoupon(null);
        }}
        onOk={() => void handleGrantCoupon()}
      >
        <ConfigProvider theme={SEARCH_THEME}>
          <Form form={grantForm} layout="vertical" preserve={false}>
            <Form.Item
              label="目标人群"
              name="audience"
              rules={[{ required: true, message: '请选择目标人群' }]}
            >
              <Select options={GRANT_AUDIENCE_OPTIONS as never} placeholder="目标人群" />
            </Form.Item>
            <Form.Item label="备注" name="note">
              <Input.TextArea rows={4} placeholder="发券备注" />
            </Form.Item>
          </Form>
        </ConfigProvider>
      </Modal>
    </div>
  );

  async function handleSubmitCoupon() {
    try {
      const values = await couponForm.validateFields();
      const payload: CreateAdminCouponTemplatePayload | UpdateAdminCouponTemplatePayload = {
        name: values.name.trim(),
        type: values.type,
        scopeType: values.scopeType,
        shopId:
          values.scopeType === 'shop'
            ? ((values.shopId?.trim() || null) as EntityId | null)
            : null,
        description: values.description?.trim() || null,
        minAmount: yuanToCents(values.minAmountYuan) ?? 0,
        discountAmount:
          values.type === 'discount' ? undefined : yuanToCents(values.discountAmountYuan) ?? 0,
        discountRate: values.type === 'discount' ? values.discountRate ?? undefined : undefined,
        maxDiscountAmount:
          values.type === 'discount'
            ? yuanToCents(values.maxDiscountAmountYuan) ?? 0
            : undefined,
        validityType: values.validityType,
        startAt: values.validityType === 'fixed' ? values.startAt || null : null,
        endAt: values.validityType === 'fixed' ? values.endAt || null : null,
        validDays: values.validityType === 'relative' ? values.validDays ?? 0 : undefined,
        totalQuantity: values.totalQuantity,
        userLimit: values.userLimit,
        status: values.status,
      };

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
      const payload: CreateAdminCouponGrantBatchPayload = {
        audience: values.audience,
        note: values.note?.trim() || null,
      };
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
      messageApi.success(
        nextStatus === 'active'
          ? '优惠券已启用'
          : nextStatus === 'paused'
            ? '优惠券已暂停'
            : '优惠券已停用',
      );
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '优惠券状态更新失败');
    }
  }
}
