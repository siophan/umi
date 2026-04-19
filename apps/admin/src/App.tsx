import type { AdminProfile, ChangePasswordPayload } from '@joy/shared';
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
import { useEffect, useState } from 'react';

import { AdminContentLoading } from './components/admin-content-loading';
import { AdminShellHeader } from './components/admin-shell-header';
import {
  changePassword,
  clearAuthToken,
  fetchMe,
  hasAuthToken,
  login as loginRequest,
  logout as logoutRequest,
  setAuthToken,
} from './lib/api';
import {
  emptyAdminPageData,
  loadAdminPageData,
  type AdminPageData,
} from './lib/admin-page-data';
import { LoginScreen } from './components/login-screen';
import {
  findAdminPageMeta,
  getAdminMenuTree,
} from './lib/admin-navigation';
import { ContentSystemPage } from './pages/content-system-page';
import { DashboardPage } from './pages/dashboard-page';
import { MarketingPage } from './pages/marketing-page';
import { OrderFulfillmentPage } from './pages/order-fulfillment-page';
import { ProductGuessPage } from './pages/product-guess-page';
import { ProductsPage } from './pages/products-page';
import { GuessesPage } from './pages/guesses-page';
import { OrdersPage } from './pages/orders-page';
import { UserMerchantPage } from './pages/user-merchant-page';
import { UsersPage } from './pages/users-page';
import { WarehousePage } from './pages/warehouse-page';

const DASHBOARD_PATH = '/dashboard';
const USERS_LIST_PATH = '/users/list';
const PRODUCTS_LIST_PATH = '/products/list';
const GUESSES_LIST_PATH = '/guesses/list';
const ORDERS_LIST_PATH = '/orders/list';
const USER_MERCHANT_PATHS = new Set([
  '/shops/list',
  '/shops/apply',
  '/shops/brand-auth',
  '/shops/brand-auth/records',
  '/shops/products',
  '/brands/list',
  '/brands/apply',
  '/product-auth/list',
  '/product-auth/records',
] as const);
const PRODUCT_GUESS_PATHS = new Set([
  '/products/brands',
  '/guesses/create',
  '/guesses/friends',
  '/pk',
] as const);
const ORDER_FULFILLMENT_PATHS = new Set([
  '/orders/transactions',
  '/orders/logistics',
  '/warehouse/consign',
] as const);
const MARKETING_PATHS = new Set([
  '/equity',
  '/marketing/banners',
  '/marketing/coupons',
  '/marketing/checkin',
  '/marketing/invite',
  '/system/rankings',
] as const);
const CONTENT_SYSTEM_PATHS = new Set([
  '/community/posts',
  '/community/comments',
  '/community/reports',
  '/live/list',
  '/live/danmaku',
  '/system/chats',
  '/system/users',
  '/system/roles',
  '/users/permissions',
  '/system/categories',
  '/system/notifications',
] as const);
const PATH_ALIASES: Record<string, string> = {
  '/users': '/users/list',
  '/products': '/products/list',
  '/guesses': '/guesses/list',
  '/orders': '/orders/list',
  '/shops': '/shops/list',
  '/brands': '/brands/list',
  '/product-auth': '/product-auth/list',
  '/warehouse': '/warehouse/virtual',
  '/community': '/community/posts',
  '/live': '/live/list',
};
const MENU_TREE = getAdminMenuTree();
const SIDER_WIDTH = 256;
const SIDER_COLLAPSED_WIDTH = 64;
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

