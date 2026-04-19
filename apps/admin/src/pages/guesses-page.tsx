import type { GuessSummary } from '@joy/shared';
import type { TableColumnsType } from 'antd';

import { Alert, Card, Descriptions, Drawer, Form, Input, List, Progress, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminCategoryItem } from '../lib/admin-data';
import { fetchAdminCategories, fetchAdminGuesses } from '../lib/api/catalog';
import { formatAmount, formatDateTime, guessReviewStatusMeta, guessStatusMeta } from '../lib/format';

interface GuessesPageProps {
  refreshToken?: number;
}

export function GuessesPage({ refreshToken = 0 }: GuessesPageProps) {
  const [selected, setSelected] = useState<GuessSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<GuessSummary[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [filters, setFilters] = useState<{
    title?: string;
    category?: string;
    brand?: string;
  }>({});
  const [status, setStatus] = useState<'all' | 'pending_review' | GuessSummary['status']>('all');
  const [form] = Form.useForm<{ title?: string; category?: string; brand?: string }>();

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const [guessesResult, categoriesResult] = await Promise.all([
          fetchAdminGuesses(),
          fetchAdminCategories(),
        ]);
        if (!alive) {
          return;
        }
        setGuesses(guessesResult.items);
        setCategories(categoriesResult.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setGuesses([]);
        setCategories([]);
        setIssue(error instanceof Error ? error.message : '竞猜列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const filteredGuesses = useMemo(() => {
    return guesses.filter((guess) => {
      if (status === 'pending_review' && guess.reviewStatus !== 'pending') {
        return false;
      }
      if (status !== 'all' && status !== 'pending_review' && guess.status !== status) {
        return false;
      }
      if (
        filters.title &&
        !guess.title.toLowerCase().includes(filters.title.trim().toLowerCase())
      ) {
        return false;
      }
      if (filters.category && guess.category !== filters.category) {
        return false;
      }
      if (filters.brand && guess.product.brand !== filters.brand) {
        return false;
      }
      return true;
    });
  }, [filters, guesses, status]);

  const categoryOptions = useMemo(
    () => {
      const fullCategoryOptions = categories
        .filter((item) => item.bizType === 'guess' && item.status === 'active')
        .map((item) => ({
          label: item.name,
          value: item.name,
        }));

      if (fullCategoryOptions.length > 0) {
        return fullCategoryOptions;
      }

      return Array.from(new Set(guesses.map((item) => item.category).filter(Boolean))).map((value) => ({
        label: value,
        value,
      }));
    },
    [categories, guesses],
  );

  const brandOptions = useMemo(
    () =>
      Array.from(
        new Set(guesses.map((item) => item.product.brand).filter(Boolean)),
      ).map((value) => ({
        label: value,
        value,
      })),
    [guesses],
  );

  const columns: TableColumnsType<GuessSummary> = [
    {
      title: '竞猜标题',
      dataIndex: 'title',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text type="secondary">{record.product.name}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: GuessSummary['status']) => (
        <Tag color={guessStatusMeta[value].color}>{guessStatusMeta[value].label}</Tag>
      ),
    },
    {
      title: '审核',
      dataIndex: 'reviewStatus',
      render: (value: GuessSummary['reviewStatus']) => (
        <Tag color={guessReviewStatusMeta[value].color}>
          {guessReviewStatusMeta[value].label}
        </Tag>
      ),
    },
    {
      title: '参与人数',
      render: (_, record) =>
        record.options.reduce((sum, option) => sum + option.voteCount, 0),
    },
    {
      title: '截止时间',
      dataIndex: 'endTime',
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={form}
        onSearch={() => {
          const values = form.getFieldsValue();
          setFilters(values);
        }}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="title">
          <Input placeholder="竞猜标题" allowClear />
        </Form.Item>
        <Form.Item name="category">
          <Select placeholder="分类" allowClear options={categoryOptions} />
        </Form.Item>
        <Form.Item name="brand">
          <Select placeholder="品牌" allowClear options={brandOptions} />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: guesses.length },
          { key: 'pending_review', label: '待审核', count: guesses.filter((item) => item.reviewStatus === 'pending').length },
          { key: 'active', label: '进行中', count: guesses.filter((item) => item.status === 'active').length },
          { key: 'settled', label: '已结算', count: guesses.filter((item) => item.status === 'settled').length },
          { key: 'cancelled', label: '已取消', count: guesses.filter((item) => item.status === 'cancelled').length },
        ]}
        onChange={(key) => setStatus(key as 'all' | 'pending_review' | GuessSummary['status'])}
      />
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredGuesses}
          loading={loading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => setSelected(record),
          })}
        />
      </Card>

      <Drawer
        open={selected != null}
        width={440}
        title={selected?.title}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="关联商品">
                {selected.product.name}
              </Descriptions.Item>
              <Descriptions.Item label="品牌">
                {selected.product.brand}
              </Descriptions.Item>
              <Descriptions.Item label="奖品价值">
                {formatAmount(selected.product.price)}
              </Descriptions.Item>
              <Descriptions.Item label="竞猜成本">
                {formatAmount(selected.product.guessPrice)}
              </Descriptions.Item>
              <Descriptions.Item label="审核状态">
                <Tag color={guessReviewStatusMeta[selected.reviewStatus].color}>
                  {guessReviewStatusMeta[selected.reviewStatus].label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Card title="选项热度" size="small">
              <List
                dataSource={selected.options}
                renderItem={(option) => {
                  const totalVotes = selected.options.reduce(
                    (sum, item) => sum + item.voteCount,
                    0,
                  );
                  const percent =
                    totalVotes === 0 ? 0 : (option.voteCount / totalVotes) * 100;

                  return (
                    <List.Item>
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Typography.Text>{option.optionText}</Typography.Text>
                          <Typography.Text type="secondary">
                            赔率 {option.odds.toFixed(2)} / {option.voteCount} 票
                          </Typography.Text>
                        </Space>
                        <Progress
                          percent={Number(percent.toFixed(1))}
                          status={option.isResult ? 'success' : 'active'}
                        />
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
}
