import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface CommunityCommentsPageProps {
  refreshToken?: number;
}

type CommunityCommentRow = {
  id: string;
  content: string;
  author: string;
  target: string;
  status: '正常' | '复核中';
};

type CommunityCommentFilters = {
  content?: string;
  author?: string;
};

const rows: CommunityCommentRow[] = [
  { id: 'comment-1', content: '这个竞猜太刺激了', author: '用户 1003', target: 'Panda 竞猜晒单', status: '正常' },
  { id: 'comment-2', content: '请尽快发货', author: '用户 1018', target: '品牌上新开箱', status: '复核中' },
];

export function CommunityCommentsPage({ refreshToken = 0 }: CommunityCommentsPageProps) {
  const [searchForm] = Form.useForm<CommunityCommentFilters>();
  const [filters, setFilters] = useState<CommunityCommentFilters>({});
  const [status, setStatus] = useState<'all' | CommunityCommentRow['status']>('all');
  const [selected, setSelected] = useState<CommunityCommentRow | null>(null);

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.content && !record.content.toLowerCase().includes(filters.content.trim().toLowerCase())) {
          return false;
        }
        if (filters.author && !record.author.toLowerCase().includes(filters.author.trim().toLowerCase())) {
          return false;
        }
        return true;
      }),
    [filters.author, filters.content, status],
  );

  const columns: ProColumns<CommunityCommentRow>[] = [
    { title: '评论内容', dataIndex: 'content', width: 300 },
    { title: '评论人', dataIndex: 'author', width: 160 },
    { title: '评论对象', dataIndex: 'target', width: 220 },
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
        <Form.Item name="content">
          <Input allowClear placeholder="评论内容" />
        </Form.Item>
        <Form.Item name="author">
          <Input allowClear placeholder="评论人" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '正常', label: '正常', count: rows.filter((item) => item.status === '正常').length },
          { key: '复核中', label: '复核中', count: rows.filter((item) => item.status === '复核中').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<CommunityCommentRow>
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

      <Drawer open={selected != null} title="评论详情" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="评论内容">{selected.content}</Descriptions.Item>
            <Descriptions.Item label="评论人">{selected.author}</Descriptions.Item>
            <Descriptions.Item label="评论对象">{selected.target}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
