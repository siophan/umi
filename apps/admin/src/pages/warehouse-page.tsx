import type { WarehouseItem } from '@joy/shared';
import type { TableColumnsType } from 'antd';

import { Card, Descriptions, Drawer, Segmented, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

import type { AdminWarehouseStats } from '../lib/admin-data';
import { formatAmount, formatDateTime, warehouseStatusMeta } from '../lib/format';

interface WarehousePageProps {
  items: WarehouseItem[];
  loading: boolean;
  stats: AdminWarehouseStats;
}

type WarehouseFilter = 'all' | 'virtual' | 'physical';

export function WarehousePage({ items, loading, stats }: WarehousePageProps) {
  const [selected, setSelected] = useState<WarehouseItem | null>(null);
  const [scope, setScope] = useState<WarehouseFilter>('all');

  const filteredItems = items.filter((item) =>
    scope === 'all' ? true : item.warehouseType === scope,
  );

  const columns: TableColumnsType<WarehouseItem> = [
    {
      title: '商品',
      dataIndex: 'productName',
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: '用户 ID',
      dataIndex: 'userId',
    },
    {
      title: '仓型',
      dataIndex: 'warehouseType',
      render: (value: WarehouseItem['warehouseType']) => (
        <Tag color={value === 'virtual' ? 'processing' : 'purple'}>
          {value === 'virtual' ? '虚拟仓' : '实体仓'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: WarehouseItem['status']) => (
        <Tag color={warehouseStatusMeta[value].color}>
          {warehouseStatusMeta[value].label}
        </Tag>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
    },
    {
      title: '寄售价',
      dataIndex: 'consignPrice',
      render: (value) => (value ? formatAmount(value) : '-'),
    },
    {
      title: '入库时间',
      dataIndex: 'createdAt',
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <div className="page-stack">
      <Space wrap size={16}>
        <Card className="metric-card">
          <Statistic title="虚拟仓总量" value={stats.totalVirtual} />
        </Card>
        <Card className="metric-card">
          <Statistic title="实体仓总量" value={stats.totalPhysical} />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="寄售中"
            value={items.filter((item) => item.status === 'consigning').length}
          />
        </Card>
      </Space>

      <Card
        title="仓库与寄售"
        extra={
          <Segmented<WarehouseFilter>
            options={[
              { label: '全部', value: 'all' },
              { label: '虚拟仓', value: 'virtual' },
              { label: '实体仓', value: 'physical' },
            ]}
            value={scope}
            onChange={setScope}
          />
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          pagination={{ pageSize: 6 }}
          onRow={(record) => ({
            onClick: () => setSelected(record),
          })}
        />
      </Card>

      <Drawer
        open={selected != null}
        width={440}
        title={selected?.productName}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="用户 ID">{selected.userId}</Descriptions.Item>
              <Descriptions.Item label="仓型">
                {selected.warehouseType === 'virtual' ? '虚拟仓' : '实体仓'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={warehouseStatusMeta[selected.status].color}>
                  {warehouseStatusMeta[selected.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="来源">{selected.sourceType}</Descriptions.Item>
              <Descriptions.Item label="数量">{selected.quantity}</Descriptions.Item>
              <Descriptions.Item label="寄售价">
                {selected.consignPrice ? formatAmount(selected.consignPrice) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预计天数">
                {selected.estimateDays ?? '-'}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
}
