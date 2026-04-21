import { Card, Col, Empty, List, Progress, Row, Tag, Typography } from 'antd';

import type { AdminDashboardStats } from '../lib/api/dashboard';
import { formatAmount, formatDateTime, formatNumber, productStatusMeta } from '../lib/format';
import { ratio } from '../lib/admin-dashboard';

interface AdminDashboardContentPanelsProps {
  dashboardUnavailable: boolean;
  stats: AdminDashboardStats;
}

function renderDashboardSection(
  dashboardUnavailable: boolean,
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

  return children;
}

export function AdminDashboardContentPanels({
  dashboardUnavailable,
  stats,
}: AdminDashboardContentPanelsProps) {
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

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="近 7 日趋势"
            extra={<Tag color="blue">数据生成 {formatDateTime(stats.generatedAt)}</Tag>}
          >
            {renderDashboardSection(
              dashboardUnavailable,
              <div style={{ display: 'grid', gap: 12, width: '100%' }}>
                {stats.trend.length === 0 ? (
                  <Empty description="暂无趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : stats.trend.map((item) => (
                  <Card key={item.date} size="small">
                    <div style={{ display: 'grid', gap: 8, width: '100%' }}>
                      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text strong>{item.date}</Typography.Text>
                        <Typography.Text type="secondary">
                          GMV {formatAmount(item.gmv)}
                        </Typography.Text>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text type="secondary">投注</Typography.Text>
                          <Typography.Text>{formatNumber(item.bets)}</Typography.Text>
                        </div>
                        <Progress percent={ratio(item.bets, maxTrendBets)} showInfo={false} strokeColor="#1677ff" />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text type="secondary">订单</Typography.Text>
                          <Typography.Text>{formatNumber(item.orders)}</Typography.Text>
                        </div>
                        <Progress percent={ratio(item.orders, maxTrendOrders)} showInfo={false} strokeColor="#fa8c16" />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text type="secondary">新增用户</Typography.Text>
                          <Typography.Text>{formatNumber(item.users)}</Typography.Text>
                        </div>
                        <Progress percent={ratio(item.users, maxTrendUsers)} showInfo={false} strokeColor="#52c41a" />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text type="secondary">GMV</Typography.Text>
                          <Typography.Text>{formatAmount(item.gmv)}</Typography.Text>
                        </div>
                        <Progress percent={ratio(item.gmv, maxTrendGmv)} showInfo={false} strokeColor="#722ed1" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>,
            )}
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <div style={{ display: 'grid', gap: 16, width: '100%' }}>
            <Card title="待处理队列">
              {renderDashboardSection(
                dashboardUnavailable,
                <List
                  dataSource={stats.pendingQueues}
                  locale={{ emptyText: <Empty description="暂无待处理事项" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
                            <Typography.Text strong>{item.title}</Typography.Text>
                            <Tag color={item.tone}>{formatNumber(item.count)}</Tag>
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
              <List
                dataSource={stats.hotProducts}
                locale={{ emptyText: <Empty description="暂无热销商品" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
                          <Tag color={index < 3 ? 'blue' : 'default'}>#{index + 1}</Tag>
                          <Typography.Text strong>{item.name}</Typography.Text>
                          <Tag color={productStatusMeta[item.status as keyof typeof productStatusMeta]?.color ?? 'default'}>
                            {productStatusMeta[item.status as keyof typeof productStatusMeta]?.label ?? item.status}
                          </Tag>
                        </div>
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
    </>
  );
}

