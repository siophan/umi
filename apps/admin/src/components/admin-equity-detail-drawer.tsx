import type { AdminEquityAccountItem, AdminEquityLogItem } from '@umi/shared';
import { Alert, Descriptions, Drawer, Table } from 'antd';

import { buildEquityLogColumns } from '../lib/admin-equity';
import { formatAmount, formatDateTime } from '../lib/format';

interface AdminEquityDetailDrawerProps {
  detailIssue: string | null;
  loading: boolean;
  logs: AdminEquityLogItem[];
  onClose: () => void;
  open: boolean;
  selectedAccount: AdminEquityAccountItem | null;
}

export function AdminEquityDetailDrawer({
  detailIssue,
  loading,
  logs,
  onClose,
  open,
  selectedAccount,
}: AdminEquityDetailDrawerProps) {
  return (
    <Drawer open={open} title="权益金详情" width={900} onClose={onClose}>
      {detailIssue ? <Alert showIcon message={detailIssue} type="error" /> : null}
      {selectedAccount ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="用户">
              {selectedAccount.userName || selectedAccount.userId}
            </Descriptions.Item>
            <Descriptions.Item label="用户 ID">{selectedAccount.userId}</Descriptions.Item>
            <Descriptions.Item label="手机号">
              {selectedAccount.phoneNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="总余额">
              {formatAmount(selectedAccount.totalBalance)}
            </Descriptions.Item>
            <Descriptions.Item label="类目权益金">
              {formatAmount(selectedAccount.categoryAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="换购权益金">
              {formatAmount(selectedAccount.exchangeAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="通兑资产">
              {formatAmount(selectedAccount.generalAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="累计发放">
              {formatAmount(selectedAccount.totalGranted)}
            </Descriptions.Item>
            <Descriptions.Item label="累计使用">
              {formatAmount(selectedAccount.totalUsed)}
            </Descriptions.Item>
            <Descriptions.Item label="累计过期">
              {formatAmount(selectedAccount.totalExpired)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(selectedAccount.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {formatDateTime(selectedAccount.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
          <Table
            columns={buildEquityLogColumns()}
            dataSource={logs}
            loading={loading}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </div>
      ) : null}
    </Drawer>
  );
}
