import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Space, Tag, Typography } from 'antd';

export function ModuleCard({
  title,
  description,
  active,
  onOpen,
}: {
  title: string;
  description: string;
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
      </Space>

      <div>
        <Typography.Title level={4}>{title}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {description}
        </Typography.Paragraph>
      </div>

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
