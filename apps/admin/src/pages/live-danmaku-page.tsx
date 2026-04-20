import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';

interface LiveDanmakuPageProps {
  refreshToken?: number;
}

type DanmakuRow = {
  id: string;
  room: string;
  sender: string;
  content: string;
  status: '正常' | '待复核';
};

type DanmakuFilters = {
  content?: string;
  room?: string;
};

const rows: DanmakuRow[] = [
  { id: 'dm-1', room: '直播间 01', sender: '用户 888', content: '求开奖', status: '正常' },
  { id: 'dm-2', room: '直播间 01', sender: '用户 999', content: '优惠券还有吗', status: '待复核' },
];

export function LiveDanmakuPage({ refreshToken = 0 }: LiveDanmakuPageProps) {
  const [searchForm] = Form.useForm<DanmakuFilters>();
  const [filters, setFilters] = useState<DanmakuFilters>({});
  const [status, setStatus] = useState<'all' | DanmakuRow['status']>('all');
  const [selected, setSelected] = useState<DanmakuRow | null>(null);

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.content && !record.content.toLowerCase().includes(filters.content.trim().toLowerCase())) {
          return false;
        }
        if (filters.room && record.room !== filters.room) {
          return false;
        }
        return true;
      }),
    [filters.content, filters.room, status],
  );

  const columns: ProColumns<DanmakuRow>[] = [
    { title: '直播间', dataIndex: 'room', width: 180 },
    { title: '发送者', dataIndex: 'sender', width: 140 },
    { title: '内容', dataIndex: 'content', width: 260 },
    { title: '风控状态', dataIndex: 'status', width: 120 },
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
        <Form.Item name="content">
          <Input allowClear placeholder="弹幕内容" />
        </Form.Item>
        <Form.Item name="room">
          <Select allowClear options={buildOptions(rows, 'room')} placeholder="直播间" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '正常', label: '正常', count: rows.filter((item) => item.status === '正常').length },
          { key: '待复核', label: '待复核', count: rows.filter((item) => item.status === '待复核').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<DanmakuRow>
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

      <Drawer open={selected != null} title="弹幕详情" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="直播间">{selected.room}</Descriptions.Item>
            <Descriptions.Item label="发送者">{selected.sender}</Descriptions.Item>
            <Descriptions.Item label="内容">{selected.content}</Descriptions.Item>
            <Descriptions.Item label="风控状态">{selected.status}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
