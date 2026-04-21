import type { AdminProfile, ChangePasswordPayload } from '@umi/shared';
import {
  ConfigProvider,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Result,
  Typography,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { AdminShellHeader } from './components/admin-shell-header';
import {
  changePassword,
  clearAuthToken,
  fetchMe,
  hasAuthToken,
  login as loginRequest,
  logout as logoutRequest,
  setAuthToken,
} from './lib/api/auth';
import { LoginScreen } from './components/login-screen';
import {
  findAdminPageMeta,
  filterAdminMenuTreeByAccess,
  findFirstAccessibleAdminPath,
  getAdminMenuTree,
  isAdminPathAccessible,
} from './lib/admin-navigation';
import { BrandLibraryPage } from './pages/brand-library-page';
import { BrandsPage } from './pages/brands-page';
import { CategoriesPage } from './pages/categories-page';
import { CommunityCommentsPage } from './pages/community-comments-page';
import { CommunityPostsPage } from './pages/community-posts-page';
import { CommunityReportsPage } from './pages/community-reports-page';
import { DashboardPage } from './pages/dashboard-page';
import { EquityPage } from './pages/equity-page';
import { FriendGuessesPage } from './pages/friend-guesses-page';
import { GuessCreatePage } from './pages/guess-create-page';
import { GuessesPage } from './pages/guesses-page';
import { LiveDanmakuPage } from './pages/live-danmaku-page';
import { LiveListPage } from './pages/live-list-page';
import { MarketingBannersPage } from './pages/marketing-banners-page';
import { MarketingCheckinPage } from './pages/marketing-checkin-page';
import { MarketingCouponsPage } from './pages/marketing-coupons-page';
import { MarketingInvitePage } from './pages/marketing-invite-page';
import { OrderLogisticsPage } from './pages/order-logistics-page';
import { OrdersPage } from './pages/orders-page';
import { OrderTransactionsPage } from './pages/order-transactions-page';
import { PermissionsPage } from './pages/permissions-page';
import { PkMatchesPage } from './pages/pk-matches-page';
import { ProductsPage } from './pages/products-page';
import { RolesPage } from './pages/roles-page';
import { ShopAppliesPage } from './pages/shop-applies-page';
import { ShopBrandAuthAppliesPage } from './pages/shop-brand-auth-applies-page';
import { ShopProductsPage } from './pages/shop-products-page';
import { ShopsPage } from './pages/shops-page';
import { SystemChatsPage } from './pages/system-chats-page';
import { SystemNotificationsPage } from './pages/system-notifications-page';
import { SystemRankingsPage } from './pages/system-rankings-page';
import { SystemUsersPage } from './pages/system-users-page';
import { UsersPage } from './pages/users-page';
import { WarehousePage } from './pages/warehouse-page';
import { WarehouseConsignPage } from './pages/warehouse-consign-page';

const DASHBOARD_PATH = '/dashboard';
const PATH_ALIASES: Record<string, string> = {
  '/users': '/users/list',
  '/products': '/products/list',
  '/guesses': '/guesses/list',
  '/orders': '/orders/list',
  '/shops': '/shops/list',
  '/brands': '/brands/list',
  '/warehouse': '/warehouse/virtual',
  '/community': '/community/posts',
  '/live': '/live/list',
};
const MENU_TREE = getAdminMenuTree();
const SIDER_WIDTH = 256;
const SIDER_COLLAPSED_WIDTH = 64;
const PAGE_COMPONENTS: Record<string, ComponentType<{ refreshToken?: number }>> = {
  '/brands/list': BrandsPage,
  '/community/comments': CommunityCommentsPage,
  '/community/posts': CommunityPostsPage,
  '/community/reports': CommunityReportsPage,
  '/dashboard': DashboardPage,
  '/equity': EquityPage,
  '/guesses/create': GuessCreatePage,
  '/guesses/friends': FriendGuessesPage,
  '/guesses/list': GuessesPage,
  '/live/danmaku': LiveDanmakuPage,
  '/live/list': LiveListPage,
  '/marketing/banners': MarketingBannersPage,
  '/marketing/checkin': MarketingCheckinPage,
  '/marketing/coupons': MarketingCouponsPage,
  '/marketing/invite': MarketingInvitePage,
  '/orders/list': OrdersPage,
  '/orders/logistics': OrderLogisticsPage,
  '/orders/transactions': OrderTransactionsPage,
  '/pk': PkMatchesPage,
  '/products/brands': BrandLibraryPage,
  '/products/list': ProductsPage,
  '/shops/apply': ShopAppliesPage,
  '/shops/brand-auth': ShopBrandAuthAppliesPage,
  '/shops/brand-auth/records': ShopBrandAuthAppliesPage,
  '/shops/list': ShopsPage,
  '/shops/products': ShopProductsPage,
  '/system/categories': CategoriesPage,
  '/system/chats': SystemChatsPage,
  '/system/notifications': SystemNotificationsPage,
  '/system/roles': RolesPage,
  '/system/rankings': SystemRankingsPage,
  '/system/users': SystemUsersPage,
  '/users/permissions': PermissionsPage,
  '/users/list': UsersPage,
  '/warehouse/consign': WarehouseConsignPage,
};
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

function normalizePath(hash: string) {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw || raw === '/') {
    return DASHBOARD_PATH;
  }

  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return PATH_ALIASES[normalized] ?? normalized;
}

