import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Tag,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  AdminSearchPanel,
  AdminStatusTabs,
  SEARCH_THEME,
} from '../components/admin-list-controls';
import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminShopApplyItem } from '../lib/api/merchant';
import { fetchAdminShopApplies, reviewAdminShopApply } from '../lib/api/merchant';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { formatDateTime } from '../lib/format';

interface ShopAppliesPageProps {
  refreshToken?: number;
}

interface ShopAppliesPageData {
  categories: AdminCategoryItem[];
  shopApplies: AdminShopApplyItem[];
}

type ShopApplyFilters = {
  applyNo?: string;
  category?: string;
  shopName?: string;
  applicant?: string;
};

const emptyData: ShopAppliesPageData = { categories: [], shopApplies: [] };

export function ShopAppliesPage({ refreshToken = 0 }: ShopAppliesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<ShopApplyFilters>();
  const [rejectForm] = Form.useForm<{ rejectReason: string }>();
  const [data, setData] = useState<ShopAppliesPageData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<ShopApplyFilters>({});
  const [status, setStatus] = useState<'all' | AdminShopApplyItem['status']>('all');
  const [selected, setSelected] = useState<AdminShopApplyItem | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminShopApplyItem | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const [shopApplies, categories] = await Promise.all([
          fetchAdminShopApplies().then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
        ]);
        if (!alive) {
          return;
        }
        setData({ categories, shopApplies });
      } catch (error) {
        if (!alive) {
          return;
        }
        setData(emptyData);
        setIssue(error instanceof Error ? error.message : '开店审核列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPageData();

    return () => {
      alive = false;
    };
  }, [refreshToken, actionSeed]);

  const categoryOptions = useMemo(() => {
    const activeCategories = data.categories
      .filter((item) => item.bizType === 'shop' && item.status === 'active')
      .map((item) => ({ label: item.name, value: item.name }));

    if (activeCategories.length > 0) {
      return activeCategories;
    }

    return Array.from(new Set(data.shopApplies.map((item) => item.category).filter(Boolean))).map(
      (value) => ({ label: String(value), value: String(value) }),
    );
  }, [data.categories, data.shopApplies]);

  const statusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: data.shopApplies.length },
      {
        key: 'pending',
        label: '待审核',
        count: data.shopApplies.filter((item) => item.status === 'pending').length,
      },
      {
        key: 'approved',
        label: '已通过',
        count: data.shopApplies.filter((item) => item.status === 'approved').length,
      },
      {
        key: 'rejected',
        label: '已拒绝',
        count: data.shopApplies.filter((item) => item.status === 'rejected').length,
      },
    ],
    [data.shopApplies],
  );

  const filteredRows = useMemo(
    () =>
      data.shopApplies.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (
          filters.applyNo &&
          !record.applyNo.toLowerCase().includes(filters.applyNo.trim().toLowerCase())
        ) {
          return false;
        }
        if (filters.category && record.category !== filters.category) {
          return false;
        }
        if (
          filters.shopName &&
          !record.shopName.toLowerCase().includes(filters.shopName.trim().toLowerCase())
        ) {
          return false;
        }
        if (
          filters.applicant &&
          !String(record.applicant ?? '')
            .toLowerCase()
            .includes(filters.applicant.trim().toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [data.shopApplies, filters, status],
  );

  const columns: ProColumns<AdminShopApplyItem>[] = [
    { title: '申请单号', dataIndex: 'applyNo', width: 180 },
    { title: '店铺名', dataIndex: 'shopName', width: 220 },
    { title: '申请人', dataIndex: 'applicant', width: 140, render: (_, record) => record.applicant || '-' },
    { title: '联系电话', dataIndex: 'contact', width: 160, render: (_, record) => record.contact || '-' },
    { title: '主营类目', dataIndex: 'category', width: 180, render: (_, record) => record.category || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag color={record.status === 'approved' ? 'success' : record.status === 'rejected' ? 'error' : 'warning'}>
          {record.statusLabel}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.submittedAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => setSelected(record)}>
            查看
          </Button>
          {record.status === 'pending' ? (
            <>
              <Popconfirm
                okButtonProps={{ loading: reviewingId === record.id }}
                title="确认通过该申请？"
                onConfirm={() => void handleApprove(record.id)}
              >
                <Button size="small" type="link">
                  通过
                </Button>
              </Popconfirm>
              <Button size="small" type="link" danger onClick={() => openRejectModal(record)}>
                拒绝
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  function openRejectModal(record: AdminShopApplyItem) {
    rejectForm.setFieldsValue({ rejectReason: record.rejectReason ?? '' });
    setRejectTarget(record);
  }

  async function handleApprove(id: string) {
    setReviewingId(id);
    try {
      await reviewAdminShopApply(id, { status: 'approved' });
      messageApi.success('开店申请已通过');
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '开店申请审核失败');
    } finally {
      setReviewingId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) {
      return;
    }

    try {
      const values = await rejectForm.validateFields();
      setReviewingId(rejectTarget.id);
      await reviewAdminShopApply(rejectTarget.id, {
        status: 'rejected',
        rejectReason: values.rejectReason,
      });
      messageApi.success('开店申请已拒绝');
      setRejectTarget(null);
      rejectForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={searchForm}
        defaultCount={3}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="applyNo">
          <Input allowClear placeholder="申请单号" />
        </Form.Item>
        <Form.Item name="category">
          <Select allowClear options={categoryOptions} placeholder="主营类目" />
        </Form.Item>
        <Form.Item name="shopName">
          <Input allowClear placeholder="店铺名" />
        </Form.Item>
        <Form.Item name="applicant">
          <Input allowClear placeholder="申请人" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs activeKey={status} items={statusItems} onChange={(key) => setStatus(key as typeof status)} />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminShopApplyItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => []}
        />
      </ConfigProvider>

      <Drawer open={selected != null} title="开店审核" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="申请单号">{selected.applyNo}</Descriptions.Item>
            <Descriptions.Item label="店铺名">{selected.shopName}</Descriptions.Item>
            <Descriptions.Item label="申请人">{selected.applicant}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selected.contact || '-'}</Descriptions.Item>
            <Descriptions.Item label="主营类目">{selected.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="申请说明">{selected.reason || '-'}</Descriptions.Item>
            <Descriptions.Item label="审核状态">{selected.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="拒绝原因">{selected.rejectReason || '-'}</Descriptions.Item>
            <Descriptions.Item label="审核时间">
              {selected.reviewedAt ? formatDateTime(selected.reviewedAt) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {selected.submittedAt ? formatDateTime(selected.submittedAt) : '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <Modal
        confirmLoading={!!reviewingId}
        open={!!rejectTarget}
        title="拒绝开店申请"
        onCancel={() => {
          setRejectTarget(null);
          rejectForm.resetFields();
        }}
        onOk={() => {
          void handleReject();
        }}
      >
        <ConfigProvider theme={SEARCH_THEME}>
          <Form form={rejectForm} layout="vertical">
            <Form.Item
              label="拒绝原因"
              name="rejectReason"
              rules={[{ required: true, message: '请填写拒绝原因' }]}
            >
              <Input.TextArea maxLength={200} rows={4} showCount />
            </Form.Item>
          </Form>
        </ConfigProvider>
      </Modal>
    </div>
  );
}
