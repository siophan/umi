import { Alert, Button, Descriptions, Result, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';

import type { WarehouseItem } from '@umi/shared';

import { fetchAdminWarehouseItemDetail } from '../lib/api/catalog-warehouse';
import { formatAmount, formatDateTime, warehouseStatusMeta } from '../lib/format';

interface WarehouseItemDetailPageProps {
  itemId: string;
  refreshToken?: number;
  warehouseType: 'virtual' | 'physical';
}

export function WarehouseItemDetailPage({
  itemId,
  refreshToken = 0,
  warehouseType,
}: WarehouseItemDetailPageProps) {
  const [record, setRecord] = useState<WarehouseItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminWarehouseItemDetail(warehouseType, itemId);
        if (!alive) {
          return;
        }
        setRecord(result);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRecord(null);
        setIssue(error instanceof Error ? error.message : '仓库详情加载失败');
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
  }, [itemId, refreshToken, warehouseType]);

  const backHref = warehouseType === 'virtual' ? '#/warehouse/virtual' : '#/warehouse/physical';
  const pageTitle = warehouseType === 'virtual' ? '虚拟仓详情' : '实体仓详情';

  if (loading && !record && !issue) {
    return (
      <div className="page-stack">
        <Typography.Text type="secondary">{pageTitle}加载中...</Typography.Text>
      </div>
    );
  }

  if (issue && !record) {
    return (
      <div className="page-stack">
        <Button href={backHref} style={{ paddingLeft: 0 }} type="link">
          返回{warehouseType === 'virtual' ? '虚拟仓库' : '实体仓库'}
        </Button>
        <Alert message={issue} showIcon type="error" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-stack">
        <Result status="404" title="仓库记录不存在" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Button href={backHref} style={{ paddingLeft: 0 }} type="link">
        返回{warehouseType === 'virtual' ? '虚拟仓库' : '实体仓库'}
      </Button>
      {issue ? <Alert message={issue} showIcon type="warning" /> : null}

      <Descriptions bordered column={2} size="small" title={pageTitle}>
        <Descriptions.Item label="商品">{record.productName}</Descriptions.Item>
        <Descriptions.Item label="商品 ID">{record.productId}</Descriptions.Item>
        <Descriptions.Item label="用户 ID">{record.userId}</Descriptions.Item>
        <Descriptions.Item label="仓型">{warehouseType === 'virtual' ? '虚拟仓' : '实体仓'}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={warehouseStatusMeta[record.status].color}>
            {warehouseStatusMeta[record.status].label}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="来源">{record.sourceType}</Descriptions.Item>
        <Descriptions.Item label="数量">{record.quantity}</Descriptions.Item>
        <Descriptions.Item label={warehouseType === 'virtual' ? '单价' : '原价值'}>
          {formatAmount((record.price ?? 0) * 100)}
        </Descriptions.Item>
        {warehouseType === 'virtual' ? (
          <Descriptions.Item label="总价值">
            {formatAmount((record.price ?? 0) * record.quantity * 100)}
          </Descriptions.Item>
        ) : null}
        {warehouseType === 'physical' ? (
          <>
            <Descriptions.Item label="寄售价">
              {record.consignPrice == null ? '-' : formatAmount(record.consignPrice * 100)}
            </Descriptions.Item>
            <Descriptions.Item label="预计寄售天数">
              {record.estimateDays == null ? '-' : `${record.estimateDays} 天`}
            </Descriptions.Item>
          </>
        ) : null}
        <Descriptions.Item label="入库时间">{formatDateTime(record.createdAt)}</Descriptions.Item>
      </Descriptions>
    </div>
  );
}
