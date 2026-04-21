import { Descriptions, Drawer, Tag } from 'antd';

import type { AdminNotificationItem } from '../lib/api/system';
import {
  NOTIFICATION_AUDIENCE_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from '../lib/admin-notifications';
import { formatDateTime, formatPercent } from '../lib/format';

interface AdminNotificationDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminNotificationItem | null;
}

export function AdminNotificationDetailDrawer({
  onClose,
  open,
  selected,
}: AdminNotificationDetailDrawerProps) {
  return (
    <Drawer open={open} title={selected?.title} width={520} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="通知类型">
            {NOTIFICATION_TYPE_LABELS[selected.type]}
          </Descriptions.Item>
          <Descriptions.Item label="目标人群">
            {NOTIFICATION_AUDIENCE_LABELS[selected.audience] ?? selected.audience}
          </Descriptions.Item>
          <Descriptions.Item label="通知内容">{selected.content}</Descriptions.Item>
          <Descriptions.Item label="跳转链接">{selected.actionUrl || '-'}</Descriptions.Item>
          <Descriptions.Item label="接收人数">{selected.recipientCount}</Descriptions.Item>
          <Descriptions.Item label="已读人数">{selected.readCount}</Descriptions.Item>
          <Descriptions.Item label="已读率">
            {formatPercent(selected.recipientCount === 0 ? 0 : selected.readCount / selected.recipientCount)}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color="success">已发送</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="发送时间">{formatDateTime(selected.sentAt)}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
