import type { TableColumnsType } from 'antd';

import { AdminDataTablePage, buildStatusItems } from './shared/admin-page-tools';

interface CommunityPostsPageProps {
  refreshToken?: number;
}

type CommunityPostRow = {
  id: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  status: '已发布' | '待复核';
};

const rows: CommunityPostRow[] = [
  { id: 'post-1', title: 'Panda 竞猜晒单', author: '用户 1001', likes: 128, comments: 24, status: '已发布' },
  { id: 'post-2', title: '品牌上新开箱', author: '用户 1008', likes: 92, comments: 13, status: '待复核' },
];

export function CommunityPostsPage({ refreshToken = 0 }: CommunityPostsPageProps) {
  const columns: TableColumnsType<CommunityPostRow> = [
    { title: '帖子标题', dataIndex: 'title' },
    { title: '作者', dataIndex: 'author' },
    { title: '点赞', dataIndex: 'likes' },
    { title: '评论', dataIndex: 'comments' },
    { title: '状态', dataIndex: 'status' },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="帖子详情"
        filterRows={(sourceRows, filters, status) =>
          sourceRows.filter((record) => {
            if (status !== 'all' && record.status !== status) {
              return false;
            }
            if (filters.keyword && !record.title.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
              return false;
            }
            if (filters.second && record.status !== filters.second) {
              return false;
            }
            if (filters.third && !record.author.toLowerCase().includes(filters.third.trim().toLowerCase())) {
              return false;
            }
            return true;
          })
        }
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="帖子标题"
        secondField={{
          options: [
            { label: '已发布', value: '已发布' },
            { label: '待复核', value: '待复核' },
          ],
          placeholder: '状态',
        }}
        statusItems={buildStatusItems(rows, (row) => row.status)}
        thirdField={{ placeholder: '作者', type: 'input' }}
      />
    </>
  );
}