function toMenuItems(
  nodes: ReturnType<typeof getAdminMenuTree>,
): NonNullable<MenuProps['items']> {
  return nodes.map((node) => {
    if (node.children?.length) {
      return {
        key: node.key,
        icon: node.icon,
        label: node.name,
        children: toMenuItems(node.children),
      };
    }

    const path = node.path ?? node.key;
    return {
      key: path,
      icon: node.icon,
      label: node.name,
    };
  });
}

function findMenuOpenKeys(
  nodes: ReturnType<typeof getAdminMenuTree>,
  targetPath: string,
  parentKeys: string[] = [],
): string[] {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return parentKeys;
    }

    if (node.children?.length) {
      const nextKeys = findMenuOpenKeys(node.children, targetPath, [
        ...parentKeys,
        node.key,
      ]);
      if (nextKeys.length > 0) {
        return nextKeys;
      }
    }
  }

  return [];
}

function sameKeys(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((key, index) => key === right[index]);
}

export function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [passwordForm] = Form.useForm<
    ChangePasswordPayload & { confirmPassword: string }
  >();
  const [activePath, setActivePath] = useState(() =>
    normalizePath(window.location.hash),
  );
  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>(() =>
    findMenuOpenKeys(MENU_TREE, normalizePath(window.location.hash)),
  );
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const accessibleMenuTree = useMemo(
    () => (currentUser ? filterAdminMenuTreeByAccess(MENU_TREE, currentUser) : []),
    [currentUser],
  );
  const firstAccessiblePath = useMemo(
    () => findFirstAccessibleAdminPath(accessibleMenuTree),
    [accessibleMenuTree],
  );
  const activePathAccessible = useMemo(
    () => (currentUser ? isAdminPathAccessible(activePath, currentUser) : false),
    [activePath, currentUser],
  );
  const visiblePath = activePathAccessible
    ? activePath
    : firstAccessiblePath ?? activePath;
  const activeMenuParentKeys = useMemo(
    () => findMenuOpenKeys(accessibleMenuTree, visiblePath),
    [accessibleMenuTree, visiblePath],
  );
  const activeMeta = findAdminPageMeta(visiblePath);
  const menuItems = useMemo(() => toMenuItems(accessibleMenuTree), [accessibleMenuTree]);
  const breadcrumbItems = [
    ...(activeMeta.parentName ? [{ title: activeMeta.parentName }] : []),
    { title: activeMeta.name },
  ];
  const pageRefreshToken = refreshNonce;
  const ActivePage = PAGE_COMPONENTS[visiblePath];

  useEffect(() => {
    const syncFromHash = () => {
      setActivePath(normalizePath(window.location.hash));
    };

    if (!window.location.hash) {
      window.location.hash = DASHBOARD_PATH;
    }

    window.addEventListener('hashchange', syncFromHash);

    return () => {
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function bootstrapUser() {
      setAuthChecking(true);
      try {
        if (!hasAuthToken()) {
          if (alive) {
            setAuthenticated(false);
            setCurrentUser(null);
          }
          return;
        }

        const user = await fetchMe();
        if (alive) {
          setAuthenticated(true);
          setCurrentUser(user);
          setLoginError(null);
        }
      } catch {
        if (alive) {
          clearAuthToken();
          setAuthenticated(false);
          setCurrentUser(null);
        }
      } finally {
        if (alive) {
          setAuthChecking(false);
        }
      }
    }

    void bootstrapUser();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setMenuOpenKeys((currentKeys) =>
      sameKeys(currentKeys, activeMenuParentKeys) ? currentKeys : activeMenuParentKeys,
    );
  }, [activeMenuParentKeys]);

  useEffect(() => {
    if (!authenticated || !currentUser) {
      return;
    }

    if (firstAccessiblePath && activePath !== visiblePath) {
      window.location.hash = visiblePath;
    }
  }, [
    activePath,
    authenticated,
    currentUser,
    firstAccessiblePath,
    visiblePath,
  ]);

  async function handleLogin(values: { username: string; password: string }) {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const result = await loginRequest({
        username: values.username,
        password: values.password,
      });

      setAuthToken(result.token);
      setCurrentUser(result.user);
      setAuthenticated(true);
      setLoginError(null);
      window.location.hash = normalizePath(window.location.hash || DASHBOARD_PATH);
      messageApi.success('登录成功');
    } catch (error) {
      clearAuthToken();
      setAuthenticated(false);
      setCurrentUser(null);
      setLoginError(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoginLoading(false);
      setAuthChecking(false);
    }
  }

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

  async function handleLogout() {
    try {
      if (hasAuthToken()) {
        await logoutRequest();
      }
    } catch {
      // Ignore logout API errors and still clear local auth.
    } finally {
      clearAuthToken();
      setAuthenticated(false);
      setCurrentUser(null);
      messageApi.success('已退出登录');
    }
  }

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
                window.location.hash = key;
              }
            }}
            onOpenChange={(keys) => {
              if (!collapsed) {
                const nextKeys = keys as string[];
                setMenuOpenKeys(nextKeys.length > 0 ? [nextKeys[nextKeys.length - 1] as string] : []);
              }
            }}
            openKeys={collapsed ? [] : menuOpenKeys}
            selectedKeys={[visiblePath]}
            theme="dark"
          />
        </Layout.Sider>

        <Layout className="umi-admin-main">
          <AdminShellHeader
            breadcrumbItems={breadcrumbItems}
            collapsed={collapsed}
            currentUser={currentUser}
            loading={false}
            onCollapse={setCollapsed}
            onLogout={() => void handleLogout()}
            onOpenDocs={() => window.open('http://localhost:4000/docs', '_blank', 'noopener,noreferrer')}
            onOpenPassword={() => setPasswordModalOpen(true)}
            onRefresh={() => void handleRefresh()}
          />

          <div className="umi-admin-page">
            {!activePathAccessible && visiblePath === activePath ? (
              <Result status="403" title="无页面权限" subTitle={activePath} />
            ) : ActivePage ? (
              <ActivePage refreshToken={pageRefreshToken} />
            ) : visiblePath === '/warehouse/virtual' ||
              visiblePath === '/warehouse/physical' ? (
              <WarehousePage
                refreshToken={pageRefreshToken}
                warehouseType={visiblePath === '/warehouse/virtual' ? 'virtual' : 'physical'}
              />
            ) : (
              <Result status="404" title="页面未配置" subTitle={visiblePath} />
            )}
          </div>
        </Layout>
      </Layout>

      <Modal
        confirmLoading={passwordSubmitting}
        open={passwordModalOpen}
        title="修改密码"
        okText="确认修改"
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        onOk={() => void handlePasswordSubmit()}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
        >
          <Form.Item
            extra={
              '当前账号已登录，将校验旧密码后修改。'
            }
            label="当前密码"
            name="currentPassword"
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '新密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
