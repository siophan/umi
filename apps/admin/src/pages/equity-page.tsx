import type { UserSummary } from '@umi/shared';
import { Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';

import { fetchAdminUsers } from '../lib/api/users';
import { formatAmount } from '../lib/format';
import { AdminDataTablePage, buildOptions, useAsyncPageData } from './shared/admin-page-tools';

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

export function EquityPage({ refreshToken = 0 }: EquityPageProps) {
  const { data: users, issue, loading } = useAsyncPageData<UserSummary[]>({
    deps: [refreshToken],
    errorMessage: '权益账户加载失败',
    initialData: [],
    load: async () => fetchAdminUsers().then((result) => result.items),
  });

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

  const accountTypeOptions = useMemo(
    () => buildOptions(rows as Array<Record<string, unknown>>, 'accountType'),
    [rows],
  );

  const columns: TableColumnsType<EquityRow> = [
    {
      title: '账户',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.userName}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.userId}</Typography.Text>
        </div>
      ),
    },
    { title: '账户类型', dataIndex: 'accountType' },
    { title: '可用余额', dataIndex: 'balance', render: (value: number) => formatAmount(value) },
    { title: '冻结金额', dataIndex: 'frozen', render: (value: number) => formatAmount(value) },
    { title: '备注', dataIndex: 'note' },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="权益金管理"
        filterRows={(sourceRows, filters) =>
          sourceRows.filter((record) => {
            if (filters.keyword && !record.userName.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.accountType !== filters.second) {
              return false;
            }
            if (filters.third && !record.note.toLowerCase().includes(filters.third.trim().toLowerCase())) {
              return false;
            }
            return true;
          })
        }
        issue={issue}
        loading={loading}
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="用户名称"
        secondField={{ options: accountTypeOptions, placeholder: '账户类型' }}
        thirdField={{ placeholder: '备注', type: 'input' }}
      />
    </>
  );
}
