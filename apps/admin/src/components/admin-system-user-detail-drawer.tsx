import type { AdminSystemUserItem } from '../lib/api/system';
import { Descriptions, Drawer, Tag } from 'antd';

import { getSystemUserStatusColor } from '../lib/admin-system-users';
import { formatDateTime } from '../lib/format';

interface AdminSystemUserDetailDrawerProps {
  open: boolean;
  selected: AdminSystemUserItem | null;
  onClose: () => void;
}

export function AdminSystemUserDetailDrawer({
  open,
  selected,
  onClose,
}: AdminSystemUserDetailDrawerProps) {
  return (
    <Drawer open={open} width={460} title={selected?.username} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="账号">{selected.username}</Descriptions.Item>
          <Descriptions.Item label="显示名">{selected.displayName}</Descriptions.Item>
          <Descriptions.Item label="角色">{selected.role}</Descriptions.Item>
          <Descriptions.Item label="角色编码">
            {selected.roleCodes.length > 0 ? selected.roleCodes.join(' / ') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="手机号">{selected.phoneNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{selected.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getSystemUserStatusColor(selected.status)}>
              {selected.status === 'active' ? '启用' : '停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="最近登录">
            {selected.lastLoginAt ? formatDateTime(selected.lastLoginAt) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDateTime(selected.createdAt)}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
