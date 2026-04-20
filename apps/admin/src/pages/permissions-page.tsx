import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
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
  createAdminPermission,
  fetchAdminPermissions,
  updateAdminPermission,
  updateAdminPermissionStatus,
  type AdminPermissionItem,
} from '../lib/api/system';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface PermissionsPageProps {
  refreshToken?: number;
}

type PermissionFilters = {
  keyword?: string;
  module?: string;
  action?: AdminPermissionItem['action'];
};

type PermissionFormValues = {
  code: string;
  name: string;
  module: string;
  action: Exclude<AdminPermissionItem['action'], 'unknown'>;
  parentId?: `${bigint}`;
  sort?: number;
  status?: 'active' | 'disabled';
};

function actionLabel(action: AdminPermissionItem['action']) {
  if (action === 'view') return '查看';
  if (action === 'create') return '新建';
  if (action === 'edit') return '编辑';
  if (action === 'manage') return '管理';
  return '未知';
}

function actionColor(action: AdminPermissionItem['action']) {
  if (action === 'manage') return 'red';
  if (action === 'edit') return 'processing';
  if (action === 'create') return 'gold';
  if (action === 'view') return 'default';
  return 'default';
}

function statusColor(status: AdminPermissionItem['status']) {
  return status === 'active' ? 'success' : 'default';
}

