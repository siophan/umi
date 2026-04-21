import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { AdminCommunityCommentItem } from '@umi/shared';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import { AdminSearchPanel } from '../components/admin-list-controls';
import {
  deleteAdminCommunityComment,
  fetchAdminCommunityComments,
} from '../lib/api/content';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDateTime, formatNumber } from '../lib/format';

interface CommunityCommentsPageProps {
  refreshToken?: number;
}

type CommunityCommentFilters = {
  content?: string;
  author?: string;
  postTitle?: string;
};

export function CommunityCommentsPage({ refreshToken = 0 }: CommunityCommentsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<CommunityCommentFilters>();
  const [rows, setRows] = useState<AdminCommunityCommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<CommunityCommentFilters>({});
  const [selected, setSelected] = useState<AdminCommunityCommentItem | null>(null);
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadComments() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminCommunityComments(filters);
        if (!alive) {
          return;
        }
        setRows(result.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows([]);
        setIssue(error instanceof Error ? error.message : '评论列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      alive = false;
    };
  }, [actionSeed, filters, refreshToken]);

  async function handleDelete(record: AdminCommunityCommentItem) {
    try {
      await deleteAdminCommunityComment(record.id);
      messageApi.success('评论已删除');
      setSelected((current) => (current?.id === record.id ? null : current));
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '删除评论失败');
    }
  }

  const columns: ProColumns<AdminCommunityCommentItem>[] = [
    {
      title: '评论内容',
      dataIndex: 'content',
      width: 360,
      render: (value) => (
        <Typography.Text ellipsis style={{ maxWidth: 320 }}>
          {value || '-'}
        </Typography.Text>
      ),
    },
    {
      title: '评论人',
      width: 180,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.authorName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.authorUid || `用户 ID ${record.authorId}`}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '所属帖子',
      dataIndex: 'targetPostTitle',
      width: 240,
      render: (value) => value || '-',
    },
    {
      title: '互动',
      width: 140,
      render: (_, record) => (
        <div>
          <Typography.Text>点赞 {formatNumber(record.likeCount)}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            回复 {formatNumber(record.replyCount)}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => formatDateTime(record.createdAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
          <Popconfirm
            title="确认删除该评论？"
            description="删除后该评论及其直接回复会一起清理。"
            okText="确认"
            cancelText="取消"
            onConfirm={() => void handleDelete(record)}
          >
            <Button danger size="small" type="link">
              删除
            </Button>
          </Popconfirm>
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
        }}
      >
        <Form.Item name="content">
          <Input allowClear placeholder="评论内容" />
        </Form.Item>
        <Form.Item name="author">
          <Input allowClear placeholder="评论人" />
        </Form.Item>
        <Form.Item name="postTitle">
          <Input allowClear placeholder="所属帖子" />
        </Form.Item>
      </AdminSearchPanel>

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminCommunityCommentItem>
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
        title="评论详情"
        width={520}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="评论内容">{selected.content}</Descriptions.Item>
            <Descriptions.Item label="评论人">{selected.authorName}</Descriptions.Item>
            <Descriptions.Item label="评论人 UID">
              {selected.authorUid || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="所属帖子">
              {selected.targetPostTitle || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="父评论">
              {selected.parentId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="点赞数">
              {formatNumber(selected.likeCount)}
            </Descriptions.Item>
            <Descriptions.Item label="回复数">
              {formatNumber(selected.replyCount)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(selected.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
