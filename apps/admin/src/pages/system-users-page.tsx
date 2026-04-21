import { ProTable } from '@ant-design/pro-components';
import { Button, ConfigProvider, Form, message } from 'antd';

import { AdminSystemUserDetailDrawer } from '../components/admin-system-user-detail-drawer';
import { AdminSystemUserFormModal } from '../components/admin-system-user-form-modal';
import { AdminSystemUserPasswordModal } from '../components/admin-system-user-password-modal';
import { AdminSystemUsersFilters } from '../components/admin-system-users-filters';
import { type AdminSystemUserItem } from '../lib/api/system';
import {
  type PasswordFormValues,
  type SystemUserFilters,
  type SystemUserFormValues,
} from '../lib/admin-system-users';
import { useAdminSystemUsersPage } from '../lib/admin-system-users-page';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface SystemUsersPageProps {
  refreshToken?: number;
}

export function SystemUsersPage({ refreshToken = 0 }: SystemUsersPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<SystemUserFilters>();
  const [modalForm] = Form.useForm<SystemUserFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const {
    loading,
    submitting,
    issue,
    roleIssue,
    status,
    selected,
    editing,
    modalOpen,
    passwordTarget,
    columns,
    filteredUsers,
    activeRoleOptions,
    roleFilterOptions,
    statusItems,
    setSelected,
    setFilters,
    resetFilters,
    setStatus,
    openCreateModal,
    closeModal,
    closePasswordModal,
    handleSubmitUser,
    handleResetPassword,
  } = useAdminSystemUsersPage({
    refreshToken,
    modalForm,
    passwordForm,
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
  });

  return (
    <div className="page-stack">
      {contextHolder}
      <AdminSystemUsersFilters
        form={form}
        issue={issue}
        roleIssue={roleIssue}
        roleFilterOptions={roleFilterOptions}
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

      <AdminSystemUserDetailDrawer
        open={selected != null}
        onClose={() => setSelected(null)}
        selected={selected}
      />

      <AdminSystemUserFormModal
        open={modalOpen}
        editing={editing}
        submitting={submitting}
        form={modalForm}
        activeRoleOptions={activeRoleOptions}
        onCancel={closeModal}
        onSubmit={handleSubmitUser}
      />

      <AdminSystemUserPasswordModal
        open={passwordTarget != null}
        username={passwordTarget?.username ?? null}
        submitting={submitting}
        form={passwordForm}
        onCancel={closePasswordModal}
        onSubmit={handleResetPassword}
      />
    </div>
  );
}
