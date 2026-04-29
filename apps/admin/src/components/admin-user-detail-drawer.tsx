import type { GuessSummary, OrderSummary, UserSummary } from '@umi/shared';
import { Alert, Avatar, Button, Descriptions, Drawer, Empty, Spin, Table, Tabs, Tag, Typography } from 'antd';

import { guessColumns, orderColumns } from '../lib/admin-users';
import { formatDateTime, formatNumber, formatPercent, roleMeta } from '../lib/format';

interface AdminUserDetailDrawerProps {
  open: boolean;
  selected: UserSummary | null;
  detailLoading: boolean;
  detailSubmitting: boolean;
  detailTab: string;
  detailIssue: string;
  orderIssue: string | null;
  guessIssue: string | null;
  ordersLoading: boolean;
  guessesLoading: boolean;
  userOrders: OrderSummary[];
  userGuesses: GuessSummary[];
  orderPage: number;
  orderPageSize: number;
  orderTotal: number;
  guessPage: number;
  guessPageSize: number;
  guessTotal: number;
  onClose: () => void;
  onToggleBan: () => void | Promise<void>;
  onTabChange: (key: string) => void;
  onOrderPageChange: (page: number, pageSize: number) => void;
  onGuessPageChange: (page: number, pageSize: number) => void;
}

export function AdminUserDetailDrawer({
  open,
  selected,
  detailLoading,
  detailSubmitting,
  detailTab,
  detailIssue,
  orderIssue,
  guessIssue,
  ordersLoading,
  guessesLoading,
  userOrders,
  userGuesses,
  orderPage,
  orderPageSize,
  orderTotal,
  guessPage,
  guessPageSize,
  guessTotal,
  onClose,
  onToggleBan,
  onTabChange,
  onOrderPageChange,
  onGuessPageChange,
}: AdminUserDetailDrawerProps) {
  const orderTabContent = orderIssue ? (
    <Alert showIcon type="warning" message="订单记录加载失败" description={orderIssue} />
  ) : userOrders.length > 0 || ordersLoading ? (
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
        onChange: onOrderPageChange,
      }}
      rowKey="id"
      size="small"
    />
  ) : (
    <Empty description="暂无订单记录" />
  );

  const guessTabContent = guessIssue ? (
    <Alert showIcon type="warning" message="竞猜记录加载失败" description={guessIssue} />
  ) : userGuesses.length > 0 || guessesLoading ? (
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
        onChange: onGuessPageChange,
      }}
      rowKey="id"
      size="small"
    />
  ) : (
    <Empty description="暂无竞猜记录" />
  );

  return (
    <Drawer open={open} width={640} title={selected?.name ?? '用户详情'} onClose={onClose}>
      {detailLoading ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <Spin />
        </div>
      ) : selected ? (
        <div style={{ display: 'grid', gap: 16, width: '100%' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <Avatar size={56} src={selected.avatar}>
              {selected.name.slice(0, 1)}
            </Avatar>
            <div style={{ display: 'grid', gap: 2 }}>
              <Typography.Text strong>{selected.name}</Typography.Text>
              <Typography.Text type="secondary">{selected.phone}</Typography.Text>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Button danger={!selected.banned} loading={detailSubmitting} onClick={() => void onToggleBan()}>
                {selected.banned ? '解除封禁' : '封禁用户'}
              </Button>
            </div>
          </div>

          {detailIssue ? (
            <Alert showIcon type="warning" message="部分详情加载失败" description={detailIssue} />
          ) : null}

          <Tabs
            activeKey={detailTab}
            onChange={onTabChange}
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="UID">{selected.uid}</Descriptions.Item>
                    <Descriptions.Item label="角色">
                      <Tag color={roleMeta[selected.role].color}>{roleMeta[selected.role].label}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="手机号">{selected.phone}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      {selected.banned ? <Tag color="error">已封禁</Tag> : <Tag color="success">正常</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="地区">{selected.region ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="店铺">{selected.shopName ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="粉丝 / 关注">
                      {formatNumber(selected.followers ?? 0)} / {formatNumber(selected.following ?? 0)}
                    </Descriptions.Item>
                    <Descriptions.Item label="竞猜战绩">
                      {formatNumber(selected.wins ?? 0)} / {formatNumber(selected.totalGuess ?? 0)}
                    </Descriptions.Item>
                    <Descriptions.Item label="订单记录">{formatNumber(selected.totalOrders ?? 0)}</Descriptions.Item>
                    <Descriptions.Item label="猜中率">{formatPercent(selected.winRate)}</Descriptions.Item>
                    <Descriptions.Item label="注册时间">{formatDateTime(selected.joinDate)}</Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'orders',
                label: `订单记录 (${orderTotal})`,
                children: orderTabContent,
              },
              {
                key: 'guesses',
                label: `竞猜记录 (${guessTotal})`,
                children: guessTabContent,
              },
            ]}
          />
        </div>
      ) : (
        <Empty description="用户详情不存在" />
      )}
    </Drawer>
  );
}
