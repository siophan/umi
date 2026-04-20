import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminBrandAuthRecordItem } from '../lib/api/merchant';
import { fetchAdminBrandAuthRecords } from '../lib/api/merchant';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatDateTime } from '../lib/format';

interface ShopBrandAuthRecordsPageProps {
  refreshToken?: number;
}

type BrandAuthRecordFilters = {
  authNo?: string;
  brandName?: string;
};

const emptyRows: AdminBrandAuthRecordItem[] = [];

export function ShopBrandAuthRecordsPage({ refreshToken = 0 }: ShopBrandAuthRecordsPageProps) {
  const [searchForm] = Form.useForm<BrandAuthRecordFilters>();
  const [rows, setRows] = useState<AdminBrandAuthRecordItem[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrandAuthRecordFilters>({});
  const [status, setStatus] = useState<'all' | AdminBrandAuthRecordItem['status']>('all');
  const [selected, setSelected] = useState<AdminBrandAuthRecordItem | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminBrandAuthRecords().then((result) => result.items);
        if (!alive) {
          return;
        }
        setRows(items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows(emptyRows);
        setIssue(error instanceof Error ? error.message : '品牌授权记录加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPageData();

    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const brandOptions = useMemo(() => buildOptions(rows, 'brandName'), [rows]);
  const statusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: rows.length },
      { key: 'active', label: '生效中', count: rows.filter((item) => item.status === 'active').length },
      { key: 'expired', label: '已过期', count: rows.filter((item) => item.status === 'expired').length },
      { key: 'revoked', label: '已撤销', count: rows.filter((item) => item.status === 'revoked').length },
    ],
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (filters.authNo && !String(record.authNo || '').toLowerCase().includes(filters.authNo.trim().toLowerCase())) {
          return false;
        }
        if (filters.brandName && record.brandName !== filters.brandName) {
          return false;
        }
        return true;
      }),
    [filters.authNo, filters.brandName, rows, status],
  );

  const columns: ProColumns<AdminBrandAuthRecordItem>[] = [
    { title: '授权单号', dataIndex: 'authNo', width: 180, render: (_, record) => record.authNo || '-' },
    { title: '店铺', dataIndex: 'shopName', width: 200 },
    { title: '品牌', dataIndex: 'brandName', width: 180 },
    { title: '授权类型', dataIndex: 'authTypeLabel', width: 140 },
    { title: '授权范围', dataIndex: 'authScopeLabel', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : record.status === 'revoked' ? 'error' : 'default'}>
          {record.statusLabel}
        </Tag>
      ),
    },
    { title: '生效时间', dataIndex: 'grantedAt', width: 180, render: (_, record) => formatDateTime(record.grantedAt) },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => setSelected(record)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="authNo">
          <Input allowClear placeholder="授权单号" />
        </Form.Item>
        <Form.Item name="brandName">
          <Select allowClear options={brandOptions} placeholder="品牌" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs activeKey={status} items={statusItems} onChange={(key) => setStatus(key as typeof status)} />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminBrandAuthRecordItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <Drawer open={selected != null} title="品牌授权记录" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="授权单号">{selected.authNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="店铺">{selected.shopName}</Descriptions.Item>
            <Descriptions.Item label="品牌">{selected.brandName}</Descriptions.Item>
            <Descriptions.Item label="授权类型">{selected.authTypeLabel}</Descriptions.Item>
            <Descriptions.Item label="授权范围">{selected.authScopeLabel}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selected.status === 'active' ? 'success' : selected.status === 'revoked' ? 'error' : 'default'}>
                {selected.statusLabel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="生效时间">{formatDateTime(selected.grantedAt)}</Descriptions.Item>
            <Descriptions.Item label="失效时间">
              {selected.expiredAt ? formatDateTime(selected.expiredAt) : '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
