import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';

interface LiveListPageProps {
  refreshToken?: number;
}

type LiveRoomRow = {
  id: string;
  room: string;
  host: string;
  viewers: number;
  status: '直播中' | '已结束';
};

type LiveFilters = {
  room?: string;
  host?: string;
};

const rows: LiveRoomRow[] = [
  { id: 'live-1', room: '直播间 01', host: '主播 Panda', viewers: 842, status: '直播中' },
  { id: 'live-2', room: '直播间 08', host: '主播 Seven', viewers: 0, status: '已结束' },
];

export function LiveListPage({ refreshToken = 0 }: LiveListPageProps) {
  const [searchForm] = Form.useForm<LiveFilters>();
  const [filters, setFilters] = useState<LiveFilters>({});
  const [status, setStatus] = useState<'all' | LiveRoomRow['status']>('all');
  const [selected, setSelected] = useState<LiveRoomRow | null>(null);

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.room && !record.room.toLowerCase().includes(filters.room.trim().toLowerCase())) {
          return false;
        }
        if (filters.host && record.host !== filters.host) {
          return false;
        }
        return true;
      }),
    [filters.host, filters.room, status],
  );

  const columns: ProColumns<LiveRoomRow>[] = [
    { title: '直播间', dataIndex: 'room', width: 220 },
    { title: '主播', dataIndex: 'host', width: 180 },
    { title: '观看人数', dataIndex: 'viewers', width: 120 },
    { title: '状态', dataIndex: 'status', width: 120 },
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

  return (
    <div className="page-stack">
      <AdminSearchPanel
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="room">
          <Input allowClear placeholder="直播间名称" />
        </Form.Item>
        <Form.Item name="host">
          <Select allowClear options={buildOptions(rows, 'host')} placeholder="主播" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '直播中', label: '直播中', count: rows.filter((item) => item.status === '直播中').length },
          { key: '已结束', label: '已结束', count: rows.filter((item) => item.status === '已结束').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<LiveRoomRow>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <Drawer open={selected != null} title="直播间详情" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="直播间">{selected.room}</Descriptions.Item>
            <Descriptions.Item label="主播">{selected.host}</Descriptions.Item>
            <Descriptions.Item label="观看人数">{selected.viewers}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
