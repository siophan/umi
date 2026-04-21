import type { ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, Typography } from 'antd';

import type { AdminPermissionItem } from './api/system';

export type PermissionFilters = {
  keyword?: string;
  module?: string;
  action?: AdminPermissionItem['action'];
};

export type PermissionFormValues = {
  code: string;
  name: string;
  module: string;
  action: Exclude<AdminPermissionItem['action'], 'unknown'>;
  parentId?: `${bigint}`;
  sort?: number;
  status?: 'active' | 'disabled';
};

export const PERMISSION_ACTION_OPTIONS = [
  { label: '查看', value: 'view' },
  { label: '新建', value: 'create' },
  { label: '编辑', value: 'edit' },
  { label: '管理', value: 'manage' },
] satisfies Array<{ label: string; value: AdminPermissionItem['action'] }>;

export function getPermissionActionLabel(action: AdminPermissionItem['action']) {
  if (action === 'view') return '查看';
  if (action === 'create') return '新建';
  if (action === 'edit') return '编辑';
  if (action === 'manage') return '管理';
  return '未知';
}

export function getPermissionActionColor(action: AdminPermissionItem['action']) {
  if (action === 'manage') return 'red';
  if (action === 'edit') return 'processing';
  if (action === 'create') return 'gold';
  return 'default';
}

export function getPermissionStatusColor(status: AdminPermissionItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

export function buildPermissionModuleOptions(permissions: AdminPermissionItem[]) {
  return Array.from(new Set(permissions.map((item) => item.module))).map((value) => ({
    label: value,
    value,
  }));
}

export function buildPermissionDescendantIdSet(
  permissions: AdminPermissionItem[],
  editing: AdminPermissionItem | null,
) {
  if (!editing) {
    return new Set<string>();
  }

  const childrenByParent = new Map<string, string[]>();
  for (const item of permissions) {
    if (!item.parentId) {
      continue;
    }
    const siblings = childrenByParent.get(item.parentId) ?? [];
    siblings.push(item.id);
    childrenByParent.set(item.parentId, siblings);
  }

  const descendants = new Set<string>();
  const queue = [editing.id];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }
    const children = childrenByParent.get(currentId) ?? [];
    for (const childId of children) {
      if (descendants.has(childId)) {
        continue;
      }
      descendants.add(childId);
      queue.push(childId);
    }
  }
  return descendants;
}

export function buildPermissionParentOptions(
  permissions: AdminPermissionItem[],
  editing: AdminPermissionItem | null,
  descendantIdSet: Set<string>,
) {
  return permissions
    .filter((item) => (editing ? item.id !== editing.id && !descendantIdSet.has(item.id) : true))
    .map((item) => ({
      label: `${item.name} · ${item.code}`,
      value: item.id,
    }));
}

export function filterPermissions(
  permissions: AdminPermissionItem[],
  filters: PermissionFilters,
  status: 'all' | AdminPermissionItem['status'],
) {
  return permissions.filter((item) => {
    if (status !== 'all' && item.status !== status) {
      return false;
    }

    if (
      filters.keyword &&
      ![item.name, item.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(filters.keyword!.trim().toLowerCase()))
    ) {
      return false;
    }

    if (filters.module && item.module !== filters.module) {
      return false;
    }

    if (filters.action && item.action !== filters.action) {
      return false;
    }

    return true;
  });
}

export function buildPermissionStatusItems(permissions: AdminPermissionItem[]) {
  return [
    { key: 'all', label: '全部', count: permissions.length },
    {
      key: 'active',
      label: '启用',
      count: permissions.filter((item) => item.status === 'active').length,
    },
    {
      key: 'disabled',
      label: '停用',
      count: permissions.filter((item) => item.status === 'disabled').length,
    },
  ];
}

export function buildCreatePermissionFormValues(): PermissionFormValues {
  return {
    code: '',
    name: '',
    module: '',
    action: 'view',
    parentId: undefined,
    sort: 0,
    status: 'active',
  };
}

export function buildEditPermissionFormValues(record: AdminPermissionItem): PermissionFormValues {
  return {
    code: record.code,
    name: record.name,
    module: record.module,
    action: record.action === 'unknown' ? 'view' : record.action,
    parentId: (record.parentId as `${bigint}` | null) ?? undefined,
    sort: record.sort,
  };
}

export function buildPermissionColumns(args: {
  onEdit: (record: AdminPermissionItem) => void;
  onToggleStatus: (record: AdminPermissionItem) => void;
  onView: (record: AdminPermissionItem) => void;
}): ProColumns<AdminPermissionItem>[] {
  return [
    {
      title: '权限',
      dataIndex: 'name',
      width: 260,
      render: (_, record) => (
        <div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
            <Typography.Text strong>{record.name}</Typography.Text>
            {record.isBuiltIn ? <Tag color="processing">内置</Tag> : null}
          </div>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '所属模块',
      dataIndex: 'module',
      width: 180,
    },
    {
      title: '动作',
      dataIndex: 'action',
      width: 120,
      render: (_, record) => (
        <Tag color={getPermissionActionColor(record.action)}>
          {getPermissionActionLabel(record.action)}
        </Tag>
      ),
    },
    {
      title: '父权限',
      dataIndex: 'parentName',
      width: 180,
      render: (_, record) => record.parentName || '-',
    },
    {
      title: '角色引用',
      dataIndex: 'assignedRoleCount',
      width: 120,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={getPermissionStatusColor(record.status)}>
          {record.status === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>
          <Button
            disabled={record.isBuiltIn}
            size="small"
            type="link"
            onClick={() => args.onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title={record.status === 'active' ? '停用权限' : '启用权限'}
            description={
              record.status === 'active'
                ? '停用后，当前权限及其子权限都会一并失效，角色访问会同步收口。'
                : '确认重新启用该权限？'
            }
            okText="确认"
            cancelText="取消"
            onConfirm={() => args.onToggleStatus(record)}
          >
            <Button size="small" type="link">
              {record.status === 'active' ? '停用' : '启用'}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];
}
