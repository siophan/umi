import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';

import { formatAmount, formatNumber } from '../lib/format';
import { AdminDataTablePage, buildOptions } from './shared/admin-page-tools';

interface MarketingCouponsPageProps {
  refreshToken?: number;
}

type CouponRow = {
  claimed: number;
  faceValue: number;
  id: string;
  name: string;
  scope: string;
  status: '发放中' | '待开始' | '已暂停';
  stock: number;
  type: string;
};

function statusColor(status: string) {
  if (status.includes('发放')) {
    return 'success';
  }
  if (status.includes('暂停')) {
    return 'warning';
  }
  return 'default';
}

export function MarketingCouponsPage({ refreshToken = 0 }: MarketingCouponsPageProps) {
  const rows: CouponRow[] = [
    { id: 'coupon-1', name: '满 199 减 20', type: '满减券', scope: '平台通用', stock: 1200, claimed: 840, faceValue: 2000, status: '发放中' },
    { id: 'coupon-2', name: '新客免邮券', type: '运费券', scope: '首单用户', stock: 5000, claimed: 2240, faceValue: 1200, status: '发放中' },
  ];

  const columns: TableColumnsType<CouponRow> = [
    { title: '券名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type' },
    { title: '适用范围', dataIndex: 'scope' },
    { title: '库存', dataIndex: 'stock', render: formatNumber },
    { title: '已领取', dataIndex: 'claimed', render: formatNumber },
    { title: '面额', dataIndex: 'faceValue', render: (value: number) => formatAmount(value) },
    { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="优惠券管理"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.name.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.type !== filters.second) {
              return false;
            }
            if (filters.third && record.scope !== filters.third) {
              return false;
            }
            return true;
          })
        }
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="优惠券名称"
        secondField={{ options: buildOptions(rows as Array<Record<string, unknown>>, 'type'), placeholder: '券类型' }}
        statusItems={[
          { key: 'all', label: '全部', count: rows.length },
          { key: '发放中', label: '发放中', count: rows.filter((item) => item.status === '发放中').length },
          { key: '待开始', label: '待开始', count: rows.filter((item) => item.status === '待开始').length },
          { key: '已暂停', label: '已暂停', count: rows.filter((item) => item.status === '已暂停').length },
        ]}
        thirdField={{ options: buildOptions(rows as Array<Record<string, unknown>>, 'scope'), placeholder: '适用范围' }}
      />
    </>
  );
}
