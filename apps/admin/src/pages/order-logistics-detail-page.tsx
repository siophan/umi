import { Alert, Button, Descriptions, Result, Typography } from 'antd';
import { useEffect, useState } from 'react';

import type { AdminLogisticsRow } from '../lib/api/orders';
import { fetchAdminLogisticsDetail } from '../lib/api/orders';
import { formatDateTime, formatYuanAmount } from '../lib/format';

interface OrderLogisticsDetailPageProps {
  logisticsId: string;
  refreshToken?: number;
}

export function OrderLogisticsDetailPage({
  logisticsId,
  refreshToken = 0,
}: OrderLogisticsDetailPageProps) {
  const [record, setRecord] = useState<AdminLogisticsRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);

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
  }, [logisticsId, refreshToken]);

  if (loading && !record && !issue) {
    return (
      <div className="page-stack">
        <Typography.Text type="secondary">物流详情加载中...</Typography.Text>
      </div>
    );
  }

  if (issue && !record) {
    return (
      <div className="page-stack">
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
        <Result status="404" title="物流记录不存在" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Button href="#/orders/logistics" style={{ paddingLeft: 0 }} type="link">
        返回物流管理
      </Button>
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
    </div>
  );
}
