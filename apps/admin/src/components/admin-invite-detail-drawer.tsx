import { Descriptions, Drawer } from 'antd';

import type { InviteRecord } from '../lib/admin-invite';
import { formatDateTime } from '../lib/format';

interface AdminInviteDetailDrawerProps {
  open: boolean;
  selected: InviteRecord | null;
  onClose: () => void;
}

export function AdminInviteDetailDrawer({
  open,
  selected,
  onClose,
}: AdminInviteDetailDrawerProps) {
  return (
    <Drawer open={open} title="邀请记录详情" width={460} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="邀请人">{selected.inviterName}</Descriptions.Item>
          <Descriptions.Item label="邀请人 ID">{selected.inviterId}</Descriptions.Item>
          <Descriptions.Item label="邀请人 UID">{selected.inviterUidCode || '-'}</Descriptions.Item>
          <Descriptions.Item label="邀请人手机号">{selected.inviterPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="邀请码">{selected.inviteCode || '-'}</Descriptions.Item>
          <Descriptions.Item label="被邀请人">{selected.inviteeName}</Descriptions.Item>
          <Descriptions.Item label="被邀请人 ID">{selected.inviteeId}</Descriptions.Item>
          <Descriptions.Item label="被邀请人 UID">{selected.inviteeUidCode || '-'}</Descriptions.Item>
          <Descriptions.Item label="被邀请人手机号">{selected.inviteePhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{formatDateTime(selected.registeredAt)}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}

