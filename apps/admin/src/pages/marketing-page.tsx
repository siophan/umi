import type { ReactNode } from 'react';
import { Card, Descriptions, Drawer, Form, Input, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminPageData } from '../lib/admin-page-data';
import { formatAmount, formatDateTime, formatNumber, formatPercent } from '../lib/format';

type MarketingPath =
  | '/equity'
  | '/marketing/banners'
  | '/marketing/coupons'
  | '/marketing/checkin'
  | '/marketing/invite'
  | '/system/rankings';

interface MarketingPageProps {
  data: AdminPageData;
  loading: boolean;
  path: MarketingPath;
}

type EquityRow = {
  id: string;
  userId: string;
  userName: string;
  balance: number;
  frozen: number;
  accountType: string;
  note: string;
};

type BannerRow = {
  id: string;
  title: string;
  position: string;
  audience: string;
  status: '投放中' | '待排期' | '已暂停';
  clickRate: number;
  updatedAt: string;
};

type CouponRow = {
  id: string;
  name: string;
  type: string;
  scope: string;
  stock: number;
  claimed: number;
  faceValue: number;
  status: '发放中' | '待开始' | '已暂停';
};

type CheckinRow = {
  id: string;
  cycle: string;
  reward: string;
  target: string;
  trigger: string;
  dailyCap: string;
  status: '启用中' | '待上线';
};

type InviteRow = {
  id: string;
  campaign: string;
  channel: string;
  invitedUsers: number;
  convertedUsers: number;
  rewardCost: number;
  status: '进行中' | '复盘中' | '待发布';
};

type RankingRow = {
  id: string;
  name: string;
  dimension: string;
  refreshRule: string;
  publishScope: string;
  status: '启用中' | '待灰度';
  lastGeneratedAt: string;
};

type DetailRecord =
  | EquityRow
  | BannerRow
  | CouponRow
  | CheckinRow
  | InviteRow
  | RankingRow;

interface MarketingView {
  title: string;
  metrics: ReactNode;
  rows: DetailRecord[];
  columns: TableColumnsType<DetailRecord>;
}

function statusColor(status: string) {
  if (status.includes('启用') || status.includes('投放') || status.includes('发放') || status.includes('进行')) {
    return 'success';
  }
  if (status.includes('暂停') || status.includes('复盘')) {
    return 'warning';
  }
  return 'default';
}

