import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Form,
  Input,
  Modal,
  Select,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs, SEARCH_THEME } from '../components/admin-list-controls';
import { WarehouseConsignDetailDrawer } from '../components/warehouse-consign-detail-drawer';
import type { AdminConsignRow } from '../lib/api/orders';
import { cancelAdminConsign, fetchAdminConsignRows } from '../lib/api/orders';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDateTime, formatYuanAmount } from '../lib/format';

interface WarehouseConsignPageProps {
  refreshToken?: number;
}

type ConsignFilters = {
  tradeNo?: string;
  productName?: string;
  sellerUserId?: string;
  orderSn?: string;
  sourceType?: string;
};

const sourceTypeOptions = [
  { label: '仓库商品', value: '仓库商品' },
  { label: '仓库调入', value: '仓库调入' },
];

const CONSIGN_LISTED = 10;
const CONSIGN_TRADED = 20;
const CONSIGN_CANCELED = 30;

type ConsignStatusKey = 'all' | 'listed' | 'pending_settle' | 'settled' | 'canceled';

function getSettlementLabel(record: AdminConsignRow) {
  if (record.statusCode === CONSIGN_CANCELED) return '-';
  if (record.statusCode !== CONSIGN_TRADED) return '-';
  return record.settledAt ? '已结算' : '待结算';
}

function formatCommissionRate(rate: number | null) {
  if (rate == null) return '-';
  return `${rate.toFixed(2)}%`;
}

