import type { TableColumnsType } from 'antd';
import { Button, Popconfirm, Tag, Typography } from 'antd';

import { formatDateTime } from './format';
import type { AdminRoleListItem, AdminSystemUserItem } from './api/system';

export type SystemUserFilters = {
  username?: string;
  role?: string;
  status?: string;
};

export type SystemUserFormValues = {
  username: string;
  displayName: string;
  password?: string;
  phoneNumber?: string;
  email?: string;
  roleIds: AdminSystemUserItem['roleIds'];
  status?: 'active' | 'disabled';
};

export type PasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export function getSystemUserStatusColor(status: AdminSystemUserItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

export function buildSystemUserStatusItems(users: AdminSystemUserItem[]) {
  return [
    { key: 'all', label: '全部', count: users.length },
    {
      key: 'active',
      label: '启用',
      count: users.filter((item) => item.status === 'active').length,
    },
    {
      key: 'disabled',
      label: '停用',
      count: users.filter((item) => item.status === 'disabled').length,
    },
  ] satisfies Array<{ key: 'all' | AdminSystemUserItem['status']; label: string; count: number }>;
}

export function buildActiveRoleOptions(roles: AdminRoleListItem[]) {
  return roles
    .filter((item) => item.status === 'active')
    .map((item) => ({
      label: item.name,
      value: item.id,
    }));
}

export function buildRoleFilterOptions(
  roles: AdminRoleListItem[],
  users: AdminSystemUserItem[],
) {
  const referencedRoleCodes = new Set(users.flatMap((item) => item.roleCodes));
  return roles
    .filter((item) => item.status === 'active' || referencedRoleCodes.has(item.code))
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === 'active' ? -1 : 1;
      }
      return left.name.localeCompare(right.name, 'zh-CN');
    })
    .map((item) => ({
      label: item.status === 'active' ? item.name : `${item.name}（已停用）`,
      value: item.code,
    }));
}

export function buildSystemUserColumns(args: {
  currentAdminId: string | null;
  onView: (record: AdminSystemUserItem) => void;
  onEdit: (record: AdminSystemUserItem) => void;
  onResetPassword: (record: AdminSystemUserItem) => void;
  onToggleStatus: (record: AdminSystemUserItem) => void | Promise<void>;
}): TableColumnsType<AdminSystemUserItem> {
  return [
    {
      title: '账号',
      width: 220,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.username}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.displayName}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '角色',
      width: 220,
      render: (_, record) => record.role || '未分配角色',
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      width: 150,
      render: (value) => value || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 220,
      render: (value) => value || '-',
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => (
        <Tag color={getSystemUserStatusColor(record.status)}>
          {record.status === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '最近登录',
      dataIndex: 'lastLoginAt',
      width: 180,
      render: (value) => (value ? formatDateTime(value) : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>
          <Button size="small" type="link" onClick={() => args.onEdit(record)}>
            编辑
          </Button>
          <Button size="small" type="link" onClick={() => args.onResetPassword(record)}>
            重置密码
          </Button>
          {record.id === args.currentAdminId && record.status === 'active' ? (
            <Typography.Text type="secondary">当前账号</Typography.Text>
          ) : (
            <Popconfirm
              title={record.status === 'active' ? '停用账号' : '启用账号'}
              description={
                record.status === 'active'
                  ? '停用后该后台账号将无法登录管理后台。'
                  : '确认重新启用该后台账号？'
              }
              okText="确认"
              cancelText="取消"
              onConfirm={() => void args.onToggleStatus(record)}
            >
              <Button size="small" type="link">
                {record.status === 'active' ? '停用' : '启用'}
              </Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];
}

export function buildCreateSystemUserFormValues(): SystemUserFormValues {
  return {
    username: '',
    displayName: '',
    phoneNumber: '',
    email: '',
    roleIds: [],
    status: 'active',
  };
}

export function buildEditSystemUserFormValues(record: AdminSystemUserItem): SystemUserFormValues {
  return {
    username: record.username,
    displayName: record.displayName,
    phoneNumber: record.phoneNumber ?? undefined,
    email: record.email ?? undefined,
    roleIds: record.roleIds,
  };
}
