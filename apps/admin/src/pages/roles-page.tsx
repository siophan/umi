import type { EntityId } from '@umi/shared';
import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Form, message } from 'antd';

import { AdminRoleDetailDrawer } from '../components/admin-role-detail-drawer';
import { AdminRoleFormModal } from '../components/admin-role-form-modal';
import { AdminRolePermissionModal } from '../components/admin-role-permission-modal';
import { AdminRolesFilters } from '../components/admin-roles-filters';
import { type AdminRoleListItem } from '../lib/api/system';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  type CreateRoleFormValues,
  type RoleFilters,
  type RoleFormValues,
} from '../lib/admin-roles';
import { useAdminRolesPage } from '../lib/admin-roles-page';

interface RolesPageProps {
  refreshToken?: number;
}

export function RolesPage({ refreshToken = 0 }: RolesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<RoleFilters>();
  const [createForm] = Form.useForm<CreateRoleFormValues>();
  const [editForm] = Form.useForm<RoleFormValues>();
  const {
    loading,
    issue,
    status,
    selected,
    permissionMatrix,
    permissionLoading,
    permissionSubmitting,
    editingPermissionsRole,
    checkedPermissionIds,
    createModalOpen,
    createSubmitting,
    editingRole,
    editSubmitting,
    filteredRoles,
    statusItems,
    columns,
    setFilters,
    resetFilters,
    setStatus,
    setSelected,
    setCheckedPermissionIds,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
    closePermissionsModal,
    handleSubmitPermissions,
    handleCreateRole,
    handleUpdateRole,
  } = useAdminRolesPage({
    refreshToken,
    createForm,
    editForm,
    onSuccess: (successMessage) => {
      messageApi.success(successMessage);
    },
    onError: (error, fallbackMessage) => {
      if (error instanceof Error) {
        messageApi.error(error.message);
        return;
      }
      messageApi.error(fallbackMessage);
    },
    onWarn: (warningMessage) => {
      messageApi.warning(warningMessage);
    },
  });

  return (
    <div className="page-stack">
      {contextHolder}
      <AdminRolesFilters
        form={form}
        issue={issue}
        status={status}
        statusItems={statusItems}
        onSearch={() => setFilters(form.getFieldsValue())}
        onReset={() => {
          form.resetFields();
          resetFilters();
        }}
        onStatusChange={setStatus}
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
            <Button
              key="create"
              type="primary"
              onClick={openCreateModal}
            >
              新增角色
            </Button>,
          ]}
        />
      </ConfigProvider>

      <AdminRoleDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminRoleFormModal
        create
        form={createForm}
        open={createModalOpen}
        submitting={createSubmitting}
        title="新增角色"
        onSubmit={() => void handleCreateRole()}
        onCancel={closeCreateModal}
      />

      <AdminRoleFormModal
        create={false}
        form={editForm}
        open={editingRole != null}
        submitting={editSubmitting}
        title={editingRole ? `编辑角色 · ${editingRole.name}` : '编辑角色'}
        onSubmit={() => void handleUpdateRole()}
        onCancel={closeEditModal}
      />

      <AdminRolePermissionModal
        checkedPermissionIds={checkedPermissionIds}
        open={editingPermissionsRole != null}
        permissionLoading={permissionLoading}
        permissionMatrix={permissionMatrix}
        permissionSubmitting={permissionSubmitting}
        role={editingPermissionsRole}
        onSubmit={() => void handleSubmitPermissions()}
        onCancel={closePermissionsModal}
        onChange={(values, currentModuleIds) => {
          const retainedIds = checkedPermissionIds.filter((id) => !currentModuleIds.includes(id));
          setCheckedPermissionIds([...retainedIds, ...values]);
        }}
      />
    </div>
  );
}
