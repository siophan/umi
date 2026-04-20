import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface CommunityReportsPageProps {
  refreshToken?: number;
}

type CommunityReportRow = {
  id: string;
  target: string;
  reporter: string;
  reason: string;
  status: '待处理' | '处理中';
};

type CommunityReportFilters = {
  reason?: string;
  reporter?: string;
};

const rows: CommunityReportRow[] = [
  { id: 'report-1', target: '帖子 post-1', reporter: '用户 1033', reason: '疑似广告', status: '待处理' },
  { id: 'report-2', target: '评论 comment-2', reporter: '用户 1109', reason: '辱骂', status: '处理中' },
];

export function CommunityReportsPage({ refreshToken = 0 }: CommunityReportsPageProps) {
  const [searchForm] = Form.useForm<CommunityReportFilters>();
  const [filters, setFilters] = useState<CommunityReportFilters>({});
  const [status, setStatus] = useState<'all' | CommunityReportRow['status']>('all');
  const [selected, setSelected] = useState<CommunityReportRow | null>(null);

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.reason && !record.reason.toLowerCase().includes(filters.reason.trim().toLowerCase())) {
          return false;
        }
        if (filters.reporter && !record.reporter.toLowerCase().includes(filters.reporter.trim().toLowerCase())) {
          return false;
        }
        return true;
      }),
    [filters.reason, filters.reporter, status],
  );

  const columns: ProColumns<CommunityReportRow>[] = [
    { title: '举报对象', dataIndex: 'target', width: 220 },
    { title: '举报人', dataIndex: 'reporter', width: 160 },
    { title: '原因', dataIndex: 'reason', width: 220 },
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
        <Form.Item name="reason">
          <Input allowClear placeholder="举报原因" />
        </Form.Item>
        <Form.Item name="reporter">
          <Input allowClear placeholder="举报人" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '待处理', label: '待处理', count: rows.filter((item) => item.status === '待处理').length },
          { key: '处理中', label: '处理中', count: rows.filter((item) => item.status === '处理中').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<CommunityReportRow>
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

      <Drawer open={selected != null} title="举报详情" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="举报对象">{selected.target}</Descriptions.Item>
            <Descriptions.Item label="举报人">{selected.reporter}</Descriptions.Item>
            <Descriptions.Item label="原因">{selected.reason}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
