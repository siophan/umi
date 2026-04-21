import { Card, Col, Row, Statistic } from 'antd';

import type { DashboardStatItem } from '../lib/admin-dashboard';

interface AdminDashboardStatGridProps {
  items: DashboardStatItem[];
  loading: boolean;
}

export function AdminDashboardStatGrid({
  items,
  loading,
}: AdminDashboardStatGridProps) {
  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col key={item.key} xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title={item.title} value={item.value} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

