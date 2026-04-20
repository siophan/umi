import type { TableColumnsType } from 'antd';

import { AdminDataTablePage, buildOptions, buildStatusItems } from './shared/admin-page-tools';

interface LiveListPageProps {
  refreshToken?: number;
}

type LiveRoomRow = {
  id: string;
  room: string;
  host: string;
  viewers: number;
  status: '直播中' | '已结束';
};

const rows: LiveRoomRow[] = [
  { id: 'live-1', room: '直播间 01', host: '主播 Panda', viewers: 842, status: '直播中' },
  { id: 'live-2', room: '直播间 08', host: '主播 Seven', viewers: 0, status: '已结束' },
];

export function LiveListPage({ refreshToken = 0 }: LiveListPageProps) {
  const columns: TableColumnsType<LiveRoomRow> = [
    { title: '直播间', dataIndex: 'room' },
    { title: '主播', dataIndex: 'host' },
    { title: '观看人数', dataIndex: 'viewers' },
    { title: '状态', dataIndex: 'status' },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="直播间详情"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.room.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.status !== filters.second) {
              return false;
            }
            if (filters.third && record.host !== filters.third) {
              return false;
            }
            return true;
          })
        }
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="直播间名称"
        secondField={{
          options: [
            { label: '直播中', value: '直播中' },
            { label: '已结束', value: '已结束' },
          ],
          placeholder: '状态',
        }}
        statusItems={buildStatusItems(rows, (row) => row.status)}
        thirdField={{ options: buildOptions(rows, 'host'), placeholder: '主播' }}
      />
    </>
  );
}
