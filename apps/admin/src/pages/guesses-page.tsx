import type { GuessSummary } from '@umi/shared';
import { ProTable } from '@ant-design/pro-components';

import { Alert, Button, ConfigProvider, Form, Input, Select, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { AdminGuessAbandonModal } from '../components/admin-guess-abandon-modal';
import { AdminGuessEditModal } from '../components/admin-guess-edit-modal';
import { AdminGuessRejectModal } from '../components/admin-guess-reject-modal';
import { GuessDetailDrawer } from '../components/guess-detail-drawer';
import { AdminSearchPanel, AdminStatusTabs } from '../components/admin-list-controls';
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
  const [editing, setEditing] = useState(false);
  const [abandonTarget, setAbandonTarget] = useState<GuessSummary | null>(null);
  const [abandoning, setAbandoning] = useState(false);
  const [drawerGuessId, setDrawerGuessId] = useState<string | null>(null);

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
      setDrawerGuessId(record.id);
    },
    onEdit: (record) => {
      setEditTarget(record);
    },
    onAbandon: (record) => {
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

  async function handleEditSubmit(values: {
    title: string;
    description: string | null;
    imageUrl: string | null;
    endTime: string;
  }) {
    if (!editTarget) return;
    setEditing(true);
    try {
      await updateAdminGuess(editTarget.id, values);
      messageApi.success('竞猜已更新');
      setEditTarget(null);
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '编辑失败');
    } finally {
      setEditing(false);
    }
  }

  async function handleAbandonSubmit(reason: string) {
    if (!abandonTarget) return;
    setAbandoning(true);
    try {
      await abandonAdminGuess(abandonTarget.id, { reason });
      messageApi.success('竞猜已作废，已支付投注将逐单原路退款');
      setAbandonTarget(null);
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
      <AdminGuessEditModal
        open={editTarget != null}
        initialValues={
          editTarget
            ? {
                title: editTarget.title,
                description: editTarget.description ?? null,
                imageUrl: editTarget.imageUrl ?? null,
                endTime: editTarget.endTime,
              }
            : null
        }
        submitting={editing}
        onCancel={() => setEditTarget(null)}
        onSubmit={(values) => void handleEditSubmit(values)}
      />
      <AdminGuessAbandonModal
        open={abandonTarget != null}
        guessTitle={abandonTarget?.title ?? null}
        submitting={abandoning}
        onCancel={() => setAbandonTarget(null)}
        onSubmit={(reason) => void handleAbandonSubmit(reason)}
      />
      <GuessDetailDrawer
        guessId={drawerGuessId}
        onClose={() => setDrawerGuessId(null)}
        onRefresh={() => setActionSeed((v) => v + 1)}
      />
    </div>
  );
}
