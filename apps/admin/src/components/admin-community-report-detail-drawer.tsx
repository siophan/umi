import type { AdminCommunityReportItem } from '@umi/shared';
import { Descriptions, Drawer } from 'antd';

import { formatDateTime } from '../lib/format';

interface AdminCommunityReportDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminCommunityReportItem | null;
}

export function AdminCommunityReportDetailDrawer({
  onClose,
  open,
  selected,
}: AdminCommunityReportDetailDrawerProps) {
  return (
    <Drawer open={open} title="举报详情" width={560} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="举报人">{selected.reporterName}</Descriptions.Item>
          <Descriptions.Item label="举报人 UID">{selected.reporterUid || '-'}</Descriptions.Item>
          <Descriptions.Item label="被举报内容">
            {selected.targetContent || '内容已删除'}
          </Descriptions.Item>
          <Descriptions.Item label="被举报标题">
            {selected.targetTitle || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="目标作者">
            {selected.targetAuthorName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="目标作者 UID">
            {selected.targetAuthorUid || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="举报原因">{selected.reasonLabel}</Descriptions.Item>
          <Descriptions.Item label="补充说明">
            {selected.reasonDetail || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">{selected.statusLabel}</Descriptions.Item>
          <Descriptions.Item label="处理动作">
            {selected.handleActionLabel || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="处理说明">{selected.handleNote || '-'}</Descriptions.Item>
          <Descriptions.Item label="举报时间">
            {formatDateTime(selected.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="处理时间">
            {selected.handledAt ? formatDateTime(selected.handledAt) : '-'}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
