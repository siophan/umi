import {
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { AdminProfile } from '@umi/shared';
import { Avatar, Breadcrumb, Dropdown, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';

interface AdminShellHeaderProps {
  breadcrumbItems: Array<{ title: ReactNode }>;
  collapsed: boolean;
  currentUser: AdminProfile;
  loading?: boolean;
  onCollapse: (next: boolean) => void;
  onLogout: () => void;
  onOpenDocs: () => void;
  onOpenPassword: () => void;
  onRefresh: () => void;
}

export function AdminShellHeader({
  breadcrumbItems,
  collapsed,
  currentUser,
  loading = false,
  onCollapse,
  onLogout,
  onOpenDocs,
  onOpenPassword,
  onRefresh,
}: AdminShellHeaderProps) {
  const userMenuItems = [
    {
      key: 'change-password',
      label: '修改密码',
      onClick: onOpenPassword,
    },
    {
      key: 'logout',
      label: '退出登录',
      onClick: onLogout,
    },
  ];

  return (
    <div className="app-header">
      <button
        aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
        className="app-header__icon-btn"
        onClick={() => onCollapse(!collapsed)}
        type="button"
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </button>

      <div className="app-header__breadcrumb">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="app-header__actions">
        <Tooltip title="接口文档">
          <button
            className="app-header__icon-btn"
            onClick={onOpenDocs}
            type="button"
          >
            <QuestionCircleOutlined />
          </button>
        </Tooltip>

        <Tooltip title="刷新数据">
          <button
            aria-busy={loading}
            className="app-header__icon-btn"
            disabled={loading}
            onClick={onRefresh}
            type="button"
          >
            <ReloadOutlined spin={loading} />
          </button>
        </Tooltip>

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
          <button
            className="app-header__user"
            title={
              currentUser.displayName && currentUser.displayName !== currentUser.username
                ? `${currentUser.username} (${currentUser.displayName})`
                : currentUser.username
            }
            type="button"
          >
            <Avatar
              className="app-header__user-avatar"
              icon={<UserOutlined />}
              size="small"
            />
            <span className="app-header__user-meta">
              <Typography.Text className="app-header__user-name" strong>
                {currentUser.username}
              </Typography.Text>
            </span>
            <DownOutlined className="app-header__user-arrow" />
          </button>
        </Dropdown>
      </div>
    </div>
  );
}
