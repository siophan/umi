import type { AdminUserFilter } from '@umi/shared';
import type { FormInstance } from 'antd';

import { Alert, Form, Input } from 'antd';

import { AdminSearchPanel, AdminStatusTabs } from './admin-list-controls';
import type { UserSummaryTabItem, UsersSearchFormValues } from '../lib/admin-users';

interface AdminUsersFiltersProps {
  form: FormInstance<UsersSearchFormValues>;
  listIssue: string | null;
  role: AdminUserFilter;
  statusItems: UserSummaryTabItem[];
  onSearch: () => void;
  onReset: () => void;
  onRoleChange: (role: AdminUserFilter) => void;
}

export function AdminUsersFilters({
  form,
  listIssue,
  role,
  statusItems,
  onSearch,
  onReset,
  onRoleChange,
}: AdminUsersFiltersProps) {
  return (
    <>
      {listIssue ? (
        <Alert showIcon type="warning" message="用户列表加载失败" description={listIssue} />
      ) : null}

      <AdminSearchPanel form={form} onSearch={onSearch} onReset={onReset}>
        <Form.Item name="keyword">
          <Input placeholder="昵称 / UID" allowClear />
        </Form.Item>
        <Form.Item name="phone">
          <Input placeholder="手机号" allowClear />
        </Form.Item>
        <Form.Item name="shopName">
          <Input placeholder="店铺名称" allowClear />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs activeKey={role} items={statusItems} onChange={(nextRole) => onRoleChange(nextRole as AdminUserFilter)} />
    </>
  );
}