export function PermissionsPage({ refreshToken = 0 }: PermissionsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<PermissionFilters>();
  const [modalForm] = Form.useForm<PermissionFormValues>();
  const [permissions, setPermissions] = useState<AdminPermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<PermissionFilters>({});
  const [status, setStatus] = useState<'all' | AdminPermissionItem['status']>('all');
  const [selected, setSelected] = useState<AdminPermissionItem | null>(null);
  const [editing, setEditing] = useState<AdminPermissionItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadPermissions() {
    setLoading(true);
    setIssue(null);
    try {
      const result = await fetchAdminPermissions();
      setPermissions(result.items);
    } catch (error) {
      setPermissions([]);
      setIssue(error instanceof Error ? error.message : '权限列表加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPermissions();
  }, [refreshToken]);

  const moduleOptions = useMemo(
    () =>
      Array.from(new Set(permissions.map((item) => item.module))).map((value) => ({
        label: value,
        value,
      })),
    [permissions],
  );

  const actionOptions = [
    { label: '查看', value: 'view' },
    { label: '新建', value: 'create' },
    { label: '编辑', value: 'edit' },
    { label: '管理', value: 'manage' },
  ] satisfies Array<{ label: string; value: AdminPermissionItem['action'] }>;

  const parentOptions = useMemo(
    () =>
      permissions
        .filter((item) => (editing ? item.id !== editing.id : true))
        .map((item) => ({
          label: `${item.name} · ${item.code}`,
          value: item.id,
        })),
    [editing, permissions],
  );

  const filteredPermissions = useMemo(
    () =>
      permissions.filter((item) => {
        if (status !== 'all' && item.status !== status) {
          return false;
        }

        if (
          filters.keyword &&
          ![item.name, item.code]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(filters.keyword!.trim().toLowerCase()),
            )
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
      }),
    [filters, permissions, status],
  );

  const columns: ProColumns<AdminPermissionItem>[] = [
    {
      title: '权限',
      dataIndex: 'name',
      width: 260,
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
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
        <Tag color={actionColor(record.action)}>{actionLabel(record.action)}</Tag>
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
        <Tag color={statusColor(record.status)}>
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
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
          <Button size="small" type="link" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title={record.status === 'active' ? '停用权限' : '启用权限'}
            description={
              record.status === 'active'
                ? '停用后，角色配置中将不能再分配该权限。'
                : '确认重新启用该权限？'
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

  async function handleToggleStatus(record: AdminPermissionItem) {
    try {
      await updateAdminPermissionStatus(record.id, {
        status: record.status === 'active' ? 'disabled' : 'active',
      });
      messageApi.success(record.status === 'active' ? '权限已停用' : '权限已启用');
      await loadPermissions();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '更新权限状态失败');
    }
  }

  function openCreateModal() {
    setEditing(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({
      code: '',
      name: '',
      module: '',
      action: 'view',
      parentId: undefined,
      sort: 0,
      status: 'active',
    });
    setModalOpen(true);
  }

  function openEditModal(record: AdminPermissionItem) {
    setEditing(record);
    modalForm.resetFields();
    modalForm.setFieldsValue({
      code: record.code,
      name: record.name,
      module: record.module,
      action: record.action === 'unknown' ? 'view' : record.action,
      parentId: (record.parentId as `${bigint}` | null) ?? undefined,
      sort: record.sort,
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    try {
      const values = await modalForm.validateFields();
      setSubmitting(true);

      if (editing) {
        await updateAdminPermission(editing.id, {
          code: values.code.trim(),
          name: values.name.trim(),
          module: values.module.trim(),
          action: values.action,
          parentId: values.parentId || null,
          sort: Number(values.sort ?? 0),
        });
        messageApi.success('权限已更新');
      } else {
        await createAdminPermission({
          code: values.code.trim(),
          name: values.name.trim(),
          module: values.module.trim(),
          action: values.action,
          parentId: values.parentId || null,
          sort: Number(values.sort ?? 0),
          status: values.status ?? 'active',
        });
        messageApi.success('权限已创建');
      }

      setModalOpen(false);
      setEditing(null);
      modalForm.resetFields();
      await loadPermissions();
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
        <Form.Item name="keyword">
          <Input allowClear placeholder="权限名称 / 编码" />
        </Form.Item>
        <Form.Item name="module">
          <Select allowClear options={moduleOptions} placeholder="所属模块" />
        </Form.Item>
        <Form.Item name="action">
          <Select allowClear options={actionOptions} placeholder="动作" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
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
        ]}
        onChange={(key) => setStatus(key as 'all' | AdminPermissionItem['status'])}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminPermissionItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredPermissions}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => [
            <Button key="create" type="primary" onClick={openCreateModal}>
              新增
            </Button>,
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
            <Descriptions.Item label="权限名称">{selected.name}</Descriptions.Item>
            <Descriptions.Item label="权限编码">{selected.code}</Descriptions.Item>
            <Descriptions.Item label="所属模块">{selected.module}</Descriptions.Item>
            <Descriptions.Item label="动作">
              <Tag color={actionColor(selected.action)}>{actionLabel(selected.action)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="父权限">{selected.parentName || '-'}</Descriptions.Item>
            <Descriptions.Item label="角色引用">{selected.assignedRoleCount}</Descriptions.Item>
            <Descriptions.Item label="排序">{selected.sort}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColor(selected.status)}>
                {selected.status === 'active' ? '启用' : '停用'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          confirmLoading={submitting}
          destroyOnHidden
          open={modalOpen}
          title={editing ? '编辑权限' : '新增权限'}
          okText="保存"
          cancelText="取消"
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
            modalForm.resetFields();
          }}
          onOk={() => void handleSubmit()}
        >
          <Form form={modalForm} layout="vertical">
            <Form.Item
              label="权限编码"
              name="code"
              rules={[{ required: true, message: '请输入权限编码' }]}
            >
              <Input allowClear placeholder="请输入权限编码" />
            </Form.Item>
            <Form.Item
              label="权限名称"
              name="name"
              rules={[{ required: true, message: '请输入权限名称' }]}
            >
              <Input allowClear placeholder="请输入权限名称" />
            </Form.Item>
            <Form.Item
              label="所属模块"
              name="module"
              rules={[{ required: true, message: '请输入所属模块' }]}
            >
              <Input allowClear placeholder="请输入所属模块" />
            </Form.Item>
            <Form.Item
              label="动作"
              name="action"
              rules={[{ required: true, message: '请选择动作' }]}
            >
              <Select options={actionOptions} placeholder="请选择动作" />
            </Form.Item>
            <Form.Item label="父权限" name="parentId">
              <Select allowClear options={parentOptions} placeholder="请选择父权限" />
            </Form.Item>
            <Form.Item label="排序" name="sort">
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            {!editing ? (
              <Form.Item label="状态" name="status">
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
    </div>
  );
}
