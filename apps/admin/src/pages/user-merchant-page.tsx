import type { ReactElement, ReactNode } from 'react';
import { Alert, Card, Descriptions, Drawer, Form, Input, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { cloneElement, useEffect, useMemo, useState } from 'react';

import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import type { AdminCategoryItem } from '../lib/api/catalog';
import {
  fetchAdminBrandApplies,
  fetchAdminBrandAuthApplies,
  fetchAdminBrandAuthRecords,
  fetchAdminBrands,
  fetchAdminProductAuthRecords,
  fetchAdminProductAuthRows,
  fetchAdminShopApplies,
  fetchAdminShopProducts,
  fetchAdminShops,
  type AdminBrandApplyItem,
  type AdminBrandAuthApplyItem,
  type AdminBrandAuthRecordItem,
  type AdminBrandItem,
  type AdminProductAuthItem,
  type AdminProductAuthRecordItem,
  type AdminShopApplyItem,
  type AdminShopItem,
  type AdminShopProductItem,
} from '../lib/api/merchant';
import { fetchAdminCategories } from '../lib/api/system';
import { formatAmount, formatDateTime, formatNumber, productStatusMeta } from '../lib/format';

type UserMerchantPath =
  | '/shops/list'
  | '/shops/apply'
  | '/shops/brand-auth'
  | '/shops/brand-auth/records'
  | '/shops/products'
  | '/brands/list'
  | '/brands/apply'
  | '/product-auth/list'
  | '/product-auth/records';

interface UserMerchantPageProps {
  path: UserMerchantPath;
  refreshToken?: number;
}

interface UserMerchantPageData {
  shops: AdminShopItem[];
  shopApplies: AdminShopApplyItem[];
  brands: AdminBrandItem[];
  brandApplies: AdminBrandApplyItem[];
  brandAuthApplies: AdminBrandAuthApplyItem[];
  brandAuthRecords: AdminBrandAuthRecordItem[];
  shopProducts: AdminShopProductItem[];
  productAuthRows: AdminProductAuthItem[];
  productAuthRecords: AdminProductAuthRecordItem[];
  categories: AdminCategoryItem[];
}

const emptyPageData: UserMerchantPageData = {
  shops: [],
  shopApplies: [],
  brands: [],
  brandApplies: [],
  brandAuthApplies: [],
  brandAuthRecords: [],
  shopProducts: [],
  productAuthRows: [],
  productAuthRecords: [],
  categories: [],
};

type DetailRecord =
  | AdminShopItem
  | AdminShopApplyItem
  | AdminBrandItem
  | AdminBrandApplyItem
  | AdminBrandAuthApplyItem
  | AdminBrandAuthRecordItem
  | AdminShopProductItem
  | AdminProductAuthItem
  | AdminProductAuthRecordItem;

interface UserMerchantView {
  title: string;
  metrics: ReactNode;
  table: ReactElement;
}

function reviewTag(status: 'pending' | 'approved' | 'rejected', label: string) {
  return (
    <Tag color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'}>
      {label}
    </Tag>
  );
}

function shopTag(status: 'active' | 'paused' | 'closed', label: string) {
  return (
    <Tag color={status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'default'}>
      {label}
    </Tag>
  );
}

function brandTag(status: 'active' | 'disabled', label: string) {
  return <Tag color={status === 'active' ? 'success' : 'default'}>{label}</Tag>;
}

function authTag(status: 'active' | 'expired' | 'revoked', label: string) {
  return (
    <Tag color={status === 'active' ? 'success' : status === 'revoked' ? 'error' : 'default'}>
      {label}
    </Tag>
  );
}

export function UserMerchantPage({
  path,
  refreshToken = 0,
}: UserMerchantPageProps) {
  const [selected, setSelected] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [data, setData] = useState<UserMerchantPageData>(emptyPageData);
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
        if (path === '/shops/list') {
          const [shops, categories] = await Promise.all([
            fetchAdminShops().then((result) => result.items),
            fetchAdminCategories().then((result) => result.items),
          ]);
          if (alive) setData({ ...emptyPageData, shops, categories });
          return;
        }
        if (path === '/shops/apply') {
          const [shopApplies, categories] = await Promise.all([
            fetchAdminShopApplies().then((result) => result.items),
            fetchAdminCategories().then((result) => result.items),
          ]);
          if (alive) setData({ ...emptyPageData, shopApplies, categories });
          return;
        }
        if (path === '/brands/list') {
          const [brands, categories] = await Promise.all([
            fetchAdminBrands().then((result) => result.items),
            fetchAdminCategories().then((result) => result.items),
          ]);
          if (alive) setData({ ...emptyPageData, brands, categories });
          return;
        }
        if (path === '/brands/apply') {
          const [brandApplies, categories] = await Promise.all([
            fetchAdminBrandApplies().then((result) => result.items),
            fetchAdminCategories().then((result) => result.items),
          ]);
          if (alive) setData({ ...emptyPageData, brandApplies, categories });
          return;
        }
        if (path === '/shops/brand-auth') {
          const brandAuthApplies = await fetchAdminBrandAuthApplies().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, brandAuthApplies });
          return;
        }
        if (path === '/shops/brand-auth/records') {
          const brandAuthRecords = await fetchAdminBrandAuthRecords().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, brandAuthRecords });
          return;
        }
        if (path === '/shops/products') {
          const shopProducts = await fetchAdminShopProducts().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, shopProducts });
          return;
        }
        if (path === '/product-auth/list') {
          const productAuthRows = await fetchAdminProductAuthRows().then((result) => result.items);
          if (alive) setData({ ...emptyPageData, productAuthRows });
          return;
        }

        const productAuthRecords = await fetchAdminProductAuthRecords().then((result) => result.items);
        if (alive) setData({ ...emptyPageData, productAuthRecords });
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
      case '/shops/list':
        return data.shops;
      case '/shops/apply':
        return data.shopApplies;
      case '/brands/list':
        return data.brands;
      case '/brands/apply':
        return data.brandApplies;
      case '/shops/brand-auth':
        return data.brandAuthApplies;
      case '/shops/brand-auth/records':
        return data.brandAuthRecords;
      case '/shops/products':
        return data.shopProducts;
      case '/product-auth/list':
        return data.productAuthRows;
      default:
        return data.productAuthRecords;
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
        case '/shops/list': {
          const record = row as AdminShopItem;
          if (normalizedKeyword && !record.name.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.category !== filters.second) {
            return false;
          }
          if (filters.third && record.ownerName !== filters.third) {
            return false;
          }
          return true;
        }
        case '/shops/apply': {
          const record = row as AdminShopApplyItem;
          if (normalizedKeyword && !record.shopName.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.category !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        case '/brands/list': {
          const record = row as AdminBrandItem;
          if (normalizedKeyword && !record.name.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.category !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        case '/brands/apply': {
          const record = row as AdminBrandApplyItem;
          if (normalizedKeyword && !record.name.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.category !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        case '/shops/brand-auth': {
          const record = row as AdminBrandAuthApplyItem;
          if (normalizedKeyword && !record.shopName.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.brandName !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        case '/shops/brand-auth/records': {
          const record = row as AdminBrandAuthRecordItem;
          if (normalizedKeyword && !(record.authNo || '').toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.brandName !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        case '/shops/products': {
          const record = row as AdminShopProductItem;
          if (normalizedKeyword && !record.productName.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.brandName !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        case '/product-auth/list': {
          const record = row as AdminProductAuthItem;
          if (normalizedKeyword && !(record.authNo || '').toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.brandName !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
        default: {
          const record = row as AdminProductAuthRecordItem;
          if (normalizedKeyword && !record.subject.toLowerCase().includes(normalizedKeyword)) {
            return false;
          }
          if (filters.second && record.mode !== filters.second) {
            return false;
          }
          if (filters.third && record.statusLabel !== filters.third) {
            return false;
          }
          return true;
        }
      }
    });
  }, [filters.keyword, filters.second, filters.third, path, sourceRows, status]);

  const selectOptions = useMemo(() => {
    const rows = sourceRows as unknown as Array<Record<string, unknown>>;
    const build = (key: string) =>
      Array.from(new Set(rows.map((item) => item[key]).filter(Boolean))).map((value) => ({
        label: String(value),
        value: String(value),
      }));
    const fullShopCategoryOptions = data.categories
      .filter((item) => item.bizType === 'shop' && item.status === 'active')
      .map((item) => ({
        label: item.name,
        value: item.name,
      }));
    const fullBrandCategoryOptions = data.categories
      .filter((item) => item.bizType === 'brand' && item.status === 'active')
      .map((item) => ({
        label: item.name,
        value: item.name,
      }));

    switch (path) {
      case '/shops/list':
        return {
          second: fullShopCategoryOptions.length > 0 ? fullShopCategoryOptions : build('category'),
          third: build('ownerName'),
          secondPlaceholder: '主营类目',
          thirdPlaceholder: '店主',
        };
      case '/shops/apply':
        return {
          second: fullShopCategoryOptions.length > 0 ? fullShopCategoryOptions : build('category'),
          third: [
            { label: '待审核', value: '待审核' },
            { label: '已通过', value: '已通过' },
            { label: '已拒绝', value: '已拒绝' },
          ],
          secondPlaceholder: '主营类目',
          thirdPlaceholder: '审核状态',
        };
      case '/brands/list':
        return {
          second: fullBrandCategoryOptions.length > 0 ? fullBrandCategoryOptions : build('category'),
          third: [
            { label: '合作中', value: '合作中' },
            { label: '停用', value: '停用' },
          ],
          secondPlaceholder: '类目',
          thirdPlaceholder: '状态',
        };
      case '/brands/apply':
        return {
          second: fullBrandCategoryOptions.length > 0 ? fullBrandCategoryOptions : build('category'),
          third: [
            { label: '待审核', value: '待审核' },
            { label: '已通过', value: '已通过' },
            { label: '已拒绝', value: '已拒绝' },
          ],
          secondPlaceholder: '类目',
          thirdPlaceholder: '审核状态',
        };
      case '/shops/brand-auth':
        return {
          second: build('brandName'),
          third: [
            { label: '待审核', value: '待审核' },
            { label: '已通过', value: '已通过' },
            { label: '已拒绝', value: '已拒绝' },
          ],
          secondPlaceholder: '品牌',
          thirdPlaceholder: '审核状态',
        };
      case '/shops/brand-auth/records':
        return {
          second: build('brandName'),
          third: [
            { label: '生效中', value: '生效中' },
            { label: '已过期', value: '已过期' },
            { label: '已撤销', value: '已撤销' },
          ],
          secondPlaceholder: '品牌',
          thirdPlaceholder: '状态',
        };
      case '/shops/products':
        return {
          second: build('brandName'),
          third: [
            { label: '在售', value: '在售' },
            { label: '低库存', value: '低库存' },
            { label: '已下架', value: '已下架' },
            { label: '不可售', value: '不可售' },
          ],
          secondPlaceholder: '品牌',
          thirdPlaceholder: '状态',
        };
      case '/product-auth/list':
      case '/product-auth/records':
        return {
          second: build('brandName'),
          third: [
            { label: '生效中', value: '生效中' },
            { label: '已过期', value: '已过期' },
            { label: '已撤销', value: '已撤销' },
          ],
          secondPlaceholder: '品牌',
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
  }, [path, sourceRows]);

  const statusItems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of sourceRows) {
      const key =
        typeof row === 'object' && row && 'status' in row ? String(row.status) : 'all';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const labels: Record<string, string> = {
      active: '启用中',
      paused: '暂停',
      closed: '已关闭',
      pending: '待处理',
      approved: '已通过',
      rejected: '已拒绝',
      disabled: '停用',
      expired: '已过期',
      revoked: '已撤销',
      off_shelf: '已下架',
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

  const view = useMemo<UserMerchantView>(() => {
    switch (path) {
      case '/shops/list': {
        const columns: TableColumnsType<AdminShopItem> = [
          {
            title: '店铺',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{record.name}</Typography.Text>
                <Typography.Text type="secondary">{record.ownerName}</Typography.Text>
              </Space>
            ),
          },
          { title: '主营类目', dataIndex: 'category', render: (value) => value || '-' },
          { title: '商品数', dataIndex: 'products', render: formatNumber },
          { title: '履约单量', dataIndex: 'orders', render: formatNumber },
          { title: '生效授权', dataIndex: 'brandAuthCount', render: formatNumber },
          {
            title: '评分',
            dataIndex: 'score',
            render: (value: number) => (value ? value.toFixed(2) : '-'),
          },
          {
            title: '状态',
            render: (_, record) => shopTag(record.status, record.statusLabel),
          },
        ];

        return {
          title: '店铺列表',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="店铺总数" value={data.shops.length} /></Card>
              <Card className="metric-card"><Statistic title="营业中" value={data.shops.filter((item) => item.status === 'active').length} /></Card>
              <Card className="metric-card"><Statistic title="暂停营业" value={data.shops.filter((item) => item.status === 'paused').length} /></Card>
              <Card className="metric-card"><Statistic title="已关闭" value={data.shops.filter((item) => item.status === 'closed').length} /></Card>
            </>
          ),
          table: <Table rowKey="id" columns={columns} dataSource={data.shops} loading={loading} pagination={{ pageSize: 10 }} onRow={(record) => ({ onClick: () => setSelected(record) })} />,
        };
      }
      case '/shops/apply': {
        const columns: TableColumnsType<AdminShopApplyItem> = [
          { title: '申请单号', dataIndex: 'applyNo' },
          { title: '店铺名', dataIndex: 'shopName' },
          { title: '申请人', dataIndex: 'applicant', render: (value) => value || '-' },
          { title: '联系电话', dataIndex: 'contact', render: (value) => value || '-' },
          { title: '主营类目', dataIndex: 'category', render: (value) => value || '-' },
          { title: '状态', render: (_, record) => reviewTag(record.status, record.statusLabel) },
          { title: '提交时间', dataIndex: 'submittedAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '开店审核',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="申请总数" value={data.shopApplies.length} /></Card>
              <Card className="metric-card"><Statistic title="待审核" value={data.shopApplies.filter((item) => item.status === 'pending').length} /></Card>
              <Card className="metric-card"><Statistic title="已通过" value={data.shopApplies.filter((item) => item.status === 'approved').length} /></Card>
              <Card className="metric-card"><Statistic title="已拒绝" value={data.shopApplies.filter((item) => item.status === 'rejected').length} /></Card>
            </>
          ),
          table: <Table rowKey="id" columns={columns} dataSource={data.shopApplies} loading={loading} pagination={{ pageSize: 10 }} onRow={(record) => ({ onClick: () => setSelected(record) })} />,
        };
      }
      case '/brands/list': {
        const columns: TableColumnsType<AdminBrandItem> = [
          { title: '品牌', dataIndex: 'name' },
          { title: '类目', dataIndex: 'category', render: (value) => value || '-' },
          { title: '合作店铺', dataIndex: 'shopCount', render: formatNumber },
          { title: '标准商品', dataIndex: 'goodsCount', render: formatNumber },
          { title: '联系人', dataIndex: 'contactName', render: (value) => value || '-' },
          { title: '状态', render: (_, record) => brandTag(record.status, record.statusLabel) },
        ];
        return {
          title: '品牌方列表',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="品牌总数" value={data.brands.length} /></Card>
              <Card className="metric-card"><Statistic title="合作中" value={data.brands.filter((item) => item.status === 'active').length} /></Card>
              <Card className="metric-card"><Statistic title="已停用" value={data.brands.filter((item) => item.status === 'disabled').length} /></Card>
              <Card className="metric-card"><Statistic title="标准商品数" value={formatNumber(data.brands.reduce((sum, item) => sum + item.goodsCount, 0))} /></Card>
            </>
          ),
          table: <Table rowKey="id" columns={columns} dataSource={data.brands} loading={loading} pagination={{ pageSize: 10 }} onRow={(record) => ({ onClick: () => setSelected(record) })} />,
        };
      }
      case '/brands/apply': {
        const columns: TableColumnsType<AdminBrandApplyItem> = [
          { title: '申请单号', dataIndex: 'applyNo' },
          { title: '品牌名', dataIndex: 'name' },
          { title: '联系人', dataIndex: 'applicant', render: (value) => value || '-' },
          { title: '保证金', dataIndex: 'deposit', render: (value: number) => formatAmount(value) },
          { title: '状态', render: (_, record) => reviewTag(record.status, record.statusLabel) },
          { title: '提交时间', dataIndex: 'submittedAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '入驻审核',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="申请总数" value={data.brandApplies.length} /></Card>
              <Card className="metric-card"><Statistic title="待审核" value={data.brandApplies.filter((item) => item.status === 'pending').length} /></Card>
              <Card className="metric-card"><Statistic title="已通过" value={data.brandApplies.filter((item) => item.status === 'approved').length} /></Card>
              <Card className="metric-card"><Statistic title="已拒绝" value={data.brandApplies.filter((item) => item.status === 'rejected').length} /></Card>
            </>
          ),
          table: <Table rowKey="id" columns={columns} dataSource={data.brandApplies} loading={loading} pagination={{ pageSize: 10 }} onRow={(record) => ({ onClick: () => setSelected(record) })} />,
        };
      }
      case '/shops/brand-auth': {
        const columns: TableColumnsType<AdminBrandAuthApplyItem> = [
          { title: '申请单号', dataIndex: 'applyNo' },
          { title: '店铺', dataIndex: 'shopName' },
          { title: '品牌', dataIndex: 'brandName' },
          { title: '店主', dataIndex: 'ownerName', render: (value) => value || '-' },
          { title: '状态', render: (_, record) => reviewTag(record.status, record.statusLabel) },
          { title: '提交时间', dataIndex: 'submittedAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '品牌授权审核',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="申请总数" value={data.brandAuthApplies.length} /></Card>
              <Card className="metric-card"><Statistic title="待审核" value={data.brandAuthApplies.filter((item) => item.status === 'pending').length} /></Card>
              <Card className="metric-card"><Statistic title="已通过" value={data.brandAuthApplies.filter((item) => item.status === 'approved').length} /></Card>
              <Card className="metric-card"><Statistic title="已拒绝" value={data.brandAuthApplies.filter((item) => item.status === 'rejected').length} /></Card>
            </>
          ),
          table: <Table rowKey="id" columns={columns} dataSource={data.brandAuthApplies} loading={loading} pagination={{ pageSize: 10 }} onRow={(record) => ({ onClick: () => setSelected(record) })} />,
        };
      }
      case '/shops/brand-auth/records': {
        const columns: TableColumnsType<AdminBrandAuthRecordItem> = [
          { title: '授权单号', dataIndex: 'authNo', render: (value) => value || '-' },
          { title: '店铺', dataIndex: 'shopName' },
          { title: '品牌', dataIndex: 'brandName' },
          { title: '授权类型', dataIndex: 'authTypeLabel' },
          { title: '授权范围', dataIndex: 'authScopeLabel' },
          { title: '状态', render: (_, record) => authTag(record.status, record.statusLabel) },
          { title: '生效时间', dataIndex: 'grantedAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '品牌授权记录',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="记录总数" value={data.brandAuthRecords.length} /></Card>
              <Card className="metric-card"><Statistic title="生效中" value={data.brandAuthRecords.filter((item) => item.status === 'active').length} /></Card>
              <Card className="metric-card"><Statistic title="已过期" value={data.brandAuthRecords.filter((item) => item.status === 'expired').length} /></Card>
              <Card className="metric-card"><Statistic title="已撤销" value={data.brandAuthRecords.filter((item) => item.status === 'revoked').length} /></Card>
            </>
          ),
          table: <Table rowKey="id" columns={columns} dataSource={data.brandAuthRecords} loading={loading} pagination={{ pageSize: 10 }} onRow={(record) => ({ onClick: () => setSelected(record) })} />,
        };
      }
      case '/shops/products': {
        const columns: TableColumnsType<AdminShopProductItem> = [
          { title: '店铺', dataIndex: 'shopName' },
          { title: '商品', dataIndex: 'productName' },
          { title: '品牌', dataIndex: 'brandName', render: (value) => value || '-' },
          { title: '售价', dataIndex: 'price', render: (value: number) => formatAmount(value) },
          { title: '可用库存', dataIndex: 'availableStock', render: formatNumber },
          { title: '销量', dataIndex: 'sales', render: formatNumber },
          {
            title: '状态',
            render: (_, record) => (
              <Tag color={productStatusMeta[record.status].color}>{record.statusLabel}</Tag>
            ),
          },
        ];
        return {
          title: '店铺授权商品',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="商品总数" value={data.shopProducts.length} /></Card>
              <Card className="metric-card"><Statistic title="在售" value={data.shopProducts.filter((item) => item.status === 'active').length} /></Card>
              <Card className="metric-card"><Statistic title="低库存" value={data.shopProducts.filter((item) => item.availableStock <= 10 && item.status === 'active').length} /></Card>
              <Card className="metric-card"><Statistic title="下架/不可售" value={data.shopProducts.filter((item) => ['off_shelf', 'disabled'].includes(item.status)).length} /></Card>
            </>
          ),
          table: <Table rowKey="id" columns={columns} dataSource={data.shopProducts} loading={loading} pagination={{ pageSize: 10 }} onRow={(record) => ({ onClick: () => setSelected(record) })} />,
        };
      }
      case '/product-auth/list': {
        const columns: TableColumnsType<AdminProductAuthItem> = [
          { title: '授权单号', dataIndex: 'authNo', render: (value) => value || '-' },
          { title: '品牌', dataIndex: 'brandName' },
          { title: '店铺', dataIndex: 'shopName' },
          { title: '主体', dataIndex: 'subject' },
          { title: '状态', render: (_, record) => authTag(record.status, record.statusLabel) },
          { title: '生效时间', dataIndex: 'grantedAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '商品授权',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="授权总数" value={data.productAuthRows.length} /></Card>
              <Card className="metric-card"><Statistic title="生效中" value={data.productAuthRows.filter((item) => item.status === 'active').length} /></Card>
              <Card className="metric-card"><Statistic title="已过期" value={data.productAuthRows.filter((item) => item.status === 'expired').length} /></Card>
              <Card className="metric-card"><Statistic title="已撤销" value={data.productAuthRows.filter((item) => item.status === 'revoked').length} /></Card>
            </>
          ),
          table: <Table rowKey="id" columns={columns} dataSource={data.productAuthRows} loading={loading} pagination={{ pageSize: 10 }} onRow={(record) => ({ onClick: () => setSelected(record) })} />,
        };
      }
      default: {
        const columns: TableColumnsType<AdminProductAuthRecordItem> = [
          { title: '主体', dataIndex: 'subject' },
          { title: '授权模式', dataIndex: 'mode' },
          { title: '状态', render: (_, record) => authTag(record.status, record.statusLabel) },
          { title: '记录时间', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
        ];
        return {
          title: '授权记录',
          metrics: (
            <>
              <Card className="metric-card"><Statistic title="记录总数" value={data.productAuthRecords.length} /></Card>
              <Card className="metric-card"><Statistic title="生效中" value={data.productAuthRecords.filter((item) => item.status === 'active').length} /></Card>
              <Card className="metric-card"><Statistic title="已过期" value={data.productAuthRecords.filter((item) => item.status === 'expired').length} /></Card>
              <Card className="metric-card"><Statistic title="已撤销" value={data.productAuthRecords.filter((item) => item.status === 'revoked').length} /></Card>
            </>
          ),
          table: <Table rowKey="id" columns={columns} dataSource={data.productAuthRecords} loading={loading} pagination={{ pageSize: 10 }} onRow={(record) => ({ onClick: () => setSelected(record) })} />,
        };
      }
    }
  }, [data, loading, path]);

  return (
    <div className="page-stack">
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
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
              path === '/shops/list'
                ? '店铺名称'
                : path === '/shops/apply'
                  ? '申请店铺名称'
                  : path === '/brands/list'
                    ? '品牌名称'
                    : path === '/brands/apply'
                      ? '申请品牌名称'
                      : path === '/shops/brand-auth'
                        ? '店铺名称'
                        : path === '/shops/brand-auth/records'
                          ? '授权单号'
                          : path === '/shops/products'
                            ? '商品名称'
                            : path === '/product-auth/list'
                              ? '授权单号'
                              : '主体名称'
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
      <Card>
        {cloneElement(view.table as ReactElement<any>, {
          dataSource: filteredRows,
        })}
      </Card>
      <Drawer open={selected != null} width={460} title={view.title} onClose={() => setSelected(null)}>
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
