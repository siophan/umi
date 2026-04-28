import { Line } from '@ant-design/plots';
import { Card, Col, Empty, List, Progress, Row, Skeleton, Tag, Typography } from 'antd';

import type { AdminDashboardStats } from '../lib/api/dashboard';
import { formatAmount, formatDateTime, formatNumber, productStatusMeta } from '../lib/format';
import { ratio } from '../lib/admin-dashboard';

interface AdminDashboardContentPanelsProps {
  dashboardUnavailable: boolean;
  loading: boolean;
  stats: AdminDashboardStats;
}

const TREND_SERIES_COLORS = ['#1677ff', '#fa8c16', '#52c41a', '#722ed1'];
const TREND_SERIES_ORDER = ['投注笔数', '订单数', '新增用户', 'GMV (元)'] as const;

const QUEUE_TONE_COLOR: Record<'processing' | 'warning' | 'error', string> = {
  processing: 'blue',
  warning: 'orange',
  error: 'red',
};

function renderDashboardSection(
  dashboardUnavailable: boolean,
  loading: boolean,
  children: React.ReactNode,
) {
  if (dashboardUnavailable) {
    return (
      <Empty
        description="仪表盘数据暂不可用"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return children;
}

function buildTrendChartData(trend: AdminDashboardStats['trend']) {
  return trend.flatMap((item) => [
    { date: item.date, type: TREND_SERIES_ORDER[0], value: item.bets },
    { date: item.date, type: TREND_SERIES_ORDER[1], value: item.orders },
    { date: item.date, type: TREND_SERIES_ORDER[2], value: item.users },
    { date: item.date, type: TREND_SERIES_ORDER[3], value: Math.round(item.gmv / 100) },
  ]);
}

export function AdminDashboardContentPanels({
  dashboardUnavailable,
  loading,
  stats,
}: AdminDashboardContentPanelsProps) {
  const totalOrderDistribution = stats.orderDistribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const totalGuessCategories = stats.guessCategories.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const trendChartData = buildTrendChartData(stats.trend);
  const trendCardExtra = dashboardUnavailable ? null : (
    <Tag color="blue">数据生成 {formatDateTime(stats.generatedAt)}</Tag>
  );

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="近 7 日趋势" extra={trendCardExtra}>
            {renderDashboardSection(
              dashboardUnavailable,
              loading,
              stats.trend.length === 0 ? (
                <Empty description="暂无趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Line
                  data={trendChartData}
                  xField="date"
                  yField="value"
                  colorField="type"
                  shapeField="smooth"
                  height={320}
                  scale={{
                    color: {
                      domain: TREND_SERIES_ORDER,
                      range: TREND_SERIES_COLORS,
                    },
                  }}
                  legend={{ color: { position: 'top', itemMarker: 'circle' } }}
                  axis={{
                    y: {
                      labelFormatter: (value: number | string) =>
                        formatNumber(Number(value)),
                    },
                  }}
                  point={{ shape: 'circle', size: 3 }}
                  tooltip={{
                    items: [
                      {
                        channel: 'y',
                        valueFormatter: (value: number) => formatNumber(value),
                      },
                    ],
                  }}
                />
              ),
            )}
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <div style={{ display: 'grid', gap: 16, width: '100%' }}>
            <Card title="待处理队列">
              {renderDashboardSection(
                dashboardUnavailable,
                loading,
                <List
                  dataSource={stats.pendingQueues}
                  locale={{ emptyText: <Empty description="暂无待处理事项" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
                            <Typography.Text strong>{item.title}</Typography.Text>
                            <Tag color={QUEUE_TONE_COLOR[item.tone] ?? 'default'}>
                              {formatNumber(item.count)}
                            </Tag>
                          </div>
                        }
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />,
              )}
            </Card>

            <Card title="订单状态分布">
              {renderDashboardSection(
                dashboardUnavailable,
                loading,
                <div style={{ display: 'grid', gap: 12, width: '100%' }}>
                  {stats.orderDistribution.length === 0 ? (
                    <Empty description="暂无订单分布" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : stats.orderDistribution.map((item) => (
                    <div key={item.type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text>{item.type}</Typography.Text>
                        <Typography.Text>{formatNumber(item.value)}</Typography.Text>
                      </div>
                      <Progress percent={ratio(item.value, totalOrderDistribution)} showInfo={false} />
                    </div>
                  ))}
                </div>,
              )}
            </Card>

            <Card title="竞猜分类分布">
              {renderDashboardSection(
                dashboardUnavailable,
                loading,
                <div style={{ display: 'grid', gap: 12, width: '100%' }}>
                  {stats.guessCategories.length === 0 ? (
                    <Empty description="暂无分类分布" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : stats.guessCategories.map((item) => (
                    <div key={item.type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text>{item.type}</Typography.Text>
                        <Typography.Text>{formatNumber(item.value)}</Typography.Text>
                      </div>
                      <Progress percent={ratio(item.value, totalGuessCategories)} showInfo={false} strokeColor="#722ed1" />
                    </div>
                  ))}
                </div>,
              )}
            </Card>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="热门竞猜">
            {renderDashboardSection(
              dashboardUnavailable,
              loading,
              <List
                dataSource={stats.hotGuesses}
                locale={{ emptyText: <Empty description="暂无热门竞猜" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
                          <Tag color={index < 3 ? 'gold' : 'default'}>#{index + 1}</Tag>
                          <Typography.Text strong>{item.title}</Typography.Text>
                        </div>
                      }
                      description={
                        <div style={{ display: 'grid', gap: 4 }}>
                          <Typography.Text type="secondary">
                            {item.category} · {formatNumber(item.participants)} 人参与 · 奖池 {formatAmount(item.poolAmount)}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            截止 {formatDateTime(item.endTime)}
                          </Typography.Text>
                        </div>
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
            {renderDashboardSection(
              dashboardUnavailable,
              loading,
              <List
                dataSource={stats.hotProducts}
                locale={{ emptyText: <Empty description="暂无热销商品" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                renderItem={(item, index) => {
                  const meta = productStatusMeta[item.status as keyof typeof productStatusMeta];
                  return (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
                            <Tag color={index < 3 ? 'blue' : 'default'}>#{index + 1}</Tag>
                            <Typography.Text strong>{item.name}</Typography.Text>
                            <Tag color={meta?.color ?? 'default'}>{meta?.label ?? item.status}</Tag>
                          </div>
                        }
                        description={
                          <Typography.Text type="secondary">
                            销量 {formatNumber(item.sales)} · 库存 {formatNumber(item.stock)} · 售价 {formatAmount(item.price)}
                          </Typography.Text>
                        }
                      />
                    </List.Item>
                  );
                }}
              />,
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}
