import type { AdminBannerItem } from '@umi/shared';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useState } from 'react';

import { AdminBannerDetailDrawer } from '../components/admin-banner-detail-drawer';
import { AdminBannerFormModal } from '../components/admin-banner-form-modal';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';
import {
  buildBannerColumns,
  buildBannerPayload,
  buildBannerStatusItems,
  buildCreateBannerFormValues,
  buildEditBannerFormValues,
  type BannerFilters,
  type BannerFormValues,
  POSITION_OPTIONS,
  TARGET_TYPE_OPTIONS,
} from '../lib/admin-banners';
import {
  createAdminBanner,
  deleteAdminBanner,
  fetchAdminBanners,
  updateAdminBanner,
  updateAdminBannerStatus,
} from '../lib/api/marketing';

interface MarketingBannersPageProps {
  refreshToken?: number;
}

export function MarketingBannersPage({ refreshToken = 0 }: MarketingBannersPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<BannerFilters>();
  const [bannerForm] = Form.useForm<BannerFormValues>();

  const [filters, setFilters] = useState<BannerFilters>({});
  const [status, setStatus] = useState<'all' | AdminBannerItem['status']>('all');
  const [rows, setRows] = useState<AdminBannerItem[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    paused: 0,
    ended: 0,
  });
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminBannerItem | null>(null);
  const [editingBanner, setEditingBanner] = useState<AdminBannerItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  const targetType = Form.useWatch('targetType', bannerForm);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminBanners({
          title: filters.title,
          position: filters.position,
          targetType: filters.targetType,
          status,
        });
        if (!alive) {
          return;
        }
        setRows(result.items);
        setSummary(result.summary);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRows([]);
        setSummary({
          total: 0,
          active: 0,
          scheduled: 0,
          paused: 0,
          ended: 0,
        });
        setIssue(error instanceof Error ? error.message : '轮播列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      alive = false;
    };
  }, [actionSeed, filters.position, filters.targetType, filters.title, refreshToken, status]);

  const statusItems = buildBannerStatusItems(summary);
  const columns: ProColumns<AdminBannerItem>[] = buildBannerColumns({
    onDelete: (record) => void handleDelete(record),
    onEdit: (record) => {
      bannerForm.resetFields();
      bannerForm.setFieldsValue(buildEditBannerFormValues(record));
      setEditingBanner(record);
      setFormOpen(true);
    },
    onToggleStatus: (record, nextStatus) => void handleToggleStatus(record, nextStatus),
    onView: (record) => setSelected(record),
  });

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
        <Form.Item name="title">
          <Input allowClear placeholder="轮播标题" />
        </Form.Item>
        <Form.Item name="position">
          <Select allowClear options={POSITION_OPTIONS as never} placeholder="投放位" />
        </Form.Item>
        <Form.Item name="targetType">
          <Select allowClear options={TARGET_TYPE_OPTIONS as never} placeholder="跳转类型" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={statusItems}
        onChange={(key) => setStatus(key as typeof status)}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminBannerItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={rows}
          loading={loading}
          options={{
            reload: () => setActionSeed((value) => value + 1),
            density: true,
            fullScreen: false,
            setting: true,
          }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              onClick={() => {
                bannerForm.resetFields();
                bannerForm.setFieldsValue(buildCreateBannerFormValues());
                setEditingBanner(null);
                setFormOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>

      <AdminBannerDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminBannerFormModal
        open={formOpen}
        editing={editingBanner != null}
        form={bannerForm}
        submitting={submitting}
        targetType={targetType}
        onCancel={() => {
          setFormOpen(false);
          setEditingBanner(null);
        }}
        onSubmit={() => void handleSubmit()}
      />
    </div>
  );

  async function handleSubmit() {
    try {
      const values = await bannerForm.validateFields();
      const payload = buildBannerPayload(values);

      setSubmitting(true);
      if (editingBanner) {
        await updateAdminBanner(editingBanner.id, payload);
        messageApi.success('轮播已更新');
      } else {
        await createAdminBanner(payload);
        messageApi.success('轮播已新增');
      }

      setFormOpen(false);
      setEditingBanner(null);
      bannerForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(
    record: AdminBannerItem,
    nextStatus: 'active' | 'disabled',
  ) {
    try {
      await updateAdminBannerStatus(record.id, { status: nextStatus });
      messageApi.success(nextStatus === 'active' ? '轮播已启用' : '轮播已暂停');
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    }
  }

  async function handleDelete(record: AdminBannerItem) {
    try {
      await deleteAdminBanner(record.id);
      messageApi.success('轮播已删除');
      if (selected?.id === record.id) {
        setSelected(null);
      }
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    }
  }
}
