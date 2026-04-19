import type { ReactElement, ReactNode } from 'react';
import type { GuessSummary } from '@joy/shared';
import { Alert, Card, Descriptions, Drawer, Form, Input, List, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { cloneElement, useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import {
  fetchAdminBrandLibrary,
  fetchAdminCategories,
  fetchAdminFriendGuesses,
  fetchAdminGuesses,
  fetchAdminPkMatches,
  fetchAdminProducts,
  type AdminBrandLibraryItem,
  type AdminCategoryItem,
  type AdminFriendGuessItem,
  type AdminPkMatchItem,
  type AdminProduct,
} from '../lib/api/catalog';
import {
  formatAmount,
  formatDateTime,
  formatNumber,
  guessReviewStatusMeta,
  guessStatusMeta,
} from '../lib/format';

type ProductGuessPath =
  | '/products/brands'
  | '/guesses/create'
  | '/guesses/friends'
  | '/pk';

interface ProductGuessPageProps {
  path: ProductGuessPath;
  refreshToken?: number;
}

interface ProductGuessPageData {
  brandLibrary: AdminBrandLibraryItem[];
  friendGuesses: AdminFriendGuessItem[];
  pkMatches: AdminPkMatchItem[];
  categories: AdminCategoryItem[];
  guesses: GuessSummary[];
  products: AdminProduct[];
}

const emptyPageData: ProductGuessPageData = {
  brandLibrary: [],
  friendGuesses: [],
  pkMatches: [],
  categories: [],
  guesses: [],
  products: [],
};

type DetailRecord = AdminBrandLibraryItem | AdminFriendGuessItem | AdminPkMatchItem;

interface ProductGuessView {
  title: string;
  metrics: ReactNode;
  content: ReactElement | ReactNode;
}

function paymentModeLabel(mode: number | null) {
  if (mode === 10) {
    return '发起人支付';
  }
  if (mode === 20) {
    return 'AA 支付';
  }
  return '-';
}

function pkStatusTag(record: AdminPkMatchItem) {
  const color =
    record.status === 'completed'
      ? 'success'
      : record.status === 'cancelled'
        ? 'default'
        : record.status === 'active'
          ? 'processing'
          : 'warning';

  return <Tag color={color}>{record.statusLabel}</Tag>;
}

export function ProductGuessPage({
  path,
  refreshToken = 0,
}: ProductGuessPageProps) {
  const [selected, setSelected] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [data, setData] = useState<ProductGuessPageData>(emptyPageData);
  const [filters, setFilters] = useState<{
    keyword?: string;
    second?: string;
    third?: string;
  }>({});
  const [status, setStatus] = useState('all');
  const [form] = Form.useForm<{ keyword?: string; second?: string; third?: string }>();

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        if (path === '/products/brands') {
          const [brandLibrary, categories] = await Promise.all([
            fetchAdminBrandLibrary({ page: 1, pageSize: 100 }).then((result) => result.items),
            fetchAdminCategories().then((result) => result.items),
          ]);
          if (alive) setData({ ...emptyPageData, brandLibrary, categories });
          return;
        }
        if (path === '/guesses/friends') {
          const friendGuesses = await fetchAdminFriendGuesses().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, friendGuesses });
          return;
        }
        if (path === '/pk') {
          const pkMatches = await fetchAdminPkMatches().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, pkMatches });
          return;
        }

        const [guesses, products, categories, friendGuesses] = await Promise.all([
          fetchAdminGuesses().then((result) => result.items),
          fetchAdminProducts({ page: 1, pageSize: 100 }).then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
          fetchAdminFriendGuesses().then((result) => result.items),
        ]);
        if (alive) {
          setData({
            ...emptyPageData,
            guesses,
            products,
            categories,
            friendGuesses,
          });
        }
      } catch (error) {
        if (!alive) {
          return;
        }
        setData(emptyPageData);
        setIssue(error instanceof Error ? error.message : '页面数据加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      alive = false;
    };
  }, [path, refreshToken]);

  const sourceRows = useMemo<DetailRecord[]>(() => {
    switch (path) {
      case '/products/brands':
        return data.brandLibrary;
      case '/guesses/friends':
        return data.friendGuesses;
      case '/pk':
        return data.pkMatches;
      default:
        return [];
    }
  }, [data, path]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = filters.keyword?.trim().toLowerCase();
    return sourceRows.filter((row) => {
      const rowStatus =
        typeof row === 'object' && row && 'status' in row ? String(row.status) : '';
      if (status !== 'all' && rowStatus !== status) {
        return false;
      }
      switch (path) {
        case '/products/brands': {
          const record = row as AdminBrandLibraryItem;
          if (normalizedKeyword && !record.productName.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.brandName !== filters.second) {
            return false;
          }
          if (filters.third && record.category !== filters.third) {
            return false;
          }
          return true;
        }
        case '/guesses/friends': {
          const record = row as AdminFriendGuessItem;
          if (normalizedKeyword && !record.roomName.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.inviter !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        case '/pk': {
          const record = row as AdminPkMatchItem;
          if (normalizedKeyword && !record.title.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.leftUser !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        default:
          return true;
      }
    });
  }, [filters.keyword, filters.second, filters.third, path, sourceRows, status]);

  const statusItems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of sourceRows) {
      const key =
        typeof row === 'object' && row && 'status' in row ? String(row.status) : 'all';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const labels: Record<string, string> = {
      active: '进行中',
      pending: '待开赛',
      ended: '已结束',
      completed: '已完成',
      cancelled: '已取消',
      disabled: '停用',
    };
    return [
      { key: 'all', label: '全部', count: sourceRows.length },
      ...Array.from(counts.entries()).map(([key, count]) => ({
        key,
        label: labels[key] ?? key,
        count,
      })),
    ];
  }, [sourceRows]);

  const selectOptions = useMemo(() => {
    const rows = sourceRows as unknown as Array<Record<string, unknown>>;
    const build = (key: string) =>
      Array.from(new Set(rows.map((item) => item[key]).filter(Boolean))).map((value) => ({
        label: String(value),
        value: String(value),
      }));
    const fullProductCategoryOptions = data.categories
      .filter((item) => item.bizType === 'product' && item.status === 'active')
      .map((item) => ({
        label: item.name,
        value: item.name,
      }));

    switch (path) {
      case '/products/brands':
        return {
          second: build('brandName'),
          third:
            fullProductCategoryOptions.length > 0
              ? fullProductCategoryOptions
              : build('category'),
          secondPlaceholder: '品牌',
          thirdPlaceholder: '分类',
        };
      case '/guesses/friends':
        return {
          second: build('inviter'),
          third: [
            { label: '待开赛', value: '待开赛' },
            { label: '进行中', value: '进行中' },
            { label: '已结束', value: '已结束' },
          ],
          secondPlaceholder: '发起人',
          thirdPlaceholder: '状态',
        };
      case '/pk':
        return {
          second: build('leftUser'),
          third: [
            { label: '待开赛', value: '待开赛' },
            { label: '进行中', value: '进行中' },
            { label: '完成', value: '完成' },
            { label: '已取消', value: '已取消' },
          ],
          secondPlaceholder: '对战发起方',
          thirdPlaceholder: '状态',
        };
      default:
        return {
          second: [],
          third: [],
          secondPlaceholder: '筛选项二',
          thirdPlaceholder: '筛选项三',
        };
    }
  }, [data.categories, path, sourceRows]);

  const view = useMemo<ProductGuessView>(() => {
    switch (path) {
      case '/products/brands': {
        const columns: TableColumnsType<AdminBrandLibraryItem> = [
          {
            title: '品牌商品',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.productName}</Typography.Text>
                <Typography.Text type="secondary">{record.brandName}</Typography.Text>
              </Space>
            ),
          },
          { title: '分类', dataIndex: 'category', render: (value) => value || '-' },
          {
            title: '指导价',
            dataIndex: 'guidePrice',
            render: (value: number) => formatAmount(value),
          },
          { title: '挂载商品', dataIndex: 'productCount', render: formatNumber },
          {
            title: '在售商品',
            dataIndex: 'activeProductCount',
            render: formatNumber,
          },
          {
            title: '状态',
            render: (_, record) => (
              <Tag color={record.status === 'active' ? 'success' : 'default'}>
                {record.status === 'active' ? '启用中' : '停用'}
              </Tag>
            ),
          },
          {
            title: '更新时间',
            dataIndex: 'updatedAt',
            render: (value) => formatDateTime(value),
          },
        ];

        return {
          title: '品牌商品库',
          metrics: (
            <>
              <Card className="metric-card">
                <Statistic title="品牌商品数" value={data.brandLibrary.length} />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="启用中"
                  value={data.brandLibrary.filter((item) => item.status === 'active').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="挂载商品总数"
                  value={data.brandLibrary.reduce((sum, item) => sum + item.productCount, 0)}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="在售商品总数"
                  value={data.brandLibrary.reduce(
                    (sum, item) => sum + item.activeProductCount,
                    0,
                  )}
                />
              </Card>
            </>
          ),
          content: (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={data.brandLibrary}
              loading={loading}
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({ onClick: () => setSelected(record) })}
            />
          ),
        };
      }
      case '/guesses/friends': {
        const columns: TableColumnsType<AdminFriendGuessItem> = [
          {
            title: '房间',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.roomName}</Typography.Text>
                <Typography.Text type="secondary">
                  发起人 {record.inviter}
                </Typography.Text>
              </Space>
            ),
          },
          { title: '参与人数', dataIndex: 'participants', render: formatNumber },
          { title: '邀请数', dataIndex: 'invitationCount', render: formatNumber },
          {
            title: '已支付金额',
            dataIndex: 'paidAmount',
            render: (value: number) => formatAmount(value),
          },
          {
            title: '支付模式',
            dataIndex: 'paymentMode',
            render: (value: number | null) => paymentModeLabel(value),
          },
          {
            title: '状态',
            render: (_, record) => (
              <Tag
                color={
                  record.status === 'active'
                    ? 'processing'
                    : record.status === 'ended'
                      ? 'default'
                      : 'warning'
                }
              >
                {record.statusLabel}
              </Tag>
            ),
          },
          {
            title: '截止时间',
            dataIndex: 'endTime',
            render: (value) => formatDateTime(value),
          },
        ];

        return {
          title: '好友竞猜',
          metrics: (
            <>
              <Card className="metric-card">
                <Statistic title="房间总数" value={data.friendGuesses.length} />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="进行中"
                  value={data.friendGuesses.filter((item) => item.status === 'active').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="待开赛"
                  value={data.friendGuesses.filter((item) => item.status === 'pending').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="邀请总数"
                  value={data.friendGuesses.reduce(
                    (sum, item) => sum + item.invitationCount,
                    0,
                  )}
                />
              </Card>
            </>
          ),
          content: (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={data.friendGuesses}
              loading={loading}
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({ onClick: () => setSelected(record) })}
            />
          ),
        };
      }
      case '/pk': {
        const columns: TableColumnsType<AdminPkMatchItem> = [
          {
            title: '对战',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.title}</Typography.Text>
                <Typography.Text type="secondary">
                  {record.leftUser} vs {record.rightUser}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: '双方选择',
            render: (_, record) => `${record.leftChoice || '-'} / ${record.rightChoice || '-'}`,
          },
          {
            title: '对战金额',
            dataIndex: 'stake',
            render: (value: number) => formatAmount(value),
          },
          { title: '结果', dataIndex: 'result', render: (value) => value || '-' },
          { title: '状态', render: (_, record) => pkStatusTag(record) },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            render: (value) => formatDateTime(value),
          },
        ];

        return {
          title: 'PK 对战',
          metrics: (
            <>
              <Card className="metric-card">
                <Statistic title="对战总数" value={data.pkMatches.length} />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="进行中"
                  value={data.pkMatches.filter((item) => item.status === 'active').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="已完成"
                  value={data.pkMatches.filter((item) => item.status === 'completed').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="对战金额"
                  value={formatAmount(
                    data.pkMatches.reduce((sum, item) => sum + item.stake, 0),
                  )}
                />
              </Card>
            </>
          ),
          content: (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={data.pkMatches}
              loading={loading}
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({ onClick: () => setSelected(record) })}
            />
          ),
        };
      }
      default: {
        const draftCount = data.guesses.filter(
          (item) => item.reviewStatus === 'pending',
        ).length;
        const guessCategories = data.categories.filter(
          (item) => item.bizType === 'guess' && item.status === 'active',
        );

        return {
          title: '创建竞猜',
          metrics: (
            <>
              <Card className="metric-card">
                <Statistic title="可用竞猜分类" value={guessCategories.length} />
              </Card>
              <Card className="metric-card">
                <Statistic title="待审核竞猜" value={draftCount} />
              </Card>
              <Card className="metric-card">
                <Statistic
                  title="进行中竞猜"
                  value={data.guesses.filter((item) => item.status === 'active').length}
                />
              </Card>
              <Card className="metric-card">
                <Statistic title="竞猜总量" value={data.guesses.length} />
              </Card>
            </>
          ),
          content: (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card title="创建前检查">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="商品池">
                    {data.products.length > 0 ? '已接入' : '暂无商品'}
                  </Descriptions.Item>
                  <Descriptions.Item label="可选分类">
                    {guessCategories.length} 个
                  </Descriptions.Item>
                  <Descriptions.Item label="审核待办">{draftCount} 条</Descriptions.Item>
                  <Descriptions.Item label="好友竞猜房间">
                    {data.friendGuesses.length} 个
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="最近待处理竞猜">
                <List
                  dataSource={data.guesses.slice(0, 8)}
                  renderItem={(record: GuessSummary) => (
                    <List.Item>
                      <Space
                        style={{ width: '100%', justifyContent: 'space-between' }}
                        align="start"
                      >
                        <Space direction="vertical" size={0}>
                          <Typography.Text strong>{record.title}</Typography.Text>
                          <Typography.Text type="secondary">
                            {record.product.name}
                          </Typography.Text>
                        </Space>
                        <Space>
                          <Tag color={guessStatusMeta[record.status].color}>
                            {guessStatusMeta[record.status].label}
                          </Tag>
                          <Tag color={guessReviewStatusMeta[record.reviewStatus].color}>
                            {guessReviewStatusMeta[record.reviewStatus].label}
                          </Tag>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </Space>
          ),
        };
      }
    }
  }, [data, loading, path]);

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      {path !== '/guesses/create' ? (
        <>
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
                  path === '/products/brands'
                    ? '商品名称'
                    : path === '/guesses/friends'
                      ? '房间名称'
                      : '对战标题'
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
              <Select
                placeholder={selectOptions.thirdPlaceholder}
                allowClear
                options={selectOptions.third}
              />
            </Form.Item>
          </AdminSearchPanel>
          {statusItems.length > 2 ? (
            <AdminStatusTabs activeKey={status} items={statusItems} onChange={setStatus} />
          ) : null}
        </>
      ) : null}
      {path === '/guesses/create' ? <Space wrap size={16}>{view.metrics}</Space> : null}
      <Card>
        {path === '/guesses/create'
          ? view.content
          : cloneElement(view.content as ReactElement<any>, { dataSource: filteredRows })}
      </Card>
      <Drawer
        open={selected != null}
        width={460}
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
