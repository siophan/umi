import type { GuessSummary } from '@umi/shared';
import { Card, Descriptions, List, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import type { AdminCategoryItem } from '../lib/api/categories';
import { fetchAdminCategories } from '../lib/api/categories';
import type { AdminFriendGuessItem, AdminProduct } from '../lib/api/catalog';
import { fetchAdminFriendGuesses, fetchAdminGuesses, fetchAdminProducts } from '../lib/api/catalog';
import { guessReviewStatusMeta, guessStatusMeta } from '../lib/format';

interface GuessCreatePageProps {
  refreshToken?: number;
}

interface GuessCreatePageData {
  categories: AdminCategoryItem[];
  friendGuesses: AdminFriendGuessItem[];
  guesses: GuessSummary[];
  products: AdminProduct[];
}

const emptyData: GuessCreatePageData = { categories: [], friendGuesses: [], guesses: [], products: [] };

export function GuessCreatePage({ refreshToken = 0 }: GuessCreatePageProps) {
  const [data, setData] = useState<GuessCreatePageData>(emptyData);
  const [issue, setIssue] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadPageData() {
      setIssue(null);
      try {
        const [guesses, products, categories, friendGuesses] = await Promise.all([
          fetchAdminGuesses().then((result) => result.items),
          fetchAdminProducts({ page: 1, pageSize: 100 }).then((result) => result.items),
          fetchAdminCategories().then((result) => result.items),
          fetchAdminFriendGuesses().then((result) => result.items),
        ]);
        if (!alive) return;
        setData({ categories, friendGuesses, guesses, products });
      } catch (error) {
        if (!alive) return;
        setData(emptyData);
        setIssue(error instanceof Error ? error.message : '创建竞猜页数据加载失败');
      }
    }
    void loadPageData();
    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const draftCount = data.guesses.filter((item) => item.reviewStatus === 'pending').length;
  const guessCategories = useMemo(
    () => data.categories.filter((item) => item.bizType === 'guess' && item.status === 'active'),
    [data.categories],
  );

  return (
    <div className="page-stack">
      {issue ? <Card>{issue}</Card> : null}
      <Card title="创建前检查">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="商品池">{data.products.length > 0 ? '已接入' : '暂无商品'}</Descriptions.Item>
          <Descriptions.Item label="可选分类">{guessCategories.length} 个</Descriptions.Item>
          <Descriptions.Item label="审核待办">{draftCount} 条</Descriptions.Item>
          <Descriptions.Item label="好友竞猜房间">{data.friendGuesses.length} 个</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="最近待处理竞猜">
        <List
          dataSource={data.guesses.slice(0, 8)}
          renderItem={(record: GuessSummary) => (
            <List.Item>
              <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div>
                  <Typography.Text strong>{record.title}</Typography.Text>
                  <Typography.Text style={{ display: 'block' }} type="secondary">{record.product.name}</Typography.Text>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Tag color={guessStatusMeta[record.status].color}>{guessStatusMeta[record.status].label}</Tag>
                  <Tag color={guessReviewStatusMeta[record.reviewStatus].color}>{guessReviewStatusMeta[record.reviewStatus].label}</Tag>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
