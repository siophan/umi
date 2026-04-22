import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Form,
  Input,
  Popconfirm,
  Select,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  AdminOrderShipModal,
  type AdminOrderShipFormValues,
} from '../components/admin-order-ship-modal';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminLogisticsRow } from '../lib/api/orders';
import {
  deliverAdminLogistics,
  fetchAdminLogistics,
  shipAdminOrder,
} from '../lib/api/orders';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatDateTime } from '../lib/format';

interface OrderLogisticsPageProps {
  refreshToken?: number;
}

type LogisticsFilters = {
  orderSn?: string;
  carrier?: string;
  shippingType?: AdminLogisticsRow['shippingType'];
};

const emptyRows: AdminLogisticsRow[] = [];

export function OrderLogisticsPage({ refreshToken = 0 }: OrderLogisticsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<LogisticsFilters>();
  const [shipForm] = Form.useForm<AdminOrderShipFormValues>();
  const [rows, setRows] = useState<AdminLogisticsRow[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogisticsFilters>({});
  const [status, setStatus] = useState<'all' | AdminLogisticsRow['status']>('all');
  const [reloadToken, setReloadToken] = useState(0);
  const [shipTarget, setShipTarget] = useState<AdminLogisticsRow | null>(null);
  const [shipSubmitting, setShipSubmitting] = useState(false);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminLogistics().then((result) => result.items);
        if (!alive) return;
        setRows(items);
      } catch (error) {
        if (!alive) return;
        setRows(emptyRows);
        setIssue(error instanceof Error ? error.message : '物流管理加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [refreshToken, reloadToken]);

  function triggerReload(successMessage: string) {
    messageApi.success(successMessage);
    setReloadToken((current) => current + 1);
  }

  function openShipModal(record: AdminLogisticsRow) {
    if (!record.orderId) {
      messageApi.error('当前物流记录缺少订单信息，暂不能发货');
      return;
    }

    shipForm.setFieldsValue({
      shippingType: record.shippingType === 'unknown' ? 'express' : record.shippingType,
      trackingNo: record.trackingNo || undefined,
    });
    setShipTarget(record);
  }

  async function handleShip() {
    if (!shipTarget?.orderId) {
      return;
    }

    try {
      const values = await shipForm.validateFields();
      setShipSubmitting(true);
      await shipAdminOrder(shipTarget.orderId, {
        shippingType: values.shippingType,
        trackingNo: values.trackingNo?.trim() || null,
      });
      setShipTarget(null);
      triggerReload('物流已发货');
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setShipSubmitting(false);
    }
  }

  async function handleDeliver(record: AdminLogisticsRow) {
    try {
      setDeliveringId(record.id);
      await deliverAdminLogistics(record.id, {});
      triggerReload('已标记签收');
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setDeliveringId(null);
    }
  }

  const carrierOptions = useMemo(() => buildOptions(rows, 'carrier'), [rows]);
  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        const orderRef = String(record.orderSn || record.orderId || '').toLowerCase();
        if (status !== 'all' && record.status !== status) return false;
        if (filters.orderSn && !orderRef.includes(filters.orderSn.trim().toLowerCase())) return false;
        if (filters.carrier && record.carrier !== filters.carrier) return false;
        if (filters.shippingType && record.shippingType !== filters.shippingType) return false;
        return true;
      }),
    [filters.carrier, filters.orderSn, filters.shippingType, rows, status],
  );

  const columns: ProColumns<AdminLogisticsRow>[] = [
    {
      title: '履约单',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.fulfillmentSn || record.orderSn || record.id}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.productSummary}
          </Typography.Text>
        </div>
      ),
    },
    { title: '收货人', dataIndex: 'receiver', width: 140, render: (_, record) => record.receiver || '-' },
    { title: '物流方式', dataIndex: 'shippingTypeLabel', width: 140 },
    { title: '承运商', dataIndex: 'carrier', width: 140 },
    { title: '单号', dataIndex: 'trackingNo', width: 180, render: (_, record) => record.trackingNo || '-' },
    { title: '状态', dataIndex: 'statusLabel', width: 120 },
    { title: '发货时间', dataIndex: 'shippedAt', width: 180, render: (_, record) => (record.shippedAt ? formatDateTime(record.shippedAt) : '-') },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div className="inline-actions">
          <Button
            size="small"
            type="link"
            onClick={() => {
              window.location.hash = `#/orders/logistics/detail/${record.id}`;
            }}
          >
            查看
          </Button>
          {record.status === 'stored' ? (
            <Button size="small" type="link" onClick={() => openShipModal(record)}>
              发货
            </Button>
          ) : null}
          {record.status === 'shipping' ? (
            <Popconfirm
              title="确认标记签收？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void handleDeliver(record)}
            >
              <Button
                size="small"
                type="link"
                loading={deliveringId === record.id}
              >
                标记签收
              </Button>
            </Popconfirm>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="orderSn">
          <Input allowClear placeholder="订单号" />
        </Form.Item>
        <Form.Item name="carrier">
          <Select allowClear options={carrierOptions} placeholder="承运商" />
        </Form.Item>
        <Form.Item name="shippingType">
          <Select
            allowClear
            options={[
              { label: '快递物流', value: 'express' },
              { label: '同城配送', value: 'same_city' },
              { label: '用户自提', value: 'self_pickup' },
              { label: '待确认', value: 'unknown' },
            ]}
            placeholder="物流方式"
          />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: 'stored', label: '已建单', count: rows.filter((item) => item.status === 'stored').length },
          { key: 'shipping', label: '配送中', count: rows.filter((item) => item.status === 'shipping').length },
          { key: 'completed', label: '已完成', count: rows.filter((item) => item.status === 'completed').length },
          { key: 'cancelled', label: '已取消', count: rows.filter((item) => item.status === 'cancelled').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminLogisticsRow>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>
      <AdminOrderShipModal
        open={shipTarget != null}
        submitting={shipSubmitting}
        orderSn={shipTarget?.orderSn || null}
        form={shipForm}
        onCancel={() => setShipTarget(null)}
        onSubmit={() => void handleShip()}
      />
    </div>
  );
}
