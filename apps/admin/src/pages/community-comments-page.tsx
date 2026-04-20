import type { TableColumnsType } from 'antd';

import { AdminDataTablePage, buildStatusItems } from './shared/admin-page-tools';

interface CommunityCommentsPageProps {
  refreshToken?: number;
}

type CommunityCommentRow = {
  id: string;
  content: string;
  author: string;
  target: string;
  status: '正常' | '复核中';
};

const rows: CommunityCommentRow[] = [
  { id: 'comment-1', content: '这个竞猜太刺激了', author: '用户 1003', target: 'Panda 竞猜晒单', status: '正常' },
  { id: 'comment-2', content: '请尽快发货', author: '用户 1018', target: '品牌上新开箱', status: '复核中' },
];

export function CommunityCommentsPage({ refreshToken = 0 }: CommunityCommentsPageProps) {
  const columns: TableColumnsType<CommunityCommentRow> = [
    { title: '评论内容', dataIndex: 'content' },
    { title: '评论人', dataIndex: 'author' },
    { title: '评论对象', dataIndex: 'target' },
    { title: '状态', dataIndex: 'status' },
  ];

  return (
    <>
      <AdminDataTablePage
        columns={columns}
        drawerTitle="评论详情"
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
            if (filters.third && !record.author.toLowerCase().includes(filters.third.trim().toLowerCase())) {
              return false;
            }
            return true;
          })
        }
        refreshSeed={refreshToken}
        rows={rows}
        searchPlaceholder="评论内容"
        secondField={{
          options: [
            { label: '正常', value: '正常' },
            { label: '复核中', value: '复核中' },
          ],
          placeholder: '状态',
        }}
        statusItems={buildStatusItems(rows, (row) => row.status)}
        thirdField={{ placeholder: '评论人', type: 'input' }}
      />
    </>
  );
}
