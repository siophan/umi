import type { GuessSummary } from '@umi/shared';
import { ProTable } from '@ant-design/pro-components';

import {
  Alert,
  Button,
  ConfigProvider,
  Form,
  Input,
  Modal,
  Select,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

function isoToLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

import { AdminGuessRejectModal } from '../components/admin-guess-reject-modal';
import {
  AdminSearchPanel,
  AdminStatusTabs,
  SEARCH_THEME,
} from '../components/admin-list-controls';
import {
  buildGuessBrandOptions,
  buildGuessCategoryOptions,
  buildGuessColumns,
  buildGuessStatusItems,
  filterGuesses,
  type GuessFilters,
  type GuessStatusFilter,
} from '../lib/admin-guesses';
import { fetchAdminCategories, type AdminCategoryItem } from '../lib/api/categories';
import {
  abandonAdminGuess,
  fetchAdminGuesses,
  reviewAdminGuess,
  updateAdminGuess,
} from '../lib/api/catalog';
import { ADMIN_LIST_TABLE_THEME } from '../lib/admin-table-theme';

interface GuessesPageProps {
  refreshToken?: number;
}

export function GuessesPage({ refreshToken = 0 }: GuessesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [categoryIssue, setCategoryIssue] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<GuessSummary[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [filters, setFilters] = useState<GuessFilters>({});
  const [status, setStatus] = useState<GuessStatusFilter>('all');
  const [form] = Form.useForm<GuessFilters>();
  const [rejectForm] = Form.useForm<{ rejectReason: string }>();
  const [actionSeed, setActionSeed] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<GuessSummary | null>(null);
  const [editTarget, setEditTarget] = useState<GuessSummary | null>(null);
  const [editForm] = Form.useForm<{
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    endTime: string;
  }>();
  const [editing, setEditing] = useState(false);
  const [abandonTarget, setAbandonTarget] = useState<GuessSummary | null>(null);
  const [abandonForm] = Form.useForm<{ reason: string }>();
  const [abandoning, setAbandoning] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      setCategoryIssue(null);
      try {
        const [guessesResult, categoriesResult] = await Promise.allSettled([
          fetchAdminGuesses(),
          fetchAdminCategories(),
        ]);
        if (!alive) {
          return;
        }

        if (guessesResult.status === 'fulfilled') {
          setGuesses(guessesResult.value.items);
        } else {
          setGuesses([]);
          setIssue(
            guessesResult.reason instanceof Error
              ? guessesResult.reason.message
              : '竞猜列表加载失败',
          );
        }

        if (categoriesResult.status === 'fulfilled') {
          setCategories(categoriesResult.value.items);
        } else {
          setCategories([]);
          setCategoryIssue(
            categoriesResult.reason instanceof Error
              ? categoriesResult.reason.message
              : '竞猜分类字典加载失败',
          );
        }
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
  }, [actionSeed, refreshToken]);

  const filteredGuesses = useMemo(() => {
    return filterGuesses(guesses, filters, status);
  }, [filters, guesses, status]);

  const categoryOptions = useMemo(() => buildGuessCategoryOptions(categories, guesses), [categories, guesses]);
  const brandOptions = useMemo(() => buildGuessBrandOptions(guesses), [guesses]);
  const columns = buildGuessColumns({
    onApprove: (id) => handleApprove(id),
    onReject: (record) => openRejectModal(record),
    onView: (record) => {
      window.location.hash = `#/guesses/detail/${record.id}`;
    },
    onEdit: (record) => {
      editForm.setFieldsValue({
        title: record.title,
        description: record.description ?? '',
        imageUrl: record.product.img ?? '',
        endTime: isoToLocalInputValue(record.endTime),
      });
      setEditTarget(record);
    },
    onAbandon: (record) => {
      abandonForm.resetFields();
      setAbandonTarget(record);
    },
    reviewingId,
  });

  function openRejectModal(record: GuessSummary) {
    rejectForm.setFieldsValue({ rejectReason: '' });
    setRejectTarget(record);
  }

  async function handleApprove(id: string) {
    setReviewingId(id);
    try {
      await reviewAdminGuess(id, { status: 'approved' });
      messageApi.success('竞猜审核已通过');
      setRejectTarget(null);
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '竞猜审核失败');
    } finally {
      setReviewingId(null);
    }
  }

  async function handleEditSubmit() {
    if (!editTarget) return;
    const values = await editForm.validateFields();
    setEditing(true);
    try {
      await updateAdminGuess(editTarget.id, {
        title: values.title.trim(),
        description: values.description?.trim() || null,
        imageUrl: values.imageUrl?.trim() || null,
        endTime: new Date(values.endTime).toISOString(),
      });
      messageApi.success('竞猜已更新');
      setEditTarget(null);
      editForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '编辑失败');
    } finally {
      setEditing(false);
    }
  }

  async function handleAbandonSubmit() {
    if (!abandonTarget) return;
    const values = await abandonForm.validateFields();
    setAbandoning(true);
    try {
      await abandonAdminGuess(abandonTarget.id, { reason: values.reason.trim() });
      messageApi.success('竞猜已作废，已支付投注将逐单原路退款');
      setAbandonTarget(null);
      abandonForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '作废失败');
    } finally {
      setAbandoning(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) {
      return;
    }

    try {
      const values = await rejectForm.validateFields();
      setReviewingId(rejectTarget.id);
      await reviewAdminGuess(rejectTarget.id, {
        status: 'rejected',
        rejectReason: values.rejectReason,
      });
      messageApi.success('竞猜审核已拒绝');
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
      {categoryIssue ? (
        <Alert
          showIcon
          type="warning"
          message="竞猜分类字典加载失败"
          description="竞猜主表已按真实接口结果保留；分类筛选已降级为当前列表可见分类。"
        />
      ) : null}
      <AdminSearchPanel
        form={form}
        onSearch={() => {
          const values = form.getFieldsValue();
          setFilters(values);
        }}
        onReset={() => {
          form.resetFields();
          setFilters({});
          setStatus('all');
        }}
      >
        <Form.Item name="title">
          <Input placeholder="竞猜标题" allowClear />
        </Form.Item>
        <Form.Item name="categoryId">
          <Select placeholder="分类" allowClear options={categoryOptions} />
        </Form.Item>
        <Form.Item name="brand">
          <Select placeholder="品牌" allowClear options={brandOptions} />
        </Form.Item>
      </AdminSearchPanel>
      <AdminStatusTabs
        activeKey={status}
        items={buildGuessStatusItems(guesses)}
        onChange={(key) => setStatus(key as GuessStatusFilter)}
      />
      <ConfigProvider theme={ADMIN_LIST_TABLE_THEME}>
        <ProTable<GuessSummary>
          cardBordered={false}
          rowKey="id"
          columns={columns as never}
          columnsState={{}}
          dataSource={filteredGuesses}
          loading={loading}
          options={{ reload: true, density: true, fullScreen: false, setting: true }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          search={false}
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              onClick={() => {
                window.location.hash = '#/guesses/create';
              }}
            >
              创建竞猜
            </Button>,
          ]}
        />
      </ConfigProvider>
      <AdminGuessRejectModal
        form={rejectForm}
        open={!!rejectTarget}
        submitting={!!reviewingId}
        onCancel={() => {
          setRejectTarget(null);
          rejectForm.resetFields();
        }}
        onSubmit={() => {
          void handleReject();
        }}
      />
      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          title="编辑竞猜"
          open={editTarget != null}
          confirmLoading={editing}
          onOk={() => void handleEditSubmit()}
          onCancel={() => {
            if (editing) return;
            setEditTarget(null);
            editForm.resetFields();
          }}
          okText="保存"
          cancelText="取消"
          destroyOnClose
        >
          <Alert
            type="info"
            showIcon
            message="本期仅支持编辑标题、封面、截止时间（只能延长）、描述。选项与赔率不可修改。"
            style={{ marginBottom: 16 }}
          />
          <Form form={editForm} layout="vertical">
            <Form.Item
              label="竞猜标题"
              name="title"
              rules={[
                { required: true, message: '请填写竞猜标题' },
                { whitespace: true, message: '请填写竞猜标题' },
              ]}
            >
              <Input maxLength={100} placeholder="竞猜标题" />
            </Form.Item>
            <Form.Item label="封面 URL" name="imageUrl">
              <Input allowClear placeholder="留空则保持原值" />
            </Form.Item>
            <Form.Item
              label="截止时间"
              name="endTime"
              rules={[
                { required: true, message: '请选择截止时间' },
                {
                  validator: (_, value: string) => {
                    if (!value || !editTarget) return Promise.resolve();
                    const next = new Date(value).getTime();
                    if (Number.isNaN(next)) return Promise.reject(new Error('截止时间不合法'));
                    if (next <= Date.now()) {
                      return Promise.reject(new Error('截止时间必须晚于当前时间'));
                    }
                    if (next < new Date(editTarget.endTime).getTime()) {
                      return Promise.reject(new Error('截止时间只能延长'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input type="datetime-local" />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} maxLength={500} showCount placeholder="补充说明" />
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title="作废竞猜"
          open={abandonTarget != null}
          confirmLoading={abandoning}
          onOk={() => void handleAbandonSubmit()}
          onCancel={() => {
            if (abandoning) return;
            setAbandonTarget(null);
            abandonForm.resetFields();
          }}
          okText="确认作废"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          destroyOnClose
        >
          <Alert
            type="warning"
            showIcon
            message="作废后所有已支付投注将原路全额退款（含手续费），未付投注将取消。已结算的竞猜不能作废。"
            style={{ marginBottom: 16 }}
          />
          <Form form={abandonForm} layout="vertical">
            <Form.Item label="竞猜">
              <span>{abandonTarget?.title ?? '-'}</span>
            </Form.Item>
            <Form.Item
              label="作废理由"
              name="reason"
              rules={[
                { required: true, message: '请填写作废理由' },
                { whitespace: true, message: '请填写作废理由' },
              ]}
            >
              <Input.TextArea
                rows={3}
                maxLength={200}
                showCount
                placeholder="例如：某选项 0 投注无法正常结算"
              />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
}
