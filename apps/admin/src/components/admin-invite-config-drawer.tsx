import { Alert, Descriptions, Drawer, Tag } from 'antd';

import type { AdminInviteRewardConfigItem } from '../lib/api/invite';
import { formatDateTime } from '../lib/format';
import {
  formatInviteRewardContent,
  getInviteRewardStatusColor,
} from '../lib/admin-invite';

interface AdminInviteConfigDrawerProps {
  open: boolean;
  config: AdminInviteRewardConfigItem | null;
  onClose: () => void;
}

export function AdminInviteConfigDrawer({
  open,
  config,
  onClose,
}: AdminInviteConfigDrawerProps) {
  return (
    <Drawer open={open} title="邀请奖励配置" width={460} onClose={onClose}>
      {config ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="邀请人奖励">
            {formatInviteRewardContent(
              config.inviterRewardTypeLabel,
              config.inviterRewardValue,
              config.inviterRewardRefId,
            )}
          </Descriptions.Item>
          <Descriptions.Item label="被邀请人奖励">
            {formatInviteRewardContent(
              config.inviteeRewardTypeLabel,
              config.inviteeRewardValue,
              config.inviteeRewardRefId,
            )}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getInviteRewardStatusColor(config.status)}>{config.statusLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(config.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(config.updatedAt)}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert type="info" showIcon message="当前还没有邀请奖励配置，请先新增。" />
      )}
    </Drawer>
  );
}

