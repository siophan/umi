import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';

import { AdminDataTablePage, buildOptions } from './shared/admin-page-tools';

interface MarketingCheckinPageProps {
  refreshToken?: number;
}

type CheckinRow = {
  cycle: string;
  dailyCap: string;
  id: string;
  reward: string;
  status: '启用中' | '待上线';
  target: string;
  trigger: string;
};

function statusColor(status: string) {
  return status.includes('启用') ? 'success' : 'default';
}

export function MarketingCheckinPage({ refreshToken = 0 }: MarketingCheckinPageProps) {
  const rows: CheckinRow[] = [
    { id: 'checkin-1', cycle: '连续 7 天', reward: '200 优米币', target: '全体用户', trigger: '每日首签发放', dailyCap: '不限', status: '启用中' },
    { id: 'checkin-2', cycle: '连续 30 天', reward: '随机免单券', target: '高活跃用户', trigger: '满足连续周期后发放', dailyCap: '500 份 / 日', status: '待上线' },
  ];

  const columns: TableColumnsType<CheckinRow> = [
    { title: '签到周期', dataIndex: 'cycle' },
    { title: '奖励', dataIndex: 'reward' },
    { title: '目标人群', dataIndex: 'target' },
    { title: '触发规则', dataIndex: 'trigger' },
    { title: '日上限', dataIndex: 'dailyCap' },
    { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="签到管理"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.cycle.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.target !== filters.second) {
              return false;
            }
            if (filters.third && record.status !== filters.third) {
              return false;
            }
            return true;
          })
        }
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="签到周期"
        secondField={{ options: buildOptions(rows as Array<Record<string, unknown>>, 'target'), placeholder: '目标人群' }}
        statusItems={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '启用中', label: '启用中', count: rows.filter((item) => item.status === '启用中').length },
          { key: '待上线', label: '待上线', count: rows.filter((item) => item.status === '待上线').length },
        ]}
        thirdField={{
          options: [
            { label: '启用中', value: '启用中' },
            { label: '待上线', value: '待上线' },
          ],
          placeholder: '状态',
        }}
      />
    </>
  );
}