const initialData: AdminPageData = emptyAdminPageData;

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
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>(() =>
    findMenuOpenKeys(MENU_TREE, normalizePath(window.location.hash)),
  );
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const [data, setData] = useState<AdminPageData>(initialData);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

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
    if (!authenticated) {
      return;
    }

    let alive = true;

    async function bootstrap() {
      setLoading(true);
      try {
        const nextData = await loadAdminPageData(activePath);
        if (alive) {
          setData(nextData);
        }
      } finally {
        if (alive) {
          setLoading(false);
          setBootstrapped(true);
        }
      }
    }

    void bootstrap();

    return () => {
      alive = false;
    };
  }, [activePath, authenticated, refreshNonce]);

  useEffect(() => {
    if (!authenticated || data.issues.length === 0) {
      return;
    }

    messageApi.warning(data.issues[0]);
  }, [authenticated, data.issues, messageApi]);

  useEffect(() => {
    const nextKeys = findMenuOpenKeys(MENU_TREE, activePath);
    setMenuOpenKeys((currentKeys) =>
      sameKeys(currentKeys, nextKeys) ? currentKeys : nextKeys,
    );
  }, [activePath]);

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
      setBootstrapped(false);
      setLoginError(null);
      window.location.hash = normalizePath(window.location.hash || DASHBOARD_PATH);
      messageApi.success('登录成功');
    } catch (error) {
      clearAuthToken();
      setAuthenticated(false);
      setCurrentUser(null);
      setBootstrapped(false);
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
      setData(initialData);
      setBootstrapped(false);
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

  const activeMeta = findAdminPageMeta(activePath);
  const menuItems = toMenuItems(MENU_TREE);
  const breadcrumbItems = [
    ...(activeMeta.parentName ? [{ title: activeMeta.parentName }] : []),
    { title: activeMeta.name },
  ];
  const showPageLoading = loading && !bootstrapped;

  return (
    <ConfigProvider theme={ADMIN_THEME}>
      {contextHolder}

      <Layout className="joy-admin-layout">
        <Layout.Sider
          breakpoint="lg"
          className="joy-admin-sider"
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
            className="joy-admin-menu"
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
                setMenuOpenKeys(keys as string[]);
              }
            }}
            openKeys={collapsed ? [] : menuOpenKeys}
            selectedKeys={[activePath]}
            theme="dark"
          />
        </Layout.Sider>

        <Layout className="joy-admin-main">
          <AdminShellHeader
            breadcrumbItems={breadcrumbItems}
            collapsed={collapsed}
            currentUser={currentUser}
            loading={loading}
            onCollapse={setCollapsed}
            onLogout={() => void handleLogout()}
            onOpenDocs={() => window.open('http://localhost:4000/docs', '_blank', 'noopener,noreferrer')}
            onOpenPassword={() => setPasswordModalOpen(true)}
            onRefresh={() => void handleRefresh()}
          />

          <div className="joy-admin-page">
            {showPageLoading ? (
              <AdminContentLoading />
            ) : activePath === DASHBOARD_PATH ? (
              <DashboardPage
                generatedAt={data.dashboard.generatedAt || data.lastUpdatedAt}
                dashboardIssue={data.dashboardIssue}
                loading={loading}
                stats={data.dashboard}
              />
            ) : activePath === USERS_LIST_PATH ? (
              <UsersPage
                issue={data.usersIssue}
                loading={loading}
                onReload={() => void handleRefresh()}
                users={data.users}
              />
            ) : activePath === PRODUCTS_LIST_PATH ? (
              <ProductsPage loading={loading} products={data.products} categories={data.categories} />
            ) : activePath === GUESSES_LIST_PATH ? (
              <GuessesPage guesses={data.guesses} loading={loading} categories={data.categories} />
            ) : activePath === ORDERS_LIST_PATH ? (
              <OrdersPage loading={loading} orders={data.orders} />
            ) : activePath === '/warehouse/virtual' ||
              activePath === '/warehouse/physical' ? (
              <WarehousePage
                items={data.warehouseItems}
                loading={loading}
                stats={data.warehouseStats}
              />
            ) : USER_MERCHANT_PATHS.has(
                activePath as (typeof USER_MERCHANT_PATHS extends Set<infer T> ? T : never),
              ) ? (
              <UserMerchantPage
                data={data}
                loading={loading}
                path={
                  activePath as
                    | '/shops/list'
                    | '/shops/apply'
                    | '/shops/brand-auth'
                    | '/shops/brand-auth/records'
                    | '/shops/products'
                    | '/brands/list'
                    | '/brands/apply'
                    | '/product-auth/list'
                    | '/product-auth/records'
                }
              />
            ) : PRODUCT_GUESS_PATHS.has(
                activePath as (typeof PRODUCT_GUESS_PATHS extends Set<infer T> ? T : never),
              ) ? (
              <ProductGuessPage
                data={data}
                loading={loading}
                path={
                  activePath as
                    | '/products/brands'
                    | '/guesses/create'
                    | '/guesses/friends'
                    | '/pk'
                }
              />
            ) : ORDER_FULFILLMENT_PATHS.has(
                activePath as (typeof ORDER_FULFILLMENT_PATHS extends Set<infer T> ? T : never),
              ) ? (
              <OrderFulfillmentPage
                data={data}
                loading={loading}
                path={
                  activePath as
                    | '/orders/transactions'
                    | '/orders/logistics'
                    | '/warehouse/consign'
                }
              />
            ) : MARKETING_PATHS.has(
                activePath as (typeof MARKETING_PATHS extends Set<infer T> ? T : never),
              ) ? (
              <MarketingPage
                data={data}
                loading={loading}
                path={
                  activePath as
                    | '/equity'
                    | '/marketing/banners'
                    | '/marketing/coupons'
                    | '/marketing/checkin'
                    | '/marketing/invite'
                    | '/system/rankings'
                }
              />
            ) : CONTENT_SYSTEM_PATHS.has(
                activePath as (typeof CONTENT_SYSTEM_PATHS extends Set<infer T> ? T : never),
              ) ? (
              <ContentSystemPage
                data={data}
                loading={loading}
                path={
                  activePath as
                    | '/community/posts'
                    | '/community/comments'
                    | '/community/reports'
                    | '/live/list'
                    | '/live/danmaku'
                    | '/system/chats'
                    | '/system/users'
                    | '/system/roles'
                    | '/users/permissions'
                    | '/system/categories'
                    | '/system/notifications'
                }
              />
            ) : (
              <Result status="404" title="页面未配置" subTitle={activePath} />
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
