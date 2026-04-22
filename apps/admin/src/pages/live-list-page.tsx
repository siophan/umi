import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { AdminLiveRoomItem, AdminLiveRoomListResult } from '@umi/shared';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { fetchAdminLiveRooms, stopAdminLiveRoom } from '../lib/api/content';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDateTime, formatNumber } from '../lib/format';

interface LiveListPageProps {
  refreshToken?: number;
}

type LiveFilters = {
  title?: string;
  host?: string;
  guessTitle?: string;
};

type LiveStatusFilter = 'all' | AdminLiveRoomItem['status'];

function getStatusColor(status: AdminLiveRoomItem['status']) {
  if (status === 'live') return 'error';
  if (status === 'upcoming') return 'processing';
  return 'default';
}

export function LiveListPage({ refreshToken = 0 }: LiveListPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<LiveFilters>();
  const [result, setResult] = useState<AdminLiveRoomListResult>({
    items: [],
    summary: { total: 0, live: 0, upcoming: 0, ended: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<LiveFilters>({});
  const [status, setStatus] = useState<LiveStatusFilter>('all');
  const [selected, setSelected] = useState<AdminLiveRoomItem | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadLives() {
      setLoading(true);
      setIssue(null);
      try {
        const next = await fetchAdminLiveRooms(filters);
        if (!alive) {
          return;
        }
        setResult(next);
      } catch (error) {
        if (!alive) {
          return;
        }
        setResult({
          items: [],
          summary: { total: 0, live: 0, upcoming: 0, ended: 0 },
        });
        setIssue(error instanceof Error ? error.message : '直播列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadLives();

    return () => {
      alive = false;
    };
  }, [actionSeed, filters, refreshToken]);

  async function handleStop(record: AdminLiveRoomItem) {
    try {
      setStoppingId(record.id);
      await stopAdminLiveRoom(record.id);
      messageApi.success('直播已强制下播');
      setSelected((current) => (current?.id === record.id ? null : current));
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '强制下播失败');
    } finally {
      setStoppingId(null);
    }
  }

  const rows = useMemo(
    () =>
      result.items.filter((item) => {
        if (status !== 'all' && item.status !== status) {
          return false;
        }
        return true;
      }),
    [result.items, status],
  );

  const columns: ProColumns<AdminLiveRoomItem>[] = [
    {
      title: '直播间',
      width: 280,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.currentGuessTitle || '当前未挂载竞猜'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '主播',
      width: 180,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.hostName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.hostUid || (record.hostId ? `用户 ID ${record.hostId}` : '未知主播')}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => <Tag color={getStatusColor(record.status)}>{record.statusLabel}</Tag>,
    },
    {
      title: '竞猜数',
      dataIndex: 'guessCount',
      width: 100,
      render: (_, record) => formatNumber(record.guessCount),
    },
    {
      title: '参与人数',
      dataIndex: 'participantCount',
      width: 120,
      render: (_, record) => formatNumber(record.participantCount),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 180,
      render: (_, record) => (record.startTime ? formatDateTime(record.startTime) : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
          {record.status === 'live' ? (
            <Popconfirm
              title="确认强制下播该直播间？"
              description="强制下播后，直播间状态会改成已结束。"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void handleStop(record)}
            >
              <Button
                danger
                loading={stoppingId === record.id}
                size="small"
                type="link"
              >
                强制下播
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
        <Form.Item name="title">
          <Input allowClear placeholder="直播标题" />
        </Form.Item>
        <Form.Item name="host">
          <Input allowClear placeholder="主播" />
        </Form.Item>
        <Form.Item name="guessTitle">
          <Input allowClear placeholder="当前竞猜" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: result.summary.total },
          { key: 'live', label: '直播中', count: result.summary.live },
          { key: 'upcoming', label: '预告中', count: result.summary.upcoming },
          { key: 'ended', label: '已结束', count: result.summary.ended },
        ]}
        onChange={(key) => setStatus(key as LiveStatusFilter)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminLiveRoomItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={rows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        title="直播详情"
        width={560}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="直播标题">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="主播">{selected.hostName}</Descriptions.Item>
            <Descriptions.Item label="主播 UID">
              {selected.hostUid || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">{selected.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="原始状态码">
              {selected.rawStatusCode ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前竞猜">
              {selected.currentGuessTitle || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="竞猜数">
              {formatNumber(selected.guessCount)}
            </Descriptions.Item>
            <Descriptions.Item label="参与人数">
              {formatNumber(selected.participantCount)}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {selected.startTime ? formatDateTime(selected.startTime) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(selected.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {formatDateTime(selected.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
