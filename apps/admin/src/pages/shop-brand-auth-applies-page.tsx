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
  Tabs,
  Tag,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import {
  AdminSearchPanel,
  AdminStatusTabs,
  SEARCH_THEME,
} from '../components/admin-list-controls';
import type {
  AdminBrandAuthApplyItem,
  AdminBrandAuthRecordItem,
} from '../lib/api/merchant';
import {
  fetchAdminBrandAuthApplies,
  fetchAdminBrandAuthRecords,
  reviewAdminBrandAuthApply,
  revokeAdminBrandAuthRecord,
} from '../lib/api/merchant';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import { buildOptions } from '../lib/admin-filter-options';
import { formatDateTime } from '../lib/format';

interface ShopBrandAuthAppliesPageProps {
  refreshToken?: number;
}

type BrandAuthView = 'applies' | 'records';

type BrandAuthFilters = {
  applyNo?: string;
  authNo?: string;
  shopName?: string;
  brandName?: string;
};

const emptyApplyRows: AdminBrandAuthApplyItem[] = [];
const emptyRecordRows: AdminBrandAuthRecordItem[] = [];

export function ShopBrandAuthAppliesPage({
  refreshToken = 0,
}: ShopBrandAuthAppliesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<BrandAuthFilters>();
  const [rejectForm] = Form.useForm<{ rejectReason: string }>();
  const [applyRows, setApplyRows] = useState<AdminBrandAuthApplyItem[]>(emptyApplyRows);
  const [recordRows, setRecordRows] =
    useState<AdminBrandAuthRecordItem[]>(emptyRecordRows);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrandAuthFilters>({});
  const [view, setView] = useState<BrandAuthView>(() =>
    window.location.hash.includes('/shops/brand-auth/records') ? 'records' : 'applies',
  );
  const [applyStatus, setApplyStatus] = useState<
    'all' | AdminBrandAuthApplyItem['status']
  >('all');
  const [recordStatus, setRecordStatus] = useState<
    'all' | AdminBrandAuthRecordItem['status']
  >('all');
  const [selectedApply, setSelectedApply] =
    useState<AdminBrandAuthApplyItem | null>(null);
  const [selectedRecord, setSelectedRecord] =
    useState<AdminBrandAuthRecordItem | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<AdminBrandAuthApplyItem | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      try {
        const [applies, records] = await Promise.all([
          fetchAdminBrandAuthApplies().then((result) => result.items),
          fetchAdminBrandAuthRecords().then((result) => result.items),
        ]);
        if (!alive) {
          return;
        }
        setApplyRows(applies);
        setRecordRows(records);
      } catch (error) {
        if (!alive) {
          return;
        }
        setApplyRows(emptyApplyRows);
        setRecordRows(emptyRecordRows);
        setIssue(error instanceof Error ? error.message : '品牌授权加载失败');
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
  }, [actionSeed, refreshToken]);

  const applyBrandOptions = useMemo(
    () => buildOptions(applyRows, 'brandName'),
    [applyRows],
  );
  const recordBrandOptions = useMemo(
    () => buildOptions(recordRows, 'brandName'),
    [recordRows],
  );
  const brandOptions = view === 'applies' ? applyBrandOptions : recordBrandOptions;

  const applyStatusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: applyRows.length },
      {
        key: 'pending',
        label: '待审核',
        count: applyRows.filter((item) => item.status === 'pending').length,
      },
      {
        key: 'approved',
        label: '已通过',
        count: applyRows.filter((item) => item.status === 'approved').length,
      },
      {
        key: 'rejected',
        label: '已拒绝',
        count: applyRows.filter((item) => item.status === 'rejected').length,
      },
    ],
    [applyRows],
  );

  const recordStatusItems = useMemo(
    () => [
      { key: 'all', label: '全部', count: recordRows.length },
      {
        key: 'active',
        label: '生效中',
        count: recordRows.filter((item) => item.status === 'active').length,
      },
      {
        key: 'expired',
        label: '已过期',
        count: recordRows.filter((item) => item.status === 'expired').length,
      },
      {
        key: 'revoked',
        label: '已撤销',
        count: recordRows.filter((item) => item.status === 'revoked').length,
      },
    ],
    [recordRows],
  );

  const filteredApplies = useMemo(
    () =>
      applyRows.filter((record) => {
        if (applyStatus !== 'all' && record.status !== applyStatus) {
          return false;
        }
        if (
          filters.applyNo &&
          !record.applyNo.toLowerCase().includes(filters.applyNo.trim().toLowerCase())
        ) {
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
    [applyRows, applyStatus, filters.applyNo, filters.brandName, filters.shopName],
  );

  const filteredRecords = useMemo(
    () =>
      recordRows.filter((record) => {
        if (recordStatus !== 'all' && record.status !== recordStatus) {
          return false;
        }
        if (
          filters.authNo &&
          !String(record.authNo || '')
            .toLowerCase()
            .includes(filters.authNo.trim().toLowerCase())
        ) {
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
    [filters.authNo, filters.brandName, filters.shopName, recordRows, recordStatus],
  );

  const applyColumns: ProColumns<AdminBrandAuthApplyItem>[] = [
    { title: '申请单号', dataIndex: 'applyNo', width: 180 },
    { title: '店铺', dataIndex: 'shopName', width: 200 },
    { title: '品牌', dataIndex: 'brandName', width: 180 },
    {
      title: '店主',
      dataIndex: 'ownerName',
      width: 140,
      render: (_, record) => record.ownerName || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag
          color={
            record.status === 'approved'
              ? 'success'
              : record.status === 'rejected'
                ? 'error'
                : 'warning'
          }
        >
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
          <Button size="small" type="link" onClick={() => setSelectedApply(record)}>
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
              <Button
                size="small"
                type="link"
                danger
                onClick={() => openRejectModal(record)}
              >
                拒绝
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  const recordColumns: ProColumns<AdminBrandAuthRecordItem>[] = [
    {
      title: '授权单号',
      dataIndex: 'authNo',
      width: 180,
      render: (_, record) => record.authNo || '-',
    },
    { title: '店铺', dataIndex: 'shopName', width: 200 },
    { title: '品牌', dataIndex: 'brandName', width: 180 },
    { title: '授权类型', dataIndex: 'authTypeLabel', width: 140 },
    { title: '授权范围', dataIndex: 'authScopeLabel', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Tag
          color={
            record.status === 'active'
              ? 'success'
              : record.status === 'revoked'
                ? 'error'
                : 'default'
          }
        >
          {record.statusLabel}
        </Tag>
      ),
    },
    {
      title: '生效时间',
      dataIndex: 'grantedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.grantedAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => setSelectedRecord(record)}>
            查看
          </Button>
          {record.status === 'active' ? (
            <Popconfirm
              okButtonProps={{ loading: reviewingId === record.id }}
              title="确认撤销该授权？"
              description="撤销后，该店铺当前品牌在售商品会自动下架。"
              onConfirm={() => void handleRevoke(record.id)}
            >
              <Button size="small" type="link" danger>
                撤销
              </Button>
            </Popconfirm>
          ) : null}
        </div>
      ),
    },
  ];

  function handleViewChange(nextView: string) {
    setView(nextView as BrandAuthView);
    searchForm.resetFields();
    setFilters({});
  }

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

  async function handleRevoke(id: string) {
    setReviewingId(id);
    try {
      await revokeAdminBrandAuthRecord(id);
      messageApi.success('品牌授权已撤销');
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '撤销品牌授权失败');
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <Tabs
        activeKey={view}
        className="admin-status-tabs"
        items={[
          {
            key: 'applies',
            label: `授权审核 (${applyRows.length})`,
          },
          {
            key: 'records',
            label: `授权记录 (${recordRows.length})`,
          },
        ]}
        onChange={handleViewChange}
      />

      <AdminSearchPanel
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          if (view === 'applies') {
            setApplyStatus('all');
          } else {
            setRecordStatus('all');
          }
        }}
      >
        {view === 'applies' ? (
          <>
            <Form.Item name="applyNo">
              <Input allowClear placeholder="申请单号" />
            </Form.Item>
            <Form.Item name="shopName">
              <Input allowClear placeholder="店铺" />
            </Form.Item>
            <Form.Item name="brandName">
              <Select allowClear options={brandOptions} placeholder="品牌" />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item name="authNo">
              <Input allowClear placeholder="授权单号" />
            </Form.Item>
            <Form.Item name="shopName">
              <Input allowClear placeholder="店铺" />
            </Form.Item>
            <Form.Item name="brandName">
              <Select allowClear options={brandOptions} placeholder="品牌" />
            </Form.Item>
          </>
        )}
      </AdminSearchPanel>

      {view === 'applies' ? (
        <>
          <AdminStatusTabs
            activeKey={applyStatus}
            items={applyStatusItems}
            onChange={(key) => setApplyStatus(key as typeof applyStatus)}
          />
          <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
            <ProTable<AdminBrandAuthApplyItem>
              cardBordered={false}
              rowKey="id"
              columns={applyColumns}
              columnsState={{}}
              dataSource={filteredApplies}
              loading={loading}
              options={{ reload: true, density: true, fullScreen: false, setting: true }}
              pagination={{ defaultPageSize: 10, showSizeChanger: true }}
              search={false}
              toolBarRender={() => []}
            />
          </ConfigProvider>
        </>
      ) : (
        <>
          <AdminStatusTabs
            activeKey={recordStatus}
            items={recordStatusItems}
            onChange={(key) => setRecordStatus(key as typeof recordStatus)}
          />
          <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
            <ProTable<AdminBrandAuthRecordItem>
              cardBordered={false}
              rowKey="id"
              columns={recordColumns}
              columnsState={{}}
              dataSource={filteredRecords}
              loading={loading}
              options={{ reload: true, density: true, fullScreen: false, setting: true }}
              pagination={{ defaultPageSize: 10, showSizeChanger: true }}
              search={false}
              toolBarRender={() => []}
            />
          </ConfigProvider>
        </>
      )}

      <Drawer
        open={selectedApply != null}
        title="品牌授权审核"
        width={460}
        onClose={() => setSelectedApply(null)}
      >
        {selectedApply ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="申请单号">{selectedApply.applyNo}</Descriptions.Item>
            <Descriptions.Item label="店铺">{selectedApply.shopName}</Descriptions.Item>
            <Descriptions.Item label="店主">{selectedApply.ownerName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {selectedApply.ownerPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="品牌">{selectedApply.brandName}</Descriptions.Item>
            <Descriptions.Item label="申请说明">{selectedApply.reason || '-'}</Descriptions.Item>
            <Descriptions.Item label="授权资料">{selectedApply.license || '-'}</Descriptions.Item>
            <Descriptions.Item label="审核状态">{selectedApply.statusLabel}</Descriptions.Item>
            <Descriptions.Item label="拒绝原因">
              {selectedApply.rejectReason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核时间">
              {selectedApply.reviewedAt ? formatDateTime(selectedApply.reviewedAt) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {selectedApply.submittedAt ? formatDateTime(selectedApply.submittedAt) : '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

      <Drawer
        open={selectedRecord != null}
        title="品牌授权记录"
        width={460}
        onClose={() => setSelectedRecord(null)}
      >
        {selectedRecord ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="授权单号">
              {selectedRecord.authNo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="店铺">{selectedRecord.shopName}</Descriptions.Item>
            <Descriptions.Item label="店主">{selectedRecord.ownerName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {selectedRecord.ownerPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="品牌">{selectedRecord.brandName}</Descriptions.Item>
            <Descriptions.Item label="授权类型">{selectedRecord.authTypeLabel}</Descriptions.Item>
            <Descriptions.Item label="授权范围">{selectedRecord.authScopeLabel}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag
                color={
                  selectedRecord.status === 'active'
                    ? 'success'
                    : selectedRecord.status === 'revoked'
                      ? 'error'
                      : 'default'
                }
              >
                {selectedRecord.statusLabel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="生效时间">
              {formatDateTime(selectedRecord.grantedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="到期时间">
              {selectedRecord.expireAt ? formatDateTime(selectedRecord.expireAt) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="失效时间">
              {selectedRecord.expiredAt ? formatDateTime(selectedRecord.expiredAt) : '-'}
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
