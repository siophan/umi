import type { GuessSummary } from '@umi/shared';
import type { TableColumnsType } from 'antd';
import { Avatar, Button, Popconfirm, Space, Tag, Typography } from 'antd';

import type { AdminCategoryItem } from './api/categories';
import { formatAmount, formatDateTime, guessReviewStatusMeta, guessStatusMeta } from './format';

export type GuessFilters = {
  title?: string;
  categoryId?: string;
  brand?: string;
};

export type GuessStatusFilter = 'all' | 'pending_review' | GuessSummary['status'];

export function filterGuesses(
  guesses: GuessSummary[],
  filters: GuessFilters,
  status: GuessStatusFilter,
) {
  return guesses.filter((guess) => {
    if (status === 'pending_review' && guess.reviewStatus !== 'pending') {
      return false;
    }
    if (status !== 'all' && status !== 'pending_review' && guess.status !== status) {
      return false;
    }
    if (filters.title && !guess.title.toLowerCase().includes(filters.title.trim().toLowerCase())) {
      return false;
    }
    if (filters.categoryId && String(guess.categoryId ?? '') !== String(filters.categoryId)) {
      return false;
    }
    if (filters.brand && guess.product.brand !== filters.brand) {
      return false;
    }
    return true;
  });
}

export function buildGuessStatusItems(guesses: GuessSummary[]) {
  const draftCount = guesses.filter((item) => item.status === 'draft').length;

  const items: Array<{ key: GuessStatusFilter; label: string; count: number }> = [
    { key: 'all', label: '全部', count: guesses.length },
    {
      key: 'pending_review',
      label: '待审核',
      count: guesses.filter((item) => item.reviewStatus === 'pending').length,
    },
  ];

  if (draftCount > 0) {
    items.push({ key: 'draft', label: '草稿', count: draftCount });
  }

  items.push(
    {
      key: 'active',
      label: '进行中',
      count: guesses.filter((item) => item.status === 'active').length,
    },
    {
      key: 'pending_settle',
      label: '待结算',
      count: guesses.filter((item) => item.status === 'pending_settle').length,
    },
    {
      key: 'settled',
      label: '已结算',
      count: guesses.filter((item) => item.status === 'settled').length,
    },
    {
      key: 'abandoned',
      label: '已作废',
      count: guesses.filter((item) => item.status === 'abandoned').length,
    },
    {
      key: 'cancelled',
      label: '审核拒绝',
      count: guesses.filter((item) => item.status === 'cancelled').length,
    },
  );

  return items;
}

export function buildGuessCategoryOptions(
  categories: AdminCategoryItem[],
  guesses: GuessSummary[],
) {
  const options = new Map<string, { label: string; value: string }>();

  categories
    .filter((item) => item.bizType === 'guess' && item.status === 'active')
    .forEach((item) => {
      options.set(String(item.id), {
        label: item.parentName ? `${item.parentName} / ${item.name}` : item.name,
        value: String(item.id),
      });
    });

  guesses.forEach((item) => {
    const value = item.categoryId ? String(item.categoryId) : '';
    if (!value) {
      return;
    }
    if (!options.has(value)) {
      options.set(value, {
        label: item.category,
        value,
      });
    }
  });

  return Array.from(options.values()).sort((left, right) =>
    left.label.localeCompare(right.label, 'zh-CN'),
  );
}

export function buildGuessBrandOptions(guesses: GuessSummary[]) {
  return Array.from(new Set(guesses.map((item) => item.product.brand).filter(Boolean))).map(
    (value) => ({
      label: value,
      value,
    }),
  );
}

export function buildGuessColumns(args: {
  onApprove: (id: string) => void | Promise<void>;
  onReject: (record: GuessSummary) => void;
  onView: (record: GuessSummary) => void;
  onEdit: (record: GuessSummary) => void;
  onAbandon: (record: GuessSummary) => void;
  reviewingId: string | null;
}): TableColumnsType<GuessSummary> {
  return [
    {
      title: '竞猜标题',
      dataIndex: 'title',
      render: (_, record) => <Typography.Text strong>{record.title}</Typography.Text>,
    },
    {
      title: '关联商品',
      key: 'product',
      render: (_, record) => (
        <Space>
          <Avatar
            shape="square"
            size={40}
            src={record.product.img || undefined}
            style={{ flexShrink: 0, background: '#f5f5f5' }}
          >
            {record.product.brand?.[0]}
          </Avatar>
          <div>
            <Typography.Text style={{ display: 'block' }}>{record.product.name}</Typography.Text>
            <Typography.Text style={{ display: 'block' }} type="secondary">
              {record.product.brand}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      render: (_, record) => <Typography.Text>{record.category}</Typography.Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: GuessSummary['status']) => (
        <Tag color={guessStatusMeta[value].color}>{guessStatusMeta[value].label}</Tag>
      ),
    },
    {
      title: '审核',
      dataIndex: 'reviewStatus',
      render: (value: GuessSummary['reviewStatus']) => (
        <Tag color={guessReviewStatusMeta[value].color}>
          {guessReviewStatusMeta[value].label}
        </Tag>
      ),
    },
    {
      title: '参与人数',
      width: 90,
      render: (_, record) => record.participantCount ?? 0,
    },
    {
      title: '奖池',
      width: 110,
      render: (_, record) => formatAmount(record.paidAmount ?? 0),
    },
    {
      title: '创建人',
      width: 120,
      render: (_, record) => (
        <Typography.Text type="secondary" ellipsis style={{ maxWidth: 110 }}>
          {record.creatorName || `用户${record.creatorId}`}
        </Typography.Text>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (value) => formatDateTime(value as string | null | undefined),
    },
    {
      title: '截止时间',
      dataIndex: 'endTime',
      width: 150,
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      fixed: 'right',
      render: (_, record) => {
        const isPendingReview = record.reviewStatus === 'pending';
        const isEditable =
          !isPendingReview &&
          (record.status === 'active' || record.status === 'pending_settle');
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" type="link" onClick={() => args.onView(record)}>
              查看
            </Button>
            {isPendingReview ? (
              <>
                <Popconfirm
                  okButtonProps={{ loading: args.reviewingId === record.id }}
                  title="确认通过该竞猜审核？"
                  onConfirm={() => void args.onApprove(record.id)}
                >
                  <Button size="small" type="link">
                    通过
                  </Button>
                </Popconfirm>
                <Button size="small" type="link" danger onClick={() => args.onReject(record)}>
                  拒绝
                </Button>
              </>
            ) : null}
            {isEditable ? (
              <>
                <Button size="small" type="link" onClick={() => args.onEdit(record)}>
                  编辑
                </Button>
                <Button size="small" type="link" danger onClick={() => args.onAbandon(record)}>
                  作废
                </Button>
              </>
            ) : null}
          </div>
        );
      },
    },
  ];
}
