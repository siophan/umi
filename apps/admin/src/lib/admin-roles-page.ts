import type { EntityId } from '@umi/shared';
import type { FormInstance } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  createAdminRole,
  fetchAdminPermissionsMatrix,
  fetchAdminRoles,
  updateAdminRole,
  updateAdminRolePermissions,
  updateAdminRoleStatus,
  type AdminPermissionMatrixData,
  type AdminRoleListItem,
} from './api/system';
import {
  buildCreateRoleFormValues,
  buildEditRoleFormValues,
  buildRoleColumns,
  buildRoleStatusItems,
  collectRolePermissionIds,
  filterRoles,
  type CreateRoleFormValues,
  type RoleFilters,
  type RoleFormValues,
} from './admin-roles';

interface UseAdminRolesPageOptions {
  refreshToken?: number;
  createForm: FormInstance<CreateRoleFormValues>;
  editForm: FormInstance<RoleFormValues>;
  onSuccess: (message: string) => void;
  onError: (error: unknown, fallbackMessage: string) => void;
  onWarn: (message: string) => void;
}

export function useAdminRolesPage({
  refreshToken = 0,
  createForm,
  editForm,
  onSuccess,
  onError,
  onWarn,
}: UseAdminRolesPageOptions) {
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
  const [editingRole, setEditingRole] = useState<AdminRoleListItem | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

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

  useEffect(() => {
    void reloadRoles();
  }, [refreshToken]);

  async function openPermissionModal(record: AdminRoleListItem) {
    if (record.status !== 'active') {
      onWarn('请先启用该角色，再进行权限配置');
      return;
    }

    setEditingPermissionsRole(record);
    setPermissionLoading(true);
    try {
      const result = await fetchAdminPermissionsMatrix();
      setPermissionMatrix(result);
      setCheckedPermissionIds(collectRolePermissionIds(result, record.id as EntityId));
    } catch (error) {
      onError(error, '权限矩阵加载失败');
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
      onSuccess('角色权限已更新');
      setEditingPermissionsRole(null);
      setPermissionMatrix(null);
      setCheckedPermissionIds([]);
      await reloadRoles();
    } catch (error) {
      onError(error, '更新角色权限失败');
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
      onSuccess('角色已创建');
      setCreateModalOpen(false);
      createForm.resetFields();
      await reloadRoles();
    } catch (error) {
      onError(error, '创建角色失败');
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
      onSuccess('角色已更新');
      closeEditModal();
      await reloadRoles();
    } catch (error) {
      onError(error, '更新角色失败');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleToggleStatus(record: AdminRoleListItem) {
    try {
      await updateAdminRoleStatus(record.id, {
        status: record.status === 'active' ? 'disabled' : 'active',
      });
      onSuccess(record.status === 'active' ? '角色已停用' : '角色已启用');
      await reloadRoles();
    } catch (error) {
      onError(error, '更新角色状态失败');
    }
  }

  function openCreateModal() {
    createForm.resetFields();
    createForm.setFieldsValue(buildCreateRoleFormValues());
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    createForm.resetFields();
  }

  function openEditModal(record: AdminRoleListItem) {
    editForm.setFieldsValue(buildEditRoleFormValues(record));
    setEditingRole(record);
  }

  function closeEditModal() {
    setEditingRole(null);
    editForm.resetFields();
  }

  const filteredRoles = useMemo(() => filterRoles(roles, filters, status), [filters, roles, status]);
  const statusItems = useMemo(() => buildRoleStatusItems(roles), [roles]);
  const columns = useMemo(
    () =>
      buildRoleColumns({
        editFormValues: openEditModal,
        onConfigurePermissions: (record) => void openPermissionModal(record),
        onToggleStatus: (record) => void handleToggleStatus(record),
        onView: setSelected,
      }),
    [roles],
  );

  return {
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
    resetFilters: () => {
      setFilters({});
      setStatus('all');
    },
    setStatus,
    setSelected,
    setCheckedPermissionIds,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
    closePermissionsModal: () => {
      setEditingPermissionsRole(null);
      setPermissionMatrix(null);
      setCheckedPermissionIds([]);
    },
    handleSubmitPermissions,
    handleCreateRole,
    handleUpdateRole,
  };
}
