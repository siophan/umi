import type { ReactNode } from 'react';
import { DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { Button, Col, ConfigProvider, Form, Input, Row, Space, Tabs } from 'antd';
import type { FormInstance, TabsProps } from 'antd';
import { Children, useMemo, useState } from 'react';

interface AdminSearchPanelProps {
  form: FormInstance;
  onSearch: () => void;
  onReset: () => void;
  defaultCount?: number;
  colProps?: { xs?: number; sm?: number; md?: number; lg?: number };
  children: ReactNode;
  extra?: ReactNode;
}

interface AdminStatusTabsProps {
  activeKey: string;
  items: Array<{
    key: string;
    label: string;
    count?: number;
  }>;
  onChange: (key: string) => void;
}

interface AdminSearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  extra?: ReactNode;
}

export const SEARCH_THEME = {
  inherit: false,
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
    colorBgContainer: '#ffffff',
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextPlaceholder: 'rgba(0, 0, 0, 0.25)',
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 32,
      controlItemBgHover: 'rgba(0, 0, 0, 0.04)',
    },
    DatePicker: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Card: {
      borderRadiusLG: 8,
    },
  },
} as const;

export function AdminSearchPanel({
  form,
  onSearch,
  onReset,
  defaultCount = 3,
  colProps = { xs: 24, sm: 12, md: 8, lg: 6 },
  children,
  extra,
}: AdminSearchPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const items = useMemo(() => Children.toArray(children), [children]);
  const visibleItems = expanded ? items : items.slice(0, defaultCount);
  const hasMore = items.length > defaultCount;

  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <ProCard className="admin-search-panel">
        <Form form={form} layout="inline" onFinish={onSearch} style={{ width: '100%' }}>
          <Row gutter={[16, 8]} style={{ width: '100%' }} align="bottom">
            {visibleItems.map((item, index) => (
              <Col
                key={index}
                xs={colProps.xs ?? 24}
                sm={colProps.sm ?? 12}
                md={colProps.md ?? 8}
                lg={colProps.lg ?? 6}
              >
                {item}
              </Col>
            ))}
            <Col
              xs={colProps.xs ?? 24}
              sm={colProps.sm ?? 12}
              md={colProps.md ?? 8}
              lg={colProps.lg ?? 6}
            >
              <Form.Item>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                    搜索
                  </Button>
                  <Button onClick={onReset}>重置</Button>
                  {hasMore ? (
                    <Button
                      type="link"
                      icon={expanded ? <UpOutlined /> : <DownOutlined />}
                      onClick={() => setExpanded((value) => !value)}
                    >
                      {expanded ? '收起' : '展开'}
                    </Button>
                  ) : null}
                  {extra}
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </ProCard>
    </ConfigProvider>
  );
}

export function AdminSearchBar({
  placeholder,
  value,
  onChange,
  onReset,
  extra,
}: AdminSearchBarProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <ProCard className="admin-search-panel">
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input.Search
            allowClear
            placeholder={placeholder}
            value={value}
            style={{ width: 320, maxWidth: '100%' }}
            onChange={(event) => onChange(event.target.value)}
            onSearch={onChange}
          />
          <Space>
            {extra}
            {onReset ? <Button onClick={onReset}>重置</Button> : null}
          </Space>
        </Space>
      </ProCard>
    </ConfigProvider>
  );
}

export function AdminStatusTabs({
  activeKey,
  items,
  onChange,
}: AdminStatusTabsProps) {
  const tabItems: TabsProps['items'] = items.map((item) => ({
    key: item.key,
    label: item.count == null ? item.label : `${item.label} (${item.count})`,
  }));

  return (
    <Tabs
      activeKey={activeKey}
      items={tabItems}
      onChange={onChange}
      className="admin-status-tabs"
    />
  );
}
