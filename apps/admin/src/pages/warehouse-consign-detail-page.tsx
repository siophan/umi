import { Alert, Button, Descriptions, Result, Typography } from 'antd';
import { useEffect, useState } from 'react';

import type { AdminConsignRow } from '../lib/api/orders';
import { fetchAdminConsignDetail } from '../lib/api/orders';
import { formatDateTime, formatYuanAmount } from '../lib/format';

interface WarehouseConsignDetailPageProps {
  consignId: string;
  refreshToken?: number;
}

function getSettlementLabel(record: AdminConsignRow) {
  if (record.statusLabel === '已取消') {
    return '-';
  }
  if (record.settledAt) {
    return '已结算';
  }
  if (record.statusLabel === '已成交' || record.statusLabel === '待结算') {
    return '待结算';
  }
  return '-';
}

export function WarehouseConsignDetailPage({
  consignId,
  refreshToken = 0,
}: WarehouseConsignDetailPageProps) {
  const [record, setRecord] = useState<AdminConsignRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminConsignDetail(consignId);
        if (!alive) {
          return;
        }
        setRecord(result);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRecord(null);
        setIssue(error instanceof Error ? error.message : '寄售详情加载失败');
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
  }, [consignId, refreshToken]);

  if (loading && !record && !issue) {
    return (
      <div className="page-stack">
        <Typography.Text type="secondary">寄售详情加载中...</Typography.Text>
      </div>
    );
  }

  if (issue && !record) {
    return (
      <div className="page-stack">
        <Button href="#/warehouse/consign" style={{ paddingLeft: 0 }} type="link">
          返回寄售市场
        </Button>
        <Alert message={issue} showIcon type="error" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-stack">
        <Result status="404" title="寄售记录不存在" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Button href="#/warehouse/consign" style={{ paddingLeft: 0 }} type="link">
        返回寄售市场
      </Button>
      {issue ? <Alert message={issue} showIcon type="warning" /> : null}

      <Descriptions bordered column={2} size="small" title="寄售信息">
        <Descriptions.Item label="交易单号">{record.tradeNo || record.id}</Descriptions.Item>
        <Descriptions.Item label="实物仓记录">{record.physicalItemId || '-'}</Descriptions.Item>
        <Descriptions.Item label="商品名称" span={2}>
          {record.productName}
        </Descriptions.Item>
        <Descriptions.Item label="卖家">{record.userId}</Descriptions.Item>
        <Descriptions.Item label="买家">{record.buyerUserId || '-'}</Descriptions.Item>
        <Descriptions.Item label="订单号">{record.orderSn || record.orderId || '-'}</Descriptions.Item>
        <Descriptions.Item label="来源类型">{record.sourceType}</Descriptions.Item>
        <Descriptions.Item label="挂单价">{record.listingPrice ? formatYuanAmount(record.listingPrice) : '-'}</Descriptions.Item>
        <Descriptions.Item label="成交价">{formatYuanAmount(record.price)}</Descriptions.Item>
        <Descriptions.Item label="佣金">{formatYuanAmount(record.commissionAmount)}</Descriptions.Item>
        <Descriptions.Item label="卖家到账">{formatYuanAmount(record.sellerAmount)}</Descriptions.Item>
        <Descriptions.Item label="状态">{record.statusLabel}</Descriptions.Item>
        <Descriptions.Item label="结算状态">{getSettlementLabel(record)}</Descriptions.Item>
        <Descriptions.Item label="上架时间">{formatDateTime(record.listedAt || record.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="成交时间">{formatDateTime(record.tradedAt)}</Descriptions.Item>
        <Descriptions.Item label="结算时间">{formatDateTime(record.settledAt)}</Descriptions.Item>
        <Descriptions.Item label="取消时间">{formatDateTime(record.canceledAt)}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{formatDateTime(record.createdAt)}</Descriptions.Item>
      </Descriptions>
    </div>
  );
}
