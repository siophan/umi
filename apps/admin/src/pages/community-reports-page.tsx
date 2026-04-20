import type { TableColumnsType } from 'antd';

import { AdminDataTablePage, buildStatusItems } from './shared/admin-page-tools';

interface CommunityReportsPageProps {
  refreshToken?: number;
}

type CommunityReportRow = {
  id: string;
  target: string;
  reporter: string;
  reason: string;
  status: '待处理' | '处理中';
};

const rows: CommunityReportRow[] = [
  { id: 'report-1', target: '帖子 post-1', reporter: '用户 1033', reason: '疑似广告', status: '待处理' },
  { id: 'report-2', target: '评论 comment-2', reporter: '用户 1109', reason: '辱骂', status: '处理中' },
];

export function CommunityReportsPage({ refreshToken = 0 }: CommunityReportsPageProps) {
  const columns: TableColumnsType<CommunityReportRow> = [
    { title: '举报对象', dataIndex: 'target' },
    { title: '举报人', dataIndex: 'reporter' },
    { title: '原因', dataIndex: 'reason' },
    { title: '状态', dataIndex: 'status' },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="举报详情"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.reason.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.status !== filters.second) {
              return false;
            }
            if (filters.third && !record.reporter.toLowerCase().includes(filters.third.trim().toLowerCase())) {
              return false;
            }
            return true;
          })
        }
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="举报原因"
        secondField={{
          options: [
            { label: '待处理', value: '待处理' },
            { label: '处理中', value: '处理中' },
          ],
          placeholder: '状态',
        }}
        statusItems={buildStatusItems(rows, (row) => row.status)}
        thirdField={{ placeholder: '举报人', type: 'input' }}
      />
    </>
  );
}
