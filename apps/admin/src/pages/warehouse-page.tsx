import type { WarehouseItem } from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';

import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { fetchAdminWarehouseItems } from '../lib/api/catalog';
import { formatAmount, formatDateTime, warehouseStatusMeta } from '../lib/format';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface WarehousePageProps {
  refreshToken?: number;
  warehouseType: 'virtual' | 'physical';
}

const virtualSourceTypeOptions = [
  { label: '竞猜奖励', value: '竞猜奖励' },
  { label: '订单入仓', value: '订单入仓' },
  { label: '兑换入仓', value: '兑换入仓' },
  { label: '手工入仓', value: '手工入仓' },
];

const physicalSourceTypeOptions = [
  { label: '商家发货', value: '商家发货' },
  { label: '竞猜奖励', value: '竞猜奖励' },
  { label: '仓库商品', value: '仓库商品' },
  { label: '仓库调入', value: '仓库调入' },
];

export function WarehousePage({
  refreshToken = 0,
  warehouseType,
}: WarehousePageProps) {
  const [selected, setSelected] = useState<WarehouseItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [filters, setFilters] = useState<{
    productName?: string;
    sourceType?: string;
    userId?: string;
  }>({});
  const [status, setStatus] = useState<'all' | WarehouseItem['status']>('all');
  const [form] = Form.useForm<{ productName?: string; sourceType?: string; userId?: string }>();

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const itemsResult = await fetchAdminWarehouseItems(warehouseType);
        if (!alive) {
          return;
        }
        setItems(itemsResult.items);
      } catch (error) {
        if (!alive) {
          return;
        }
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
    const visibleItems =
      warehouseType === 'physical'
        ? items.filter((item) => item.status !== 'consigning' && item.status !== 'completed')
        : items;

    return visibleItems.filter((item) => {
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
  }, [filters, items, status, warehouseType]);

  const sourceTypeOptions = warehouseType === 'virtual' ? virtualSourceTypeOptions : physicalSourceTypeOptions;

  const columns = useMemo<ProColumns<WarehouseItem>[]>(() => {
    const baseColumns: ProColumns<WarehouseItem>[] = [
      {
        title: '商品',
        dataIndex: 'productName',
        width: 240,
        render: (_, record) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {record.productImg ? (
              <img
                src={record.productImg}
                alt={record.productName}
                style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
              />
            ) : null}
            <Typography.Text strong>{record.productName}</Typography.Text>
          </div>
        ),
      },
      {
        title: '用户 ID',
        dataIndex: 'userId',
        width: 160,
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        width: 100,
      },
      {
        title: '来源',
        dataIndex: 'sourceType',
        width: 140,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (_, record) => (
          <Tag color={warehouseStatusMeta[record.status].color}>
            {warehouseStatusMeta[record.status].label}
          </Tag>
        ),
      },
      {
        title: '入库时间',
        dataIndex: 'createdAt',
        width: 180,
        render: (_, record) => formatDateTime(record.createdAt),
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        fixed: 'right',
        valueType: 'option',
        render: (_, record) => (
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
        ),
      },
    ];

    if (warehouseType === 'virtual') {
      baseColumns.splice(
        3,
        0,
        {
          title: '单价',
          dataIndex: 'price',
          width: 120,
          render: (_, record) => formatAmount((record.price ?? 0) * 100),
        },
        {
          title: '总价值',
          key: 'totalAmount',
          width: 130,
          render: (_, record) => formatAmount((record.price ?? 0) * record.quantity * 100),
        },
      );
    } else {
      baseColumns.splice(
        3,
        0,
        {
          title: '原价值',
          dataIndex: 'price',
          width: 120,
          render: (_, record) => formatAmount((record.price ?? 0) * 100),
        },
      );
    }

    return baseColumns;
  }, [warehouseType]);

  const statusItems = useMemo(() => {
    if (warehouseType === 'virtual') {
      return [
        { key: 'all', label: '全部', count: items.length },
        { key: 'stored', label: '在库', count: items.filter((item) => item.status === 'stored').length },
        { key: 'locked', label: '冻结中', count: items.filter((item) => item.status === 'locked').length },
        { key: 'converted', label: '已转换', count: items.filter((item) => item.status === 'converted').length },
      ];
    }

    const pageItems = items.filter((item) => item.status !== 'consigning' && item.status !== 'completed');

    return [
      { key: 'all', label: '全部', count: pageItems.length },
      { key: 'stored', label: '在库', count: pageItems.filter((item) => item.status === 'stored').length },
      { key: 'shipping', label: '配送中', count: pageItems.filter((item) => item.status === 'shipping').length },
      { key: 'delivered', label: '已送达', count: pageItems.filter((item) => item.status === 'delivered').length },
    ];
  }, [items, warehouseType]);

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
          setStatus('all');
        }}
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
        items={statusItems}
        onChange={(key) => setStatus(key as 'all' | WarehouseItem['status'])}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<WarehouseItem>
          cardBordered={false}
          rowKey="id"
          columns={columns as never}
          columnsState={{}}
          dataSource={filteredItems}
          loading={loading}
        options={{ reload: true, density: true, fullScreen: false, setting: true }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        search={false}
        toolBarRender={() => []}
      />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        width={440}
        title={warehouseType === 'virtual' ? '虚拟仓详情' : '实体仓详情'}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: 'grid', gap: 16, width: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="商品">{selected.productName}</Descriptions.Item>
              <Descriptions.Item label="商品 ID">{selected.productId}</Descriptions.Item>
              <Descriptions.Item label="用户 ID">{selected.userId}</Descriptions.Item>
              <Descriptions.Item label="仓型">{selected.warehouseType === 'virtual' ? '虚拟仓' : '实体仓'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={warehouseStatusMeta[selected.status].color}>
                  {warehouseStatusMeta[selected.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="来源">{selected.sourceType}</Descriptions.Item>
              <Descriptions.Item label="数量">{selected.quantity}</Descriptions.Item>
              <Descriptions.Item label={selected.warehouseType === 'virtual' ? '单价' : '原价值'}>
                {formatAmount((selected.price ?? 0) * 100)}
              </Descriptions.Item>
              {selected.warehouseType === 'virtual' ? (
                <Descriptions.Item label="总价值">
                  {formatAmount((selected.price ?? 0) * selected.quantity * 100)}
                </Descriptions.Item>
              ) : null}
              {selected.warehouseType === 'physical' ? (
                <Descriptions.Item label="入库时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
              ) : null}
            </Descriptions>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
