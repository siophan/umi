import type { AdminPermissionItem } from '../lib/api/system';
import { Descriptions, Drawer, Tag } from 'antd';

import {
  getPermissionActionColor,
  getPermissionActionLabel,
  getPermissionStatusColor,
} from '../lib/admin-permissions';

interface AdminPermissionDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  selected: AdminPermissionItem | null;
}

export function AdminPermissionDetailDrawer({
  onClose,
  open,
  selected,
}: AdminPermissionDetailDrawerProps) {
  return (
    <Drawer open={open} width={460} title={selected?.name} onClose={onClose}>
      {selected ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="权限名称">{selected.name}</Descriptions.Item>
          <Descriptions.Item label="权限编码">{selected.code}</Descriptions.Item>
          <Descriptions.Item label="所属模块">{selected.module}</Descriptions.Item>
          <Descriptions.Item label="动作">
            <Tag color={getPermissionActionColor(selected.action)}>
              {getPermissionActionLabel(selected.action)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="父权限">{selected.parentName || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色引用">{selected.assignedRoleCount}</Descriptions.Item>
          <Descriptions.Item label="权限来源">
            {selected.isBuiltIn ? '系统内置目录' : '自定义权限'}
          </Descriptions.Item>
          <Descriptions.Item label="排序">{selected.sort}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getPermissionStatusColor(selected.status)}>
              {selected.status === 'active' ? '启用' : '停用'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
