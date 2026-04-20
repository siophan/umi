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
import type { AdminBrandAuthApplyItem } from '../lib/api/merchant';
import {
  fetchAdminBrandAuthApplies,
  reviewAdminBrandAuthApply,
} from '../lib/api/merchant';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatDateTime } from '../lib/format';

interface ShopBrandAuthAppliesPageProps {
  refreshToken?: number;
}

type BrandAuthApplyFilters = {
  shopName?: string;
  brandName?: string;
};

const emptyRows: AdminBrandAuthApplyItem[] = [];

export function ShopBrandAuthAppliesPage({ refreshToken = 0 }: ShopBrandAuthAppliesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<BrandAuthApplyFilters>();
  const [rejectForm] = Form.useForm<{ rejectReason: string }>();
  const [rows, setRows] = useState<AdminBrandAuthApplyItem[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrandAuthApplyFilters>({});
  const [status, setStatus] = useState<'all' | AdminBrandAuthApplyItem['status']>('all');
  const [selected, setSelected] = useState<AdminBrandAuthApplyItem | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminBrandAuthApplyItem | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const items = await fetchAdminBrandAuthApplies().then((result) => result.items);
        if (!alive) {
          return;
        }
        setRows(items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows(emptyRows);
        setIssue(error instanceof Error ? error.message : '品牌授权审核加载失败');
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

  const brandOptions = useMemo(() => buildOptions(rows, 'brandName'), [rows]);
  const statusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: rows.length },
      { key: 'pending', label: '待审核', count: rows.filter((item) => item.status === 'pending').length },
      { key: 'approved', label: '已通过', count: rows.filter((item) => item.status === 'approved').length },
      { key: 'rejected', label: '已拒绝', count: rows.filter((item) => item.status === 'rejected').length },
    ],
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((record) => {
        if (status !== 'all' && record.status !== status) {
          return false;
        }
        if (
          filters.shopName &&
          !record.shopName.toLowerCase().includes(filters.shopName.trim().toLowerCase())
        ) {
          return false;
        }
        if (filters.brandName && record.brandName !== filters.brandName) {
          return false;
        }
        return true;
      }),
    [filters.brandName, filters.shopName, rows, status],
  );

  const columns: ProColumns<AdminBrandAuthApplyItem>[] = [
    { title: '申请单号', dataIndex: 'applyNo', width: 180 },
    { title: '店铺', dataIndex: 'shopName', width: 200 },
    { title: '品牌', dataIndex: 'brandName', width: 180 },
    { title: '店主', dataIndex: 'ownerName', width: 140, render: (_, record) => record.ownerName || '-' },
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
    { title: '提交时间', dataIndex: 'submittedAt', width: 180, render: (_, record) => formatDateTime(record.submittedAt) },
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

  function openRejectModal(record: AdminBrandAuthApplyItem) {
    rejectForm.setFieldsValue({ rejectReason: record.rejectReason ?? '' });
    setRejectTarget(record);
  }

  async function handleApprove(id: string) {
    setReviewingId(id);
    try {
      await reviewAdminBrandAuthApply(id, { status: 'approved' });
      messageApi.success('品牌授权申请已通过');
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '品牌授权审核失败');
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
      await reviewAdminBrandAuthApply(rejectTarget.id, {
        status: 'rejected',
        rejectReason: values.rejectReason,
      });
      messageApi.success('品牌授权申请已拒绝');
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
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="shopName">
          <Input allowClear placeholder="店铺名称" />
        </Form.Item>
        <Form.Item name="brandName">
          <Select allowClear options={brandOptions} placeholder="品牌" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs activeKey={status} items={statusItems} onChange={(key) => setStatus(key as typeof status)} />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminBrandAuthApplyItem>
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

      <Drawer open={selected != null} title="品牌授权审核" width={460} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="申请单号">{selected.applyNo}</Descriptions.Item>
            <Descriptions.Item label="店铺">{selected.shopName}</Descriptions.Item>
            <Descriptions.Item label="店主">{selected.ownerName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selected.ownerPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="品牌">{selected.brandName}</Descriptions.Item>
            <Descriptions.Item label="申请说明">{selected.reason || '-'}</Descriptions.Item>
            <Descriptions.Item label="授权资料">{selected.license || '-'}</Descriptions.Item>
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
        title="拒绝品牌授权申请"
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
