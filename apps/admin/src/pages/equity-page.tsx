import type {
  AdminEquityAccountItem,
  AdminEquityLogItem,
  AdjustAdminEquityPayload,
} from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Avatar,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';

import { AdminSearchPanel } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  adjustAdminEquity,
  fetchAdminEquityAccounts,
  fetchAdminEquityDetail,
} from '../lib/api/equity';
import { formatAmount, formatDateTime } from '../lib/format';

interface EquityPageProps {
  refreshToken?: number;
}

type EquityFilters = {
  userId?: string;
  userName?: string;
  phone?: string;
};

type AdjustFormValues = {
  subType: AdjustAdminEquityPayload['subType'];
  amount: number;
  note?: string;
};

const equitySubTypeOptions = [
  { label: '类目权益金', value: 'category' },
  { label: '换购权益金', value: 'exchange' },
  { label: '通兑资产', value: 'general' },
] as const;

const equityLogTypeMeta: Record<AdminEquityLogItem['type'], { color: string; label: string }> = {
  grant: { color: 'success', label: '发放' },
  use: { color: 'warning', label: '使用' },
  expire: { color: 'error', label: '过期' },
  adjust: { color: 'processing', label: '调整' },
  unknown: { color: 'default', label: '未知' },
};

const equitySubTypeLabel: Record<NonNullable<AdminEquityLogItem['subType']>, string> = {
  category: '类目权益金',
  exchange: '换购权益金',
  general: '通兑资产',
};

function formatEquitySource(sourceType: number | null) {
  if (sourceType === 40) {
    return '后台调账';
  }
  if (sourceType == null) {
    return '-';
  }
  return `来源类型 ${sourceType}`;
}

