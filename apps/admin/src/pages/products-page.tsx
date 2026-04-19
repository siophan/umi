import type { TableColumnsType } from 'antd';

import { Card, Descriptions, Drawer, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

import type { AdminProduct } from '../lib/admin-data';
import { formatAmount, formatDateTime, productStatusMeta } from '../lib/format';

interface ProductsPageProps {
  loading: boolean;
  products: AdminProduct[];
}

export function ProductsPage({ loading, products }: ProductsPageProps) {
  const [selected, setSelected] = useState<AdminProduct | null>(null);

  const columns: TableColumnsType<AdminProduct> = [
    {
      title: '商品',
      dataIndex: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text type="secondary">{record.brand}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
    },
    {
      title: '店铺',
      dataIndex: 'shopName',
    },
    {
      title: '售价',
      dataIndex: 'price',
      render: (value: number) => formatAmount(value),
    },
    {
      title: '库存',
      dataIndex: 'stock',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: AdminProduct['status']) => (
        <Tag color={productStatusMeta[value].color}>{productStatusMeta[value].label}</Tag>
      ),
    },
    {
      title: '最近更新',
      dataIndex: 'updatedAt',
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <div className="page-stack">
      <Space wrap size={16}>
        <Card className="metric-card">
          <Statistic title="商品数" value={products.length} />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="低库存"
            value={products.filter((product) => product.status === 'low_stock').length}
          />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="在售商品"
            value={products.filter((product) => product.status === 'active').length}
          />
        </Card>
      </Space>

      <Card title="商品管理">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={products}
          loading={loading}
          pagination={{ pageSize: 6 }}
          onRow={(record) => ({
            onClick: () => setSelected(record),
          })}
        />
      </Card>

      <Drawer
        open={selected != null}
        width={420}
        title={selected?.name}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="品牌">{selected.brand}</Descriptions.Item>
              <Descriptions.Item label="分类">{selected.category}</Descriptions.Item>
              <Descriptions.Item label="所属店铺">{selected.shopName}</Descriptions.Item>
              <Descriptions.Item label="售价">
                {formatAmount(selected.price)}
              </Descriptions.Item>
              <Descriptions.Item label="库存">{selected.stock}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={productStatusMeta[selected.status].color}>
                  {productStatusMeta[selected.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="最近更新">
                {formatDateTime(selected.updatedAt)}
              </Descriptions.Item>
            </Descriptions>

            <Card title="标签" size="small">
              <Space wrap>
                {selected.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
}
