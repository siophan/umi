import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { AdminCommunityPostItem } from '@umi/shared';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Image,
  Input,
  Popconfirm,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import { AdminSearchPanel } from '../components/admin-list-controls';
import {
  deleteAdminCommunityPost,
  fetchAdminCommunityPosts,
} from '../lib/api/content';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDateTime, formatNumber } from '../lib/format';

interface CommunityPostsPageProps {
  refreshToken?: number;
}

type CommunityPostFilters = {
  title?: string;
  author?: string;
  tag?: string;
};

function getTypeColor(type: AdminCommunityPostItem['type']) {
  if (type === 'guess') return 'processing';
  if (type === 'repost') return 'warning';
  return 'default';
}

export function CommunityPostsPage({ refreshToken = 0 }: CommunityPostsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<CommunityPostFilters>();
  const [rows, setRows] = useState<AdminCommunityPostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<CommunityPostFilters>({});
  const [selected, setSelected] = useState<AdminCommunityPostItem | null>(null);
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadPosts() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminCommunityPosts(filters);
        if (!alive) {
          return;
        }
        setRows(result.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows([]);
        setIssue(error instanceof Error ? error.message : '帖子列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      alive = false;
    };
  }, [actionSeed, filters, refreshToken]);

  async function handleDelete(record: AdminCommunityPostItem) {
    try {
      await deleteAdminCommunityPost(record.id);
      messageApi.success('帖子已删除');
      setSelected((current) => (current?.id === record.id ? null : current));
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '删除帖子失败');
    }
  }

  const columns: ProColumns<AdminCommunityPostItem>[] = [
    {
      title: '帖子',
      width: 320,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title || '未命名动态'}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.content || '-'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '作者',
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
      title: '类型',
      width: 120,
      render: (_, record) => <Tag color={getTypeColor(record.type)}>{record.typeLabel}</Tag>,
    },
    {
      title: '标签',
      width: 120,
      render: (_, record) => (record.tag ? <Tag>{record.tag}</Tag> : '-'),
    },
    {
      title: '互动',
      width: 160,
      render: (_, record) => (
        <div>
          <Typography.Text>点赞 {formatNumber(record.likeCount)}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            评论 {formatNumber(record.commentCount)} / 转发 {formatNumber(record.repostCount)}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '发布时间',
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
            title="确认删除该帖子？"
            description="删除后帖子、评论和对应互动关系会一起清理。"
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
        <Form.Item name="title">
          <Input allowClear placeholder="帖子标题" />
        </Form.Item>
        <Form.Item name="author">
          <Input allowClear placeholder="作者" />
        </Form.Item>
        <Form.Item name="tag">
          <Input allowClear placeholder="标签" />
        </Form.Item>
      </AdminSearchPanel>

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminCommunityPostItem>
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
        title="帖子详情"
        width={560}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="帖子标题">
                {selected.title || '未命名动态'}
              </Descriptions.Item>
              <Descriptions.Item label="作者">
                {selected.authorName}
              </Descriptions.Item>
              <Descriptions.Item label="作者 UID">
                {selected.authorUid || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                {selected.typeLabel}
              </Descriptions.Item>
              <Descriptions.Item label="可见范围">
                {selected.scopeLabel}
              </Descriptions.Item>
              <Descriptions.Item label="标签">
                {selected.tag || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联竞猜">
                {selected.guessTitle || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="点赞 / 评论 / 转发">
                {`${formatNumber(selected.likeCount)} / ${formatNumber(selected.commentCount)} / ${formatNumber(selected.repostCount)}`}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(selected.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatDateTime(selected.updatedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="正文">
                {selected.content || '-'}
              </Descriptions.Item>
            </Descriptions>

            {selected.images.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <Typography.Text strong>图片</Typography.Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {selected.images.map((image) => (
                    <Image
                      key={image}
                      src={image}
                      width={96}
                      height={96}
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