export function EquityPage({ refreshToken = 0 }: EquityPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<EquityFilters>();
  const [adjustForm] = Form.useForm<AdjustFormValues>();

  const [filters, setFilters] = useState<EquityFilters>({});
  const [rows, setRows] = useState<AdminEquityAccountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailIssue, setDetailIssue] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AdminEquityAccountItem | null>(null);
  const [detailLogs, setDetailLogs] = useState<AdminEquityLogItem[]>([]);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<AdminEquityAccountItem | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminEquityAccounts({
          page,
          pageSize,
          userId: filters.userId,
          userName: filters.userName,
          phone: filters.phone,
        });
        if (!alive) {
          return;
        }
        setRows(result.items);
        setTotal(result.total);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows([]);
        setTotal(0);
        setIssue(error instanceof Error ? error.message : '权益金账户加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPageData();

    return () => {
      alive = false;
    };
  }, [filters.phone, filters.userId, filters.userName, page, pageSize, refreshToken]);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedAccount(null);
      setDetailLogs([]);
      setDetailIssue(null);
      return;
    }

    const targetUserId = selectedUserId;
    let alive = true;

    async function loadDetail() {
      setDetailLoading(true);
      setDetailIssue(null);
      try {
        const result = await fetchAdminEquityDetail(targetUserId);
        if (!alive) {
          return;
        }
        setSelectedAccount(result.account);
        setDetailLogs(result.logs);
      } catch (error) {
        if (!alive) {
          return;
        }
        setSelectedAccount(null);
        setDetailLogs([]);
        setDetailIssue(error instanceof Error ? error.message : '权益金详情加载失败');
      } finally {
        if (alive) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      alive = false;
    };
  }, [selectedUserId]);

  function openDetail(record: AdminEquityAccountItem) {
    setSelectedUserId(record.userId);
    setDetailOpen(true);
  }

  function openAdjust(record: AdminEquityAccountItem) {
    setAdjustTarget(record);
    adjustForm.resetFields();
    setAdjustOpen(true);
  }

  async function refreshCurrentPage() {
    const result = await fetchAdminEquityAccounts({
      page,
      pageSize,
      userId: filters.userId,
      userName: filters.userName,
      phone: filters.phone,
    });
    setRows(result.items);
    setTotal(result.total);
  }

  async function handleAdjustSubmit() {
    if (!adjustTarget) {
      return;
    }

    try {
      const values = await adjustForm.validateFields();
      setAdjustLoading(true);
      const result = await adjustAdminEquity({
        userId: adjustTarget.userId,
        subType: values.subType,
        amount: Math.round(values.amount * 100),
        note: values.note?.trim() || null,
      });

      messageApi.success('调账成功');
      setAdjustOpen(false);
      setAdjustTarget(null);
      await refreshCurrentPage();

      if (detailOpen && selectedUserId === result.account.userId) {
        setSelectedAccount(result.account);
        setDetailLogs((current) => [result.log, ...current].slice(0, 100));
      }
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setAdjustLoading(false);
    }
  }

  const columns: ProColumns<AdminEquityAccountItem>[] = [
    {
      title: '用户',
      width: 220,
      render: (_, record) => (
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          <Avatar src={record.avatarUrl}>{record.userName?.slice(0, 1) || 'U'}</Avatar>
          <div>
            <Typography.Text strong>{record.userName || record.userId}</Typography.Text>
            <Typography.Text style={{ display: 'block' }} type="secondary">
              {record.userId}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      width: 140,
      render: (_, record) => record.phoneNumber || '-',
    },
    {
      title: '类目权益金',
      dataIndex: 'categoryAmount',
      width: 120,
      render: (_, record) => formatAmount(record.categoryAmount),
    },
    {
      title: '换购权益金',
      dataIndex: 'exchangeAmount',
      width: 120,
      render: (_, record) => formatAmount(record.exchangeAmount),
    },
    {
      title: '通兑资产',
      dataIndex: 'generalAmount',
      width: 120,
      render: (_, record) => formatAmount(record.generalAmount),
    },
    {
      title: '总余额',
      dataIndex: 'totalBalance',
      width: 120,
      render: (_, record) => <Typography.Text strong>{formatAmount(record.totalBalance)}</Typography.Text>,
    },
    {
      title: '累计发放',
      dataIndex: 'totalGranted',
      width: 120,
      render: (_, record) => formatAmount(record.totalGranted),
    },
    {
      title: '累计使用',
      dataIndex: 'totalUsed',
      width: 120,
      render: (_, record) => formatAmount(record.totalUsed),
    },
    {
      title: '累计过期',
      dataIndex: 'totalExpired',
      width: 120,
      render: (_, record) => formatAmount(record.totalExpired),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.updatedAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => [
        <Button key="view" size="small" type="link" onClick={() => openDetail(record)}>
          查看
        </Button>,
        <Button key="adjust" size="small" type="link" onClick={() => openAdjust(record)}>
          调账
        </Button>,
      ],
    },
  ];

  const logColumns: TableColumnsType<AdminEquityLogItem> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (_, record) => formatDateTime(record.createdAt),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (_, record) => (
        <Tag color={equityLogTypeMeta[record.type].color}>{equityLogTypeMeta[record.type].label}</Tag>
      ),
    },
    {
      title: '子账户',
      dataIndex: 'subType',
      width: 120,
      render: (_, record) => (record.subType ? equitySubTypeLabel[record.subType] : '-'),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: (_, record) => {
        const color = record.amount < 0 ? 'danger' : undefined;
        return <Typography.Text type={color}>{formatAmount(record.amount)}</Typography.Text>;
      },
    },
    {
      title: '变动后余额',
      dataIndex: 'balance',
      width: 130,
      render: (_, record) => formatAmount(record.balance),
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      width: 120,
      render: (_, record) => formatEquitySource(record.sourceType),
    },
    {
      title: '备注',
      dataIndex: 'note',
      render: (_, record) => record.note || '-',
    },
  ];

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={searchForm}
        onSearch={() => {
          setPage(1);
          setFilters(searchForm.getFieldsValue());
        }}
        onReset={() => {
          searchForm.resetFields();
          setPage(1);
          setFilters({});
        }}
      >
        <Form.Item name="userId">
          <Input allowClear placeholder="用户 ID" />
        </Form.Item>
        <Form.Item name="userName">
          <Input allowClear placeholder="用户名称" />
        </Form.Item>
        <Form.Item name="phone">
          <Input allowClear placeholder="手机号" />
        </Form.Item>
      </AdminSearchPanel>
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminEquityAccountItem>
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

      <Drawer
        open={detailOpen}
        width={900}
        title="权益金详情"
        onClose={() => {
          setDetailOpen(false);
          setSelectedUserId(null);
          setSelectedAccount(null);
          setDetailLogs([]);
          setDetailIssue(null);
        }}
      >
        {detailIssue ? <Alert showIcon type="error" message={detailIssue} /> : null}
        {selectedAccount ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="用户">{selectedAccount.userName || selectedAccount.userId}</Descriptions.Item>
              <Descriptions.Item label="用户 ID">{selectedAccount.userId}</Descriptions.Item>
              <Descriptions.Item label="手机号">{selectedAccount.phoneNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="总余额">{formatAmount(selectedAccount.totalBalance)}</Descriptions.Item>
              <Descriptions.Item label="类目权益金">{formatAmount(selectedAccount.categoryAmount)}</Descriptions.Item>
              <Descriptions.Item label="换购权益金">{formatAmount(selectedAccount.exchangeAmount)}</Descriptions.Item>
              <Descriptions.Item label="通兑资产">{formatAmount(selectedAccount.generalAmount)}</Descriptions.Item>
              <Descriptions.Item label="累计发放">{formatAmount(selectedAccount.totalGranted)}</Descriptions.Item>
              <Descriptions.Item label="累计使用">{formatAmount(selectedAccount.totalUsed)}</Descriptions.Item>
              <Descriptions.Item label="累计过期">{formatAmount(selectedAccount.totalExpired)}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(selectedAccount.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDateTime(selectedAccount.updatedAt)}</Descriptions.Item>
            </Descriptions>
            <Table
              rowKey="id"
              size="small"
              loading={detailLoading}
              columns={logColumns}
              dataSource={detailLogs}
              pagination={false}
            />
          </div>
        ) : detailLoading ? null : null}
      </Drawer>

      <Modal
        title={`调账 - ${adjustTarget?.userName || adjustTarget?.userId || ''}`}
        open={adjustOpen}
        onOk={() => void handleAdjustSubmit()}
        onCancel={() => {
          setAdjustOpen(false);
          setAdjustTarget(null);
          adjustForm.resetFields();
        }}
        confirmLoading={adjustLoading}
        okText="确认调账"
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item
            name="subType"
            label="子账户类型"
            rules={[{ required: true, message: '请选择子账户类型' }]}
          >
            <Select options={equitySubTypeOptions as unknown as { label: string; value: string }[]} />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额（正数增加，负数扣减）"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="请输入调账原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
