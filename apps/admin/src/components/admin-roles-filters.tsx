import type { FormInstance } from 'antd';
import { Alert, Form, Input } from 'antd';

import { AdminSearchPanel, AdminStatusTabs } from './admin-list-controls';
import type { AdminRoleListItem } from '../lib/api/system';
import type { RoleFilters } from '../lib/admin-roles';

interface AdminRolesFiltersProps {
  form: FormInstance<RoleFilters>;
  issue: string | null;
  status: 'all' | AdminRoleListItem['status'];
  statusItems: Array<{ key: 'all' | AdminRoleListItem['status']; label: string; count: number }>;
  onSearch: () => void;
  onReset: () => void;
  onStatusChange: (status: 'all' | AdminRoleListItem['status']) => void;
}

export function AdminRolesFilters({
  form,
  issue,
  status,
  statusItems,
  onSearch,
  onReset,
  onStatusChange,
}: AdminRolesFiltersProps) {
  return (
    <>
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel form={form} onSearch={onSearch} onReset={onReset}>
        <Form.Item name="name">
          <Input allowClear placeholder="角色名称 / 编码" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => onStatusChange(key as 'all' | AdminRoleListItem['status'])}
      />
    </>
  );
}
