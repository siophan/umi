import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Descriptions, Drawer, Form, Input } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface CommunityPostsPageProps {
  refreshToken?: number;
}

type CommunityPostRow = {
  id: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  status: '已发布' | '待复核';
};

type CommunityPostFilters = {
  title?: string;
  author?: string;
};

const rows: CommunityPostRow[] = [
  { id: 'post-1', title: 'Panda 竞猜晒单', author: '用户 1001', likes: 128, comments: 24, status: '已发布' },
  { id: 'post-2', title: '品牌上新开箱', author: '用户 1008', likes: 92, comments: 13, status: '待复核' },
];

export function CommunityPostsPage({ refreshToken = 0 }: CommunityPostsPageProps) {
  const [searchForm] = Form.useForm<CommunityPostFilters>();
  const [filters, setFilters] = useState<CommunityPostFilters>({});
  const [status, setStatus] = useState<'all' | CommunityPostRow['status']>('all');
  const [selected, setSelected] = useState<CommunityPostRow | null>(null);

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.title && !record.title.toLowerCase().includes(filters.title.trim().toLowerCase())) {
          return false;
        }
        if (filters.author && !record.author.toLowerCase().includes(filters.author.trim().toLowerCase())) {
          return false;
        }
        return true;
      }),
    [filters.author, filters.title, status],
  );

  const columns: ProColumns<CommunityPostRow>[] = [
    { title: '帖子标题', dataIndex: 'title', width: 260 },
    { title: '作者', dataIndex: 'author', width: 160 },
    { title: '点赞', dataIndex: 'likes', width: 100 },
    { title: '评论', dataIndex: 'comments', width: 100 },
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
        <Form.Item name="title">
          <Input allowClear placeholder="帖子标题" />
        </Form.Item>
        <Form.Item name="author">
          <Input allowClear placeholder="作者" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '已发布', label: '已发布', count: rows.filter((item) => item.status === '已发布').length },
          { key: '待复核', label: '待复核', count: rows.filter((item) => item.status === '待复核').length },
        ]}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<CommunityPostRow>
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

      <Drawer open={selected != null} title="帖子详情" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="帖子标题">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="作者">{selected.author}</Descriptions.Item>
            <Descriptions.Item label="点赞">{selected.likes}</Descriptions.Item>
            <Descriptions.Item label="评论">{selected.comments}</Descriptions.Item>
            <Descriptions.Item label="状态">{selected.status}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
