import type { GuessSummary } from '@joy/shared';
import type { TableColumnsType } from 'antd';

import { Card, Descriptions, Drawer, List, Progress, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

import { formatAmount, formatDateTime, guessReviewStatusMeta, guessStatusMeta } from '../lib/format';

interface GuessesPageProps {
  guesses: GuessSummary[];
  loading: boolean;
}

export function GuessesPage({ guesses, loading }: GuessesPageProps) {
  const [selected, setSelected] = useState<GuessSummary | null>(null);

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
      <Space wrap size={16}>
        <Card className="metric-card">
          <Statistic
            title="进行中"
            value={guesses.filter((guess) => guess.status === 'active').length}
          />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="待审核"
            value={guesses.filter((guess) => guess.reviewStatus === 'pending').length}
          />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="已结算"
            value={guesses.filter((guess) => guess.status === 'settled').length}
          />
        </Card>
      </Space>

      <Card title="竞猜管理">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={guesses}
          loading={loading}
          pagination={{ pageSize: 6 }}
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