export function MarketingPage({ data, loading, path }: MarketingPageProps) {
  const [selected, setSelected] = useState<DetailRecord | null>(null);
  const [filters, setFilters] = useState<{
    keyword?: string;
    second?: string;
    third?: string;
  }>({});
  const [status, setStatus] = useState('all');
  const [form] = Form.useForm<{ keyword?: string; second?: string; third?: string }>();

  const equityRows = useMemo<EquityRow[]>(
    () =>
      data.users.map((user, index) => {
        const balance = Math.round(user.coins * 0.55);
        const frozen = Math.round(user.coins * (user.role === 'shop_owner' ? 0.22 : 0.12));
        return {
          id: `equity-${index + 1}`,
          userId: user.id,
          userName: user.name,
          balance,
          frozen,
          accountType: user.role === 'shop_owner' ? '店铺担保户' : '用户账户',
          note: frozen > balance * 0.3 ? '冻结占比偏高' : '余额结构正常',
        };
      }),
    [data.users],
  );

  const bannerRows: BannerRow[] = [
    {
      id: 'banner-1',
      title: 'Panda 限时竞猜季',
      position: '首页头图',
      audience: '全体用户',
      status: '投放中',
      clickRate: 8.4,
      updatedAt: data.lastUpdatedAt,
    },
    {
      id: 'banner-2',
      title: '新店入驻奖励',
      position: '商城二屏',
      audience: '新注册店主',
      status: '待排期',
      clickRate: 4.1,
      updatedAt: data.lastUpdatedAt,
    },
  ];

  const couponRows: CouponRow[] = [
    {
      id: 'coupon-1',
      name: '满 199 减 20',
      type: '满减券',
      scope: '平台通用',
      stock: 1200,
      claimed: 840,
      faceValue: 2000,
      status: '发放中',
    },
    {
      id: 'coupon-2',
      name: '新客免邮券',
      type: '运费券',
      scope: '首单用户',
      stock: 5000,
      claimed: 2240,
      faceValue: 1200,
      status: '发放中',
    },
  ];

  const checkinRows: CheckinRow[] = [
    {
      id: 'checkin-1',
      cycle: '连续 7 天',
      reward: '200 优米币',
      target: '全体用户',
      trigger: '每日首签发放',
      dailyCap: '不限',
      status: '启用中',
    },
    {
      id: 'checkin-2',
      cycle: '连续 30 天',
      reward: '随机免单券',
      target: '高活跃用户',
      trigger: '满足连续周期后发放',
      dailyCap: '500 份 / 日',
      status: '待上线',
    },
  ];

  const inviteRows: InviteRow[] = [
    {
      id: 'invite-1',
      campaign: '老带新拉新',
      channel: '站内 + 微信',
      invitedUsers: 1240,
      convertedUsers: 386,
      rewardCost: 580000,
      status: '进行中',
    },
    {
      id: 'invite-2',
      campaign: '品牌联名专场',
      channel: '短信',
      invitedUsers: 620,
      convertedUsers: 104,
      rewardCost: 160000,
      status: '复盘中',
    },
  ];

  const rankingRows: RankingRow[] = [
    {
      id: 'ranking-1',
      name: '竞猜热度榜',
      dimension: '参与人数 + 金额',
      refreshRule: '每小时刷新',
      publishScope: '首页 / 竞猜频道',
      status: '启用中',
      lastGeneratedAt: data.lastUpdatedAt,
    },
    {
      id: 'ranking-2',
      name: '商品热销榜',
      dimension: '销量 + GMV',
      refreshRule: '每日 00:10',
      publishScope: '商城首页',
      status: '待灰度',
      lastGeneratedAt: data.lastUpdatedAt,
    },
  ];

  const view = useMemo<MarketingView>(() => {
    switch (path) {
      case '/equity': {
        const columns: TableColumnsType<EquityRow> = [
          {
            title: '账户',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.userName}</Typography.Text>
                <Typography.Text type="secondary">{record.userId}</Typography.Text>
              </Space>
            ),
          },
          { title: '账户类型', dataIndex: 'accountType' },
          { title: '可用余额', dataIndex: 'balance', render: (value: number) => formatAmount(value) },
          { title: '冻结金额', dataIndex: 'frozen', render: (value: number) => formatAmount(value) },
          { title: '备注', dataIndex: 'note' },
        ];

        return {
          title: '权益金管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="账户数" value={equityRows.length} /></Card>
              <Card className="metric-card"><Statistic title="可用余额" value={formatAmount(equityRows.reduce((sum, item) => sum + item.balance, 0))} /></Card>
              <Card className="metric-card"><Statistic title="冻结金额" value={formatAmount(equityRows.reduce((sum, item) => sum + item.frozen, 0))} /></Card>
              <Card className="metric-card"><Statistic title="店铺担保户" value={equityRows.filter((item) => item.accountType === '店铺担保户').length} /></Card>
            </>
          ),
          rows: equityRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/marketing/banners': {
        const columns: TableColumnsType<BannerRow> = [
          { title: 'Banner', dataIndex: 'title' },
          { title: '投放位', dataIndex: 'position' },
          { title: '目标人群', dataIndex: 'audience' },
          { title: '点击率', dataIndex: 'clickRate', render: (value: number) => formatPercent(value / 100) },
          { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
          { title: '更新时间', dataIndex: 'updatedAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '轮播管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="投放位" value={bannerRows.length} /></Card>
              <Card className="metric-card"><Statistic title="投放中" value={bannerRows.filter((item) => item.status === '投放中').length} /></Card>
              <Card className="metric-card"><Statistic title="待排期" value={bannerRows.filter((item) => item.status === '待排期').length} /></Card>
              <Card className="metric-card"><Statistic title="平均点击率" value={formatPercent(bannerRows.reduce((sum, item) => sum + item.clickRate, 0) / (bannerRows.length || 1))} /></Card>
            </>
          ),
          rows: bannerRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/marketing/coupons': {
        const columns: TableColumnsType<CouponRow> = [
          { title: '券名称', dataIndex: 'name' },
          { title: '类型', dataIndex: 'type' },
          { title: '适用范围', dataIndex: 'scope' },
          { title: '库存', dataIndex: 'stock', render: formatNumber },
          { title: '已领取', dataIndex: 'claimed', render: formatNumber },
          { title: '面额', dataIndex: 'faceValue', render: (value: number) => formatAmount(value) },
          { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
        ];
        return {
          title: '优惠券管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="券模板" value={couponRows.length} /></Card>
              <Card className="metric-card"><Statistic title="总库存" value={couponRows.reduce((sum, item) => sum + item.stock, 0)} /></Card>
              <Card className="metric-card"><Statistic title="已领取" value={couponRows.reduce((sum, item) => sum + item.claimed, 0)} /></Card>
              <Card className="metric-card"><Statistic title="发放中" value={couponRows.filter((item) => item.status === '发放中').length} /></Card>
            </>
          ),
          rows: couponRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/marketing/checkin': {
        const columns: TableColumnsType<CheckinRow> = [
          { title: '签到周期', dataIndex: 'cycle' },
          { title: '奖励', dataIndex: 'reward' },
          { title: '目标人群', dataIndex: 'target' },
          { title: '触发规则', dataIndex: 'trigger' },
          { title: '日上限', dataIndex: 'dailyCap' },
          { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
        ];
        return {
          title: '签到管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="规则数" value={checkinRows.length} /></Card>
              <Card className="metric-card"><Statistic title="启用中" value={checkinRows.filter((item) => item.status === '启用中').length} /></Card>
              <Card className="metric-card"><Statistic title="待上线" value={checkinRows.filter((item) => item.status === '待上线').length} /></Card>
            </>
          ),
          rows: checkinRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      case '/marketing/invite': {
        const columns: TableColumnsType<InviteRow> = [
          { title: '活动', dataIndex: 'campaign' },
          { title: '渠道', dataIndex: 'channel' },
          { title: '邀请用户', dataIndex: 'invitedUsers', render: formatNumber },
          { title: '转化用户', dataIndex: 'convertedUsers', render: formatNumber },
          { title: '奖励成本', dataIndex: 'rewardCost', render: (value: number) => formatAmount(value) },
          { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
        ];
        return {
          title: '邀请管理',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="活动数" value={inviteRows.length} /></Card>
              <Card className="metric-card"><Statistic title="邀请总数" value={inviteRows.reduce((sum, item) => sum + item.invitedUsers, 0)} /></Card>
              <Card className="metric-card"><Statistic title="转化总数" value={inviteRows.reduce((sum, item) => sum + item.convertedUsers, 0)} /></Card>
              <Card className="metric-card"><Statistic title="奖励成本" value={formatAmount(inviteRows.reduce((sum, item) => sum + item.rewardCost, 0))} /></Card>
            </>
          ),
          rows: inviteRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
      default: {
        const columns: TableColumnsType<RankingRow> = [
          { title: '榜单', dataIndex: 'name' },
          { title: '维度', dataIndex: 'dimension' },
          { title: '刷新规则', dataIndex: 'refreshRule' },
          { title: '发布范围', dataIndex: 'publishScope' },
          { title: '状态', render: (_, record) => <Tag color={statusColor(record.status)}>{record.status}</Tag> },
          { title: '最近生成', dataIndex: 'lastGeneratedAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '排行榜配置',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="榜单数" value={rankingRows.length} /></Card>
              <Card className="metric-card"><Statistic title="启用中" value={rankingRows.filter((item) => item.status === '启用中').length} /></Card>
              <Card className="metric-card"><Statistic title="待灰度" value={rankingRows.filter((item) => item.status === '待灰度').length} /></Card>
            </>
          ),
          rows: rankingRows,
          columns: columns as TableColumnsType<DetailRecord>,
        };
      }
    }
  }, [equityRows, inviteRows, checkinRows, couponRows, bannerRows, rankingRows, path]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = filters.keyword?.trim().toLowerCase();
    return view.rows.filter((row) => {
      const rowStatus = 'status' in row ? String(row.status) : 'all';
      if (status !== 'all' && rowStatus !== status) {
        return false;
      }
      switch (path) {
        case '/equity': {
          const record = row as EquityRow;
          if (normalizedKeyword && !record.userName.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.accountType !== filters.second) {
            return false;
          }
          if (
            filters.third &&
            !record.note.toLowerCase().includes(filters.third.trim().toLowerCase())
          ) {
            return false;
          }
          return true;
        }
        case '/marketing/banners': {
          const record = row as BannerRow;
          if (normalizedKeyword && !record.title.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.position !== filters.second) {
            return false;
          }
          if (filters.third && record.status !== filters.third) {
            return false;
          }
          return true;
        }
        case '/marketing/coupons': {
          const record = row as CouponRow;
          if (normalizedKeyword && !record.name.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.type !== filters.second) {
            return false;
          }
          if (filters.third && record.scope !== filters.third) {
            return false;
          }
          return true;
        }
        case '/marketing/checkin': {
          const record = row as CheckinRow;
          if (normalizedKeyword && !record.cycle.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.target !== filters.second) {
            return false;
          }
          if (filters.third && record.status !== filters.third) {
            return false;
          }
          return true;
        }
        case '/marketing/invite': {
          const record = row as InviteRow;
          if (normalizedKeyword && !record.campaign.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.channel !== filters.second) {
            return false;
          }
          if (filters.third && record.status !== filters.third) {
            return false;
          }
          return true;
        }
        default: {
          const record = row as RankingRow;
          if (normalizedKeyword && !record.name.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.publishScope !== filters.second) {
            return false;
          }
          if (filters.third && record.status !== filters.third) {
            return false;
          }
          return true;
        }
      }
    });
  }, [filters.keyword, filters.second, filters.third, path, status, view.rows]);

  const statusItems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of view.rows) {
      const key = 'status' in row ? String(row.status) : 'all';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [
      { key: 'all', label: '全部', count: view.rows.length },
      ...Array.from(counts.entries())
        .filter(([key]) => key !== 'all')
        .map(([key, count]) => ({ key, label: key, count })),
    ];
  }, [view.rows]);

  const selectOptions = useMemo(() => {
    const rows = view.rows as Array<Record<string, unknown>>;
    const build = (key: string) =>
      Array.from(new Set(rows.map((item) => item[key]).filter(Boolean))).map((value) => ({
        label: String(value),
        value: String(value),
      }));

    switch (path) {
      case '/equity':
        return {
          second: build('accountType'),
          third: [],
          secondPlaceholder: '账户类型',
          thirdPlaceholder: '备注',
        };
      case '/marketing/banners':
        return {
          second: build('position'),
          third: [
            { label: '投放中', value: '投放中' },
            { label: '待排期', value: '待排期' },
            { label: '已暂停', value: '已暂停' },
          ],
          secondPlaceholder: '投放位',
          thirdPlaceholder: '状态',
        };
      case '/marketing/coupons':
        return {
          second: build('type'),
          third: build('scope'),
          secondPlaceholder: '券类型',
          thirdPlaceholder: '适用范围',
        };
      case '/marketing/checkin':
        return {
          second: build('target'),
          third: [
            { label: '启用中', value: '启用中' },
            { label: '待上线', value: '待上线' },
          ],
          secondPlaceholder: '目标人群',
          thirdPlaceholder: '状态',
        };
      case '/marketing/invite':
        return {
          second: build('channel'),
          third: [
            { label: '进行中', value: '进行中' },
            { label: '复盘中', value: '复盘中' },
            { label: '待发布', value: '待发布' },
          ],
          secondPlaceholder: '渠道',
          thirdPlaceholder: '状态',
        };
      default:
        return {
          second: build('publishScope'),
          third: [
            { label: '启用中', value: '启用中' },
            { label: '待灰度', value: '待灰度' },
          ],
          secondPlaceholder: '发布范围',
          thirdPlaceholder: '状态',
        };
    }
  }, [path, view.rows]);

  return (
    <div className="page-stack">
      <AdminSearchPanel
        form={form}
        onSearch={() => {
          setFilters(form.getFieldsValue());
        }}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="keyword">
          <Input
            placeholder={
              path === '/equity'
                ? '用户名称'
                : path === '/marketing/banners'
                  ? 'Banner 标题'
                  : path === '/marketing/coupons'
                    ? '优惠券名称'
                    : path === '/marketing/checkin'
                      ? '签到周期'
                      : path === '/marketing/invite'
                        ? '活动名称'
                        : '榜单名称'
            }
            allowClear
          />
        </Form.Item>
        <Form.Item name="second">
          <Select
            placeholder={selectOptions.secondPlaceholder}
            allowClear
            options={selectOptions.second}
          />
        </Form.Item>
        <Form.Item name="third">
          {selectOptions.third.length > 0 ? (
            <Select
              placeholder={selectOptions.thirdPlaceholder}
              allowClear
              options={selectOptions.third}
            />
          ) : (
            <Input placeholder={selectOptions.thirdPlaceholder} allowClear />
          )}
        </Form.Item>
      </AdminSearchPanel>
      {statusItems.length > 2 ? (
        <AdminStatusTabs activeKey={status} items={statusItems} onChange={setStatus} />
      ) : null}
      <Card>
        <Table
          rowKey="id"
          columns={view.columns}
          dataSource={filteredRows}
          loading={loading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({ onClick: () => setSelected(record) })}
        />
      </Card>
      <Drawer
        open={selected != null}
        width={420}
        title={view.title}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <Descriptions column={1} size="small">
            {Object.entries(selected).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {typeof value === 'number'
                  ? value
                  : typeof value === 'string' && value.includes('T')
                    ? formatDateTime(value)
                    : String(value ?? '-')}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
