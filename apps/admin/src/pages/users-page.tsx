import type { UserSummary } from '@joy/shared';
import type { TableColumnsType } from 'antd';

import { Card, Descriptions, Drawer, Input, Segmented, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

import { formatAmount, formatDateTime, formatPercent, roleMeta } from '../lib/format';

interface UsersPageProps {
  loading: boolean;
  users: UserSummary[];
}

type UserFilter = 'all' | 'admin' | 'shop_owner' | 'user';

export function UsersPage({ loading, users }: UsersPageProps) {
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<UserFilter>('all');
  const [selected, setSelected] = useState<UserSummary | null>(null);

  const filteredUsers = users.filter((user) => {
    const roleMatched = role === 'all' ? true : user.role === role;
    const keywordMatched =
      keyword.trim() === ''
        ? true
        : `${user.name} ${user.uid} ${user.phone} ${user.shopName ?? ''}`
            .toLowerCase()
            .includes(keyword.toLowerCase());

    return roleMatched && keywordMatched;
  });

  const columns: TableColumnsType<UserSummary> = [
    {
      title: '用户',
      dataIndex: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text type="secondary">UID {record.uid}</Typography.Text>
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
      render: (value) => value ?? '-',
    },
    {
      title: '余额',
      dataIndex: 'coins',
      render: (value: number) => formatAmount(value),
    },
    {
      title: '猜中率',
      dataIndex: 'winRate',
      render: (value) => formatPercent(value),
    },
    {
      title: '加入时间',
      dataIndex: 'joinDate',
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <div className="page-stack">
      <Space wrap size={16}>
        <Card className="metric-card">
          <Statistic title="用户总数" value={filteredUsers.length} />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="店铺认证用户"
            value={filteredUsers.filter((user) => user.shopVerified).length}
          />
        </Card>
        <Card className="metric-card">
          <Statistic
            title="管理员"
            value={filteredUsers.filter((user) => user.role === 'admin').length}
          />
        </Card>
      </Space>

      <Card
        title="用户列表"
        extra={
          <Space wrap>
            <Segmented<UserFilter>
              options={[
                { label: '全部', value: 'all' },
                { label: '普通用户', value: 'user' },
                { label: '店主', value: 'shop_owner' },
                { label: '管理员', value: 'admin' },
              ]}
              value={role}
              onChange={setRole}
            />
            <Input.Search
              allowClear
              placeholder="搜索昵称 / UID / 手机号"
              style={{ width: 260 }}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          pagination={{ pageSize: 6 }}
          onRow={(record) => ({
            onClick: () => setSelected(record),
          })}
        />
      </Card>

      <Drawer
        open={selected != null}
        width={420}
        title={selected?.name}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="UID">{selected.uid}</Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color={roleMeta[selected.role].color}>
                  {roleMeta[selected.role].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="手机号">{selected.phone}</Descriptions.Item>
              <Descriptions.Item label="地区">{selected.region ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="店铺">{selected.shopName ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="余额">
                {formatAmount(selected.coins)}
              </Descriptions.Item>
              <Descriptions.Item label="猜中率">
                {formatPercent(selected.winRate)}
              </Descriptions.Item>
              <Descriptions.Item label="加入时间">
                {formatDateTime(selected.joinDate)}
              </Descriptions.Item>
            </Descriptions>

            <Card title="运营建议" size="small">
              <Space direction="vertical" size={8}>
                <Typography.Text>查看最近登录与下注频次</Typography.Text>
                <Typography.Text>补封禁、禁言、角色切换操作</Typography.Text>
                <Typography.Text>补个人资料、地址、订单侧边详情</Typography.Text>
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
}
