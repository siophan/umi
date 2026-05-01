import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminBrandLibraryDetailDrawer } from '../components/admin-brand-library-detail-drawer';
import { AdminBrandLibraryFormModal } from '../components/admin-brand-library-form-modal';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import {
  buildBrandFilterOptions,
  buildBrandIdOptions,
  buildBrandLibraryColumns,
  buildCategoryFilterOptions,
  buildCategoryIdOptions,
  buildCreateBrandProductFormValues,
  buildEditBrandProductFormValues,
  type BrandLibraryFilters,
  type BrandProductFormValues,
  EMPTY_BRAND_LIBRARY_DATA,
  yuanToCents,
  type BrandLibraryPageData,
} from '../lib/admin-brand-library';
import type { AdminBrandLibraryItem } from '../lib/api/catalog';
import {
  createAdminBrandProduct,
  fetchAdminBrandLibrary,
  updateAdminBrandProduct,
} from '../lib/api/catalog';
import { fetchAdminCategories } from '../lib/api/categories';
import { fetchAdminBrands } from '../lib/api/merchant';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface BrandLibraryPageProps {
  refreshToken?: number;
}

export function BrandLibraryPage({ refreshToken = 0 }: BrandLibraryPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [searchForm] = Form.useForm<BrandLibraryFilters>();
  const [brandProductForm] = Form.useForm<BrandProductFormValues>();
  const [data, setData] = useState<BrandLibraryPageData>(EMPTY_BRAND_LIBRARY_DATA);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [brandIssue, setBrandIssue] = useState<string | null>(null);
  const [categoryIssue, setCategoryIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<BrandLibraryFilters>({});
  const [status, setStatus] = useState<'all' | AdminBrandLibraryItem['status']>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AdminBrandLibraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<AdminBrandLibraryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setLoading(true);
      setIssue(null);
      setBrandIssue(null);
      setCategoryIssue(null);
      try {
        const [brandLibraryResult, brandsResult, categoriesResult] = await Promise.allSettled([
          fetchAdminBrandLibrary({
            page,
            pageSize,
            keyword: filters.productName?.trim() || undefined,
            status,
            brandId: filters.brandId ? String(filters.brandId) : undefined,
            categoryId: filters.categoryId ? String(filters.categoryId) : undefined,
          }),
          fetchAdminBrands().then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
        ]);
        if (!alive) return;
        setData({
          brandLibrary: brandLibraryResult.status === 'fulfilled' ? brandLibraryResult.value.items : [],
          brands: brandsResult.status === 'fulfilled' ? brandsResult.value : [],
          categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : [],
        });
        setTotal(brandLibraryResult.status === 'fulfilled' ? brandLibraryResult.value.total : 0);
        if (brandLibraryResult.status === 'rejected') {
          setIssue(
            brandLibraryResult.reason instanceof Error
              ? brandLibraryResult.reason.message
              : '品牌商品加载失败',
          );
        }
        if (brandsResult.status === 'rejected') {
          setBrandIssue(
            brandsResult.reason instanceof Error ? brandsResult.reason.message : '品牌字典加载失败',
          );
        }
        if (categoriesResult.status === 'rejected') {
          setCategoryIssue(
            categoriesResult.reason instanceof Error
              ? categoriesResult.reason.message
              : '商品分类加载失败',
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [actionSeed, filters.brandId, filters.categoryId, filters.productName, page, pageSize, refreshToken, status]);

  const brandOptions = useMemo(() => buildBrandFilterOptions(data), [data]);
  const categoryOptions = useMemo(() => buildCategoryFilterOptions(data), [data]);
  const brandIdOptions = useMemo(() => buildBrandIdOptions(data, editingItem), [data, editingItem]);
  const categoryIdOptions = useMemo(
    () => buildCategoryIdOptions(data, editingItem),
    [data, editingItem],
  );
  // 用 initialValues 走声明式回填: Modal destroyOnClose 每次开都 remount Form,
  // initialValues 跟 editingItem 联动, 避免在 Form 未挂载时 setFieldsValue 丢值
  const formInitialValues = useMemo<Partial<BrandProductFormValues>>(
    () =>
      editingItem
        ? buildEditBrandProductFormValues(editingItem)
        : buildCreateBrandProductFormValues(),
    [editingItem],
  );
  const columns = buildBrandLibraryColumns({
    onEdit: (record) => {
      setEditingItem(record);
      setFormOpen(true);
    },
    onView: (record) => setSelected(record),
  });

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}
      {brandIssue ? (
        <Alert
          showIcon
          type="warning"
          message="品牌字典加载失败"
          description="品牌商品主表已按真实接口结果保留；品牌筛选器和编辑弹层品牌选项可能不完整。"
        />
      ) : null}
      {categoryIssue ? (
        <Alert
          showIcon
          type="warning"
          message="商品分类加载失败"
          description="品牌商品主表已按真实接口结果保留；分类筛选器和编辑弹层分类选项可能不完整。"
        />
      ) : null}

      <AdminSearchPanel
        form={searchForm}
        onSearch={() => {
          setFilters(searchForm.getFieldsValue());
          setPage(1);
        }}
        onReset={() => {
          searchForm.resetFields();
          setFilters({});
          setStatus('all');
          setPage(1);
          setPageSize(10);
        }}
      >
        <Form.Item name="productName">
          <Input allowClear placeholder="商品 / 品牌 / 分类名" />
        </Form.Item>
        <Form.Item name="brandId">
          <Select allowClear options={brandOptions} placeholder="品牌" />
        </Form.Item>
        <Form.Item name="categoryId">
          <Select allowClear options={categoryOptions} placeholder="分类" />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={[
          { key: 'all', label: '全部', count: status === 'all' ? total : undefined },
          { key: 'active', label: '启用', count: status === 'active' ? total : undefined },
          { key: 'disabled', label: '停用', count: status === 'disabled' ? total : undefined },
        ]}
        onChange={(key) => {
          setStatus(key as typeof status);
          setPage(1);
        }}
      />

      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<AdminBrandLibraryItem>
          cardBordered={false}
          rowKey="id"
          columns={columns}
          columnsState={{}}
          dataSource={data.brandLibrary}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPage(1);
                setPageSize(nextPageSize);
                return;
              }
              setPage(nextPage);
            },
          }}
          search={false}
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              onClick={() => {
                setEditingItem(null);
                setFormOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
        />
      </ConfigProvider>

      <AdminBrandLibraryDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminBrandLibraryFormModal
        brandIdOptions={brandIdOptions}
        categoryIdOptions={categoryIdOptions}
        editing={editingItem != null}
        form={brandProductForm}
        initialValues={formInitialValues}
        open={formOpen}
        submitting={submitting}
        onCancel={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={() => void handleSubmitBrandProduct()}
      />
    </div>
  );

  async function handleSubmitBrandProduct() {
    try {
      const values = await brandProductForm.validateFields();
      setSubmitting(true);
      const specTable = (values.specTable ?? [])
        .filter((row): row is { key: string; value: string } =>
          Boolean(row && typeof row.key === 'string' && row.key.trim()),
        )
        .map((row) => ({ key: row.key.trim(), value: (row.value ?? '').trim() }));
      const packageList = (values.packageList ?? [])
        .map((item) => (item?.value ?? '').trim())
        .filter((item) => item.length > 0);

      const imageList = (values.imageList ?? [])
        .map((url) => (url ?? '').trim())
        .filter((url) => url.length > 0);

      const tags = (values.tags ?? [])
        .map((tag) => (tag ?? '').trim())
        .filter((tag) => tag.length > 0);

      const payload = {
        brandId: values.brandId,
        name: values.name,
        categoryId: values.categoryId,
        guidePrice: yuanToCents(values.guidePriceYuan) ?? 0,
        supplyPrice: yuanToCents(values.supplyPriceYuan),
        guessPrice: yuanToCents(values.guessPriceYuan),
        stock: Math.max(0, Math.trunc(Number(values.stock ?? 0))),
        defaultImg: values.defaultImg || null,
        imageList: imageList.length ? imageList : null,
        description: values.description || null,
        status: values.status,
        videoUrl: values.videoUrl?.trim() || null,
        detailHtml: values.detailHtml || null,
        specTable: specTable.length ? specTable : null,
        packageList: packageList.length ? packageList : null,
        freight: values.freightYuan == null ? null : yuanToCents(values.freightYuan),
        shipFrom: values.shipFrom?.trim() || null,
        deliveryDays: values.deliveryDays?.trim() || null,
        tags: tags.length ? tags : null,
        collab: values.collab?.trim() || null,
      } as const;

      if (editingItem) {
        await updateAdminBrandProduct(editingItem.id, payload);
        messageApi.success('品牌商品已更新');
      } else {
        await createAdminBrandProduct(payload);
        messageApi.success('品牌商品已新增');
      }

      setFormOpen(false);
      setEditingItem(null);
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error && 'errorFields' in error) {
        return;
      }
      messageApi.error(error instanceof Error ? error.message : '保存品牌商品失败');
    } finally {
      setSubmitting(false);
    }
  }
}
