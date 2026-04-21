import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  List,
  Result,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import { AdminGuessRejectModal } from '../components/admin-guess-reject-modal';
import { fetchAdminGuessDetail, reviewAdminGuess } from '../lib/api/catalog';
import type { AdminGuessDetailResult } from '../lib/api/catalog';
import { formatAmount, formatDateTime, guessReviewStatusMeta, guessStatusMeta } from '../lib/format';

interface GuessDetailPageProps {
  guessId: string;
  refreshToken?: number;
}

export function GuessDetailPage({ guessId, refreshToken = 0 }: GuessDetailPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [rejectForm] = Form.useForm<{ rejectReason: string }>();
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminGuessDetailResult | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [actionSeed, setActionSeed] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadDetail() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminGuessDetail(guessId);
        if (!alive) {
          return;
        }
        setDetail(result);
      } catch (error) {
        if (!alive) {
          return;
        }
        setDetail(null);
        setIssue(error instanceof Error ? error.message : '竞猜详情加载失败');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      alive = false;
    };
  }, [actionSeed, guessId, refreshToken]);

  async function handleApprove() {
    setReviewing(true);
    try {
      await reviewAdminGuess(guessId, { status: 'approved' });
      messageApi.success('竞猜审核已通过');
      setActionSeed((value) => value + 1);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '竞猜审核失败');
    } finally {
      setReviewing(false);
    }
  }

  async function handleReject() {
    try {
      const values = await rejectForm.validateFields();
      setReviewing(true);
      await reviewAdminGuess(guessId, {
        status: 'rejected',
        rejectReason: values.rejectReason,
      });
      messageApi.success('竞猜审核已拒绝');
      setRejectOpen(false);
      rejectForm.resetFields();
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  if (issue || !detail) {
    return (
      <div className="page-stack">
        {contextHolder}
        <Result status="error" title="竞猜详情加载失败" subTitle={issue ?? '请稍后重试'} />
      </div>
    );
  }

  const { guess, stats, reviewLogs, comments, oracleEvidence } = detail;
  const statusMeta = guessStatusMeta[guess.status];
  const reviewMeta = guessReviewStatusMeta[guess.reviewStatus];

  return (
    <div className="page-stack">
      {contextHolder}
      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
        <Space align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              window.location.hash = '#/guesses/list';
            }}
          >
            返回列表
          </Button>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {guess.title}
          </Typography.Title>
          <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
          <Tag color={reviewMeta.color}>{reviewMeta.label}</Tag>
        </Space>
        {guess.reviewStatus === 'pending' ? (
          <Space>
            <Button loading={reviewing} type="primary" onClick={() => void handleApprove()}>
              审核通过
            </Button>
            <Button danger loading={reviewing} onClick={() => setRejectOpen(true)}>
              审核拒绝
            </Button>
          </Space>
        ) : null}
      </Space>

      <Card>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="竞猜 ID">{guess.id}</Descriptions.Item>
          <Descriptions.Item label="分类">{guess.category}</Descriptions.Item>
          <Descriptions.Item label="创建人">{guess.creatorName}</Descriptions.Item>
          <Descriptions.Item label="可见范围">{guess.scope === 'public' ? '公开' : '好友'}</Descriptions.Item>
          <Descriptions.Item label="开奖方式">{guess.settlementMode === 'oracle' ? 'Oracle 结算' : '手动结算'}</Descriptions.Item>
          <Descriptions.Item label="截止时间">{formatDateTime(guess.endTime)}</Descriptions.Item>
          <Descriptions.Item label="结算时间">{formatDateTime(guess.settledAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(guess.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="关联商品">{guess.product.name}</Descriptions.Item>
          <Descriptions.Item label="品牌">{guess.product.brand}</Descriptions.Item>
          <Descriptions.Item label="奖品价值">{formatAmount(guess.product.price)}</Descriptions.Item>
          <Descriptions.Item label="竞猜成本">{formatAmount(guess.product.guessPrice)}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {guess.description || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="补充说明" span={2}>
            {guess.topicDetail || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Space size={16} style={{ width: '100%' }} wrap>
        <Card style={{ flex: 1, minWidth: 220 }}>
          <Statistic title="投注笔数" value={stats.totalBets} />
        </Card>
        <Card style={{ flex: 1, minWidth: 220 }}>
          <Statistic title="参与人数" value={stats.totalParticipants} />
        </Card>
        <Card style={{ flex: 1, minWidth: 220 }}>
          <Statistic title="总投注额" value={formatAmount(stats.totalAmount)} />
        </Card>
      </Space>

      <Card title="竞猜选项与统计">
        <List
          dataSource={guess.options}
          renderItem={(item) => (
            <List.Item>
              <div style={{ display: 'grid', gap: 4, width: '100%' }}>
                <Space align="center">
                  <Typography.Text strong>{item.optionText}</Typography.Text>
                  {item.isResult ? <Tag color="success">已开奖结果</Tag> : null}
                </Space>
                <Typography.Text type="secondary">
                  赔率 {item.odds.toFixed(2)} · {item.voteCount} 票 · 投注额 {formatAmount(item.voteAmount)}
                </Typography.Text>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Card title="审核日志">
        {reviewLogs.length > 0 ? (
          <List
            dataSource={reviewLogs}
            renderItem={(item) => (
              <List.Item>
                <div style={{ display: 'grid', gap: 4 }}>
                  <Space align="center">
                    <Tag>{item.actionLabel}</Tag>
                    <Typography.Text>{item.reviewerName || '未知管理员'}</Typography.Text>
                    <Typography.Text type="secondary">
                      {formatDateTime(item.createdAt)}
                    </Typography.Text>
                  </Space>
                  <Typography.Text type="secondary">
                    状态流转 {item.fromStatus} → {item.toStatus}
                  </Typography.Text>
                  <Typography.Text>{item.note || '无备注'}</Typography.Text>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无审核日志" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card title="Oracle 证据">
        {oracleEvidence.length > 0 ? (
          <List
            dataSource={oracleEvidence}
            renderItem={(item) => (
              <List.Item>
                <div style={{ display: 'grid', gap: 6, width: '100%' }}>
                  <Space align="center">
                    <Tag>{item.sourceType}</Tag>
                    <Typography.Text type="secondary">
                      {formatDateTime(item.createdAt)}
                    </Typography.Text>
                  </Space>
                  <Typography.Text>
                    匹配结果：{item.matchedIndex == null ? '-' : `选项 ${item.matchedIndex + 1}`}
                    {item.confidence != null ? ` · 置信度 ${(item.confidence * 100).toFixed(1)}%` : ''}
                  </Typography.Text>
                  <Typography.Text type="secondary">原因：{item.reason || '-'}</Typography.Text>
                  <Typography.Paragraph copyable={{ text: JSON.stringify(item.queryPayload ?? null) }}>
                    查询载荷：{JSON.stringify(item.queryPayload ?? null)}
                  </Typography.Paragraph>
                  <Typography.Paragraph copyable={{ text: JSON.stringify(item.responsePayload ?? null) }}>
                    响应载荷：{JSON.stringify(item.responsePayload ?? null)}
                  </Typography.Paragraph>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无 Oracle 证据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card title="评论">
        {comments.length > 0 ? (
          <List
            dataSource={comments}
            renderItem={(item) => (
              <List.Item>
                <div style={{ display: 'grid', gap: 4, width: '100%' }}>
                  <Space align="center">
                    <Typography.Text strong>{item.authorName}</Typography.Text>
                    <Typography.Text type="secondary">
                      {formatDateTime(item.createdAt)}
                    </Typography.Text>
                    {item.replyCount > 0 ? <Tag>{item.replyCount} 条回复</Tag> : null}
                  </Space>
                  <Typography.Text>{item.content}</Typography.Text>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无评论" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Alert
        showIcon
        type="info"
        message="当前详情页已接入真实详情、审核日志、评论、Oracle 证据和统计链路。"
        description="当前工作区还没有后台开奖/取消接口，所以这里不会展示假动作按钮。"
      />

      <AdminGuessRejectModal
        form={rejectForm}
        open={rejectOpen}
        submitting={reviewing}
        onCancel={() => {
          setRejectOpen(false);
          rejectForm.resetFields();
        }}
        onSubmit={() => void handleReject()}
      />
    </div>
  );
}
