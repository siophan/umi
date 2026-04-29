import type { GuessSummary } from '@umi/shared';
import type { TableColumnsType } from 'antd';
import { Button, Popconfirm, Tag, Typography } from 'antd';

import type { AdminCategoryItem } from './api/categories';
import { formatDateTime, guessReviewStatusMeta, guessStatusMeta } from './format';

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
  return [
    { key: 'all', label: '全部', count: guesses.length },
    {
      key: 'pending_review',
      label: '待审核',
      count: guesses.filter((item) => item.reviewStatus === 'pending').length,
    },
    {
      key: 'draft',
      label: '草稿',
      count: guesses.filter((item) => item.status === 'draft').length,
    },
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
      label: '已废弃',
      count: guesses.filter((item) => item.status === 'abandoned').length,
    },
    {
      key: 'cancelled',
      label: '已取消',
      count: guesses.filter((item) => item.status === 'cancelled').length,
    },
  ] satisfies Array<{ key: GuessStatusFilter; label: string; count: number }>;
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

export function getGuessTotalVotes(guess: GuessSummary) {
  return guess.options.reduce((sum, option) => sum + option.voteCount, 0);
}

export function buildGuessColumns(args: {
  onApprove: (id: string) => void | Promise<void>;
  onReject: (record: GuessSummary) => void;
  onView: (record: GuessSummary) => void;
  reviewingId: string | null;
}): TableColumnsType<GuessSummary> {
  return [
    {
      title: '竞猜标题',
      dataIndex: 'title',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            {record.product.name}
          </Typography.Text>
        </div>
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
      render: (_, record) => getGuessTotalVotes(record),
    },
    {
      title: '截止时间',
      dataIndex: 'endTime',
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="link" onClick={() => args.onView(record)}>
            查看
          </Button>
          {record.reviewStatus === 'pending' ? (
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
        </div>
      ),
    },
  ];
}
