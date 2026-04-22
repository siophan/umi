import { Alert, Button, Descriptions, Form, Popconfirm, Result, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import {
  AdminOrderShipModal,
  type AdminOrderShipFormValues,
} from '../components/admin-order-ship-modal';
import type { AdminLogisticsRow } from '../lib/api/orders';
import {
  deliverAdminLogistics,
  fetchAdminLogisticsDetail,
  shipAdminOrder,
} from '../lib/api/orders';
import { formatDateTime, formatYuanAmount } from '../lib/format';

interface OrderLogisticsDetailPageProps {
  logisticsId: string;
  refreshToken?: number;
}

export function OrderLogisticsDetailPage({
  logisticsId,
  refreshToken = 0,
}: OrderLogisticsDetailPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [shipForm] = Form.useForm<AdminOrderShipFormValues>();
  const [record, setRecord] = useState<AdminLogisticsRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [shippingSubmitting, setShippingSubmitting] = useState(false);
  const [delivering, setDelivering] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminLogisticsDetail(logisticsId);
        if (!alive) {
          return;
        }
        setRecord(result);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRecord(null);
        setIssue(error instanceof Error ? error.message : '物流详情加载失败');
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
  }, [logisticsId, refreshToken, reloadToken]);

  function triggerReload(successMessage: string) {
    messageApi.success(successMessage);
    setReloadToken((current) => current + 1);
  }

  function openShippingModal() {
    if (!record?.orderId) {
      messageApi.error('当前物流记录缺少订单信息，暂不能发货');
      return;
    }

    shipForm.setFieldsValue({
      shippingType: record.shippingType === 'unknown' ? 'express' : record.shippingType,
      trackingNo: record.trackingNo || undefined,
    });
    setShippingOpen(true);
  }

  async function handleShip() {
    if (!record?.orderId) {
      return;
    }

    try {
      const values = await shipForm.validateFields();
      setShippingSubmitting(true);
      await shipAdminOrder(record.orderId, {
        shippingType: values.shippingType,
        trackingNo: values.trackingNo?.trim() || null,
      });
      setShippingOpen(false);
      triggerReload('物流已发货');
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setShippingSubmitting(false);
    }
  }

  async function handleDeliver() {
    if (!record) {
      return;
    }

    try {
      setDelivering(true);
      await deliverAdminLogistics(record.id, {});
      triggerReload('已标记签收');
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setDelivering(false);
    }
  }

  if (loading && !record && !issue) {
    return (
      <div className="page-stack">
        {contextHolder}
        <Typography.Text type="secondary">物流详情加载中...</Typography.Text>
      </div>
    );
  }

  if (issue && !record) {
    return (
      <div className="page-stack">
        {contextHolder}
        <Button href="#/orders/logistics" style={{ paddingLeft: 0 }} type="link">
          返回物流管理
        </Button>
        <Alert message={issue} showIcon type="error" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-stack">
        {contextHolder}
        <Result status="404" title="物流记录不存在" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      {contextHolder}
      <div className="page-header page-header--compact">
        <div className="page-header__meta">
          <Button href="#/orders/logistics" style={{ paddingLeft: 0 }} type="link">
            返回物流管理
          </Button>
          <Typography.Title level={4} style={{ margin: 0 }}>
            物流详情
          </Typography.Title>
        </div>
        <div className="page-header__actions">
          {record.status === 'stored' ? (
            <Button type="primary" onClick={openShippingModal}>
              发货
            </Button>
          ) : null}
          {record.status === 'shipping' ? (
            <Popconfirm
              title="确认标记签收？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void handleDeliver()}
            >
              <Button loading={delivering}>标记签收</Button>
            </Popconfirm>
          ) : null}
        </div>
      </div>
      {issue ? <Alert message={issue} showIcon type="warning" /> : null}

      <Descriptions bordered column={2} size="small" title="物流信息">
        <Descriptions.Item label="履约单">{record.fulfillmentSn || record.orderSn || record.id}</Descriptions.Item>
        <Descriptions.Item label="订单号">{record.orderSn || '-'}</Descriptions.Item>
        <Descriptions.Item label="商品摘要" span={2}>
          {record.productSummary}
        </Descriptions.Item>
        <Descriptions.Item label="收货人">{record.receiver || '-'}</Descriptions.Item>
        <Descriptions.Item label="联系电话">{record.phoneNumber || '-'}</Descriptions.Item>
        <Descriptions.Item label="物流方式">{record.shippingTypeLabel}</Descriptions.Item>
        <Descriptions.Item label="承运商">{record.carrier}</Descriptions.Item>
        <Descriptions.Item label="物流单号">{record.trackingNo || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">{record.statusLabel}</Descriptions.Item>
        <Descriptions.Item label="运费">{formatYuanAmount(record.shippingFee)}</Descriptions.Item>
        <Descriptions.Item label="履约金额">{formatYuanAmount(record.totalAmount)}</Descriptions.Item>
        <Descriptions.Item label="建单时间">{formatDateTime(record.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="发货时间">{formatDateTime(record.shippedAt)}</Descriptions.Item>
        <Descriptions.Item label="完成时间">{formatDateTime(record.completedAt)}</Descriptions.Item>
        <Descriptions.Item label="用户 ID">{record.userId}</Descriptions.Item>
      </Descriptions>
      <AdminOrderShipModal
        open={shippingOpen}
        submitting={shippingSubmitting}
        orderSn={record.orderSn || null}
        form={shipForm}
        onCancel={() => setShippingOpen(false)}
        onSubmit={() => void handleShip()}
      />
    </div>
  );
}