export function WarehouseConsignPage({ refreshToken = 0 }: WarehouseConsignPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<ConsignFilters>();
  const [reasonForm] = Form.useForm<{ reason: string }>();

  const [rows, setRows] = useState<AdminConsignRow[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<ConsignFilters>({});
  const [status, setStatus] = useState<ConsignStatusKey>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionSeed, setActionSeed] = useState(0);

  const [cancelTarget, setCancelTarget] = useState<AdminConsignRow | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [selectedConsignId, setSelectedConsignId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminConsignRows({
          page,
          pageSize,
          tradeNo: filters.tradeNo,
          productName: filters.productName,
          sellerUserId: filters.sellerUserId,
          orderSn: filters.orderSn,
          sourceType: filters.sourceType,
          statusKey: status === 'all' ? undefined : status,
        });
        if (!alive) return;
        setRows(result.items);
        setTotal(result.total);
        setStatusCounts(result.statusCounts ?? {});
      } catch (error) {
        if (!alive) return;
        setRows([]);
        setTotal(0);
        setStatusCounts({});
        setIssue(error instanceof Error ? error.message : '寄售市场加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [
    actionSeed,
    filters.orderSn,
    filters.productName,
    filters.sellerUserId,
    filters.sourceType,
    filters.tradeNo,
    page,
    pageSize,
    refreshToken,
    status,
  ]);

  function openCancel(record: AdminConsignRow) {
    setCancelTarget(record);
    reasonForm.resetFields();
  }

  async function submitCancel() {
    if (!cancelTarget) return;
    try {
      const values = await reasonForm.validateFields();
      setCancelSubmitting(true);
      await cancelAdminConsign(cancelTarget.id, values.reason);
      messageApi.success('寄售商品已强制下架');
      setCancelTarget(null);
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setCancelSubmitting(false);
    }
  }

  const columns: ProColumns<AdminConsignRow>[] = [
    {
      title: '交易单号',
      width: 180,
      render: (_, record) => <Typography.Text strong>{record.tradeNo || record.id}</Typography.Text>,
    },
    {
      title: '商品',
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
      title: '卖家',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography.Text>{record.userName || '-'}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            ID {record.userId}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '买家',
      width: 200,
      render: (_, record) =>
        record.buyerUserId ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Typography.Text>{record.buyerUserName || '-'}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ID {record.buyerUserId}
            </Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    { title: '挂单价', dataIndex: 'listingPrice', width: 120, render: (_, record) => (record.listingPrice ? formatYuanAmount(record.listingPrice) : '-') },
    { title: '成交价', dataIndex: 'price', width: 120, render: (_, record) => formatYuanAmount(record.price) },
    { title: '佣金', dataIndex: 'commissionAmount', width: 120, render: (_, record) => formatYuanAmount(record.commissionAmount) },
    { title: '佣金率', dataIndex: 'commissionRate', width: 100, render: (_, record) => formatCommissionRate(record.commissionRate) },
    { title: '卖家到账', dataIndex: 'sellerAmount', width: 120, render: (_, record) => formatYuanAmount(record.sellerAmount) },
    { title: '状态', dataIndex: 'statusLabel', width: 120 },
    { title: '结算状态', width: 120, render: (_, record) => getSettlementLabel(record) },
    { title: '上架时间', dataIndex: 'listedAt', width: 180, render: (_, record) => formatDateTime(record.listedAt || record.createdAt) },
    { title: '成交时间', dataIndex: 'tradedAt', width: 180, render: (_, record) => formatDateTime(record.tradedAt) },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            type="link"
            onClick={() => setSelectedConsignId(record.id)}
          >
            查看
          </Button>
          {record.statusCode === CONSIGN_LISTED ? (
            <Button danger size="small" type="link" onClick={() => openCancel(record)}>
              强制下架
            </Button>
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
        defaultCount={3}
        onSearch={() => {
          setPage(1);
          setFilters(searchForm.getFieldsValue());
        }}
        onReset={() => {
          searchForm.resetFields();
          setPage(1);
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="tradeNo">
          <Input allowClear placeholder="交易单号" />
        </Form.Item>
        <Form.Item name="productName">
          <Input allowClear placeholder="商品名称" />
        </Form.Item>
        <Form.Item name="sellerUserId">
          <Input allowClear placeholder="卖家 ID / 昵称" />
        </Form.Item>
        <Form.Item name="orderSn">
          <Input allowClear placeholder="订单号" />
        </Form.Item>
        <Form.Item name="sourceType">
          <Select allowClear options={sourceTypeOptions} placeholder="来源类型" />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: statusCounts.all ?? 0 },
          { key: 'listed', label: '寄售中', count: statusCounts.listed ?? 0 },
          { key: 'pending_settle', label: '待结算', count: statusCounts.pending_settle ?? 0 },
          { key: 'settled', label: '已成交', count: statusCounts.settled ?? 0 },
          { key: 'canceled', label: '已取消', count: statusCounts.canceled ?? 0 },
        ]}
        onChange={(key) => {
          setPage(1);
          setStatus(key as ConsignStatusKey);
        }}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminConsignRow>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={rows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPage(1);
                setPageSize(nextPageSize);
                return;
              }
              setPage(nextPage);
            },
          }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          title="强制下架寄售商品"
          open={cancelTarget !== null}
          onCancel={() => {
            if (cancelSubmitting) return;
            setCancelTarget(null);
          }}
          onOk={() => void submitCancel()}
          confirmLoading={cancelSubmitting}
          okText="确认下架"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
            下架后该寄售改为已取消，商品回到实体仓。请填写下架理由用于追溯。
          </Typography.Paragraph>
          {cancelTarget ? (
            <Typography.Paragraph>
              <Typography.Text strong>{cancelTarget.productName}</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                交易单号 {cancelTarget.tradeNo || cancelTarget.id}
              </Typography.Text>
            </Typography.Paragraph>
          ) : null}
          <Form form={reasonForm} layout="vertical" preserve={false}>
            <Form.Item
              name="reason"
              label="下架理由"
              rules={[
                { required: true, message: '请填写下架理由' },
                { max: 255, message: '最多 255 字' },
              ]}
            >
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="例：商品涉嫌违规 / 卖家申请下架 / 价格异常" />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>

      <WarehouseConsignDetailDrawer
        consignId={selectedConsignId}
        onClose={() => setSelectedConsignId(null)}
        onRefresh={() => setActionSeed((value) => value + 1)}
      />
    </div>
  );
}
