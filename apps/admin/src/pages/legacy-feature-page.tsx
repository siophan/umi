import type { ReactNode } from 'react';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useMemo, useState } from 'react';

export type LegacyMetric = {
  label: string;
  value: number | string;
  formatter?: (value: number | string) => ReactNode;
};

export type LegacyInfoCard = {
  title: string;
  items: string[];
};

export type LegacyFilterOption<TRecord> = {
  label: string;
  value: string;
  predicate: (record: TRecord) => boolean;
};

export type LegacyDetailField<TRecord> = {
  label: string;
  render: (record: TRecord) => ReactNode;
};

export type LegacyTablePage<TRecord> = {
  kind: 'table';
  title: string;
  summary: string;
  bannerTags?: string[];
  metrics: LegacyMetric[];
  quickActions?: string[];
  searchPlaceholder?: string;
  searchKeys?: Array<keyof TRecord>;
  filterOptions?: LegacyFilterOption<TRecord>[];
  columns: Parameters<typeof Table<any>>[0]['columns'];
  data: TRecord[];
  rowKey: string | ((record: TRecord) => string);
  detailTitle?: (record: TRecord) => string;
  detailFields?: LegacyDetailField<TRecord>[];
  infoCards?: LegacyInfoCard[];
};

export type LegacyEditorField =
  | {
      type: 'input' | 'textarea' | 'select';
      name: string;
      label: string;
      placeholder?: string;
      options?: string[];
    }
  | {
      type: 'number';
      name: string;
      label: string;
      placeholder?: string;
    }
  | {
      type: 'date';
      name: string;
      label: string;
      placeholder?: string;
    };

export type LegacyEditorPage = {
  kind: 'editor';
  title: string;
  summary: string;
  bannerTags?: string[];
  metrics: LegacyMetric[];
  quickActions?: string[];
  formSections: Array<{
    title: string;
    description?: string;
    fields: LegacyEditorField[];
  }>;
  infoCards?: LegacyInfoCard[];
  submitLabel: string;
};

export type LegacyMatrixPage = {
  kind: 'matrix';
  title: string;
  summary: string;
  bannerTags?: string[];
  metrics: LegacyMetric[];
  quickActions?: string[];
  roleCards: Array<{
    title: string;
    description: string;
    tags: string[];
  }>;
  columns: Parameters<typeof Table<any>>[0]['columns'];
  data: Array<Record<string, ReactNode>>;
  infoCards?: LegacyInfoCard[];
};

export type LegacyFeatureDefinition =
  | LegacyTablePage<any>
  | LegacyEditorPage
  | LegacyMatrixPage;

interface LegacyFeaturePageProps {
  definition: LegacyFeatureDefinition;
  loading?: boolean;
  usingFallback?: boolean;
}

function renderMetric(metric: LegacyMetric) {
  if (metric.formatter) {
    return metric.formatter(metric.value);
  }

  return metric.value;
}

