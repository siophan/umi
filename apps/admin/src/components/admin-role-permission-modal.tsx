import type { EntityId } from '@umi/shared';
import { Checkbox, ConfigProvider, Modal, Typography } from 'antd';

import { SEARCH_THEME } from './admin-list-controls';
import type { AdminPermissionMatrixData, AdminRoleListItem } from '../lib/api/system';
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
      <ConfigProvider theme={SEARCH_THEME}>
        {permissionLoading ? (
          <Typography.Text type="secondary">权限矩阵加载中...</Typography.Text>
        ) : permissionMatrix ? (
          <div style={{ display: 'grid', gap: 16, maxHeight: 560, overflowY: 'auto' }}>
            {permissionMatrix.modules.map((module) => {
              const currentIds = module.permissions.map((permission) => permission.id as EntityId);
              return (
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
                        label: `${permission.name}（${getPermissionActionText(permission.action)}）`,
                        value: permission.id,
                      }))}
                      value={checkedPermissionIds}
                      onChange={(values) => onChange(values as EntityId[], currentIds)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Typography.Text type="secondary">暂无可配置权限</Typography.Text>
        )}
      </ConfigProvider>
    </Modal>
  );
}
