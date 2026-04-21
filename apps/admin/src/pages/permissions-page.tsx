import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminPermissionDetailDrawer } from '../components/admin-permission-detail-drawer';
import { AdminPermissionFormModal } from '../components/admin-permission-form-modal';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import {
  createAdminPermission,
  fetchAdminPermissions,
  updateAdminPermission,
  updateAdminPermissionStatus,
  type AdminPermissionItem,
} from '../lib/api/system';
import {
  buildCreatePermissionFormValues,
  buildEditPermissionFormValues,
  buildPermissionColumns,
  buildPermissionDescendantIdSet,
  buildPermissionModuleOptions,
  buildPermissionParentOptions,
  buildPermissionStatusItems,
  filterPermissions,
  type PermissionFilters,
  type PermissionFormValues,
  PERMISSION_ACTION_OPTIONS,
} from '../lib/admin-permissions';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface PermissionsPageProps {
  refreshToken?: number;
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

  useEffect(() => {
    void loadPermissions();
  }, [refreshToken]);

  const moduleOptions = useMemo(() => buildPermissionModuleOptions(permissions), [permissions]);
  const descendantIdSet = useMemo(
    () => buildPermissionDescendantIdSet(permissions, editing),
    [editing, permissions],
  );
  const parentOptions = useMemo(
    () => buildPermissionParentOptions(permissions, editing, descendantIdSet),
    [descendantIdSet, editing, permissions],
  );
  const filteredPermissions = useMemo(
    () => filterPermissions(permissions, filters, status),
    [filters, permissions, status],
  );
  const columns: ProColumns<AdminPermissionItem>[] = buildPermissionColumns({
    onEdit: (record) => openEditModal(record),
    onToggleStatus: (record) => void handleToggleStatus(record),
    onView: (record) => setSelected(record),
  });

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
          <Select allowClear options={PERMISSION_ACTION_OPTIONS} placeholder="动作" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={buildPermissionStatusItems(permissions)}
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

      <AdminPermissionDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminPermissionFormModal
        editing={editing != null}
        form={modalForm}
        open={modalOpen}
        parentOptions={parentOptions}
        submitting={submitting}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          modalForm.resetFields();
        }}
        onSubmit={() => void handleSubmit()}
      />
    </div>
  );

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
    modalForm.setFieldsValue(buildCreatePermissionFormValues());
    setModalOpen(true);
  }

  function openEditModal(record: AdminPermissionItem) {
    setEditing(record);
    modalForm.resetFields();
    modalForm.setFieldsValue(buildEditPermissionFormValues(record));
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
}
