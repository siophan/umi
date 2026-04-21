import { Descriptions, Drawer, Tag } from 'antd';

import {
  type BrandAuthRow,
  formatBrandAuthScopeValue,
  getBrandAuthStatusTagColor,
} from '../lib/admin-brand-auth';
import { formatDateTime } from '../lib/format';

interface AdminBrandAuthDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: BrandAuthRow | null;
}

export function AdminBrandAuthDetailDrawer({
  onClose,
  open,
  selected,
}: AdminBrandAuthDetailDrawerProps) {
  const scopeValueText =
    selected?.sourceType === 'record' ? formatBrandAuthScopeValue(selected.scopeValue) : '-';

  return (
    <Drawer open={open} title="品牌授权详情" width={500} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="单号">{selected.orderNo}</Descriptions.Item>
          <Descriptions.Item label="店铺">{selected.shopName}</Descriptions.Item>
          <Descriptions.Item label="品牌">{selected.brandName}</Descriptions.Item>
          <Descriptions.Item label="店主">{selected.ownerName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{selected.ownerPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getBrandAuthStatusTagColor(selected.status)}>{selected.statusLabel}</Tag>
          </Descriptions.Item>
          {selected.sourceType === 'apply' ? (
            <>
              <Descriptions.Item label="申请原因">{selected.reason || '-'}</Descriptions.Item>
              <Descriptions.Item label="授权资料">{selected.license || '-'}</Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {formatDateTime(selected.submittedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="审核时间">
                {formatDateTime(selected.reviewedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="拒绝原因">{selected.rejectReason || '-'}</Descriptions.Item>
            </>
          ) : (
            <>
              <Descriptions.Item label="授权对象">{selected.subject}</Descriptions.Item>
              <Descriptions.Item label="授权类型">{selected.authTypeLabel}</Descriptions.Item>
              <Descriptions.Item label="授权范围">{selected.authScopeLabel}</Descriptions.Item>
              <Descriptions.Item label="范围明细">
                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {scopeValueText}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="生效时间">
                {formatDateTime(selected.grantedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="到期时间">
                {formatDateTime(selected.expireAt)}
              </Descriptions.Item>
              <Descriptions.Item label="失效/撤销时间">
                {formatDateTime(selected.expiredAt)}
              </Descriptions.Item>
              <Descriptions.Item label="操作人">{selected.operatorName || '-'}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
