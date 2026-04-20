import type { TableColumnsType } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  AdminSearchPanel,
  AdminStatusTabs,
  SEARCH_THEME,
} from '../components/admin-list-controls';
import {
  createAdminSystemUser,
  fetchAdminRoles,
  fetchAdminSystemUsers,
  resetAdminSystemUserPassword,
  updateAdminSystemUser,
  updateAdminSystemUserStatus,
  type AdminRoleListItem,
  type AdminSystemUserItem,
} from '../lib/api/system';
import { formatDateTime } from '../lib/format';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface SystemUsersPageProps {
  refreshToken?: number;
}

type SystemUserFilters = {
  username?: string;
  role?: string;
  status?: string;
};

type SystemUserFormValues = {
  username: string;
  displayName: string;
  password?: string;
  phoneNumber?: string;
  email?: string;
  roleIds: AdminSystemUserItem['roleIds'];
  status?: 'active' | 'disabled';
};

type PasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

function getStatusColor(status: AdminSystemUserItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

export function SystemUsersPage({ refreshToken = 0 }: SystemUsersPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<SystemUserFilters>();
  const [modalForm] = Form.useForm<SystemUserFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [users, setUsers] = useState<AdminSystemUserItem[]>([]);
  const [roles, setRoles] = useState<AdminRoleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<SystemUserFilters>({});
  const [status, setStatus] = useState<'all' | AdminSystemUserItem['status']>('all');
  const [selected, setSelected] = useState<AdminSystemUserItem | null>(null);
  const [editing, setEditing] = useState<AdminSystemUserItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<AdminSystemUserItem | null>(null);

  async function loadPage() {
    setLoading(true);
    setIssue(null);
    try {
      const [usersResult, rolesResult] = await Promise.all([
        fetchAdminSystemUsers(),
        fetchAdminRoles(),
      ]);
      setUsers(usersResult.items);
      setRoles(rolesResult.items);
    } catch (error) {
      setUsers([]);
      setRoles([]);
      setIssue(error instanceof Error ? error.message : '系统用户加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [refreshToken]);

  const activeRoleOptions = useMemo(
    () =>
      roles
        .filter((item) => item.status === 'active')
        .map((item) => ({
          label: item.name,
          value: item.id,
        })),
    [roles],
  );

  const roleFilterOptions = useMemo(
    () =>
      roles
        .filter((item) => item.status === 'active')
        .map((item) => ({
          label: item.name,
          value: item.code,
        })),
    [roles],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((item) => {
        if (status !== 'all' && item.status !== status) {
          return false;
        }
        if (
          filters.username &&
          ![item.username, item.displayName]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(filters.username!.trim().toLowerCase()),
            )
        ) {
          return false;
        }
        if (filters.role && !item.roleCodes.includes(filters.role)) {
          return false;
        }
        if (filters.status && item.status !== filters.status) {
          return false;
        }
        return true;
      }),
    [filters, status, users],
  );

  const columns: TableColumnsType<AdminSystemUserItem> = [
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
        <Tag color={getStatusColor(record.status)}>
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
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
          <Button size="small" type="link" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button size="small" type="link" onClick={() => openPasswordModal(record)}>
            重置密码
          </Button>
          <Popconfirm
            title={record.status === 'active' ? '停用账号' : '启用账号'}
            description={
              record.status === 'active'
                ? '停用后该后台账号将无法登录管理后台。'
                : '确认重新启用该后台账号？'
            }
            okText="确认"
            cancelText="取消"
            onConfirm={() => void handleToggleStatus(record)}
          >
            <Button size="small" type="link">
              {record.status === 'active' ? '停用' : '启用'}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  function openCreateModal() {
    setEditing(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({
      username: '',
      displayName: '',
      phoneNumber: '',
      email: '',
      roleIds: [],
      status: 'active',
    });
    setModalOpen(true);
  }

  function openEditModal(record: AdminSystemUserItem) {
    setEditing(record);
    modalForm.resetFields();
    modalForm.setFieldsValue({
      username: record.username,
      displayName: record.displayName,
      phoneNumber: record.phoneNumber ?? undefined,
      email: record.email ?? undefined,
      roleIds: record.roleIds,
    });
    setModalOpen(true);
  }

  function openPasswordModal(record: AdminSystemUserItem) {
    passwordForm.resetFields();
    setPasswordTarget(record);
  }

  async function handleToggleStatus(record: AdminSystemUserItem) {
    try {
      await updateAdminSystemUserStatus(record.id, {
        status: record.status === 'active' ? 'disabled' : 'active',
      });
      messageApi.success(record.status === 'active' ? '系统用户已停用' : '系统用户已启用');
      await loadPage();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '更新系统用户状态失败');
    }
  }

  async function handleSubmitUser() {
    try {
      const values = await modalForm.validateFields();
      setSubmitting(true);

      if (editing) {
        await updateAdminSystemUser(editing.id, {
          username: values.username.trim(),
          displayName: values.displayName.trim(),
          phoneNumber: values.phoneNumber?.trim() || null,
          email: values.email?.trim() || null,
          roleIds: values.roleIds,
        });
        messageApi.success('系统用户已更新');
      } else {
        await createAdminSystemUser({
          username: values.username.trim(),
          password: values.password ?? '',
          displayName: values.displayName.trim(),
          phoneNumber: values.phoneNumber?.trim() || null,
          email: values.email?.trim() || null,
          roleIds: values.roleIds,
          status: values.status ?? 'active',
        });
        messageApi.success('系统用户已创建');
      }

      setModalOpen(false);
      modalForm.resetFields();
      setEditing(null);
      await loadPage();
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!passwordTarget) {
      return;
    }

    try {
      const values = await passwordForm.validateFields();
      setSubmitting(true);
      await resetAdminSystemUserPassword(passwordTarget.id, {
        newPassword: values.newPassword,
      });
      messageApi.success('系统用户密码已重置');
      setPasswordTarget(null);
      passwordForm.resetFields();
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={form}
        onSearch={() => setFilters(form.getFieldsValue())}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="username">
          <Input allowClear placeholder="系统用户名 / 显示名" />
        </Form.Item>
        <Form.Item name="role">
          <Select allowClear options={roleFilterOptions} placeholder="角色" />
        </Form.Item>
        <Form.Item name="status">
          <Select
            allowClear
            options={[
              { label: '启用', value: 'active' },
              { label: '停用', value: 'disabled' },
            ]}
            placeholder="状态"
          />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
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
        ]}
        onChange={(key) => setStatus(key as 'all' | AdminSystemUserItem['status'])}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminSystemUserItem>
          cardBordered={false}
          rowKey="id"
          columns={columns as never}
          columnsState={{}}
          dataSource={filteredUsers}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => [
            <Button key="add" type="primary" onClick={openCreateModal}>
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        width={460}
        title={selected?.username}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="账号">{selected.username}</Descriptions.Item>
            <Descriptions.Item label="显示名">{selected.displayName}</Descriptions.Item>
            <Descriptions.Item label="角色">{selected.role}</Descriptions.Item>
            <Descriptions.Item label="角色编码">
              {selected.roleCodes.length > 0 ? selected.roleCodes.join(' / ') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              {selected.phoneNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              {selected.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(selected.status)}>
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

      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          confirmLoading={submitting}
          destroyOnHidden
          open={modalOpen}
          title={editing ? '编辑系统用户' : '新增系统用户'}
          okText={editing ? '保存' : '创建'}
          cancelText="取消"
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
            modalForm.resetFields();
          }}
          onOk={() => void handleSubmitUser()}
        >
          <Form form={modalForm} layout="vertical">
            <Form.Item
              label="系统用户名"
              name="username"
              rules={[{ required: true, message: '请输入系统用户名' }]}
            >
              <Input maxLength={50} placeholder="请输入系统用户名" />
            </Form.Item>
            <Form.Item
              label="显示名称"
              name="displayName"
              rules={[{ required: true, message: '请输入显示名称' }]}
            >
              <Input maxLength={50} placeholder="请输入显示名称" />
            </Form.Item>
            {!editing ? (
              <Form.Item
                label="登录密码"
                name="password"
                rules={[
                  { required: true, message: '请输入登录密码' },
                  { min: 6, message: '密码长度不能少于 6 位' },
                ]}
              >
                <Input.Password placeholder="请输入登录密码" />
              </Form.Item>
            ) : null}
            <Form.Item
              label="角色"
              name="roleIds"
              rules={[{ required: true, message: '请至少选择一个角色' }]}
            >
              <Select
                mode="multiple"
                options={activeRoleOptions}
                placeholder="请选择角色"
              />
            </Form.Item>
            <Form.Item label="手机号" name="phoneNumber">
              <Input maxLength={20} placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item label="邮箱" name="email">
              <Input maxLength={100} placeholder="请输入邮箱" />
            </Form.Item>
            {!editing ? (
              <Form.Item label="初始状态" name="status">
                <Select
                  options={[
                    { label: '启用', value: 'active' },
                    { label: '停用', value: 'disabled' },
                  ]}
                />
              </Form.Item>
            ) : null}
          </Form>
        </Modal>
      </ConfigProvider>

      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          confirmLoading={submitting}
          destroyOnHidden
          open={passwordTarget != null}
          title={passwordTarget ? `重置密码 · ${passwordTarget.username}` : '重置密码'}
          okText="确认重置"
          cancelText="取消"
          onCancel={() => {
            setPasswordTarget(null);
            passwordForm.resetFields();
          }}
          onOk={() => void handleResetPassword()}
        >
          <Form form={passwordForm} layout="vertical">
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度不能少于 6 位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请再次输入新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
}
