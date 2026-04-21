import { Descriptions, Drawer } from 'antd';

import type { AdminShopApplyItem } from '../lib/api/merchant';
import { formatDateTime } from '../lib/format';

interface AdminShopApplyDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminShopApplyItem | null;
}

export function AdminShopApplyDetailDrawer({
  onClose,
  open,
  selected,
}: AdminShopApplyDetailDrawerProps) {
  return (
    <Drawer open={open} title="开店审核" width={460} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="申请单号">{selected.applyNo}</Descriptions.Item>
          <Descriptions.Item label="店铺名">{selected.shopName}</Descriptions.Item>
          <Descriptions.Item label="申请人">{selected.applicant}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{selected.contact || '-'}</Descriptions.Item>
          <Descriptions.Item label="主营类目">{selected.category || '-'}</Descriptions.Item>
          <Descriptions.Item label="申请说明">{selected.reason || '-'}</Descriptions.Item>
          <Descriptions.Item label="审核状态">{selected.statusLabel}</Descriptions.Item>
          <Descriptions.Item label="拒绝原因">{selected.rejectReason || '-'}</Descriptions.Item>
          <Descriptions.Item label="审核时间">
            {selected.reviewedAt ? formatDateTime(selected.reviewedAt) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="提交时间">
            {selected.submittedAt ? formatDateTime(selected.submittedAt) : '-'}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
