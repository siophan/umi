import type { AdminProfile } from '@umi/shared';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

import { AdminShellHeader } from './admin-shell-header';
import { DASHBOARD_PATH } from '../lib/admin-navigation';

const SIDER_WIDTH = 256;
const SIDER_COLLAPSED_WIDTH = 64;

interface AdminShellLayoutProps {
  breadcrumbItems: Array<{ title: ReactNode }>;
  children: ReactNode;
  collapsed: boolean;
  currentUser: AdminProfile;
  menuItems: NonNullable<MenuProps['items']>;
  menuOpenKeys: string[];
  onCollapse: (next: boolean) => void;
  onLogout: () => void;
  onMenuClick: (path: string) => void;
  onMenuOpenChange: (keys: string[]) => void;
  onOpenDocs: () => void;
  onOpenPassword: () => void;
  onRefresh: () => void;
  selectedPath: string;
}

export function AdminShellLayout({
  breadcrumbItems,
  children,
  collapsed,
  currentUser,
  menuItems,
  menuOpenKeys,
  onCollapse,
  onLogout,
  onMenuClick,
  onMenuOpenChange,
  onOpenDocs,
  onOpenPassword,
  onRefresh,
  selectedPath,
}: AdminShellLayoutProps) {
  return (
    <Layout className="umi-admin-layout">
      <Layout.Sider
        breakpoint="lg"
        className="umi-admin-sider"
        collapsed={collapsed}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        theme="dark"
        trigger={null}
        width={SIDER_WIDTH}
      >
        <a className="app-sider-brand" href={`#${DASHBOARD_PATH}`}>
          <span className="app-sider-brand__mark">U</span>
          {collapsed ? null : (
            <span className="app-sider-brand__meta">
              <span className="app-sider-brand__title">Umi 管理后台</span>
            </span>
          )}
        </a>
        <Menu
          className="umi-admin-menu"
          inlineCollapsed={collapsed}
          inlineIndent={16}
          items={menuItems}
          mode="inline"
          onClick={({ key }) => {
            if (typeof key === 'string' && key.startsWith('/')) {
              onMenuClick(key);
            }
          }}
          onOpenChange={(keys) => {
            if (!collapsed) {
              const nextKeys = keys as string[];
              onMenuOpenChange(
                nextKeys.length > 0 ? [nextKeys[nextKeys.length - 1] as string] : [],
              );
            }
          }}
          openKeys={collapsed ? [] : menuOpenKeys}
          selectedKeys={[selectedPath]}
          theme="dark"
        />
      </Layout.Sider>

      <Layout className="umi-admin-main">
        <AdminShellHeader
          breadcrumbItems={breadcrumbItems}
          collapsed={collapsed}
          currentUser={currentUser}
          loading={false}
          onCollapse={onCollapse}
          onLogout={onLogout}
          onOpenDocs={onOpenDocs}
          onOpenPassword={onOpenPassword}
          onRefresh={onRefresh}
        />

        <div className="umi-admin-page">{children}</div>
      </Layout>
    </Layout>
  );
}
