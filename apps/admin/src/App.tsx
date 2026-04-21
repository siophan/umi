import type { ChangePasswordPayload } from '@umi/shared';
import {
  ConfigProvider,
  Form,
  Result,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';

import { AdminPasswordModal } from './components/admin-password-modal';
import { AdminShellLayout } from './components/admin-shell-layout';
import { changePassword, hasAuthToken } from './lib/api/auth';
import { LoginScreen } from './components/login-screen';
import {
  normalizeAdminPath,
  resolveAdminSelectedPath,
} from './lib/admin-navigation';
import { renderAdminPage } from './lib/admin-page-registry';
import { useAdminHashNavigation } from './hooks/use-admin-hash-navigation';
import { useAdminSession } from './hooks/use-admin-session';

const ADMIN_THEME = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 16,
    colorBgLayout: '#f3f5f8',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorText: '#1b2130',
    colorTextSecondary: '#64748b',
  },
  components: {
    Menu: {
      darkItemBg: '#141422',
      darkItemColor: 'rgba(255,255,255,0.65)',
      darkItemHoverBg: 'rgba(255,255,255,0.07)',
      darkItemHoverColor: 'rgba(255,255,255,0.85)',
      darkItemSelectedBg: '#1677ff',
      darkItemSelectedColor: '#ffffff',
      darkPopupBg: '#141422',
      darkSubMenuItemBg: '#141422',
      darkGroupTitleColor: 'rgba(255,255,255,0.35)',
      itemBorderRadius: 8,
      subMenuItemBorderRadius: 8,
      itemHeight: 40,
    },
  },
} as const;

export function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [passwordForm] = Form.useForm<
    ChangePasswordPayload & { confirmPassword: string }
  >();
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const pageRefreshToken = refreshNonce;
  const {
    authChecking,
    authenticated,
    currentUser,
    loginError,
    loginLoading,
    handleLogin,
    handleLogout,
  } = useAdminSession({
    onLoginSuccess: () => {
      window.location.hash = normalizeAdminPath(window.location.hash);
      messageApi.success('登录成功');
    },
    onLogout: () => {
      messageApi.success('已退出登录');
    },
  });
  const {
    activePath,
    activePathAccessible,
    breadcrumbItems,
    collapsed,
    firstAccessiblePath,
    menuItems,
    menuOpenKeys,
    setCollapsed,
    setMenuOpenKeys,
    visiblePath,
  } = useAdminHashNavigation(currentUser);

  async function handleRefresh() {
    setRefreshNonce((value) => value + 1);
    messageApi.success('当前页面已刷新');
  }

  async function handlePasswordSubmit() {
    if (!hasAuthToken()) {
      messageApi.warning('登录态已失效，请重新登录后再试');
      return;
    }

    const values = await passwordForm.validateFields();
    if (values.newPassword !== values.confirmPassword) {
      messageApi.error('两次输入的新密码不一致');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      messageApi.success('密码修改成功');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '修改密码失败');
    } finally {
      setPasswordSubmitting(false);
    }
  }

  const pageContent =
    !activePathAccessible && visiblePath === activePath ? (
      <Result status="403" title="无页面权限" subTitle={activePath} />
    ) : (
      renderAdminPage(visiblePath, pageRefreshToken) ?? (
        <Result status="404" title="页面未配置" subTitle={visiblePath} />
      )
    );

  if (authChecking) {
    return (
      <ConfigProvider theme={ADMIN_THEME}>
        {contextHolder}
        <div className="login-screen login-screen--loading">
          <Typography.Text type="secondary">正在校验登录状态...</Typography.Text>
        </div>
      </ConfigProvider>
    );
  }

  if (!authenticated || !currentUser) {
    return (
      <ConfigProvider theme={ADMIN_THEME}>
        {contextHolder}
        <LoginScreen
          errorMessage={loginError}
          loading={loginLoading}
          onSubmit={handleLogin}
        />
      </ConfigProvider>
    );
  }

  if (!firstAccessiblePath) {
    return (
      <ConfigProvider theme={ADMIN_THEME}>
        {contextHolder}
        <div className="login-screen login-screen--loading">
          <Result
            status="403"
            title="暂无可访问页面"
            subTitle="当前账号未分配可访问菜单对应的系统权限。"
          />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={ADMIN_THEME}>
      {contextHolder}
      <AdminShellLayout
        breadcrumbItems={breadcrumbItems}
        collapsed={collapsed}
        currentUser={currentUser}
        menuItems={menuItems}
        menuOpenKeys={menuOpenKeys}
        onCollapse={setCollapsed}
        onLogout={() => void handleLogout()}
        onMenuClick={(path) => {
          window.location.hash = path;
        }}
        onMenuOpenChange={setMenuOpenKeys}
        onOpenDocs={() => window.open('/docs', '_blank', 'noopener,noreferrer')}
        onOpenPassword={() => setPasswordModalOpen(true)}
        onRefresh={() => void handleRefresh()}
        selectedPath={resolveAdminSelectedPath(visiblePath)}
      >
        {pageContent}
      </AdminShellLayout>

      <AdminPasswordModal
        confirmLoading={passwordSubmitting}
        form={passwordForm}
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        onSubmit={() => void handlePasswordSubmit()}
      />
    </ConfigProvider>
  );
}
