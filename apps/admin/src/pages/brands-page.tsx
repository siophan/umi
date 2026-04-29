import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminBrandDetailDrawer } from '../components/admin-brand-detail-drawer';
import { AdminBrandFormModal } from '../components/admin-brand-form-modal';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminBrandItem } from '../lib/api/merchant';
import { createAdminBrand, fetchAdminBrands, updateAdminBrand } from '../lib/api/merchant';
import {
  BRAND_STATUS_OPTIONS,
  buildBrandColumns,
  buildBrandFilterCategoryOptions,
  buildBrandFormCategoryOptions,
  buildBrandStatusItems,
  buildCreateBrandFormValues,
  buildEditBrandFormValues,
  EMPTY_BRANDS_PAGE_DATA,
  filterBrands,
  type BrandFilters,
  type BrandFormValues,
  type BrandsPageData,
} from '../lib/admin-brands';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface BrandsPageProps {
  refreshToken?: number;
}

export function BrandsPage({ refreshToken = 0 }: BrandsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<BrandFilters>();
  const [brandForm] = Form.useForm<BrandFormValues>();
  const [data, setData] = useState<BrandsPageData>(EMPTY_BRANDS_PAGE_DATA);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [categoryIssue, setCategoryIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrandFilters>({});
  const [status, setStatus] = useState<'all' | AdminBrandItem['status']>('all');
  const [selected, setSelected] = useState<AdminBrandItem | null>(null);
  const [editingBrand, setEditingBrand] = useState<AdminBrandItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      setCategoryIssue(null);
      try {
        const [brandsResult, categoriesResult] = await Promise.allSettled([
          fetchAdminBrands().then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
        ]);
        if (!alive) {
          return;
        }
        setData({
          brands: brandsResult.status === 'fulfilled' ? brandsResult.value : [],
          categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : [],
        });
        if (brandsResult.status === 'rejected') {
          setIssue(
            brandsResult.reason instanceof Error ? brandsResult.reason.message : '品牌列表加载失败',
          );
        }
        if (categoriesResult.status === 'rejected') {
          setCategoryIssue(
            categoriesResult.reason instanceof Error
              ? categoriesResult.reason.message
              : '品牌类目加载失败',
          );
        }
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

  const categoryOptions = useMemo(() => buildBrandFilterCategoryOptions(data), [data]);
  const categoryIdOptions = useMemo(
    () => buildBrandFormCategoryOptions(data, editingBrand),
    [data, editingBrand],
  );
  const statusItems = useMemo(() => buildBrandStatusItems(data.brands), [data.brands]);
  const filteredRows = useMemo(() => filterBrands(data.brands, filters, status), [data.brands, filters, status]);
  const formInitialValues = useMemo<Partial<BrandFormValues>>(
    () => (editingBrand ? buildEditBrandFormValues(editingBrand) : buildCreateBrandFormValues()),
    [editingBrand],
  );
  const columns = buildBrandColumns({
    onEdit: (record) => {
      setEditingBrand(record);
      setFormOpen(true);
    },
    onView: (record) => setSelected(record),
  });

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      {categoryIssue ? (
        <Alert
          showIcon
          type="warning"
          message="品牌类目加载失败"
          description="品牌主表已按真实接口结果保留；筛选器和编辑弹层类目选项可能不完整。"
        />
      ) : null}

      <AdminSearchPanel
        form={searchForm}
        onSearch={() => setFilters(searchForm.getFieldsValue())}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="name">
          <Input allowClear placeholder="搜索品牌名/联系人/电话" />
        </Form.Item>
        <Form.Item name="categoryId">
          <Select allowClear options={categoryOptions} placeholder="类目" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs activeKey={status} items={statusItems} onChange={(key) => setStatus(key as typeof status)} />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminBrandItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={filteredRows}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              onClick={() => {
                setEditingBrand(null);
                setFormOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>

      <AdminBrandDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminBrandFormModal
        categoryIdOptions={categoryIdOptions as Array<{ label: string; value: string }>}
        categoryIssue={categoryIssue}
        editing={editingBrand != null}
        form={brandForm}
        initialValues={formInitialValues}
        open={formOpen}
        statusOptions={BRAND_STATUS_OPTIONS as unknown as Array<{ label: string; value: string }>}
        submitting={submitting}
        onCancel={() => {
          setFormOpen(false);
          setEditingBrand(null);
        }}
        onSubmit={() => void handleSubmitBrand()}
      />
    </div>
  );

  async function handleSubmitBrand() {
    try {
      const values = await brandForm.validateFields();
      setSubmitting(true);
      if (editingBrand) {
        await updateAdminBrand(editingBrand.id, {
          name: values.name,
          categoryId: values.categoryId,
          logoUrl: values.logoUrl || null,
          contactName: values.contactName || null,
          contactPhone: values.contactPhone || null,
          description: values.description || null,
          status: values.status,
        });
        messageApi.success('品牌已更新');
      } else {
        await createAdminBrand({
          name: values.name,
          categoryId: values.categoryId,
          logoUrl: values.logoUrl || null,
          contactName: values.contactName || null,
          contactPhone: values.contactPhone || null,
          description: values.description || null,
          status: values.status,
        });
        messageApi.success('品牌已新增');
      }
      setFormOpen(false);
      setEditingBrand(null);
      brandForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }
}