function renderEditorField(field: LegacyEditorField) {
  if (field.type === 'textarea') {
    return <Input.TextArea placeholder={field.placeholder} rows={4} />;
  }

  if (field.type === 'select') {
    return (
      <Select
        options={(field.options ?? []).map((option) => ({
          label: option,
          value: option,
        }))}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === 'number') {
    return <InputNumber placeholder={field.placeholder} style={{ width: '100%' }} />;
  }

  if (field.type === 'date') {
    return <DatePicker style={{ width: '100%' }} />;
  }

  return <Input placeholder={field.placeholder} />;
}

export function LegacyFeaturePage({
  definition,
  loading = false,
  usingFallback = true,
}: LegacyFeaturePageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>(
    definition.kind === 'table' && definition.filterOptions?.length
      ? definition.filterOptions[0].value
      : 'all',
  );
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const filteredData = useMemo(() => {
    if (definition.kind !== 'table') {
      return [];
    }

    return definition.data.filter((record) => {
      const filterMatched =
        !definition.filterOptions?.length
          ? true
          : definition.filterOptions.some((option) => {
              if (option.value !== selectedFilter) {
                return false;
              }

              return option.predicate(record);
            });

      if (!filterMatched) {
        return false;
      }

      if (!keyword.trim() || !definition.searchKeys?.length) {
        return true;
      }

      const haystack = definition.searchKeys
        .map((key) => String(record[key] ?? ''))
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword.toLowerCase());
    });
  }, [definition, keyword, selectedFilter]);

  return (
    <div className="page-stack">
      {contextHolder}

      {usingFallback ? (
        <Alert
          showIcon
          type="warning"
          message="当前页面部分数据为前端对齐老系统功能点的演示数据"
          description="新系统 API 尚未完全覆盖这些页面时，先用前端 mock 把功能面补齐。"
        />
      ) : null}

      <Card className="hero-card">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            {(definition.bannerTags ?? []).map((tag) => (
              <Tag color="blue" key={tag}>
                {tag}
              </Tag>
            ))}
          </Space>
          <Typography.Title level={2}>{definition.title}</Typography.Title>
          <Typography.Paragraph type="secondary">
            {definition.summary}
          </Typography.Paragraph>
          {definition.quickActions?.length ? (
            <Space wrap>
              {definition.quickActions.map((action) => (
                <Tag key={action}>{action}</Tag>
              ))}
            </Space>
          ) : null}
        </Space>
      </Card>

      <Space wrap size={16}>
        {definition.metrics.map((metric) => (
          <Card className="metric-card" key={metric.label}>
            <Typography.Text type="secondary">{metric.label}</Typography.Text>
            <Typography.Title level={3} style={{ margin: '8px 0 0' }}>
              {renderMetric(metric)}
            </Typography.Title>
          </Card>
        ))}
      </Space>

      {definition.kind === 'matrix' ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card title="权限矩阵">
              <Table
                columns={definition.columns}
                dataSource={definition.data}
                loading={loading}
                pagination={false}
                rowKey="key"
              />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card title="角色分层">
                <List
                  dataSource={definition.roleCards}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.title}
                        description={
                          <Space direction="vertical" size={8}>
                            <Typography.Text type="secondary">
                              {item.description}
                            </Typography.Text>
                            <Space wrap>
                              {item.tags.map((tag) => (
                                <Tag key={tag}>{tag}</Tag>
                              ))}
                            </Space>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
              {(definition.infoCards ?? []).map((card) => (
                <Card key={card.title} title={card.title}>
                  <List
                    dataSource={card.items}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </Card>
              ))}
            </Space>
          </Col>
        </Row>
      ) : null}

      {definition.kind === 'editor' ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card title={definition.title}>
              <Form
                layout="vertical"
                onFinish={() => {
                  messageApi.success(`${definition.submitLabel}入口已就位`);
                }}
              >
                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                  {definition.formSections.map((section) => (
                    <Card key={section.title} size="small" title={section.title}>
                      {section.description ? (
                        <Typography.Paragraph type="secondary">
                          {section.description}
                        </Typography.Paragraph>
                      ) : null}
                      <Row gutter={[16, 0]}>
                        {section.fields.map((field) => (
                          <Col key={field.name} span={field.type === 'textarea' ? 24 : 12}>
                            <Form.Item label={field.label} name={field.name}>
                              {renderEditorField(field)}
                            </Form.Item>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  ))}
                  <Button htmlType="submit" type="primary">
                    {definition.submitLabel}
                  </Button>
                </Space>
              </Form>
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {(definition.infoCards ?? []).map((card) => (
                <Card key={card.title} title={card.title}>
                  <List
                    dataSource={card.items}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </Card>
              ))}
            </Space>
          </Col>
        </Row>
      ) : null}

      {definition.kind === 'table' ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card
              title={definition.title}
              extra={
                <Space wrap>
                  {definition.filterOptions?.length ? (
                    <Segmented
                      options={definition.filterOptions.map((option) => ({
                        label: option.label,
                        value: option.value,
                      }))}
                      value={selectedFilter}
                      onChange={(value) => setSelectedFilter(String(value))}
                    />
                  ) : null}
                  {definition.searchKeys?.length ? (
                    <Input.Search
                      allowClear
                      placeholder={definition.searchPlaceholder}
                      style={{ width: 260 }}
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                    />
                  ) : null}
                </Space>
              }
            >
              <Table
                columns={definition.columns}
                dataSource={filteredData}
                loading={loading}
                pagination={{ pageSize: 6 }}
                rowKey={definition.rowKey}
                onRow={(record) => ({
                  onClick: () => setSelectedRecord(record),
                })}
              />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {(definition.infoCards ?? []).map((card) => (
                <Card key={card.title} title={card.title}>
                  <List
                    dataSource={card.items}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </Card>
              ))}
            </Space>
          </Col>
        </Row>
      ) : null}

      {definition.kind === 'table' && definition.detailFields?.length ? (
        <Drawer
          open={selectedRecord != null}
          title={
            selectedRecord
              ? definition.detailTitle?.(selectedRecord) ?? definition.title
              : definition.title
          }
          width={460}
          onClose={() => setSelectedRecord(null)}
        >
          {selectedRecord ? (
            <Descriptions column={1} size="small">
              {definition.detailFields.map((field) => (
                <Descriptions.Item key={field.label} label={field.label}>
                  {field.render(selectedRecord)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          ) : null}
        </Drawer>
      ) : null}
    </div>
  );
}
