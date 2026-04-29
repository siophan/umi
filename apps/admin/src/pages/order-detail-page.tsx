import {
  Alert,
  Button,
  Descriptions,
  Form,
  Popconfirm,
  Result,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import {
  AdminOrderRefundReviewModal,
  type AdminOrderRefundReviewFormValues,
} from '../components/admin-order-refund-review-modal';
import {
  AdminOrderShipModal,
  type AdminOrderShipFormValues,
} from '../components/admin-order-ship-modal';
import type { AdminOrderRecord } from '../lib/api/orders';
import {
  completeAdminOrderRefund,
  fetchAdminOrderDetail,
  reviewAdminOrderRefund,
  shipAdminOrder,
} from '../lib/api/orders';
import { formatDateTime, formatYuanAmount, orderStatusMeta } from '../lib/format';

interface OrderDetailPageProps {
  orderId: string;
  refreshToken?: number;
}

export function OrderDetailPage({
  orderId,
  refreshToken = 0,
}: OrderDetailPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [shipForm] = Form.useForm<AdminOrderShipFormValues>();
  const [refundReviewForm] = Form.useForm<AdminOrderRefundReviewFormValues>();
  const [record, setRecord] = useState<AdminOrderRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [refundReviewOpen, setRefundReviewOpen] = useState(false);
  const [shippingSubmitting, setShippingSubmitting] = useState(false);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundCompleting, setRefundCompleting] = useState(false);
  const [shipInitialValues, setShipInitialValues] = useState<Partial<AdminOrderShipFormValues>>({
    shippingType: 'express',
  });
  const [refundInitialValues, setRefundInitialValues] = useState<
    Partial<AdminOrderRefundReviewFormValues>
  >({ status: 'approved' });

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminOrderDetail(orderId);
        if (!alive) {
          return;
        }
        setRecord(result);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRecord(null);
        setIssue(error instanceof Error ? error.message : '订单详情加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      alive = false;
    };
  }, [orderId, refreshToken, reloadToken]);

  function getOrderTypeLabel(value: AdminOrderRecord['orderType']) {
    if (value === 'guess_reward') {
      return '竞猜奖励单';
    }
    if (value === 'shop_order') {
      return '店铺订单';
    }
    return '-';
  }

  function getBuyerLabel(target: AdminOrderRecord) {
    return target.user.name || target.user.phoneNumber || target.user.uidCode || target.userId;
  }

  function getFulfillmentStatusLabel(statusCode: number | null | undefined) {
    if (statusCode === 10) {
      return '待履约';
    }
    if (statusCode === 20) {
      return '履约中';
    }
    if (statusCode === 30) {
      return '已发货';
    }
    if (statusCode === 40) {
      return '已完成';
    }
    if (statusCode === 90) {
      return '已取消';
    }
    return '-';
  }

  function getShippingTypeLabel(shippingType?: string | null) {
    if (shippingType === 'express') {
      return '快递';
    }
    if (shippingType === 'same_city') {
      return '同城配送';
    }
    if (shippingType === 'self_pickup') {
      return '到店自提';
    }
    return '-';
  }

  function getRefundStatusLabel(statusCode: number | null | undefined) {
    if (statusCode === 10) {
      return '待审核';
    }
    if (statusCode === 20) {
      return '审核中';
    }
    if (statusCode === 30) {
      return '已通过';
    }
    if (statusCode === 40) {
      return '已拒绝';
    }
    if (statusCode === 90) {
      return '已退款';
    }
    return '-';
  }

  function canShip(target: AdminOrderRecord | null) {
    if (!target?.fulfillment) {
      return false;
    }

    return target.fulfillment.statusCode === 10 || target.fulfillment.statusCode === 20;
  }

  function canReviewRefund(target: AdminOrderRecord | null) {
    if (!target?.refund) {
      return false;
    }

    return target.refund.statusCode === 10 || target.refund.statusCode === 20;
  }

  function canCompleteRefund(target: AdminOrderRecord | null) {
    return target?.refund?.statusCode === 30;
  }

  function hasRefundSection(target: AdminOrderRecord | null) {
    return target?.refund != null;
  }

  function triggerReload(successMessage: string) {
    messageApi.success(successMessage);
    setReloadToken((current) => current + 1);
  }

  function openShippingModal() {
    if (!record?.fulfillment) {
      return;
    }

    setShipInitialValues({
      shippingType:
        record.fulfillment.shippingType === 'unknown'
          ? 'express'
          : record.fulfillment.shippingType,
      trackingNo: record.fulfillment.trackingNo || undefined,
    });
    setShippingOpen(true);
  }

  async function handleShip() {
    try {
      const values = await shipForm.validateFields();
      setShippingSubmitting(true);
      await shipAdminOrder(orderId, {
        shippingType: values.shippingType,
        trackingNo: values.trackingNo?.trim() || null,
      });
      setShippingOpen(false);
      triggerReload('订单已发货');
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setShippingSubmitting(false);
    }
  }

  function openRefundReviewModal(defaultStatus: 'approved' | 'rejected' = 'approved') {
    setRefundInitialValues({
      status: defaultStatus,
      reviewNote: undefined,
    });
    setRefundReviewOpen(true);
  }

  async function handleRefundReview() {
    try {
      const values = await refundReviewForm.validateFields();
      setRefundSubmitting(true);
      await reviewAdminOrderRefund(orderId, {
        status: values.status,
        reviewNote: values.reviewNote?.trim() || null,
      });
      setRefundReviewOpen(false);
      triggerReload(values.status === 'approved' ? '退款审核已通过' : '退款已拒绝');
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setRefundSubmitting(false);
    }
  }

  async function handleCompleteRefund() {
    try {
      setRefundCompleting(true);
      await completeAdminOrderRefund(orderId, {});
      triggerReload('退款已完成');
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setRefundCompleting(false);
    }
  }

  if (loading && !record && !issue) {
    return (
      <div className="page-stack">
        {contextHolder}
        <Typography.Text type="secondary">订单详情加载中...</Typography.Text>
      </div>
    );
  }

  if (issue && !record) {
    return (
      <div className="page-stack">
        {contextHolder}
        <Button href="#/orders/list" type="link">
          返回订单列表
        </Button>
        <Alert message={issue} showIcon type="error" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-stack">
        {contextHolder}
        <Result status="404" title="订单不存在" />
      </div>
    );
  }

  return (
    <div className="page-stack admin-detail-page">
      {contextHolder}
      <Button href="#/orders/list" style={{ paddingLeft: 0 }} type="link">
        返回订单列表
      </Button>
      {issue ? <Alert message={issue} showIcon type="warning" /> : null}

      <div className="admin-detail-header">
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            订单详情
          </Typography.Title>
          <Typography.Text type="secondary">
            {record.orderSn || record.id} · {getBuyerLabel(record)}
          </Typography.Text>
        </div>
        <Tag color={orderStatusMeta[record.status].color} style={{ marginInlineEnd: 0 }}>
          {orderStatusMeta[record.status].label}
        </Tag>
      </div>

      <section className="admin-detail-block">
        <div className="admin-detail-block__head">
          <Typography.Title className="admin-detail-block__title" level={5}>
            订单信息
          </Typography.Title>
        </div>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="订单号">{record.orderSn || record.id}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={orderStatusMeta[record.status].color}>
              {orderStatusMeta[record.status].label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="买家">{getBuyerLabel(record)}</Descriptions.Item>
          <Descriptions.Item label="用户 ID">{record.userId}</Descriptions.Item>
          <Descriptions.Item label="订单类型">{getOrderTypeLabel(record.orderType)}</Descriptions.Item>
          <Descriptions.Item label="关联竞猜">
            {record.guessTitle ?? record.guessId ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="订单金额">{formatYuanAmount(record.amount)}</Descriptions.Item>
          <Descriptions.Item label="原价金额">{formatYuanAmount(record.originalAmount)}</Descriptions.Item>
          <Descriptions.Item label="优惠金额">{formatYuanAmount(record.couponDiscount)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(record.createdAt)}</Descriptions.Item>
        </Descriptions>
      </section>

      <section className="admin-detail-block">
        <div className="admin-detail-block__head">
          <Typography.Title className="admin-detail-block__title" level={5}>
            收货与履约
          </Typography.Title>
          {canShip(record) ? (
            <Button size="small" type="primary" onClick={openShippingModal}>
              发货
            </Button>
          ) : null}
        </div>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="收货人">
            {record.address?.name || record.fulfillment?.receiverName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {record.address?.phoneNumber || record.fulfillment?.phoneNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>
            {record.address
              ? `${record.address.province || ''}${record.address.city || ''}${record.address.district || ''}${record.address.detail || ''}` ||
                '-'
              : record.fulfillment?.detailAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="物流单号">
            {record.fulfillment?.trackingNo || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="履约状态">
            {getFulfillmentStatusLabel(record.fulfillment?.statusCode)}
          </Descriptions.Item>
          <Descriptions.Item label="配送方式">
            {getShippingTypeLabel(record.fulfillment?.shippingType ?? 'unknown')}
          </Descriptions.Item>
          <Descriptions.Item label="发货时间">
            {formatDateTime(record.fulfillment?.shippedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="完成时间">
            {formatDateTime(record.fulfillment?.completedAt)}
          </Descriptions.Item>
        </Descriptions>
      </section>

      {hasRefundSection(record) ? (
        <section className="admin-detail-block">
          <div className="admin-detail-block__head">
            <Typography.Title className="admin-detail-block__title" level={5}>
              退款信息
            </Typography.Title>
            <div className="admin-detail-actions">
              {canReviewRefund(record) ? (
                <>
                  <Button size="small" onClick={() => openRefundReviewModal('approved')}>
                    审核退款
                  </Button>
                  <Button size="small" danger onClick={() => openRefundReviewModal('rejected')}>
                    拒绝退款
                  </Button>
                </>
              ) : null}
              {canCompleteRefund(record) ? (
                <Popconfirm
                  title="确认完成退款？"
                  okText="确认"
                  cancelText="取消"
                  onConfirm={() => void handleCompleteRefund()}
                >
                  <Button size="small" loading={refundCompleting} type="primary">
                    完成退款
                  </Button>
                </Popconfirm>
              ) : null}
            </div>
          </div>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="退款单号">{record.refund?.refundNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="退款金额">
              {record.refund ? formatYuanAmount(record.refund.refundAmount) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="退款状态">
              {getRefundStatusLabel(record.refund?.statusCode)}
            </Descriptions.Item>
            <Descriptions.Item label="申请时间">
              {formatDateTime(record.refund?.requestedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="退款原因" span={2}>
              {record.refund?.reason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核备注" span={2}>
              {record.refund?.reviewNote || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核时间">
              {formatDateTime(record.refund?.reviewedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {formatDateTime(record.refund?.completedAt)}
            </Descriptions.Item>
          </Descriptions>
        </section>
      ) : null}

      <div className="admin-detail-section">
        <div className="admin-detail-section-head">
          <Typography.Title level={5} style={{ margin: 0 }}>
            订单明细
          </Typography.Title>
          <Typography.Text type="secondary">
            共 {record.items.length} 件
          </Typography.Text>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {record.items.length > 0 ? (
            record.items.map((item) => (
              <div className="detail-line" key={item.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <Typography.Text strong>{item.productName}</Typography.Text>
                    <Typography.Text style={{ display: 'block' }} type="secondary">
                      {item.skuText ? `${item.skuText} / ` : ''}
                      x{item.quantity}
                    </Typography.Text>
                  </div>
                  <Typography.Text>{formatYuanAmount(item.itemAmount)}</Typography.Text>
                </div>
              </div>
            ))
          ) : (
            <Typography.Text type="secondary">暂无订单明细</Typography.Text>
          )}
        </div>
      </div>

      <AdminOrderShipModal
        open={shippingOpen}
        submitting={shippingSubmitting}
        orderSn={record.orderSn}
        form={shipForm}
        initialValues={shipInitialValues}
        onCancel={() => setShippingOpen(false)}
        onSubmit={() => void handleShip()}
      />

      <AdminOrderRefundReviewModal
        open={refundReviewOpen}
        submitting={refundSubmitting}
        refundNo={record.refund?.refundNo ?? null}
        form={refundReviewForm}
        initialValues={refundInitialValues}
        onCancel={() => setRefundReviewOpen(false)}
        onSubmit={() => void handleRefundReview()}
      />
    </div>
  );
}
