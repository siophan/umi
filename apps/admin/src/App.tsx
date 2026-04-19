import {
  DownOutlined,
  LockOutlined,
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer, ProLayout } from '@ant-design/pro-components';
import type { AdminProfile, ChangePasswordPayload } from '@joy/shared';
import {
  Avatar,
  Button,
  ConfigProvider,
  Dropdown,
  Form,
  Input,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

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
  fallbackDashboardStats,
  fallbackGuesses,
  fallbackOrders,
  fallbackProducts,
  fallbackUsers,
  fallbackWarehouseItems,
  fallbackWarehouseStats,
} from './lib/admin-data';
import { loadAdminRuntimeData, type AdminRuntimeData } from './lib/admin-loader';
import { LoginScreen } from './components/login-screen';
import {
  findLegacyPageMeta,
  getLegacyMenuTree,
  getLegacyPage,
} from './lib/legacy-admin';
import { formatDateTime } from './lib/format';
import { DashboardPage } from './pages/dashboard-page';
import { LegacyFeaturePage } from './pages/legacy-feature-page';

function normalizePath(hash: string) {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw || raw === '/') {
    return '/';
  }

  return raw.startsWith('/') ? raw : `/${raw}`;
}

function toProRoutes(nodes: ReturnType<typeof getLegacyMenuTree>) {
  return nodes.map((node): {
    path: string;
    name: string;
    icon: ReactNode;
    routes?: ReturnType<typeof toProRoutes>;
  } => ({
    path: node.path ?? node.key,
    name: node.name,
    icon: node.icon,
    routes: node.children ? toProRoutes(node.children) : undefined,
  }));
}

const initialData: AdminRuntimeData = {
  dashboard: fallbackDashboardStats,
  users: fallbackUsers,
  products: fallbackProducts,
  guesses: fallbackGuesses,
  orders: fallbackOrders,
  warehouseStats: fallbackWarehouseStats,
  warehouseItems: fallbackWarehouseItems,
  usingFallback: true,
  issues: [],
  lastUpdatedAt: new Date().toISOString(),
};

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
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const [data, setData] = useState<AdminRuntimeData>(initialData);

  useEffect(() => {
    const syncFromHash = () => {
      setActivePath(normalizePath(window.location.hash));
    };

    if (!window.location.hash) {
      window.location.hash = '/';
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
        const nextData = await loadAdminRuntimeData();
        if (alive) {
          setData(nextData);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      alive = false;
    };
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || data.issues.length === 0) {
      return;
    }

    messageApi.warning(data.issues[0]);
  }, [authenticated, data.issues, messageApi]);

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
      window.location.hash = normalizePath(window.location.hash);
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
    setLoading(true);

    try {
      const nextData = await loadAdminRuntimeData();
      setData(nextData);
      messageApi.success('后台数据已刷新');
    } finally {
      setLoading(false);
    }
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
      messageApi.success('已退出登录');
    }
  }

  if (authChecking) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 16,
            colorBgLayout: '#f3f5f8',
          },
        }}
      >
        {contextHolder}
        <div className="login-screen login-screen--loading">
          <Typography.Text type="secondary">正在校验登录状态...</Typography.Text>
        </div>
      </ConfigProvider>
    );
  }

  if (!authenticated || !currentUser) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 16,
            colorBgLayout: '#f3f5f8',
          },
        }}
      >
        {contextHolder}
        <LoginScreen
          errorMessage={loginError}
          loading={loginLoading}
          onSubmit={handleLogin}
        />
      </ConfigProvider>
    );
  }

  const pageContext = {
    currentUserName: currentUser.displayName,
    data,
    loading,
    usingFallback: data.usingFallback,
  };
  const activePage = getLegacyPage(activePath, pageContext);
  const activeDefinition = activePath === '/' ? null : activePage.builder(pageContext);
  const activeMeta = findLegacyPageMeta(activePath);
  const menuTree = getLegacyMenuTree();
  const menuRoutes = toProRoutes(menuTree);
  const userMenuItems = [
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalOpen(true),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => void handleLogout(),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 16,
          colorBgLayout: '#f3f5f8',
        },
      }}
    >
      {contextHolder}

      <ProLayout
        className="joy-admin-layout"
        title="JOY Admin"
        logo={false}
        layout="mix"
        fixedHeader
        fixSiderbar
        splitMenus={false}
        route={{ routes: menuRoutes }}
        location={{ pathname: activePath }}
        menuItemRender={(item, dom) => {
          const menuItem = item as { path?: string; routes?: unknown[] };

          if (Array.isArray(menuItem.routes) && menuItem.routes.length > 0) {
            return dom;
          }

          return <a href={`#${menuItem.path}`}>{dom}</a>;
        }}
        actionsRender={() => [
          <Dropdown key="user-menu" menu={{ items: userMenuItems }} trigger={['click']}>
            <button className="toolbar-user" type="button">
              <Avatar
                icon={<UserOutlined />}
                className="toolbar-user__avatar"
                size={36}
              />
              <span className="toolbar-user__meta">
                <Typography.Text className="toolbar-user__name" strong>
                  {currentUser.displayName}
                </Typography.Text>
                <span className="toolbar-user__sub">
                  <span className="toolbar-user__dot is-live" />
                  <Typography.Text className="toolbar-user__subtext" type="secondary">
                    {currentUser.roles[0]?.name ?? currentUser.username}
                  </Typography.Text>
                </span>
              </span>
              <DownOutlined className="toolbar-user__arrow" />
            </button>
          </Dropdown>,
        ]}
      >
        <PageContainer
          header={{
            title: activePage.title,
            subTitle: activePage.description,
            tags: (
              <Space wrap>
                <Tag color="processing">Legacy Menu</Tag>
                <Tag color="processing">Ant Design Pro</Tag>
                {data.usingFallback ? <Tag color="warning">演示数据</Tag> : null}
                {data.issues.length > 0 ? (
                  <Tag color="error">{`接口告警 ${data.issues.length}`}</Tag>
                ) : null}
              </Space>
            ),
            extra: [
              <Button
                key="docs"
                href="http://localhost:4000/docs"
                rel="noreferrer"
                target="_blank"
              >
                打开接口文档
              </Button>,
              <Button
                key="refresh"
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={() => void handleRefresh()}
              >
                刷新数据
              </Button>,
            ],
            breadcrumb: {
              items: [
                { path: '#/', title: '后台' },
                ...(activeMeta.parentName
                  ? [{ title: activeMeta.parentName }]
                  : []),
                { title: activeMeta.name },
              ],
            },
            footer: (
              <Typography.Text type="secondary">
                最近同步时间 {formatDateTime(data.lastUpdatedAt)}
              </Typography.Text>
            ),
          }}
        >
          {activePath === '/' ? (
            <DashboardPage
              activeKey="dashboard"
              lastUpdatedAt={data.lastUpdatedAt}
              loading={loading}
              onOpenModule={(key) => {
                const nextPath =
                  key === 'dashboard'
                    ? '/'
                    : key === 'users'
                      ? '/users'
                      : key === 'products'
                        ? '/products'
                        : key === 'guesses'
                          ? '/guesses'
                          : key === 'orders'
                            ? '/orders'
                            : '/warehouse';
                window.location.hash = nextPath;
              }}
              stats={data.dashboard}
              usingFallback={data.usingFallback}
            />
          ) : (
            <LegacyFeaturePage
              definition={activeDefinition!}
              loading={loading}
              usingFallback={data.usingFallback}
            />
          )}
        </PageContainer>
      </ProLayout>

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
