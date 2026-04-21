import type { FormInstance } from 'antd';

import { useEffect, useMemo, useState } from 'react';

import { fetchMe } from './api/auth';
import {
  createAdminSystemUser,
  fetchAdminRoles,
  fetchAdminSystemUsers,
  resetAdminSystemUserPassword,
  updateAdminSystemUser,
  updateAdminSystemUserStatus,
  type AdminRoleListItem,
  type AdminSystemUserItem,
} from './api/system';
import {
  type PasswordFormValues,
  type SystemUserFilters,
  type SystemUserFormValues,
  buildActiveRoleOptions,
  buildCreateSystemUserFormValues,
  buildEditSystemUserFormValues,
  buildRoleFilterOptions,
  buildSystemUserColumns,
  buildSystemUserStatusItems,
} from './admin-system-users';

interface UseAdminSystemUsersPageOptions {
  refreshToken?: number;
  modalForm: FormInstance<SystemUserFormValues>;
  passwordForm: FormInstance<PasswordFormValues>;
  onSuccess: (message: string) => void;
  onError: (error: unknown, fallbackMessage: string) => void;
}

export interface AdminSystemUsersPageState {
  users: AdminSystemUserItem[];
  roles: AdminRoleListItem[];
  loading: boolean;
  submitting: boolean;
  issue: string | null;
  roleIssue: string | null;
  filters: SystemUserFilters;
  status: 'all' | AdminSystemUserItem['status'];
  selected: AdminSystemUserItem | null;
  editing: AdminSystemUserItem | null;
  modalOpen: boolean;
  passwordTarget: AdminSystemUserItem | null;
  currentAdminId: string | null;
  columns: ReturnType<typeof buildSystemUserColumns>;
  filteredUsers: AdminSystemUserItem[];
  activeRoleOptions: Array<{ label: string; value: string }>;
  roleFilterOptions: Array<{ label: string; value: string }>;
  statusItems: ReturnType<typeof buildSystemUserStatusItems>;
  setSelected: (selected: AdminSystemUserItem | null) => void;
  setFilters: (filters: SystemUserFilters) => void;
  resetFilters: () => void;
  setStatus: (status: 'all' | AdminSystemUserItem['status']) => void;
  openCreateModal: () => void;
  openEditModal: (record: AdminSystemUserItem) => void;
  closeModal: () => void;
  openPasswordModal: (record: AdminSystemUserItem) => void;
  closePasswordModal: () => void;
  handleSubmitUser: () => Promise<void>;
  handleResetPassword: () => Promise<void>;
  reloadPage: () => Promise<void>;
}

export function useAdminSystemUsersPage({
  refreshToken = 0,
  modalForm,
  passwordForm,
  onSuccess,
  onError,
}: UseAdminSystemUsersPageOptions): AdminSystemUsersPageState {
  const [users, setUsers] = useState<AdminSystemUserItem[]>([]);
  const [roles, setRoles] = useState<AdminRoleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [roleIssue, setRoleIssue] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SystemUserFilters>({});
  const [status, setStatus] = useState<'all' | AdminSystemUserItem['status']>('all');
  const [selected, setSelected] = useState<AdminSystemUserItem | null>(null);
  const [editing, setEditing] = useState<AdminSystemUserItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<AdminSystemUserItem | null>(null);

  async function loadPage() {
    setLoading(true);
    setIssue(null);
    setRoleIssue(null);
    try {
      const [usersResult, rolesResult] = await Promise.allSettled([
        fetchAdminSystemUsers(),
        fetchAdminRoles(),
      ]);

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value.items);
      } else {
        setUsers([]);
        setRoles([]);
        setIssue(usersResult.reason instanceof Error ? usersResult.reason.message : '系统用户加载失败');
        return;
      }

      if (rolesResult.status === 'fulfilled') {
        setRoles(rolesResult.value.items);
      } else {
        setRoles([]);
        setRoleIssue(rolesResult.reason instanceof Error ? rolesResult.reason.message : '角色列表加载失败');
      }
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

  useEffect(() => {
    let alive = true;

    async function loadCurrentAdmin() {
      try {
        const me = await fetchMe();
        if (alive) {
          setCurrentAdminId(me.id);
        }
      } catch {
        if (alive) {
          setCurrentAdminId(null);
        }
      }
    }

    void loadCurrentAdmin();

    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const activeRoleOptions = useMemo(() => buildActiveRoleOptions(roles), [roles]);
  const roleFilterOptions = useMemo(() => buildRoleFilterOptions(roles, users), [roles, users]);
  const statusItems = useMemo(() => buildSystemUserStatusItems(users), [users]);

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

  async function handleToggleStatus(record: AdminSystemUserItem) {
    try {
      await updateAdminSystemUserStatus(record.id, {
        status: record.status === 'active' ? 'disabled' : 'active',
      });
      onSuccess(record.status === 'active' ? '系统用户已停用' : '系统用户已启用');
      await loadPage();
    } catch (error) {
      onError(error, '更新系统用户状态失败');
    }
  }

  const columns = useMemo(
    () =>
      buildSystemUserColumns({
        currentAdminId,
        onView: setSelected,
        onEdit: openEditModal,
        onResetPassword: openPasswordModal,
        onToggleStatus: handleToggleStatus,
      }),
    [currentAdminId],
  );

  function openCreateModal() {
    setEditing(null);
    modalForm.resetFields();
    modalForm.setFieldsValue(buildCreateSystemUserFormValues());
    setModalOpen(true);
  }

  function openEditModal(record: AdminSystemUserItem) {
    setEditing(record);
    modalForm.resetFields();
    modalForm.setFieldsValue(buildEditSystemUserFormValues(record));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    modalForm.resetFields();
  }

  function openPasswordModal(record: AdminSystemUserItem) {
    passwordForm.resetFields();
    setPasswordTarget(record);
  }

  function closePasswordModal() {
    setPasswordTarget(null);
    passwordForm.resetFields();
  }

  function resetFilters() {
    setFilters({});
    setStatus('all');
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
        onSuccess('系统用户已更新');
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
        onSuccess('系统用户已创建');
      }

      closeModal();
      await loadPage();
    } catch (error) {
      onError(error, editing ? '更新系统用户失败' : '创建系统用户失败');
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
      onSuccess('系统用户密码已重置');
      closePasswordModal();
    } catch (error) {
      onError(error, '重置系统用户密码失败');
    } finally {
      setSubmitting(false);
    }
  }

  return {
    users,
    roles,
    loading,
    submitting,
    issue,
    roleIssue,
    filters,
    status,
    selected,
    editing,
    modalOpen,
    passwordTarget,
    currentAdminId,
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
    openEditModal,
    closeModal,
    openPasswordModal,
    closePasswordModal,
    handleSubmitUser,
    handleResetPassword,
    reloadPage: loadPage,
  };
}
