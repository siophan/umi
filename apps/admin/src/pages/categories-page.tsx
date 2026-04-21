import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminCategoryDetailDrawer } from '../components/admin-category-detail-drawer';
import { AdminCategoryFormModal } from '../components/admin-category-form-modal';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
import {
  buildCategoryColumns,
  buildCategoryParentOptions,
  buildCategoryStatusItems,
  buildCreateCategoryFormValues,
  buildEditCategoryFormValues,
  BIZ_TYPE_OPTIONS,
  CATEGORY_TABLE_THEME,
  type CategoryFilters,
  type CategoryFormValues,
  filterCategories,
  toCategoryPayload,
  toCategoryUpdatePayload,
} from '../lib/admin-categories';
import {
  createAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
  updateAdminCategoryStatus,
  type AdminCategoryItem,
} from '../lib/api/categories';

interface CategoriesPageProps {
  refreshToken?: number;
}

export function CategoriesPage({ refreshToken = 0 }: CategoriesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<CategoryFilters>();
  const [modalForm] = Form.useForm<CategoryFormValues>();
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>({});
  const [status, setStatus] = useState<'all' | AdminCategoryItem['status']>('all');
  const [selected, setSelected] = useState<AdminCategoryItem | null>(null);
  const [editing, setEditing] = useState<AdminCategoryItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const watchedBizTypeCode = Form.useWatch('bizTypeCode', modalForm);

  useEffect(() => {
    let alive = true;

    async function loadCategories() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminCategories();
        if (!alive) {
          return;
        }
        setCategories(result.items);
      } catch (error) {
        if (!alive) {
          return;
        }
        setCategories([]);
        setIssue(error instanceof Error ? error.message : '分类列表加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const parentOptions = useMemo(
    () => buildCategoryParentOptions(categories, watchedBizTypeCode),
    [categories, watchedBizTypeCode],
  );
  const filteredCategories = useMemo(
    () => filterCategories(categories, filters, status),
    [categories, filters, status],
  );
  const columns = buildCategoryColumns({
    onEdit: (record) => {
      setEditing(record);
      modalForm.resetFields();
      modalForm.setFieldsValue(buildEditCategoryFormValues(record));
      setModalOpen(true);
    },
    onToggleStatus: (record) => void handleToggleStatus(record),
    onView: (record) => setSelected(record),
  });

  return (
    <div className="page-stack">
      {contextHolder}
      {issue ? <Alert showIcon type="error" message={issue} /> : null}

      <AdminSearchPanel
        form={form}
        onSearch={() => setFilters(form.getFieldsValue())}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="name">
          <Input allowClear placeholder="分类名称" />
        </Form.Item>
        <Form.Item name="bizTypeCode">
          <Select allowClear options={BIZ_TYPE_OPTIONS as never} placeholder="业务域" />
        </Form.Item>
        <Form.Item name="parentId">
          <Select
            allowClear
            options={categories.map((item) => ({ label: item.name, value: item.id }))}
            placeholder="父分类"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </AdminSearchPanel>

      <AdminStatusTabs
        activeKey={status}
        items={buildCategoryStatusItems(categories)}
        onChange={(key) => setStatus(key as 'all' | AdminCategoryItem['status'])}
      />

      <ConfigProvider theme={CATEGORY_TABLE_THEME}>
        <ProTable<AdminCategoryItem>
          cardBordered={false}
          columns={columns}
          dataSource={filteredCategories}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          rowKey="id"
          search={false}
          scroll={{ x: 1320 }}
          toolBarRender={() => [
            <Button
              key="add"
              type="primary"
              onClick={() => {
                setEditing(null);
                modalForm.resetFields();
                modalForm.setFieldsValue(buildCreateCategoryFormValues());
                setModalOpen(true);
              }}
            >
              新增
            </Button>,
          ]}
          columnsState={{
            defaultValue: {
              path: { show: false },
              iconUrl: { show: false },
            },
          }}
        />
      </ConfigProvider>

      <AdminCategoryDetailDrawer
        open={selected != null}
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <AdminCategoryFormModal
        editing={editing != null}
        form={modalForm}
        open={modalOpen}
        parentOptions={parentOptions}
        submitting={submitting}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          modalForm.resetFields();
        }}
        onSubmit={() => void handleSubmit()}
      />
    </div>
  );

  async function reloadCategories() {
    setLoading(true);
    setIssue(null);
    try {
      const result = await fetchAdminCategories();
      setCategories(result.items);
    } catch (error) {
      setCategories([]);
      setIssue(error instanceof Error ? error.message : '分类列表加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(record: AdminCategoryItem) {
    try {
      await updateAdminCategoryStatus(record.id, {
        status: record.status === 'active' ? 'disabled' : 'active',
      });
      messageApi.success(record.status === 'active' ? '分类已停用' : '分类已启用');
      await reloadCategories();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '更新分类状态失败');
    }
  }

  async function handleSubmit() {
    try {
      const values = await modalForm.validateFields();
      setSubmitting(true);

      if (editing) {
        await updateAdminCategory(editing.id, toCategoryUpdatePayload(values));
        messageApi.success('分类已更新');
      } else {
        await createAdminCategory(toCategoryPayload(values));
        messageApi.success('分类已创建');
      }

      setModalOpen(false);
      setEditing(null);
      modalForm.resetFields();
      await reloadCategories();
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }
}
