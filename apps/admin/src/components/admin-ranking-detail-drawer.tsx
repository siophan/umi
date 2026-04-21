import type {
  AdminRankingDetailResult,
  AdminRankingSummaryItem,
} from '@umi/shared';
import { Alert, Descriptions, Drawer, Table } from 'antd';

import {
  buildRankingDetailColumns,
} from '../lib/admin-rankings';
import { formatDateTime, formatNumber } from '../lib/format';

interface AdminRankingDetailDrawerProps {
  open: boolean;
  selected: AdminRankingSummaryItem | null;
  detail: AdminRankingDetailResult | null;
  detailIssue: string | null;
  detailLoading: boolean;
  onClose: () => void;
}

const detailColumns = buildRankingDetailColumns();

export function AdminRankingDetailDrawer({
  open,
  selected,
  detail,
  detailIssue,
  detailLoading,
  onClose,
}: AdminRankingDetailDrawerProps) {
  return (
    <Drawer open={open} title="榜单详情" width={780} onClose={onClose}>
      {selected ? (
        <>
          {detailIssue ? (
            <Alert showIcon type="error" message={detailIssue} style={{ marginBottom: 16 }} />
          ) : null}
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="榜单">{selected.boardTypeLabel}</Descriptions.Item>
            <Descriptions.Item label="周期">{selected.periodTypeLabel}</Descriptions.Item>
            <Descriptions.Item label="期次">{selected.periodLabel}</Descriptions.Item>
            <Descriptions.Item label="上榜人数">
              {formatNumber(detail?.totalEntries ?? selected.entryCount)}
            </Descriptions.Item>
            <Descriptions.Item label="榜首用户">
              {selected.topUserName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="榜首分值">{selected.topValue}</Descriptions.Item>
            <Descriptions.Item label="最近生成">
              {formatDateTime(detail?.generatedAt ?? selected.generatedAt)}
            </Descriptions.Item>
          </Descriptions>
          <Table
            rowKey={(record) => `${record.userId}-${record.rank}`}
            columns={detailColumns}
            dataSource={detail?.items ?? []}
            loading={detailLoading}
            pagination={false}
            scroll={{ y: 420 }}
          />
        </>
      ) : null}
    </Drawer>
  );
}
