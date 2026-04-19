import type { ReactElement, ReactNode } from 'react';
import { Card, Descriptions, Drawer, Form, Input, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { cloneElement, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type {
  AdminConsignRow,
  AdminLogisticsRow,
  AdminTransactionRow,
} from '../lib/admin-data';
import type { AdminPageData } from '../lib/admin-page-data';
import { formatAmount, formatDateTime, formatNumber } from '../lib/format';

type OrderFulfillmentPath =
  | '/orders/transactions'
  | '/orders/logistics'
  | '/warehouse/consign';

interface OrderFulfillmentPageProps {
  data: AdminPageData;
  loading: boolean;
  path: OrderFulfillmentPath;
}

type DetailRecord = AdminTransactionRow | AdminLogisticsRow | AdminConsignRow;

interface OrderFulfillmentView {
  title: string;
  metrics: ReactNode;
  content: ReactElement;
}

function directionTag(direction: 'payment' | 'refund') {
  return <Tag color={direction === 'payment' ? 'processing' : 'warning'}>{direction === 'payment' ? '支付' : '退款'}</Tag>;
}

export function OrderFulfillmentPage({
  data,
  loading,
  path,
}: OrderFulfillmentPageProps) {
  const [selected, setSelected] = useState<DetailRecord | null>(null);
  const [filters, setFilters] = useState<{
    keyword?: string;
    second?: string;
    third?: string;
  }>({});
  const [status, setStatus] = useState('all');
  const [form] = Form.useForm<{ keyword?: string; second?: string; third?: string }>();

  const sourceRows = useMemo<DetailRecord[]>(() => {
    switch (path) {
      case '/orders/transactions':
        return data.transactions;
      case '/orders/logistics':
        return data.logistics;
      default:
        return data.consignRows;
    }
  }, [data, path]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = filters.keyword?.trim().toLowerCase();
    return sourceRows.filter((row) => {
      const rowStatus =
        path === '/orders/transactions'
          ? ('direction' in row ? String(row.direction) : '')
          : 'status' in row
            ? String(row.status)
            : 'statusLabel' in row
              ? String(row.statusLabel)
              : '';
      if (status !== 'all' && rowStatus !== status) {
        return false;
      }
      switch (path) {
        case '/orders/transactions': {
          const record = row as AdminTransactionRow;
          const orderRef = String(record.orderSn || record.orderId || '').toLowerCase();
          if (
            normalizedKeyword &&
            !orderRef.includes(normalizedKeyword)
          ) {
            return false;
          }
          if (filters.second && record.channel !== filters.second) {
            return false;
          }
          if (filters.third && record.direction !== filters.third) {
            return false;
          }
          return true;
        }
        case '/orders/logistics': {
          const record = row as AdminLogisticsRow;
          const orderRef = String(record.orderSn || record.orderId || '').toLowerCase();
          if (
            normalizedKeyword &&
            !orderRef.includes(normalizedKeyword)
          ) {
            return false;
          }
          if (filters.second && record.carrier !== filters.second) {
            return false;
          }
          if (filters.third && record.shippingTypeLabel !== filters.third) {
            return false;
          }
          return true;
        }
        default: {
          const record = row as AdminConsignRow;
          if (normalizedKeyword && !record.productName.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.sourceType !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
      }
    });
  }, [filters.keyword, filters.second, filters.third, path, sourceRows, status]);

  const statusItems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of sourceRows) {
      const key =
        path === '/orders/transactions'
          ? ('direction' in row ? String(row.direction) : 'all')
          : 'status' in row
            ? String(row.status)
            : 'statusLabel' in row
              ? String(row.statusLabel)
              : 'all';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const labels: Record<string, string> = {
      payment: '支付',
      refund: '退款',
      stored: '已建单',
      shipping: '配送中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return [
      { key: 'all', label: '全部', count: sourceRows.length },
      ...Array.from(counts.entries()).map(([key, count]) => ({
        key,
        label: labels[key] ?? key,
        count,
      })),
    ];
  }, [path, sourceRows]);

  const selectOptions = useMemo(() => {
    const rows = sourceRows as unknown as Array<Record<string, unknown>>;
    const build = (key: string) =>
      Array.from(new Set(rows.map((item) => item[key]).filter(Boolean))).map((value) => ({
        label: String(value),
        value: String(value),
      }));

    switch (path) {
      case '/orders/transactions':
        return {
          second: build('channel'),
          third: build('direction'),
          secondPlaceholder: '渠道',
          thirdPlaceholder: '方向',
        };
      case '/orders/logistics':
        return {
          second: build('carrier'),
          third: [
            { label: '快递', value: '快递' },
            { label: '同城配送', value: '同城配送' },
            { label: '到店自提', value: '到店自提' },
            { label: '未知', value: '未知' },
          ],
          secondPlaceholder: '承运商',
          thirdPlaceholder: '物流方式',
        };
      default:
        return {
          second: build('sourceType'),
          third: [
            { label: '待上架', value: '待上架' },
            { label: '寄售中', value: '寄售中' },
            { label: '已成交', value: '已成交' },
            { label: '已结算', value: '已结算' },
            { label: '已取消', value: '已取消' },
          ],
          secondPlaceholder: '来源类型',
          thirdPlaceholder: '状态',
        };
    }
  }, [path, sourceRows]);

  const view = useMemo<OrderFulfillmentView>(() => {
    switch (path) {
      case '/orders/transactions': {
        const columns: TableColumnsType<AdminTransactionRow> = [
          {
            title: '流水',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.orderSn || record.orderId}</Typography.Text>
                <Typography.Text type="secondary">
                  {record.userName || record.userId}
                </Typography.Text>
              </Space>
            ),
          },
          { title: '渠道', dataIndex: 'channel' },
          { title: '方向', render: (_, record) => directionTag(record.direction) },
          {
            title: '金额',
            dataIndex: 'amount',
            render: (value: number) => formatAmount(value),
          },
          { title: '状态', dataIndex: 'statusLabel' },
          {
            title: '时间',
            dataIndex: 'createdAt',
            render: (value) => formatDateTime(value),
          },
        ];

        return {
          title: '交易流水',
          metrics: (
            <>
              <Card className="metric-card">
                <Statistic title="流水总数" value={data.transactions.length} />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="支付流水"
                  value={data.transactions.filter((item) => item.direction === 'payment').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="退款流水"
                  value={data.transactions.filter((item) => item.direction === 'refund').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="支付金额"
                  value={formatAmount(
                    data.transactions
                      .filter((item) => item.direction === 'payment')
                      .reduce((sum, item) => sum + item.amount, 0),
                  )}
                />
              </Card>
            </>
          ),
          content: (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={data.transactions}
              loading={loading}
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({ onClick: () => setSelected(record) })}
            />
          ),
        };
      }
      case '/orders/logistics': {
        const columns: TableColumnsType<AdminLogisticsRow> = [
          {
            title: '履约单',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.fulfillmentSn || record.orderSn || record.id}</Typography.Text>
                <Typography.Text type="secondary">{record.productSummary}</Typography.Text>
              </Space>
            ),
          },
          { title: '收货人', dataIndex: 'receiver', render: (value) => value || '-' },
          { title: '物流方式', dataIndex: 'shippingTypeLabel' },
          { title: '承运商', dataIndex: 'carrier' },
          { title: '单号', dataIndex: 'trackingNo', render: (value) => value || '-' },
          { title: '状态', dataIndex: 'statusLabel' },
          {
            title: '发货时间',
            dataIndex: 'shippedAt',
            render: (value) => (value ? formatDateTime(value) : '-'),
          },
        ];

        return {
          title: '物流管理',
          metrics: (
            <>
              <Card className="metric-card">
                <Statistic title="履约单总数" value={data.logistics.length} />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="配送中"
                  value={data.logistics.filter((item) => item.status === 'shipping').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="已完成"
                  value={data.logistics.filter((item) => item.status === 'completed').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="运费"
                  value={formatAmount(
                    data.logistics.reduce((sum, item) => sum + item.shippingFee, 0),
                  )}
                />
              </Card>
            </>
          ),
          content: (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={data.logistics}
              loading={loading}
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({ onClick: () => setSelected(record) })}
            />
          ),
        };
      }
      default: {
        const columns: TableColumnsType<AdminConsignRow> = [
          {
            title: '寄售商品',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.productName}</Typography.Text>
                <Typography.Text type="secondary">
                  卖家 {record.userId}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: '成交价',
            dataIndex: 'price',
            render: (value: number) => formatAmount(value),
          },
          {
            title: '挂单价',
            dataIndex: 'listingPrice',
            render: (value: number | null) => (value ? formatAmount(value) : '-'),
          },
          {
            title: '佣金',
            dataIndex: 'commissionAmount',
            render: (value: number) => formatAmount(value),
          },
          { title: '状态', dataIndex: 'statusLabel' },
          {
            title: '时间',
            dataIndex: 'createdAt',
            render: (value) => formatDateTime(value),
          },
        ];

        return {
          title: '寄售市场',
          metrics: (
            <>
              <Card className="metric-card">
                <Statistic title="寄售记录" value={data.consignRows.length} />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="已成交"
                  value={data.consignRows.filter((item) => item.tradedAt).length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="已结算"
                  value={data.consignRows.filter((item) => item.settledAt).length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="成交金额"
                  value={formatAmount(
                    data.consignRows.reduce((sum, item) => sum + item.price, 0),
                  )}
                />
              </Card>
            </>
          ),
          content: (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={data.consignRows}
              loading={loading}
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({ onClick: () => setSelected(record) })}
            />
          ),
        };
      }
    }
  }, [data, loading, path]);

  return (
    <div className="page-stack">
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
        <Form.Item name="keyword">
          <Input
            placeholder={
              path === '/orders/transactions'
                ? '订单号'
                : path === '/orders/logistics'
                  ? '订单号'
                  : '商品名称'
            }
            allowClear
          />
        </Form.Item>
        <Form.Item name="second">
          <Select
            placeholder={selectOptions.secondPlaceholder}
            allowClear
            options={selectOptions.second}
          />
        </Form.Item>
        <Form.Item name="third">
          <Select
            placeholder={selectOptions.thirdPlaceholder}
            allowClear
            options={selectOptions.third}
          />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs activeKey={status} items={statusItems} onChange={setStatus} />
      <Card>
        {cloneElement(view.content as ReactElement<any>, { dataSource: filteredRows })}
      </Card>
      <Drawer
        open={selected != null}
        width={460}
        title={view.title}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            {Object.entries(selected).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {typeof value === 'number'
                  ? value
                  : typeof value === 'string' && value.includes('T')
                    ? formatDateTime(value)
                    : String(value ?? '-')}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
