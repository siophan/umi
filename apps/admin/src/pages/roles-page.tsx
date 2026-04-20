import type { EntityId } from '@umi/shared';
import type { TableColumnsType } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Checkbox,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
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
  createAdminRole,
  fetchAdminPermissionsMatrix,
  fetchAdminRoles,
  updateAdminRole,
  updateAdminRolePermissions,
  updateAdminRoleStatus,
  type AdminPermissionMatrixData,
  type AdminRoleListItem,
} from '../lib/api/system';
import { formatDateTime, formatNumber } from '../lib/format';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface RolesPageProps {
  refreshToken?: number;
}

type RoleFilters = {
  name?: string;
};

type RoleFormValues = {
  code: string;
  name: string;
  description?: string;
  sort?: number;
};

function getRoleStatusColor(status: AdminRoleListItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

export function RolesPage({ refreshToken = 0 }: RolesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<RoleFilters>();
  const [roles, setRoles] = useState<AdminRoleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<RoleFilters>({});
  const [status, setStatus] = useState<'all' | AdminRoleListItem['status']>('all');
  const [selected, setSelected] = useState<AdminRoleListItem | null>(null);
  const [permissionMatrix, setPermissionMatrix] = useState<AdminPermissionMatrixData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSubmitting, setPermissionSubmitting] = useState(false);
  const [editingPermissionsRole, setEditingPermissionsRole] = useState<AdminRoleListItem | null>(null);
  const [checkedPermissionIds, setCheckedPermissionIds] = useState<EntityId[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm] = Form.useForm<{ code: string; name: string; description?: string; sort?: number; status: 'active' | 'disabled' }>();
  const [editingRole, setEditingRole] = useState<AdminRoleListItem | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm] = Form.useForm<RoleFormValues>();

  useEffect(() => {
    let alive = true;

    async function loadRoles() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminRoles();
        if (!alive) {
          return;
        }
        setRoles(result.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRoles([]);
        setIssue(error instanceof Error ? error.message : '角色列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadRoles();

    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const filteredRoles = useMemo(
    () =>
      roles.filter((item) => {
        if (status !== 'all' && item.status !== status) {
          return false;
        }
        if (
          filters.name &&
          ![item.name, item.code]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(filters.name!.trim().toLowerCase()),
            )
        ) {
          return false;
        }
        return true;
      }),
    [filters, roles, status],
  );

  const columns: TableColumnsType<AdminRoleListItem> = [
    {
      title: '角色',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">{record.code}</Typography.Text>
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
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
          <Button
            disabled={record.isSystem}
            size="small"
            type="link"
            onClick={() => {
              editForm.setFieldsValue({
                code: record.code,
                name: record.name,
                description: record.description ?? undefined,
                sort: record.sort,
              });
              setEditingRole(record);
            }}
          >
            编辑
          </Button>
          <Button
            disabled={record.status !== 'active'}
            size="small"
            type="link"
            onClick={() => void openPermissionModal(record)}
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
            onConfirm={() => void handleToggleStatus(record)}
          >
            <Button disabled={record.isSystem && record.status === 'active'} size="small" type="link">
              {record.status === 'active' ? '停用' : '启用'}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  async function reloadRoles() {
    setLoading(true);
    setIssue(null);
    try {
      const result = await fetchAdminRoles();
      setRoles(result.items);
    } catch (error) {
      setRoles([]);
      setIssue(error instanceof Error ? error.message : '角色列表加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function openPermissionModal(record: AdminRoleListItem) {
    if (record.status !== 'active') {
      messageApi.warning('请先启用该角色，再进行权限配置');
      return;
    }

    setEditingPermissionsRole(record);
    setPermissionLoading(true);
    try {
      const result = await fetchAdminPermissionsMatrix();
      setPermissionMatrix(result);
      const permissionIds = result.modules.flatMap((module) => {
        const cell = module.cells.find((item) => item.roleId === record.id);
        return module.permissions
          .filter((permission) => cell?.permissionCodes.includes(permission.code))
          .map((permission) => permission.id as EntityId);
      });
      setCheckedPermissionIds(permissionIds);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '权限矩阵加载失败');
      setEditingPermissionsRole(null);
      setPermissionMatrix(null);
      setCheckedPermissionIds([]);
    } finally {
      setPermissionLoading(false);
    }
  }

  async function handleSubmitPermissions() {
    if (!editingPermissionsRole) {
      return;
    }

    try {
      setPermissionSubmitting(true);
      await updateAdminRolePermissions(editingPermissionsRole.id, {
        permissionIds: checkedPermissionIds,
      });
      messageApi.success('角色权限已更新');
      setEditingPermissionsRole(null);
      setPermissionMatrix(null);
      setCheckedPermissionIds([]);
      await reloadRoles();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '更新角色权限失败');
    } finally {
      setPermissionSubmitting(false);
    }
  }

  async function handleCreateRole() {
    try {
      const values = await createForm.validateFields();
      setCreateSubmitting(true);
      await createAdminRole({
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        sort: Number(values.sort ?? 0),
        status: values.status,
      });
      messageApi.success('角色已创建');
      setCreateModalOpen(false);
      createForm.resetFields();
      await reloadRoles();
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleUpdateRole() {
    if (!editingRole) {
      return;
    }

    try {
      const values = await editForm.validateFields();
      setEditSubmitting(true);
      await updateAdminRole(editingRole.id, {
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        sort: Number(values.sort ?? 0),
      });
      messageApi.success('角色已更新');
      setEditingRole(null);
      editForm.resetFields();
      await reloadRoles();
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleToggleStatus(record: AdminRoleListItem) {
    try {
      await updateAdminRoleStatus(record.id, {
        status: record.status === 'active' ? 'disabled' : 'active',
      });
      messageApi.success(record.status === 'active' ? '角色已停用' : '角色已启用');
      await reloadRoles();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '更新角色状态失败');
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
        <Form.Item name="name">
          <Input allowClear placeholder="角色名称 / 编码" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
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
        ]}
        onChange={(key) => setStatus(key as 'all' | AdminRoleListItem['status'])}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminRoleListItem>
          cardBordered={false}
          rowKey="id"
          columns={columns as never}
          columnsState={{}}
          dataSource={filteredRoles}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => [
            <Button key="create" type="primary" onClick={() => {
              createForm.resetFields();
              createForm.setFieldsValue({ status: 'active', sort: 0 });
              setCreateModalOpen(true);
            }}>新增角色</Button>,
          ]}
        />
      </ConfigProvider>

      <Drawer
        open={selected != null}
        width={460}
        title={selected?.name}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="角色名称">{selected.name}</Descriptions.Item>
            <Descriptions.Item label="角色编码">{selected.code}</Descriptions.Item>
            <Descriptions.Item label="角色说明">
              {selected.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="权限范围">{selected.permissionRange}</Descriptions.Item>
            <Descriptions.Item label="权限模块">
              {selected.permissionModules.length > 0
                ? selected.permissionModules.join(' / ')
                : '未配置权限'}
            </Descriptions.Item>
            <Descriptions.Item label="成员数">{selected.memberCount}</Descriptions.Item>
            <Descriptions.Item label="权限数">{selected.permissionCount}</Descriptions.Item>
            <Descriptions.Item label="排序">{selected.sort}</Descriptions.Item>
            <Descriptions.Item label="系统角色">
              {selected.isSystem ? '是' : '否'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getRoleStatusColor(selected.status)}>
                {selected.status === 'active' ? '启用' : '停用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(selected.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {formatDateTime(selected.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          destroyOnHidden
          open={createModalOpen}
          title="新增角色"
          okText="创建"
          cancelText="取消"
          confirmLoading={createSubmitting}
          onOk={() => void handleCreateRole()}
          onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        >
          <Form form={createForm} layout="vertical">
            <Form.Item label="角色编码" name="code" rules={[{ required: true, message: '请输入角色编码' }]}>
              <Input allowClear placeholder="例如：operator" />
            </Form.Item>
            <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
              <Input allowClear placeholder="例如：运营" />
            </Form.Item>
            <Form.Item label="说明" name="description">
              <Input.TextArea allowClear placeholder="可选" rows={2} />
            </Form.Item>
            <Form.Item label="排序" name="sort">
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="状态" name="status">
              <Select options={[{ label: '启用', value: 'active' }, { label: '停用', value: 'disabled' }]} />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>

      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          destroyOnHidden
          open={editingRole != null}
          title={editingRole ? `编辑角色 · ${editingRole.name}` : '编辑角色'}
          okText="保存"
          cancelText="取消"
          confirmLoading={editSubmitting}
          onOk={() => void handleUpdateRole()}
          onCancel={() => {
            setEditingRole(null);
            editForm.resetFields();
          }}
        >
          <Form form={editForm} layout="vertical">
            <Form.Item label="角色编码" name="code" rules={[{ required: true, message: '请输入角色编码' }]}>
              <Input allowClear placeholder="例如：operator" />
            </Form.Item>
            <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
              <Input allowClear placeholder="例如：运营" />
            </Form.Item>
            <Form.Item label="说明" name="description">
              <Input.TextArea allowClear placeholder="可选" rows={2} />
            </Form.Item>
            <Form.Item label="排序" name="sort">
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>

      <Modal
        destroyOnHidden
        open={editingPermissionsRole != null}
        title={editingPermissionsRole ? `权限配置 · ${editingPermissionsRole.name}` : '权限配置'}
        width={760}
        okText="保存"
        cancelText="取消"
        confirmLoading={permissionSubmitting}
        onOk={() => void handleSubmitPermissions()}
        onCancel={() => {
          setEditingPermissionsRole(null);
          setPermissionMatrix(null);
          setCheckedPermissionIds([]);
        }}
      >
        <ConfigProvider theme={SEARCH_THEME}>
          {permissionLoading ? (
            <Typography.Text type="secondary">权限矩阵加载中...</Typography.Text>
          ) : permissionMatrix ? (
            <div style={{ display: 'grid', gap: 16, maxHeight: 560, overflowY: 'auto' }}>
              {permissionMatrix.modules.map((module) => (
                <div
                  key={module.module}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Typography.Text strong>{module.module}</Typography.Text>
                  <div style={{ marginTop: 12 }}>
	                    <Checkbox.Group
	                      options={module.permissions.map((permission) => ({
	                        label: `${permission.name}（${{ view: '查看', create: '新建', edit: '编辑', manage: '管理', unknown: '未知' }[permission.action] ?? permission.action}）`,
	                        value: permission.id,
	                      }))}
                      value={checkedPermissionIds}
                      onChange={(values) => {
                        const currentIds = module.permissions.map((permission) => permission.id as EntityId);
                        const retainedIds = checkedPermissionIds.filter((id) => !currentIds.includes(id));
                        setCheckedPermissionIds([
                          ...retainedIds,
                          ...(values as EntityId[]),
                        ]);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Typography.Text type="secondary">暂无可配置权限</Typography.Text>
          )}
        </ConfigProvider>
      </Modal>
    </div>
  );
}
