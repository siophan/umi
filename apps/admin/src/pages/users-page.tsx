import type {
  AdminUserFilter,
  GuessSummary,
  OrderSummary,
  UserSummary,
} from '@joy/shared';
import type { TableColumnsType } from 'antd';

import { Alert, Avatar, Card, Descriptions, Drawer, Form, Input, Space, Table, Tag, Typography } from 'antd';
import { Button, Empty, Spin, Tabs, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import {
  formatAmount,
  formatDateTime,
  formatNumber,
  formatPercent,
  guessStatusMeta,
  orderStatusMeta,
  roleMeta,
} from '../lib/format';
import {
  fetchAdminUsersPage,
  fetchAdminUserDetail,
  fetchAdminUserGuesses,
  fetchAdminUserOrders,
  updateAdminUserBan,
} from '../lib/api';

interface UsersPageProps {
  issue?: string | null;
  loading: boolean;
  onReload?: () => Promise<void> | void;
  users?: UserSummary[];
}

export function UsersPage({
  issue = null,
  loading,
  users = [],
}: UsersPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<AdminUserFilter>('all');
  const [listLoading, setListLoading] = useState(false);
  const [listIssue, setListIssue] = useState<string | null>(issue);
  const [listData, setListData] = useState<UserSummary[]>(users);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(users.length);
  const [extraFilters, setExtraFilters] = useState<{
    phone?: string;
    shopName?: string;
  }>({});
  const [summary, setSummary] = useState({
    totalUsers: users.length,
    verifiedUsers: users.filter((user) => user.shopVerified).length,
    bannedUsers: users.filter((user) => user.banned).length,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState('info');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSubmitting, setDetailSubmitting] = useState(false);
  const [selected, setSelected] = useState<UserSummary | null>(null);
  const [profileIssue, setProfileIssue] = useState<string | null>(null);
  const [orderIssue, setOrderIssue] = useState<string | null>(null);
  const [guessIssue, setGuessIssue] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [guessesLoading, setGuessesLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<OrderSummary[]>([]);
  const [userGuesses, setUserGuesses] = useState<GuessSummary[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [orderTotal, setOrderTotal] = useState(0);
  const [guessPage, setGuessPage] = useState(1);
  const [guessPageSize, setGuessPageSize] = useState(10);
  const [guessTotal, setGuessTotal] = useState(0);
  const [searchForm] = Form.useForm<{ keyword?: string; phone?: string; shopName?: string }>();

  useEffect(() => {
    setListIssue(issue ?? null);
  }, [issue]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setUserOrders([]);
      setUserGuesses([]);
      setProfileIssue(null);
      setOrderIssue(null);
      setGuessIssue(null);
      setDetailTab('info');
      setOrderPage(1);
      setOrderPageSize(10);
      setOrderTotal(0);
      setGuessPage(1);
      setGuessPageSize(10);
      setGuessTotal(0);
      return;
    }

    const currentSelectedId = selectedId;
    let alive = true;

    setSelected(null);
    setUserOrders([]);
    setUserGuesses([]);
    setProfileIssue(null);
    setOrderIssue(null);
    setGuessIssue(null);
    setDetailTab('info');
    setOrderTotal(0);
    setGuessTotal(0);

    async function loadUserDetail() {
      setDetailLoading(true);
      setProfileIssue(null);
      try {
        const userResult = await fetchAdminUserDetail(currentSelectedId);

        if (!alive) {
          return;
        }

        setSelected(userResult);
        setOrderTotal(userResult.totalOrders ?? 0);
        setGuessTotal(userResult.totalGuess ?? 0);
      } catch (error) {
        if (!alive) {
          return;
        }
        setSelected(null);
        setProfileIssue(error instanceof Error ? error.message : '用户详情加载失败');
      } finally {
        if (alive) {
          setDetailLoading(false);
        }
      }
    }

    void loadUserDetail();

    return () => {
      alive = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const currentSelectedId = selectedId;
    let alive = true;

    async function loadOrders() {
      setOrdersLoading(true);
      setOrderIssue(null);
      try {
        const result = await fetchAdminUserOrders(currentSelectedId, {
          page: orderPage,
          pageSize: orderPageSize,
        });
        if (!alive) {
          return;
        }
        setUserOrders(result.items);
        setOrderTotal(result.total);
      } catch (error) {
        if (!alive) {
          return;
        }
        setUserOrders([]);
        setOrderTotal(0);
        setOrderIssue(error instanceof Error ? `订单记录：${error.message}` : '订单记录加载失败');
      } finally {
        if (alive) {
          setOrdersLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      alive = false;
    };
  }, [orderPage, orderPageSize, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const currentSelectedId = selectedId;
    let alive = true;

    async function loadGuesses() {
      setGuessesLoading(true);
      setGuessIssue(null);
      try {
        const result = await fetchAdminUserGuesses(currentSelectedId, {
          page: guessPage,
          pageSize: guessPageSize,
        });
        if (!alive) {
          return;
        }
        setUserGuesses(result.items);
        setGuessTotal(result.total);
      } catch (error) {
        if (!alive) {
          return;
        }
        setUserGuesses([]);
        setGuessTotal(0);
        setGuessIssue(error instanceof Error ? `竞猜记录：${error.message}` : '竞猜记录加载失败');
      } finally {
        if (alive) {
          setGuessesLoading(false);
        }
      }
    }

    void loadGuesses();

    return () => {
      alive = false;
    };
  }, [guessPage, guessPageSize, selectedId]);

  const detailIssue = useMemo(
    () => [profileIssue, orderIssue, guessIssue].filter(Boolean).join('；'),
    [guessIssue, orderIssue, profileIssue],
  );

  const visibleUsers = useMemo(() => {
    return listData.filter((user) => {
      if (
        extraFilters.phone &&
        !String(user.phone ?? '')
          .toLowerCase()
          .includes(extraFilters.phone.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        extraFilters.shopName &&
        !String(user.shopName ?? '')
          .toLowerCase()
          .includes(extraFilters.shopName.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [extraFilters.phone, extraFilters.shopName, listData]);

  useEffect(() => {
    let alive = true;

    async function loadUsers() {
      setListLoading(true);
      try {
        const result = await fetchAdminUsersPage({
          page,
          pageSize,
          keyword,
          role,
        });

        if (!alive) {
          return;
        }

        setListData(result.items);
        setTotal(result.total);
        setSummary(result.summary);
        setListIssue(null);
      } catch (error) {
        if (!alive) {
          return;
        }
        setListData([]);
        setTotal(0);
        setListIssue(error instanceof Error ? error.message : '用户列表加载失败');
      } finally {
        if (alive) {
          setListLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      alive = false;
    };
  }, [keyword, page, pageSize, role]);

  async function handleToggleBan() {
    if (!selected) {
      return;
    }

    setDetailSubmitting(true);
    try {
      const result = await updateAdminUserBan(selected.id, {
        banned: !selected.banned,
      });
      setSelected((current) =>
        current ? { ...current, banned: result.banned } : current,
      );
      messageApi.success(result.banned ? '已封禁该用户' : '已解除封禁');
      const refreshed = await fetchAdminUsersPage({
        page,
        pageSize,
        keyword,
        role,
      });
      setListData(refreshed.items);
      setTotal(refreshed.total);
      setSummary(refreshed.summary);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setDetailSubmitting(false);
    }
  }

  const orderColumns: TableColumnsType<OrderSummary> = [
    {
      title: '订单',
      dataIndex: 'id',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>#{record.id}</Typography.Text>
          <Typography.Text type="secondary">
            {record.guessTitle ?? record.items[0]?.productName ?? '普通订单'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (value: number) => formatAmount(Math.round(value * 100)),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: OrderSummary['status']) => (
        <Tag color={orderStatusMeta[value].color}>
          {orderStatusMeta[value].label}
        </Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      render: (value) => formatDateTime(value),
    },
  ];

  const guessColumns: TableColumnsType<GuessSummary> = [
    {
      title: '竞猜',
      dataIndex: 'title',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text type="secondary">
            {record.product.name}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: GuessSummary['status']) => (
        <Tag color={guessStatusMeta[value].color}>
          {guessStatusMeta[value].label}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
    },
    {
      title: '截止',
      dataIndex: 'endTime',
      render: (value) => formatDateTime(value),
    },
  ];

  const columns: TableColumnsType<UserSummary> = [
    {
      title: '用户',
      dataIndex: 'name',
      render: (_, record) => (
        <Space size={12}>
          <Avatar src={record.avatar}>{record.name.slice(0, 1)}</Avatar>
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{record.name}</Typography.Text>
            <Typography.Text type="secondary">UID {record.uid}</Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      render: (value: UserSummary['role']) => (
        <Tag color={roleMeta[value].color}>{roleMeta[value].label}</Tag>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      render: (_, record) =>
        record.level ? (
          <Space direction="vertical" size={0}>
            <Typography.Text>Lv.{record.level}</Typography.Text>
            <Typography.Text type="secondary">{record.title ?? '未设置头衔'}</Typography.Text>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '竞猜',
      dataIndex: 'totalGuess',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{formatNumber(record.totalGuess ?? 0)} 场</Typography.Text>
          <Typography.Text type="secondary">
            胜率 {formatPercent(record.winRate)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '店铺',
      dataIndex: 'shopName',
      render: (_, record) =>
        record.shopName ? (
          <Space direction="vertical" size={0}>
            <Typography.Text>{record.shopName}</Typography.Text>
            <Typography.Text type="secondary">
              {record.shopVerified ? '已认证店铺' : '店铺资料待完善'}
            </Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: '零钱',
      dataIndex: 'coins',
      render: (value: number) => formatAmount(value),
    },
    {
      title: '状态',
      dataIndex: 'banned',
      render: (value: UserSummary['banned']) =>
        value ? <Tag color="error">已封禁</Tag> : <Tag color="success">正常</Tag>,
    },
    {
      title: '注册时间',
      dataIndex: 'joinDate',
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => setSelectedId(record.id)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack">
      {contextHolder}

      {listIssue ? (
        <Alert
          showIcon
          type="warning"
          message="用户列表加载失败"
          description={listIssue}
        />
      ) : null}

      <AdminSearchPanel
        form={searchForm}
        onSearch={() => {
          const values = searchForm.getFieldsValue();
          setKeyword(values.keyword ?? '');
          setExtraFilters({
            phone: values.phone,
            shopName: values.shopName,
          });
          setPage(1);
        }}
        onReset={() => {
          searchForm.resetFields();
          setKeyword('');
          setExtraFilters({});
          setRole('all');
          setPage(1);
        }}
      >
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

      <AdminStatusTabs
        activeKey={role}
        items={[
          { key: 'all', label: '全部', count: summary.totalUsers },
          { key: 'user', label: '普通用户' },
          { key: 'shop_owner', label: '店主', count: summary.verifiedUsers },
          { key: 'banned', label: '已封禁', count: summary.bannedUsers },
        ]}
        onChange={(nextRole) => {
          setRole(nextRole as AdminUserFilter);
          setPage(1);
        }}
      />

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={visibleUsers}
          loading={loading || listLoading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPage(1);
                setPageSize(nextPageSize);
                return;
              }
              setPage(nextPage);
            },
            pageSizeOptions: [10, 20, 50],
            locale: {
              items_per_page: '条/页',
            },
          }}
        />
      </Card>

      <Drawer
        open={selectedId != null}
        width={640}
        title={selected?.name ?? '用户详情'}
        onClose={() => setSelectedId(null)}
      >
        {detailLoading ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space size={12}>
              <Avatar size={56} src={selected.avatar}>
                {selected.name.slice(0, 1)}
              </Avatar>
              <Space direction="vertical" size={2}>
                <Typography.Text strong>{selected.name}</Typography.Text>
                <Typography.Text type="secondary">
                  {selected.phone}
                </Typography.Text>
              </Space>
              <div style={{ marginLeft: 'auto' }}>
                <Button
                  danger={!selected.banned}
                  loading={detailSubmitting}
                  onClick={() => void handleToggleBan()}
                >
                  {selected.banned ? '解除封禁' : '封禁用户'}
                </Button>
              </div>
            </Space>

            {detailIssue ? (
              <Alert
                showIcon
                type="warning"
                message="部分详情加载失败"
                description={detailIssue}
              />
            ) : null}

            <Tabs
              activeKey={detailTab}
              onChange={setDetailTab}
              items={[
                {
                  key: 'info',
                  label: '基本信息',
                  children: (
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="UID">{selected.uid}</Descriptions.Item>
                      <Descriptions.Item label="角色">
                        <Tag color={roleMeta[selected.role].color}>
                          {roleMeta[selected.role].label}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="手机号">{selected.phone}</Descriptions.Item>
                      <Descriptions.Item label="状态">
                        {selected.banned ? (
                          <Tag color="error">已封禁</Tag>
                        ) : (
                          <Tag color="success">正常</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="地区">{selected.region ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="店铺">{selected.shopName ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="余额">
                        {formatAmount(selected.coins)}
                      </Descriptions.Item>
                      <Descriptions.Item label="粉丝 / 关注">
                        {formatNumber(selected.followers ?? 0)} / {formatNumber(selected.following ?? 0)}
                      </Descriptions.Item>
                      <Descriptions.Item label="竞猜战绩">
                        {formatNumber(selected.wins ?? 0)} / {formatNumber(selected.totalGuess ?? 0)}
                      </Descriptions.Item>
                      <Descriptions.Item label="订单记录">
                        {formatNumber(selected.totalOrders ?? 0)}
                      </Descriptions.Item>
                      <Descriptions.Item label="猜中率">
                        {formatPercent(selected.winRate)}
                      </Descriptions.Item>
                      <Descriptions.Item label="注册时间">
                        {formatDateTime(selected.joinDate)}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'orders',
                  label: `订单记录 (${orderTotal})`,
                  children:
                    userOrders.length > 0 || ordersLoading ? (
                      <Table
                        columns={orderColumns}
                        dataSource={userOrders}
                        loading={ordersLoading}
                        pagination={{
                          current: orderPage,
                          pageSize: orderPageSize,
                          total: orderTotal,
                          showSizeChanger: true,
                          showTotal: (value) => `共 ${value} 条`,
                          pageSizeOptions: [10, 20, 50],
                          locale: {
                            items_per_page: '条/页',
                          },
                          onChange: (nextPage, nextPageSize) => {
                            if (nextPageSize !== orderPageSize) {
                              setOrderPage(1);
                              setOrderPageSize(nextPageSize);
                              return;
                            }
                            setOrderPage(nextPage);
                          },
                        }}
                        rowKey="id"
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无订单记录" />
                    ),
                },
                {
                  key: 'guesses',
                  label: `竞猜记录 (${guessTotal})`,
                  children:
                    userGuesses.length > 0 || guessesLoading ? (
                      <Table
                        columns={guessColumns}
                        dataSource={userGuesses}
                        loading={guessesLoading}
                        pagination={{
                          current: guessPage,
                          pageSize: guessPageSize,
                          total: guessTotal,
                          showSizeChanger: true,
                          showTotal: (value) => `共 ${value} 条`,
                          pageSizeOptions: [10, 20, 50],
                          locale: {
                            items_per_page: '条/页',
                          },
                          onChange: (nextPage, nextPageSize) => {
                            if (nextPageSize !== guessPageSize) {
                              setGuessPage(1);
                              setGuessPageSize(nextPageSize);
                              return;
                            }
                            setGuessPage(nextPage);
                          },
                        }}
                        rowKey="id"
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无竞猜记录" />
                    ),
                },
              ]}
            />
          </Space>
        ) : (
          <Empty description="用户详情不存在" />
        )}
      </Drawer>
    </div>
  );
}
