import { Avatar, Descriptions, Drawer, Empty, Space, Spin, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import type { WarehouseItem } from '@umi/shared';

import { fetchAdminWarehouseItemDetail } from '../lib/api/catalog-warehouse';
import { formatAmount, formatDateTime, warehouseStatusMeta } from '../lib/format';

interface WarehouseItemDetailDrawerProps {
  itemId: string | null;
  warehouseType: 'virtual' | 'physical';
  onClose: () => void;
}

export function WarehouseItemDetailDrawer({
  itemId,
  warehouseType,
  onClose,
}: WarehouseItemDetailDrawerProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<WarehouseItem | null>(null);

  useEffect(() => {
    if (!itemId) {
      setRecord(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setRecord(null);

    fetchAdminWarehouseItemDetail(warehouseType, itemId)
      .then((result) => {
        if (alive) setRecord(result);
      })
      .catch((error: unknown) => {
        if (alive) {
          messageApi.error(error instanceof Error ? error.message : '仓库详情加载失败');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [itemId, warehouseType, messageApi]);

  const drawerTitle = warehouseType === 'virtual' ? '虚拟仓详情' : '实体仓详情';

  return (
    <>
      {contextHolder}
      <Drawer open={itemId != null} onClose={onClose} width={720} title={drawerTitle} destroyOnClose>
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
            <Spin size="large" />
          </div>
        ) : !record ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 14px',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: '#fafafa',
                alignItems: 'center',
              }}
            >
              <Avatar
                shape="square"
                size={72}
                src={record.productImg ?? undefined}
                style={{ flexShrink: 0, background: '#e8e8e8', borderRadius: 6, fontSize: 20 }}
              >
                {record.productName?.[0] ?? '?'}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  商品 ID {record.productId}
                </Typography.Text>
                <div>
                  <Typography.Text strong style={{ fontSize: 14 }}>
                    {record.productName}
                  </Typography.Text>
                </div>
                <Space size={16} style={{ marginTop: 4 }}>
                  <span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {warehouseType === 'virtual' ? '单价 ' : '原价值 '}
                    </Typography.Text>
                    <Typography.Text style={{ fontWeight: 600 }}>
                      {formatAmount((record.price ?? 0) * 100)}
                    </Typography.Text>
                  </span>
                  <span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>数量 </Typography.Text>
                    <Typography.Text style={{ fontWeight: 600 }}>{record.quantity}</Typography.Text>
                  </span>
                  {warehouseType === 'virtual' ? (
                    <span>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>总价值 </Typography.Text>
                      <Typography.Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
                        {formatAmount((record.price ?? 0) * record.quantity * 100)}
                      </Typography.Text>
                    </span>
                  ) : null}
                </Space>
              </div>
            </div>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="持有人">
                {record.userName || '-'}
                <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  ID {record.userId}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="仓型">
                {warehouseType === 'virtual' ? '虚拟仓' : '实体仓'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={warehouseStatusMeta[record.status].color}>
                  {warehouseStatusMeta[record.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="来源">{record.sourceType}</Descriptions.Item>
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
              <Descriptions.Item label="入库时间" span={warehouseType === 'physical' ? 2 : 1}>
                {formatDateTime(record.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </>
  );
}
