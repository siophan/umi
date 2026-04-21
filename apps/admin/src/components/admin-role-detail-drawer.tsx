import { Descriptions, Drawer, Tag } from 'antd';

import type { AdminRoleListItem } from '../lib/api/system';
import { formatDateTime } from '../lib/format';
import { getRoleStatusColor } from '../lib/admin-roles';

interface AdminRoleDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminRoleListItem | null;
}

export function AdminRoleDetailDrawer({
  onClose,
  open,
  selected,
}: AdminRoleDetailDrawerProps) {
  return (
    <Drawer open={open} width={460} title={selected?.name} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="角色名称">{selected.name}</Descriptions.Item>
          <Descriptions.Item label="角色编码">{selected.code}</Descriptions.Item>
          <Descriptions.Item label="角色说明">{selected.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="权限范围">{selected.permissionRange}</Descriptions.Item>
          <Descriptions.Item label="权限模块">
            {selected.permissionModules.length > 0 ? selected.permissionModules.join(' / ') : '未配置权限'}
          </Descriptions.Item>
          <Descriptions.Item label="成员数">{selected.memberCount}</Descriptions.Item>
          <Descriptions.Item label="权限数">{selected.permissionCount}</Descriptions.Item>
          <Descriptions.Item label="排序">{selected.sort}</Descriptions.Item>
          <Descriptions.Item label="系统角色">{selected.isSystem ? '是' : '否'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getRoleStatusColor(selected.status)}>
              {selected.status === 'active' ? '启用' : '停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
