import type { TableColumnsType } from 'antd';

import { AdminDataTablePage, buildOptions, buildStatusItems } from './shared/admin-page-tools';

interface LiveDanmakuPageProps {
  refreshToken?: number;
}

type DanmakuRow = {
  id: string;
  room: string;
  sender: string;
  content: string;
  status: '正常' | '待复核';
};

const rows: DanmakuRow[] = [
  { id: 'dm-1', room: '直播间 01', sender: '用户 888', content: '求开奖', status: '正常' },
  { id: 'dm-2', room: '直播间 01', sender: '用户 999', content: '优惠券还有吗', status: '待复核' },
];

export function LiveDanmakuPage({ refreshToken = 0 }: LiveDanmakuPageProps) {
  const columns: TableColumnsType<DanmakuRow> = [
    { title: '直播间', dataIndex: 'room' },
    { title: '发送者', dataIndex: 'sender' },
    { title: '内容', dataIndex: 'content' },
    { title: '风控状态', dataIndex: 'status' },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="弹幕详情"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.content.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.status !== filters.second) {
              return false;
            }
            if (filters.third && record.room !== filters.third) {
              return false;
            }
            return true;
          })
        }
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="弹幕内容"
        secondField={{ options: buildOptions(rows, 'status'), placeholder: '风控状态' }}
        statusItems={buildStatusItems(rows, (row) => row.status)}
        thirdField={{ options: buildOptions(rows, 'room'), placeholder: '直播间' }}
      />
    </>
  );
}
