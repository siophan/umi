import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';

interface MarketingCheckinPageProps {
  refreshToken?: number;
}

type CheckinRow = {
  cycle: string;
  dailyCap: string;
  id: string;
  reward: string;
  status: '启用中' | '待上线';
  target: string;
  trigger: string;
};

type CheckinFilters = {
  cycle?: string;
  target?: string;
};

function statusColor(status: string) {
  return status.includes('启用') ? 'success' : 'default';
}

export function MarketingCheckinPage({ refreshToken = 0 }: MarketingCheckinPageProps) {
  const [searchForm] = Form.useForm<CheckinFilters>();
  const [filters, setFilters] = useState<CheckinFilters>({});
  const [status, setStatus] = useState<'all' | CheckinRow['status']>('all');
  const [selected, setSelected] = useState<CheckinRow | null>(null);

  const rows: CheckinRow[] = [
    { id: 'checkin-1', cycle: '连续 7 天', reward: '200 优米币', target: '全体用户', trigger: '每日首签发放', dailyCap: '不限', status: '启用中' },
    { id: 'checkin-2', cycle: '连续 30 天', reward: '随机免单券', target: '高活跃用户', trigger: '满足连续周期后发放', dailyCap: '500 份 / 日', status: '待上线' },
  ];

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.cycle && !record.cycle.toLowerCase().includes(filters.cycle.trim().toLowerCase())) {
          return false;
        }
        if (filters.target && record.target !== filters.target) {
          return false;
        }
        return true;
      }),
    [filters.cycle, filters.target, rows, status],
  );

  const columns: ProColumns<CheckinRow>[] = [
    { title: '签到周期', dataIndex: 'cycle', width: 180 },
    { title: '奖励', dataIndex: 'reward', width: 180 },
    { title: '目标人群', dataIndex: 'target', width: 160 },
    { title: '触发规则', dataIndex: 'trigger', width: 220 },
    { title: '日上限', dataIndex: 'dailyCap', width: 120 },
    { title: '状态', dataIndex: 'status', width: 120, render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
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
        <Form.Item name="cycle">
          <Input allowClear placeholder="签到周期" />
        </Form.Item>
        <Form.Item name="target">
          <Select allowClear options={buildOptions(rows as Array<Record<string, unknown>>, 'target')} placeholder="目标人群" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '启用中', label: '启用中', count: rows.filter((item) => item.status === '启用中').length },
          { key: '待上线', label: '待上线', count: rows.filter((item) => item.status === '待上线').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<CheckinRow>
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

      <Drawer open={selected != null} title="签到管理" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="签到周期">{selected.cycle}</Descriptions.Item>
            <Descriptions.Item label="奖励">{selected.reward}</Descriptions.Item>
            <Descriptions.Item label="目标人群">{selected.target}</Descriptions.Item>
            <Descriptions.Item label="触发规则">{selected.trigger}</Descriptions.Item>
            <Descriptions.Item label="日上限">{selected.dailyCap}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
