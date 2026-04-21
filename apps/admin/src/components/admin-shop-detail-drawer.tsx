import { Alert, Drawer, Empty, Tabs, Typography } from 'antd';

import { buildShopDetailTabs } from '../lib/admin-shops';

type ShopDetail = Awaited<ReturnType<typeof import('../lib/api/merchant').fetchAdminShopDetail>>;

interface AdminShopDetailDrawerProps {
  detail: ShopDetail | null;
  detailIssue: string | null;
  detailLoading: boolean;
  onClose: () => void;
  open: boolean;
}

export function AdminShopDetailDrawer({
  detail,
  detailIssue,
  detailLoading,
  onClose,
  open,
}: AdminShopDetailDrawerProps) {
  return (
    <Drawer open={open} title="店铺详情" width={960} onClose={onClose}>
      {detailIssue ? <Alert showIcon type="error" message={detailIssue} style={{ marginBottom: 16 }} /> : null}
      {detailLoading ? (
        <div style={{ padding: '48px 0' }}>
          <Typography.Text type="secondary">店铺详情加载中...</Typography.Text>
        </div>
      ) : detail ? (
        <Tabs items={buildShopDetailTabs(detail)} />
      ) : (
        <Empty description="暂无店铺详情" />
      )}
    </Drawer>
  );
}
