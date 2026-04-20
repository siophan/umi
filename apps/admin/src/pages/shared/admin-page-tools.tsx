import type { Key, ReactNode } from 'react';
import type { TableColumnsType } from 'antd';
import { ProTable } from '@ant-design/pro-components';

import {
  Alert,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../../components/admin-list-controls';
import { formatDateTime } from '../../lib/format';

export interface AdminPageFilters {
  keyword?: string;
  second?: string;
  third?: string;
}

export interface AdminFilterFieldConfig {
  options?: Array<{ label: string; value: string }>;
  placeholder: string;
  type?: 'input' | 'select';
}

interface AdminDataTablePageProps<Row extends object> {
  columns: TableColumnsType<Row>;
  drawerTitle: string;
  filterRows: (rows: Row[], filters: AdminPageFilters, status: string) => Row[];
  issue?: string | null;
  loading?: boolean;
  refreshSeed?: number;
  renderDetail?: (row: Row) => ReactNode;
  rowKey?: string | ((row: Row) => Key);
  rows: Row[];
  searchPlaceholder: string;
  secondField?: AdminFilterFieldConfig;
  statusItems?: Array<{ count?: number; key: string; label: string }>;
  thirdField?: AdminFilterFieldConfig;
}

interface UseAsyncPageDataOptions<T> {
  deps: readonly unknown[];
  errorMessage: string;
  initialData: T;
  load: () => Promise<T>;
}

export const ADMIN_LIST_TABLE_THEME = {
  token: {
    borderRadius: 6,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
    },
  },
} as const;

function renderDetailValue(value: unknown) {
  if (typeof value === 'string' && value.includes('T')) {
    return formatDateTime(value);
  }

  if (value == null || value === '') {
    return '-';
  }

  return String(value);
}

export function buildOptions<Row, K extends keyof Row>(rows: Row[], key: K) {
  return Array.from(new Set(rows.map((item) => item[key]).filter(Boolean))).map((value) => ({
    label: String(value),
    value: String(value),
  }));
}

export function buildStatusItems<Row>(
  rows: Row[],
  getStatus: (row: Row) => string | null | undefined,
  labels?: Record<string, string>,
) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const status = getStatus(row);
    if (!status) {
      continue;
    }

    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  return [
    { key: 'all', label: '全部', count: rows.length },
    ...Array.from(counts.entries()).map(([key, count]) => ({
      key,
      label: labels?.[key] ?? key,
      count,
    })),
  ];
}

export function useAsyncPageData<T>({
  deps,
  errorMessage,
  initialData,
  load,
}: UseAsyncPageDataOptions<T>) {
  const [data, setData] = useState(initialData);
  const [issue, setIssue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await load();
        if (!alive) {
          return;
        }
        setData(result);
      } catch (error) {
        if (!alive) {
          return;
        }
        setData(initialData);
        setIssue(error instanceof Error ? error.message : errorMessage);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      alive = false;
    };
  }, deps);

  return { data, issue, loading };
}

export function AdminDataTablePage<Row extends object>({
  columns,
  drawerTitle,
  filterRows,
  issue,
  loading = false,
  refreshSeed = 0,
  renderDetail,
  rowKey = 'id',
  rows,
  searchPlaceholder,
  secondField,
  statusItems,
  thirdField,
}: AdminDataTablePageProps<Row>) {
  const [selected, setSelected] = useState<Row | null>(null);
  const [filters, setFilters] = useState<AdminPageFilters>({});
  const [status, setStatus] = useState('all');
  const [form] = Form.useForm<AdminPageFilters>();

  useEffect(() => {
    form.resetFields();
    setFilters({});
    setStatus('all');
    setSelected(null);
  }, [form, refreshSeed]);

  const filteredRows = useMemo(
    () => filterRows(rows, filters, status),
    [filterRows, filters, rows, status],
  );

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      <AdminSearchPanel
        form={form}
        onSearch={() => setFilters(form.getFieldsValue())}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="keyword">
          <Input allowClear placeholder={searchPlaceholder} />
        </Form.Item>
        {secondField ? (
          <Form.Item name="second">
            {secondField.type === 'input' ? (
              <Input allowClear placeholder={secondField.placeholder} />
            ) : (
              <Select
                allowClear
                options={secondField.options}
                placeholder={secondField.placeholder}
              />
            )}
          </Form.Item>
        ) : null}
        {thirdField ? (
          <Form.Item name="third">
            {thirdField.type === 'input' ? (
              <Input allowClear placeholder={thirdField.placeholder} />
            ) : (
              <Select
                allowClear
                options={thirdField.options}
                placeholder={thirdField.placeholder}
              />
            )}
          </Form.Item>
        ) : null}
      </AdminSearchPanel>
      {statusItems && statusItems.length > 2 ? (
        <AdminStatusTabs activeKey={status} items={statusItems} onChange={setStatus} />
      ) : null}
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<Row>
          cardBordered={false}
          columns={columns as never}
          columnsState={{}}
          dataSource={filteredRows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          rowKey={rowKey as never}
          search={false}
          toolBarRender={() => []}
          onRow={(record) => ({
            onClick: () => setSelected(record),
          })}
        />
      </ConfigProvider>
      <Drawer
        open={selected != null}
        title={drawerTitle}
        width={460}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          renderDetail ? (
            renderDetail(selected)
          ) : (
            <Descriptions column={1} size="small">
              {Object.entries(selected).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {renderDetailValue(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          )
        ) : null}
      </Drawer>
    </div>
  );
}
