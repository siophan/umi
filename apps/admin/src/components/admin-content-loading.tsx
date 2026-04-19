import { Card, Col, Row, Skeleton, Space } from 'antd';

export function AdminContentLoading() {
  return (
    <div className="page-loading-skeleton">
      <Row gutter={[16, 16]}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Col key={index} xs={24} md={12} xl={6}>
            <Card bordered={false}>
              <Skeleton active paragraph={{ rows: 2 }} title={{ width: '48%' }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card bordered={false}>
            <Skeleton active paragraph={{ rows: 5 }} title={{ width: 96 }} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card bordered={false}>
            <Skeleton active paragraph={{ rows: 6 }} title={{ width: 108 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card bordered={false}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} size="small">
                  <Skeleton active paragraph={{ rows: 4 }} title={{ width: '36%' }} />
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card bordered={false}>
              <Skeleton active paragraph={{ rows: 4 }} title={{ width: 128 }} />
            </Card>
            <Card bordered={false}>
              <Skeleton active paragraph={{ rows: 4 }} title={{ width: 128 }} />
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
