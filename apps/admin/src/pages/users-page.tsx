import type {
  AdminUserFilter,
  UserSummary,
} from '@umi/shared';
import { ProTable } from '@ant-design/pro-components';

import { ConfigProvider, Form, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminUserDetailDrawer } from '../components/admin-user-detail-drawer';
import { AdminUsersFilters } from '../components/admin-users-filters';
import {
  buildUserColumns,
  buildUserSummaryItems,
  type UserSummaryCounts,
  type UsersSearchFormValues,
} from '../lib/admin-users';
import { useAdminUserDetailState } from '../lib/admin-users-page';
import {
  fetchAdminUsersPage,
} from '../lib/api/users';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface UsersPageProps {
  refreshToken?: number;
}

export function UsersPage({ refreshToken = 0 }: UsersPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<AdminUserFilter>('all');
  const [listLoading, setListLoading] = useState(false);
  const [listIssue, setListIssue] = useState<string | null>(null);
  const [listData, setListData] = useState<UserSummary[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [summary, setSummary] = useState<UserSummaryCounts>({
    totalUsers: 0,
    verifiedUsers: 0,
    bannedUsers: 0,
  });
  const [searchForm] = Form.useForm<UsersSearchFormValues>();

  async function reloadUsers() {
    const result = await fetchAdminUsersPage({
      page,
      pageSize,
      keyword,
      phone,
      shopName,
      role,
    });

    setListData(result.items);
    setTotal(result.total);
    setSummary(result.summary);
    setListIssue(null);
  }

  const {
    selectedId,
    detailTab,
    detailLoading,
    detailSubmitting,
    selected,
    detailIssue,
    orderIssue,
    guessIssue,
    inviteIssue,
    ordersLoading,
    guessesLoading,
    invitesLoading,
    userOrders,
    userGuesses,
    userInvites,
    orderPage,
    orderPageSize,
    orderTotal,
    guessPage,
    guessPageSize,
    guessTotal,
    invitePage,
    invitePageSize,
    inviteTotal,
    setSelectedId,
    setDetailTab,
    handleToggleBan,
    handleOrderPageChange,
    handleGuessPageChange,
    handleInvitePageChange,
  } = useAdminUserDetailState({
    onUserBanUpdated: reloadUsers,
    onBanSuccess: (banned) => {
      messageApi.success(banned ? '已封禁该用户' : '已解除封禁');
    },
    onBanError: (error) => {
      messageApi.error(error instanceof Error ? error.message : '操作失败');
    },
  });

  const columns = useMemo(() => buildUserColumns(setSelectedId), [setSelectedId]);
  const statusItems = useMemo(() => buildUserSummaryItems(summary), [summary]);

  useEffect(() => {
    let alive = true;

    async function loadUsers() {
      setListLoading(true);
      try {
        const result = await fetchAdminUsersPage({ page, pageSize, keyword, phone, shopName, role });
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
  }, [keyword, page, pageSize, phone, refreshToken, role, shopName]);

  return (
    <div className="page-stack">
      {contextHolder}

      <AdminUsersFilters
        form={searchForm}
        listIssue={listIssue}
        role={role}
        statusItems={statusItems}
        onSearch={() => {
          const values = searchForm.getFieldsValue();
          setKeyword(values.keyword ?? '');
          setPhone(values.phone ?? '');
          setShopName(values.shopName ?? '');
          setPage(1);
        }}
        onReset={() => {
          searchForm.resetFields();
          setKeyword('');
          setPhone('');
          setShopName('');
          setRole('all');
          setPage(1);
        }}
        onRoleChange={(nextRole) => {
          setRole(nextRole);
          setPage(1);
        }}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<UserSummary>
          cardBordered={false}
          rowKey="id"
          columns={columns as never}
          columnsState={{}}
          dataSource={listData}
          loading={listLoading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
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
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <AdminUserDetailDrawer
        open={selectedId != null}
        selected={selected}
        detailLoading={detailLoading}
        detailSubmitting={detailSubmitting}
        detailTab={detailTab}
        detailIssue={detailIssue}
        orderIssue={orderIssue}
        guessIssue={guessIssue}
        inviteIssue={inviteIssue}
        ordersLoading={ordersLoading}
        guessesLoading={guessesLoading}
        invitesLoading={invitesLoading}
        userOrders={userOrders}
        userGuesses={userGuesses}
        userInvites={userInvites}
        orderPage={orderPage}
        orderPageSize={orderPageSize}
        orderTotal={orderTotal}
        guessPage={guessPage}
        guessPageSize={guessPageSize}
        guessTotal={guessTotal}
        invitePage={invitePage}
        invitePageSize={invitePageSize}
        inviteTotal={inviteTotal}
        onClose={() => setSelectedId(null)}
        onToggleBan={handleToggleBan}
        onTabChange={setDetailTab}
        onOrderPageChange={handleOrderPageChange}
        onGuessPageChange={handleGuessPageChange}
        onInvitePageChange={handleInvitePageChange}
      />
    </div>
  );
}
