import type { UserSummary } from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Descriptions, Drawer, Form, Input, Select, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel } from '../components/admin-list-controls';
import { fetchAdminUsers } from '../lib/api/users';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatAmount } from '../lib/format';

interface EquityPageProps {
  refreshToken?: number;
}

type EquityRow = {
  accountType: string;
  balance: number;
  frozen: number;
  id: string;
  note: string;
  userId: string;
  userName: string;
};

type EquityFilters = {
  userName?: string;
  accountType?: string;
  note?: string;
};

export function EquityPage({ refreshToken = 0 }: EquityPageProps) {
  const [searchForm] = Form.useForm<EquityFilters>();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<EquityFilters>({});
  const [selected, setSelected] = useState<EquityRow | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminUsers().then((result) => result.items);
        if (!alive) return;
        setUsers(items);
      } catch (error) {
        if (!alive) return;
        setUsers([]);
        setIssue(error instanceof Error ? error.message : '权益账户加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const rows = useMemo<EquityRow[]>(
    () =>
      users.map((user, index) => {
        const balance = Math.round(user.coins * 0.55);
        const frozen = Math.round(user.coins * (user.role === 'shop_owner' ? 0.22 : 0.12));
        return {
          accountType: user.role === 'shop_owner' ? '店铺担保户' : '用户账户',
          balance,
          frozen,
          id: `equity-${index + 1}`,
          note: frozen > balance * 0.3 ? '冻结占比偏高' : '余额结构正常',
          userId: user.id,
          userName: user.name,
        };
      }),
    [users],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (filters.userName && !record.userName.toLowerCase().includes(filters.userName.trim().toLowerCase())) return false;
        if (filters.accountType && record.accountType !== filters.accountType) return false;
        if (filters.note && !record.note.toLowerCase().includes(filters.note.trim().toLowerCase())) return false;
        return true;
      }),
    [filters.accountType, filters.note, filters.userName, rows],
  );

  const columns: ProColumns<EquityRow>[] = [
    {
      title: '账户',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.userName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.userId}</Typography.Text>
        </div>
      ),
    },
    { title: '账户类型', dataIndex: 'accountType', width: 140 },
    { title: '可用余额', dataIndex: 'balance', width: 140, render: (_, record) => formatAmount(record.balance) },
    { title: '冻结金额', dataIndex: 'frozen', width: 140, render: (_, record) => formatAmount(record.frozen) },
    { title: '备注', dataIndex: 'note', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => <Button size="small" type="link" onClick={() => setSelected(record)}>查看</Button>,
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
        }}
      >
        <Form.Item name="userName">
          <Input allowClear placeholder="用户名称" />
        </Form.Item>
        <Form.Item name="accountType">
          <Select allowClear options={buildOptions(rows as Array<Record<string, unknown>>, 'accountType')} placeholder="账户类型" />
        </Form.Item>
        <Form.Item name="note">
          <Input allowClear placeholder="备注" />
        </Form.Item>
      </AdminSearchPanel>
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<EquityRow>
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
      <Drawer open={selected != null} title="权益金管理" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="用户">{selected.userName}</Descriptions.Item>
            <Descriptions.Item label="用户 ID">{selected.userId}</Descriptions.Item>
            <Descriptions.Item label="账户类型">{selected.accountType}</Descriptions.Item>
            <Descriptions.Item label="可用余额">{formatAmount(selected.balance)}</Descriptions.Item>
            <Descriptions.Item label="冻结金额">{formatAmount(selected.frozen)}</Descriptions.Item>
            <Descriptions.Item label="备注">{selected.note}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
