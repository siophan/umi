import type { EntityId } from '@umi/shared';
import { Checkbox, ConfigProvider, Modal, Typography } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import type { AdminPermissionMatrixData, AdminRoleListItem } from '../lib/api/system';
import { adminMenuTree, type AdminMenuNode } from '../lib/admin-menu-config';
import { getPermissionModuleLabel } from '../lib/admin-permissions';
import { getPermissionActionText } from '../lib/admin-roles';

interface AdminRolePermissionModalProps {
  checkedPermissionIds: EntityId[];
  onCancel: () => void;
  onChange: (values: EntityId[], currentModuleIds: EntityId[]) => void;
  onSubmit: () => void;
  open: boolean;
  permissionLoading: boolean;
  permissionMatrix: AdminPermissionMatrixData | null;
  permissionSubmitting: boolean;
  role: AdminRoleListItem | null;
}

type MatrixModule = AdminPermissionMatrixData['modules'][number];
type MatrixPermission = MatrixModule['permissions'][number];

type MenuPermissionGroup = {
  key: string;
  name: string;
  childGroups: Array<{
    key: string;
    name: string;
    permissions: MatrixPermission[];
  }>;
  extraPermissions: MatrixPermission[];
};

function getNodePermissions(
  node: AdminMenuNode,
  permissionByCode: Map<string, MatrixPermission>,
  childrenByParentId: Map<string, MatrixPermission[]>,
) {
  return (node.access?.permissionCodes ?? []).flatMap((code) => {
    const permission = permissionByCode.get(code);
    return permission ? [permission, ...(childrenByParentId.get(permission.id) ?? [])] : [];
  });
}

function sortPermissionsByName(permissions: MatrixPermission[]) {
  return permissions.slice().sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
}

function buildMenuPermissionGroups(permissionMatrix: AdminPermissionMatrixData) {
  const allPermissions = permissionMatrix.modules.flatMap((module) => module.permissions);
  const permissionByCode = new Map(allPermissions.map((permission) => [permission.code, permission]));
  const childrenByParentId = new Map<string, MatrixPermission[]>();
  for (const permission of allPermissions) {
    if (!permission.parentId) {
      continue;
    }
    const siblings = childrenByParentId.get(permission.parentId) ?? [];
    siblings.push(permission);
    childrenByParentId.set(permission.parentId, siblings);
  }
  const usedPermissionIds = new Set<string>();

  const groups: MenuPermissionGroup[] = adminMenuTree.flatMap((node) => {
    const directPermissions = getNodePermissions(node, permissionByCode, childrenByParentId);
    const childGroups = node.children?.length
      ? node.children
          .map((child) => ({
            key: child.key,
            name: child.name,
            permissions: getNodePermissions(child, permissionByCode, childrenByParentId),
          }))
          .filter((child) => child.permissions.length > 0)
      : directPermissions.length > 0
        ? [{ key: node.key, name: node.name, permissions: directPermissions }]
        : [];

    const groupPermissionIds = childGroups.flatMap((child) =>
      child.permissions.map((permission) => permission.id),
    );

    if (groupPermissionIds.length === 0) {
      return [];
    }

    for (const permissionId of groupPermissionIds) {
      usedPermissionIds.add(permissionId);
    }

    return [
      {
        key: node.key,
        name: node.name,
        childGroups,
        extraPermissions: [],
      },
    ];
  });

  const extraPermissionsByModule = new Map<string, MatrixPermission[]>();
  for (const permission of allPermissions) {
    if (usedPermissionIds.has(permission.id)) {
      continue;
    }
    const module = permission.code.split('.')[0] || permission.parentId || 'other';
    const current = extraPermissionsByModule.get(module) ?? [];
    current.push(permission);
    extraPermissionsByModule.set(module, current);
  }

  const extraGroups = Array.from(extraPermissionsByModule.entries()).map(([module, permissions]) => ({
    key: `extra-${module}`,
    name: getPermissionModuleLabel(module),
    childGroups: [],
    extraPermissions: sortPermissionsByName(permissions),
  }));

  return [...groups, ...extraGroups];
}

function permissionOption(permission: MatrixPermission) {
  return {
    label: `${permission.name}（${getPermissionActionText(permission.action)}）`,
    value: permission.id,
  };
}

export function AdminRolePermissionModal({
  checkedPermissionIds,
  onCancel,
  onChange,
  onSubmit,
  open,
  permissionLoading,
  permissionMatrix,
  permissionSubmitting,
  role,
}: AdminRolePermissionModalProps) {
  return (
    <ConfigProvider theme={SEARCH_THEME}>
      <Modal
        destroyOnHidden
        open={open}
        title={role ? `权限配置 · ${role.name}` : '权限配置'}
        width={760}
        okText="保存"
        cancelText="取消"
        confirmLoading={permissionSubmitting}
        onOk={onSubmit}
        onCancel={onCancel}
      >
        {permissionLoading ? (
          <Typography.Text type="secondary">权限矩阵加载中...</Typography.Text>
        ) : permissionMatrix ? (
          <div style={{ display: 'grid', gap: 16, maxHeight: 560, overflowY: 'auto' }}>
            {buildMenuPermissionGroups(permissionMatrix).map((group) => {
              return (
                <div
                  key={group.key}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Typography.Text strong>{group.name}</Typography.Text>
                  {group.childGroups.length > 0 ? (
                    <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                      {group.childGroups.map((child) => (
                        <div key={child.key}>
                          <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                            <Typography.Text type="secondary">{child.name}</Typography.Text>
                            <Checkbox
                              checked={child.permissions.every((permission) =>
                                checkedPermissionIds.includes(permission.id as EntityId),
                              )}
                              indeterminate={
                                child.permissions.some((permission) =>
                                  checkedPermissionIds.includes(permission.id as EntityId),
                                ) &&
                                !child.permissions.every((permission) =>
                                  checkedPermissionIds.includes(permission.id as EntityId),
                                )
                              }
                              onChange={(event) =>
                                onChange(
                                  event.target.checked
                                    ? child.permissions.map((permission) => permission.id as EntityId)
                                    : [],
                                  child.permissions.map((permission) => permission.id as EntityId),
                                )
                              }
                            >
                              全选
                            </Checkbox>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <Checkbox.Group
                              options={child.permissions.map(permissionOption)}
                              value={checkedPermissionIds}
                              onChange={(values) =>
                                onChange(
                                  values as EntityId[],
                                  child.permissions.map((permission) => permission.id as EntityId),
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {group.extraPermissions.length > 0 ? (
                    <div style={{ marginTop: 12 }}>
                      <Typography.Text type="secondary">其他权限</Typography.Text>
                      <div style={{ marginTop: 8 }}>
                        <Checkbox.Group
                          options={group.extraPermissions.map(permissionOption)}
                          value={checkedPermissionIds}
                          onChange={(values) =>
                            onChange(
                              values as EntityId[],
                              group.extraPermissions.map((permission) => permission.id as EntityId),
                            )
                          }
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <Typography.Text type="secondary">暂无可配置权限</Typography.Text>
        )}
      </Modal>
    </ConfigProvider>
  );
}
