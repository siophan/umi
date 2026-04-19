import type { WarehouseItem } from '@joy/shared';
import type { TableColumnsType } from 'antd';

import { Alert, Card, Descriptions, Drawer, Form, Input, Segmented, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminWarehouseStats } from '../lib/admin-data';
import { fetchAdminWarehouseItems, fetchWarehouseStats } from '../lib/api/catalog';
import { formatAmount, formatDateTime, warehouseStatusMeta } from '../lib/format';

interface WarehousePageProps {
  refreshToken?: number;
  warehouseType: 'virtual' | 'physical';
}

type WarehouseFilter = 'all' | 'virtual' | 'physical';

export function WarehousePage({
  refreshToken = 0,
  warehouseType,
}: WarehousePageProps) {
  const [selected, setSelected] = useState<WarehouseItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [stats, setStats] = useState<AdminWarehouseStats>({
    totalVirtual: 0,
    totalPhysical: 0,
  });
  const [filters, setFilters] = useState<{
    productName?: string;
    sourceType?: string;
    userId?: string;
  }>({});
  const [scope, setScope] = useState<WarehouseFilter>('all');
  const [status, setStatus] = useState<'all' | WarehouseItem['status']>('all');
  const [form] = Form.useForm<{ productName?: string; sourceType?: string; userId?: string }>();

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const [statsResult, itemsResult] = await Promise.all([
          fetchWarehouseStats(),
          fetchAdminWarehouseItems(warehouseType),
        ]);
        if (!alive) {
          return;
        }
        setStats(statsResult);
        setItems(itemsResult.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setStats({ totalVirtual: 0, totalPhysical: 0 });
        setItems([]);
        setIssue(error instanceof Error ? error.message : '仓库列表加载失败');
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
  }, [refreshToken, warehouseType]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (scope !== 'all' && item.warehouseType !== scope) {
        return false;
      }
      if (status !== 'all' && item.status !== status) {
        return false;
      }
      if (
        filters.productName &&
        !item.productName.toLowerCase().includes(filters.productName.trim().toLowerCase())
      ) {
        return false;
      }
      if (filters.sourceType && item.sourceType !== filters.sourceType) {
        return false;
      }
      if (
        filters.userId &&
        !String(item.userId).toLowerCase().includes(filters.userId.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [filters, items, scope, status]);

  const sourceTypeOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.sourceType).filter(Boolean))).map((value) => ({
        label: value,
        value,
      })),
    [items],
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
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={form}
        onSearch={() => {
          setFilters(form.getFieldsValue());
        }}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setScope('all');
          setStatus('all');
        }}
        extra={
          <Segmented<WarehouseFilter>
            options={[
              { label: '全部仓型', value: 'all' },
              { label: '虚拟仓', value: 'virtual' },
              { label: '实体仓', value: 'physical' },
            ]}
            value={scope}
            onChange={setScope}
          />
        }
      >
        <Form.Item name="productName">
          <Input placeholder="商品名称" allowClear />
        </Form.Item>
        <Form.Item name="sourceType">
          <Select placeholder="来源类型" allowClear options={sourceTypeOptions} />
        </Form.Item>
        <Form.Item name="userId">
          <Input placeholder="用户 ID" allowClear />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: filteredItems.length },
          { key: 'stored', label: '已入仓', count: items.filter((item) => item.status === 'stored').length },
          { key: 'locked', label: '锁定', count: items.filter((item) => item.status === 'locked').length },
          { key: 'consigning', label: '寄售中', count: items.filter((item) => item.status === 'consigning').length },
          { key: 'completed', label: '已完成', count: items.filter((item) => item.status === 'completed').length },
        ]}
        onChange={(key) => setStatus(key as 'all' | WarehouseItem['status'])}
      />
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          pagination={{ pageSize: 10 }}
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
