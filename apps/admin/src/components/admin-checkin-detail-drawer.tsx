import type { AdminCheckinRewardConfigItem } from '../lib/api/checkin';
import { Descriptions, Drawer, Tag } from 'antd';

import { formatDateTime, formatNumber } from '../lib/format';
import {
  formatCheckinRewardContent,
  getCheckinRewardStatusColor,
} from '../lib/admin-checkin';

interface AdminCheckinDetailDrawerProps {
  open: boolean;
  selected: AdminCheckinRewardConfigItem | null;
  onClose: () => void;
}

export function AdminCheckinDetailDrawer({
  open,
  selected,
  onClose,
}: AdminCheckinDetailDrawerProps) {
  return (
    <Drawer open={open} title="签到奖励详情" width={460} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="签到天数">第 {formatNumber(selected.dayNo)} 天</Descriptions.Item>
          <Descriptions.Item label="奖励类型">{selected.rewardTypeLabel}</Descriptions.Item>
          <Descriptions.Item label="奖励内容">
            {formatCheckinRewardContent(selected)}
          </Descriptions.Item>
          <Descriptions.Item label="奖励数值">{formatNumber(selected.rewardValue)}</Descriptions.Item>
          <Descriptions.Item label="奖励关联 ID">{selected.rewardRefId ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="奖励标题">{selected.title || '-'}</Descriptions.Item>
          <Descriptions.Item label="排序">{formatNumber(selected.sort)}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getCheckinRewardStatusColor(selected.status)}>{selected.statusLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
