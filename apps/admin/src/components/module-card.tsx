import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Space, Tag, Typography } from 'antd';

export function ModuleCard({
  title,
  description,
  owner,
  status,
  active,
  onOpen,
}: {
  title: string;
  description: string;
  owner: string;
  status: string;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <Card
      className="module-card"
      hoverable
      onClick={onOpen}
      styles={{
        body: {
          display: 'grid',
          gap: 16,
        },
      }}
    >
      <Space>
        <Tag color={active ? 'processing' : 'default'}>
          {active ? '当前查看' : '模块'}
        </Tag>
        <Tag>{status}</Tag>
      </Space>

      <div>
        <Typography.Title level={4}>{title}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {description}
        </Typography.Paragraph>
      </div>

      <Space className="module-card-meta">
        <Typography.Text type="secondary">Owner</Typography.Text>
        <Typography.Text>{owner}</Typography.Text>
      </Space>

      <Button
        type={active ? 'primary' : 'default'}
        block
        icon={<ArrowRightOutlined />}
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
      >
        {active ? '当前模块' : '进入模块'}
      </Button>
    </Card>
  );
}
