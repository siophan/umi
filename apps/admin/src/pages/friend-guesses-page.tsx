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
  Space,
  Tag,
  message as messageApi,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs, SEARCH_THEME } from '../components/admin-list-controls';
import type { AdminFriendGuessItem } from '../lib/api/catalog';
import { abandonAdminGuess, fetchAdminFriendGuesses } from '../lib/api/catalog';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatAmount, formatDateTime, formatNumber } from '../lib/format';

interface FriendGuessesPageProps {
  refreshToken?: number;
}

type FriendGuessFilters = {
  roomName?: string;
  inviter?: string;
  reward?: string;
  paymentMode?: string;
};

const emptyRows: AdminFriendGuessItem[] = [];

function paymentModeLabel(mode: number | null) {
  if (mode === 10) return '发起人支付';
  if (mode === 20) return 'AA 支付';
  return '-';
}

function statusTagColor(status: AdminFriendGuessItem['status']) {
  if (status === 'active') return 'processing';
  if (status === 'pending_confirm') return 'gold';
  if (status === 'settled') return 'success';
  if (status === 'abandoned') return 'red';
  return 'warning';
}

export function FriendGuessesPage({ refreshToken = 0 }: FriendGuessesPageProps) {
  const [searchForm] = Form.useForm<FriendGuessFilters>();
  const [abandonForm] = Form.useForm<{ reason: string }>();
  const [rows, setRows] = useState<AdminFriendGuessItem[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<FriendGuessFilters>({});
  const [status, setStatus] = useState<'all' | AdminFriendGuessItem['status']>('all');
  const [abandonTarget, setAbandonTarget] = useState<AdminFriendGuessItem | null>(null);
  const [abandoning, setAbandoning] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [toast, toastHolder] = messageApi.useMessage();

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminFriendGuesses().then((result) => result.items);
        if (!alive) return;
        setRows(items);
      } catch (error) {
        if (!alive) return;
        setRows(emptyRows);
        setIssue(error instanceof Error ? error.message : '好友竞猜加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [refreshToken, reloadNonce]);

  const paymentModeOptions = useMemo(
    () => [
      { label: '发起人支付', value: '10' },
      { label: 'AA 支付', value: '20' },
    ],
    [],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) return false;
        if (filters.roomName && !record.roomName.toLowerCase().includes(filters.roomName.trim().toLowerCase())) return false;
        if (
          filters.inviter &&
          !record.inviter.toLowerCase().includes(filters.inviter.trim().toLowerCase())
        ) {
          return false;
        }
        if (
          filters.reward &&
          !record.reward.toLowerCase().includes(filters.reward.trim().toLowerCase())
        ) {
          return false;
        }
        if (filters.paymentMode && String(record.paymentMode ?? '') !== filters.paymentMode) {
          return false;
        }
        return true;
      }),
    [filters.inviter, filters.paymentMode, filters.reward, filters.roomName, rows, status],
  );

  async function handleAbandonSubmit() {
    if (!abandonTarget) return;
    const values = await abandonForm.validateFields();
    setAbandoning(true);
    try {
      await abandonAdminGuess(abandonTarget.guessId, { reason: values.reason.trim() });
      toast.success('已提交作废，已支付的投注将逐单原路退款');
      setAbandonTarget(null);
      abandonForm.resetFields();
      setReloadNonce((n) => n + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '作废失败');
    } finally {
      setAbandoning(false);
    }
  }

  const columns: ProColumns<AdminFriendGuessItem>[] = [
    {
      title: '房间名称',
      dataIndex: 'roomName',
      width: 240,
    },
    {
      title: '发起人',
      dataIndex: 'inviter',
      width: 140,
    },
    {
      title: '奖励',
      dataIndex: 'reward',
      width: 200,
      ellipsis: true,
    },
    { title: '参与人数', dataIndex: 'participants', width: 100, render: (_, record) => formatNumber(record.participants) },
    {
      title: '邀请进度',
      width: 140,
      render: (_, record) =>
        `${formatNumber(record.acceptedInvitations)}/${formatNumber(record.invitationCount)}`,
    },
    {
      title: '结果确认',
      width: 140,
      render: (_, record) =>
        `${formatNumber(record.confirmedResults)}/${formatNumber(record.betParticipantCount)}`,
    },
    { title: '已支付金额', dataIndex: 'paidAmount', width: 120, render: (_, record) => formatAmount(record.paidAmount) },
    { title: '支付模式', dataIndex: 'paymentMode', width: 120, render: (_, record) => paymentModeLabel(record.paymentMode) },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => <Tag color={statusTagColor(record.status)}>{record.statusLabel}</Tag>,
    },
    { title: '截止时间', dataIndex: 'endTime', width: 180, render: (_, record) => formatDateTime(record.endTime) },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <Space size={4}>
          <Button
            size="small"
            type="link"
            onClick={() => {
              window.location.hash = `#/guesses/detail/${record.guessId}`;
            }}
          >
            详情
          </Button>
          {record.status !== 'settled' && record.status !== 'abandoned' ? (
            <Button
              danger
              size="small"
              type="link"
              onClick={() => {
                abandonForm.resetFields();
                setAbandonTarget(record);
              }}
            >
              作废
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack">
      {toastHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={searchForm}
        defaultCount={3}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="roomName">
          <Input allowClear placeholder="房间名称" />
        </Form.Item>
        <Form.Item name="inviter">
          <Input allowClear placeholder="发起人" />
        </Form.Item>
        <Form.Item name="reward">
          <Input allowClear placeholder="奖励" />
        </Form.Item>
        <Form.Item name="paymentMode">
          <Select allowClear options={paymentModeOptions} placeholder="支付模式" />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: 'pending', label: '待开赛', count: rows.filter((item) => item.status === 'pending').length },
          { key: 'active', label: '进行中', count: rows.filter((item) => item.status === 'active').length },
          { key: 'pending_confirm', label: '待确认', count: rows.filter((item) => item.status === 'pending_confirm').length },
          { key: 'settled', label: '已结算', count: rows.filter((item) => item.status === 'settled').length },
          { key: 'abandoned', label: '已作废', count: rows.filter((item) => item.status === 'abandoned').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminFriendGuessItem>
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
      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          title="作废好友竞猜"
          open={abandonTarget != null}
          confirmLoading={abandoning}
          onOk={() => void handleAbandonSubmit()}
          onCancel={() => {
            if (abandoning) return;
            setAbandonTarget(null);
            abandonForm.resetFields();
          }}
          okText="确认作废"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          destroyOnClose
        >
          <Alert
            type="warning"
            showIcon
            message="作废后所有已支付投注将原路全额退款（含手续费），未付投注将取消。已结算的竞猜不能作废。"
            style={{ marginBottom: 16 }}
          />
          <Form form={abandonForm} layout="vertical">
            <Form.Item label="房间">
              <span>{abandonTarget?.roomName ?? '-'}</span>
            </Form.Item>
            <Form.Item
              label="作废理由"
              name="reason"
              rules={[
                { required: true, message: '请填写作废理由' },
                { whitespace: true, message: '请填写作废理由' },
              ]}
            >
              <Input.TextArea
                rows={3}
                maxLength={200}
                showCount
                placeholder="例如：某选项 0 投注无法正常结算"
              />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
}
