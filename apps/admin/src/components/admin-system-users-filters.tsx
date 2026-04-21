import type { FormInstance } from 'antd';

import { Alert, Form, Input, Select } from 'antd';

import { AdminSearchPanel, AdminStatusTabs } from './admin-list-controls';
import type { AdminSystemUserItem } from '../lib/api/system';
import type { SystemUserFilters } from '../lib/admin-system-users';

interface AdminSystemUsersFiltersProps {
  form: FormInstance<SystemUserFilters>;
  issue: string | null;
  roleIssue: string | null;
  roleFilterOptions: Array<{ label: string; value: string }>;
  status: 'all' | AdminSystemUserItem['status'];
  statusItems: Array<{ key: 'all' | AdminSystemUserItem['status']; label: string; count: number }>;
  onSearch: () => void;
  onReset: () => void;
  onStatusChange: (status: 'all' | AdminSystemUserItem['status']) => void;
}

export function AdminSystemUsersFilters({
  form,
  issue,
  roleIssue,
  roleFilterOptions,
  status,
  statusItems,
  onSearch,
  onReset,
  onStatusChange,
}: AdminSystemUsersFiltersProps) {
  return (
    <>
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      {roleIssue ? <Alert showIcon type="warning" message={roleIssue} /> : null}

      <AdminSearchPanel form={form} onSearch={onSearch} onReset={onReset}>
        <Form.Item name="username">
          <Input allowClear placeholder="系统用户名 / 显示名" />
        </Form.Item>
        <Form.Item name="role">
          <Select allowClear options={roleFilterOptions} placeholder="角色" />
        </Form.Item>
        <Form.Item name="status">
          <Select
            allowClear
            options={[
              { label: '启用', value: 'active' },
              { label: '停用', value: 'disabled' },
            ]}
            placeholder="状态"
          />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => onStatusChange(key as 'all' | AdminSystemUserItem['status'])}
      />
    </>
  );
}
