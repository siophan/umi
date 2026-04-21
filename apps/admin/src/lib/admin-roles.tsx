import type { EntityId } from '@umi/shared';
import type { TableColumnsType } from 'antd';
import { Button, Popconfirm, Tag, Typography } from 'antd';

import type {
  AdminPermissionMatrixData,
  AdminRoleListItem,
} from './api/system';
import { formatNumber } from './format';

export type RoleFilters = {
  name?: string;
};

export type RoleStatusKey = 'all' | AdminRoleListItem['status'];

export type RoleFormValues = {
  code: string;
  name: string;
  description?: string;
  sort?: number;
};

export type CreateRoleFormValues = RoleFormValues & {
  status: 'active' | 'disabled';
};

export function getRoleStatusColor(status: AdminRoleListItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

export function buildRoleStatusItems(roles: AdminRoleListItem[]) {
  return [
    { key: 'all', label: '全部', count: roles.length },
    {
      key: 'active',
      label: '启用',
      count: roles.filter((item) => item.status === 'active').length,
    },
    {
      key: 'disabled',
      label: '停用',
      count: roles.filter((item) => item.status === 'disabled').length,
    },
  ] satisfies Array<{ key: RoleStatusKey; label: string; count: number }>;
}

export function filterRoles(
  roles: AdminRoleListItem[],
  filters: RoleFilters,
  status: RoleStatusKey,
) {
  return roles.filter((item) => {
    if (status !== 'all' && item.status !== status) {
      return false;
    }
    if (
      filters.name &&
      ![item.name, item.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(filters.name!.trim().toLowerCase()))
    ) {
      return false;
    }
    return true;
  });
}

export function buildCreateRoleFormValues(): CreateRoleFormValues {
  return {
    code: '',
    name: '',
    description: undefined,
    sort: 0,
    status: 'active',
  };
}

export function buildEditRoleFormValues(record: AdminRoleListItem): RoleFormValues {
  return {
    code: record.code,
    name: record.name,
    description: record.description ?? undefined,
    sort: record.sort,
  };
}

export function buildRoleColumns(args: {
  editFormValues: (record: AdminRoleListItem) => void;
  onConfigurePermissions: (record: AdminRoleListItem) => void;
  onToggleStatus: (record: AdminRoleListItem) => void;
  onView: (record: AdminRoleListItem) => void;
}): TableColumnsType<AdminRoleListItem> {
  return [
    {
      title: '角色',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.code}
          </Typography.Text>
        </div>
      ),
    },
    { title: '成员数', dataIndex: 'memberCount', render: formatNumber },
    { title: '权限数', dataIndex: 'permissionCount', render: formatNumber },
    {
      title: '系统角色',
      render: (_, record) => (record.isSystem ? <Tag color="processing">系统内置</Tag> : '-'),
    },
    {
      title: '状态',
      render: (_, record) => (
        <Tag color={getRoleStatusColor(record.status)}>
          {record.status === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>
          <Button
            disabled={record.isSystem}
            size="small"
            type="link"
            onClick={() => args.editFormValues(record)}
          >
            编辑
          </Button>
          <Button
            disabled={record.status !== 'active'}
            size="small"
            type="link"
            onClick={() => args.onConfigurePermissions(record)}
          >
            权限配置
          </Button>
          <Popconfirm
            disabled={record.isSystem && record.status === 'active'}
            title={record.status === 'active' ? '停用角色' : '启用角色'}
            description={
              record.isSystem && record.status === 'active'
                ? '系统内置角色不允许停用。'
                : record.status === 'active'
                  ? '停用后绑定该角色的账号将失去对应角色权限。'
                  : '确认重新启用该角色？'
            }
            okText="确认"
            cancelText="取消"
            onConfirm={() => args.onToggleStatus(record)}
          >
            <Button disabled={record.isSystem && record.status === 'active'} size="small" type="link">
              {record.status === 'active' ? '停用' : '启用'}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];
}

export function collectRolePermissionIds(
  matrix: AdminPermissionMatrixData,
  roleId: EntityId,
): EntityId[] {
  return matrix.modules.flatMap((module) => {
    const cell = module.cells.find((item) => item.roleId === roleId);
    return module.permissions
      .filter((permission) => cell?.permissionCodes.includes(permission.code))
      .map((permission) => permission.id as EntityId);
  });
}

export function getPermissionActionText(action: string) {
  return (
    {
      view: '查看',
      create: '新建',
      edit: '编辑',
      manage: '管理',
      unknown: '未知',
    }[action] ?? action
  );
}
