import { Alert, Card, Col, Empty, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';

import type { AdminDashboardStats } from '../lib/admin-data';
import { formatAmount, formatDateTime, formatNumber, productStatusMeta } from '../lib/format';

interface DashboardPageProps {
  generatedAt: string;
  dashboardIssue?: string | null;
  loading: boolean;
  stats: AdminDashboardStats;
}

function ratio(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function DashboardPage({
  generatedAt,
  dashboardIssue,
  loading,
  stats,
}: DashboardPageProps) {
  const dashboardUnavailable = Boolean(dashboardIssue);
  const maxTrendBets = Math.max(...stats.trend.map((item) => item.bets), 1);
  const maxTrendOrders = Math.max(...stats.trend.map((item) => item.orders), 1);
  const maxTrendUsers = Math.max(...stats.trend.map((item) => item.users), 1);
  const maxTrendGmv = Math.max(...stats.trend.map((item) => item.gmv), 1);
  const totalOrderDistribution = stats.orderDistribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const totalGuessCategories = stats.guessCategories.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  function displayValue(value: string) {
    return dashboardUnavailable ? '--' : value;
  }

  function renderSection(children: ReactNode) {
    if (dashboardUnavailable) {
      return (
        <Empty
          description="仪表盘数据暂不可用"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return children;
  }

  return (
    <div className="page-stack">
      {dashboardUnavailable ? (
        <Alert
          showIcon
          type="error"
          message="仪表盘数据暂不可用"
          description={dashboardIssue}
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="总用户数" value={displayValue(formatNumber(stats.users))} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="在售商品数" value={displayValue(formatNumber(stats.products))} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="进行中竞猜" value={displayValue(formatNumber(stats.activeGuesses))} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="订单总量" value={displayValue(formatNumber(stats.orders))} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="今日新增用户" value={displayValue(formatNumber(stats.todayUsers))} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="今日下注笔数" value={displayValue(formatNumber(stats.todayBets))} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="今日订单数" value={displayValue(formatNumber(stats.todayOrders))} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="今日 GMV" value={displayValue(formatAmount(stats.todayGmv))} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="近 7 日趋势"
            extra={<Tag color="blue">数据生成 {formatDateTime(generatedAt)}</Tag>}
          >
            {renderSection(
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {stats.trend.length === 0 ? (
                  <Empty description="暂无趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : stats.trend.map((item) => (
                  <Card key={item.date} size="small">
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text strong>{item.date}</Typography.Text>
                        <Typography.Text type="secondary">
                          GMV {formatAmount(item.gmv)}
                        </Typography.Text>
                      </Space>

                      <div>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text type="secondary">投注</Typography.Text>
                          <Typography.Text>{formatNumber(item.bets)}</Typography.Text>
                        </Space>
                        <Progress percent={ratio(item.bets, maxTrendBets)} showInfo={false} strokeColor="#1677ff" />
                      </div>

                      <div>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text type="secondary">订单</Typography.Text>
                          <Typography.Text>{formatNumber(item.orders)}</Typography.Text>
                        </Space>
                        <Progress percent={ratio(item.orders, maxTrendOrders)} showInfo={false} strokeColor="#fa8c16" />
                      </div>

                      <div>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text type="secondary">新增用户</Typography.Text>
                          <Typography.Text>{formatNumber(item.users)}</Typography.Text>
                        </Space>
                        <Progress percent={ratio(item.users, maxTrendUsers)} showInfo={false} strokeColor="#52c41a" />
                      </div>

                      <div>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text type="secondary">GMV</Typography.Text>
                          <Typography.Text>{formatAmount(item.gmv)}</Typography.Text>
                        </Space>
                        <Progress percent={ratio(item.gmv, maxTrendGmv)} showInfo={false} strokeColor="#722ed1" />
                      </div>
                    </Space>
                  </Card>
                ))}
              </Space>,
            )}
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card title="待处理队列">
              {renderSection(
                <List
                  dataSource={stats.pendingQueues}
                  locale={{ emptyText: <Empty description="暂无待处理事项" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Typography.Text strong>{item.title}</Typography.Text>
                            <Tag color={item.tone}>{formatNumber(item.count)}</Tag>
                          </Space>
                        }
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />,
              )}
            </Card>

            <Card title="订单状态分布">
              {renderSection(
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {stats.orderDistribution.length === 0 ? (
                    <Empty description="暂无订单分布" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : stats.orderDistribution.map((item) => (
                    <div key={item.type}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text>{item.type}</Typography.Text>
                        <Typography.Text>{formatNumber(item.value)}</Typography.Text>
                      </Space>
                      <Progress percent={ratio(item.value, totalOrderDistribution)} showInfo={false} />
                    </div>
                  ))}
                </Space>,
              )}
            </Card>

            <Card title="竞猜分类分布">
              {renderSection(
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {stats.guessCategories.length === 0 ? (
                    <Empty description="暂无分类分布" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : stats.guessCategories.map((item) => (
                    <div key={item.type}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text>{item.type}</Typography.Text>
                        <Typography.Text>{formatNumber(item.value)}</Typography.Text>
                      </Space>
                      <Progress percent={ratio(item.value, totalGuessCategories)} showInfo={false} strokeColor="#722ed1" />
                    </div>
                  ))}
                </Space>,
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="热门竞猜">
            {renderSection(
              <List
                dataSource={stats.hotGuesses}
                locale={{ emptyText: <Empty description="暂无热门竞猜" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={index < 3 ? 'gold' : 'default'}>#{index + 1}</Tag>
                          <Typography.Text strong>{item.title}</Typography.Text>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4}>
                          <Typography.Text type="secondary">
                            {item.category} · {formatNumber(item.participants)} 人参与 · 奖池 {formatAmount(item.poolAmount)}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            截止 {formatDateTime(item.endTime)}
                          </Typography.Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />,
            )}
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="热销商品">
            {renderSection(
              <List
                dataSource={stats.hotProducts}
                locale={{ emptyText: <Empty description="暂无热销商品" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={index < 3 ? 'blue' : 'default'}>#{index + 1}</Tag>
                          <Typography.Text strong>{item.name}</Typography.Text>
                          <Tag color={productStatusMeta[item.status as keyof typeof productStatusMeta]?.color ?? 'default'}>
                            {productStatusMeta[item.status as keyof typeof productStatusMeta]?.label ?? item.status}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Typography.Text type="secondary">
                          销量 {formatNumber(item.sales)} · 库存 {formatNumber(item.stock)} · 售价 {formatAmount(item.price)}
                        </Typography.Text>
                      }
                    />
                  </List.Item>
                )}
              />,
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
