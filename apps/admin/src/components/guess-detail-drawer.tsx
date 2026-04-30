import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  ConfigProvider,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Pagination,
  Radio,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { AdminGuessParticipantItem } from '@umi/shared';

import { AdminGuessRejectModal } from './admin-guess-reject-modal';
import { AdminOssImageUploader } from './admin-oss-image-uploader';
import { SEARCH_THEME } from './admin-list-controls';
import {
  abandonAdminGuess,
  fetchAdminGuessDetail,
  fetchAdminGuessParticipants,
  reviewAdminGuess,
  settleAdminGuess,
  updateAdminGuess,
} from '../lib/api/catalog';
import type { AdminGuessDetailResult } from '../lib/api/catalog';
import { formatAmount, formatDateTime, guessReviewStatusMeta, guessStatusMeta } from '../lib/format';

interface GuessDetailDrawerProps {
  guessId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

type ActiveTab = 'info' | 'participants' | 'oracle' | 'comments' | 'logs';

const GUESS_STATUS_LABELS: Record<number, string> = {
  10: '草稿',
  20: '待审核',
  30: '进行中',
  35: '待结算',
  40: '已结算',
  80: '已废弃',
  90: '已取消',
};

const BET_STATUS_LABELS: Record<string, string> = {
  pending: '待开奖',
  won: '已中奖',
  lost: '未中奖',
  cancelled: '已取消',
};

const PAY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: '待支付', color: 'default' },
  paid: { label: '已支付', color: 'success' },
  failed: { label: '支付失败', color: 'error' },
  closed: { label: '已关闭', color: 'default' },
  refunded: { label: '已退款', color: 'warning' },
};

function guessStatusLabel(code: number): string {
  return GUESS_STATUS_LABELS[code] ?? `状态${code}`;
}

export function GuessDetailDrawer({ guessId, onClose, onRefresh }: GuessDetailDrawerProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<AdminGuessDetailResult | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');

  // review
  const [reviewing, setReviewing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectForm] = Form.useForm<{ rejectReason: string }>();

  // settle
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleForm] = Form.useForm<{ winnerOptionIndex: number }>();
  const [settling, setSettling] = useState(false);

  // abandon/cancel
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [abandonForm] = Form.useForm<{ reason: string }>();
  const [abandoning, setAbandoning] = useState(false);

  // edit
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm<{
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    endTime: Dayjs | null;
  }>();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!guessId) {
      setDetail(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setDetail(null);
    setActiveTab('info');

    fetchAdminGuessDetail(guessId)
      .then((result) => {
        if (alive) setDetail(result);
      })
      .catch((error: unknown) => {
        if (alive) messageApi.error(error instanceof Error ? error.message : '竞猜详情加载失败');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [guessId, actionSeed, messageApi]);

  function refresh() {
    setActionSeed((v) => v + 1);
    onRefresh();
  }

  async function handleApprove() {
    if (!guessId) return;
    setReviewing(true);
    try {
      await reviewAdminGuess(guessId, { status: 'approved' });
      messageApi.success('竞猜审核已通过');
      refresh();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '审核失败');
    } finally {
      setReviewing(false);
    }
  }

  async function handleReject() {
    if (!guessId) return;
    try {
      const values = await rejectForm.validateFields();
      setReviewing(true);
      await reviewAdminGuess(guessId, { status: 'rejected', rejectReason: values.rejectReason });
      messageApi.success('竞猜审核已拒绝');
      setRejectOpen(false);
      rejectForm.resetFields();
      refresh();
    } catch (error) {
      if (error instanceof Error) messageApi.error(error.message);
    } finally {
      setReviewing(false);
    }
  }

  async function handleSettle() {
    if (!guessId) return;
    try {
      const values = await settleForm.validateFields();
      setSettling(true);
      await settleAdminGuess(guessId, { winnerOptionIndex: values.winnerOptionIndex });
      messageApi.success('竞猜已开奖');
      setSettleOpen(false);
      settleForm.resetFields();
      refresh();
    } catch (error) {
      if (error instanceof Error) messageApi.error(error.message);
    } finally {
      setSettling(false);
    }
  }

  async function handleAbandon() {
    if (!guessId) return;
    try {
      const values = await abandonForm.validateFields();
      setAbandoning(true);
      await abandonAdminGuess(guessId, { reason: values.reason.trim() });
      messageApi.success('竞猜已取消，已支付金额将逐单原路退款');
      setAbandonOpen(false);
      abandonForm.resetFields();
      refresh();
    } catch (error) {
      if (error instanceof Error) messageApi.error(error.message);
    } finally {
      setAbandoning(false);
    }
  }

  async function handleEditSubmit() {
    if (!guessId || !detail) return;
    const values = await editForm.validateFields();
    setEditing(true);
    try {
      await updateAdminGuess(guessId, {
        title: values.title.trim(),
        description: values.description?.trim() || null,
        imageUrl: values.imageUrl ?? null,
        endTime: values.endTime?.toISOString() ?? '',
      });
      messageApi.success('竞猜已更新');
      setEditOpen(false);
      editForm.resetFields();
      refresh();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '编辑失败');
    } finally {
      setEditing(false);
    }
  }

  const guess = detail?.guess;
  const canSettle = guess?.status === 'pending_settle' || guess?.status === 'active';
  const canAbandon =
    guess?.status !== 'settled' && guess?.status !== 'abandoned' && guess?.status !== 'cancelled';
  const canEdit = guess?.status === 'active' || guess?.status === 'pending_settle';

  const tabItems: Array<{ key: ActiveTab; label: string }> = [
    { key: 'info', label: '基本信息' },
    { key: 'participants', label: '参与记录' },
    { key: 'oracle', label: 'Oracle证据' },
    { key: 'comments', label: '评论' },
    { key: 'logs', label: '审核记录' },
  ];

  const drawerTitle = guess ? (
    <Space align="center">
      <Typography.Text strong style={{ fontSize: 16 }}>
        {guess.title}
      </Typography.Text>
      <Tag color={guessStatusMeta[guess.status]?.color}>{guessStatusMeta[guess.status]?.label}</Tag>
      <Tag color={guessReviewStatusMeta[guess.reviewStatus]?.color}>
        {guessReviewStatusMeta[guess.reviewStatus]?.label}
      </Tag>
    </Space>
  ) : (
    '竞猜详情'
  );

  const footerActions = guess ? (
    <Space wrap>
      {guess.reviewStatus === 'pending' ? (
        <>
          <Button type="primary" loading={reviewing} onClick={() => void handleApprove()}>
            审核通过
          </Button>
          <Button danger loading={reviewing} onClick={() => setRejectOpen(true)}>
            审核拒绝
          </Button>
        </>
      ) : null}
      {canSettle ? (
        <Button
          type="primary"
          onClick={() => {
            settleForm.resetFields();
            setSettleOpen(true);
          }}
        >
          开奖
        </Button>
      ) : null}
      {canEdit ? (
        <Button
          onClick={() => {
            editForm.setFieldsValue({
              title: guess.title,
              description: guess.description ?? '',
              imageUrl: '',
              endTime: guess.endTime ? dayjs(guess.endTime) : null,
            });
            setEditOpen(true);
          }}
        >
          编辑
        </Button>
      ) : null}
      {canAbandon ? (
        <Button
          danger
          onClick={() => {
            abandonForm.resetFields();
            setAbandonOpen(true);
          }}
        >
          取消
        </Button>
      ) : null}
    </Space>
  ) : null;

  return (
    <>
      {contextHolder}
      <Drawer
        open={guessId != null}
        onClose={onClose}
        width={800}
        title={drawerTitle}
        footer={footerActions}
        footerStyle={{ padding: '12px 24px' }}
        destroyOnClose
      >
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
            <Spin size="large" />
          </div>
        ) : !detail ? (
          <Empty description="暂无数据" />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    borderBottom:
                      activeTab === tab.key ? '2px solid #1677ff' : '2px solid transparent',
                    color: activeTab === tab.key ? '#1677ff' : 'inherit',
                    fontWeight: activeTab === tab.key ? 600 : 400,
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'info' && <InfoTab detail={detail} />}
            {activeTab === 'participants' && guessId && (
              <ParticipantsTab guessId={guessId} stats={detail.stats} />
            )}
            {activeTab === 'oracle' && <OracleTab detail={detail} />}
            {activeTab === 'comments' && <CommentsTab detail={detail} />}
            {activeTab === 'logs' && <LogsTab detail={detail} />}
          </>
        )}
      </Drawer>

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

      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          title="开奖"
          open={settleOpen}
          confirmLoading={settling}
          onOk={() => void handleSettle()}
          onCancel={() => {
            if (settling) return;
            setSettleOpen(false);
            settleForm.resetFields();
          }}
          okText="确认开奖"
          cancelText="取消"
          destroyOnClose
        >
          <Alert
            type="warning"
            showIcon
            message="开奖后不可撤销，请确认获胜选项后再提交。"
            style={{ marginBottom: 16 }}
          />
          <Form form={settleForm} layout="vertical">
            <Form.Item
              label="获胜选项"
              name="winnerOptionIndex"
              rules={[{ required: true, message: '请选择获胜选项' }]}
            >
              <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {detail?.guess.options.map((opt) => (
                  <Radio key={opt.optionIndex} value={opt.optionIndex}>
                    {opt.optionText}
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                      {opt.voteCount} 次 · {formatAmount(opt.voteAmount)}
                    </Typography.Text>
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="取消竞猜"
          open={abandonOpen}
          confirmLoading={abandoning}
          onOk={() => void handleAbandon()}
          onCancel={() => {
            if (abandoning) return;
            setAbandonOpen(false);
            abandonForm.resetFields();
          }}
          okText="确认取消"
          cancelText="关闭"
          okButtonProps={{ danger: true }}
          destroyOnClose
        >
          <Alert
            type="warning"
            showIcon
            message="取消后所有已支付金额将原路全额退款（含手续费），未付款记录将作废。已结算的竞猜不能取消。"
            style={{ marginBottom: 16 }}
          />
          <Form form={abandonForm} layout="vertical">
            <Form.Item
              label="取消理由"
              name="reason"
              rules={[
                { required: true, message: '请填写取消理由' },
                { whitespace: true, message: '请填写取消理由' },
              ]}
            >
              <Input.TextArea
                rows={3}
                maxLength={200}
                showCount
                placeholder="例如：某选项 0 参与无法正常结算"
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="编辑竞猜"
          open={editOpen}
          confirmLoading={editing}
          onOk={() => void handleEditSubmit()}
          onCancel={() => {
            if (editing) return;
            setEditOpen(false);
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
            <Form.Item label="封面" name="imageUrl">
              <AdminOssImageUploader usage="guess_cover" />
            </Form.Item>
            <Form.Item
              label="截止时间"
              name="endTime"
              rules={[
                { required: true, message: '请选择截止时间' },
                {
                  validator: (_, value: Dayjs | null) => {
                    if (!value || !guess) return Promise.resolve();
                    if (!value.isValid()) return Promise.reject(new Error('截止时间不合法'));
                    if (value.valueOf() <= Date.now())
                      return Promise.reject(new Error('截止时间必须晚于当前时间'));
                    if (guess.endTime && value.valueOf() < new Date(guess.endTime).getTime())
                      return Promise.reject(new Error('截止时间只能延长'));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} maxLength={500} showCount placeholder="补充说明" />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </>
  );
}

function InfoTab({ detail }: { detail: AdminGuessDetailResult }) {
  const { guess } = detail;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="竞猜 ID">{guess.id}</Descriptions.Item>
        <Descriptions.Item label="分类">{guess.category}</Descriptions.Item>
        <Descriptions.Item label="创建人">{guess.creatorName}</Descriptions.Item>
        <Descriptions.Item label="可见范围">
          {guess.scope === 'public' ? '公开' : '好友'}
        </Descriptions.Item>
        <Descriptions.Item label="开奖方式">
          {guess.settlementMode === 'oracle' ? 'Oracle 结算' : '手动结算'}
        </Descriptions.Item>
        <Descriptions.Item label="截止时间">{formatDateTime(guess.endTime)}</Descriptions.Item>
        <Descriptions.Item label="结算时间">{formatDateTime(guess.settledAt)}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{formatDateTime(guess.updatedAt)}</Descriptions.Item>
        <Descriptions.Item label="关联商品">{guess.product.name}</Descriptions.Item>
        <Descriptions.Item label="品牌">{guess.product.brand}</Descriptions.Item>
        <Descriptions.Item label="奖品价值">{formatAmount(guess.product.price)}</Descriptions.Item>
        <Descriptions.Item label="参与费用">{formatAmount(guess.product.guessPrice)}</Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>
          {guess.description || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="补充说明" span={2}>
          {guess.topicDetail || '-'}
        </Descriptions.Item>
      </Descriptions>

      <List
        header={<Typography.Text strong>竞猜选项</Typography.Text>}
        bordered
        size="small"
        dataSource={guess.options}
        renderItem={(item) => (
          <List.Item>
            <div style={{ display: 'grid', gap: 4, width: '100%' }}>
              <Space align="center">
                <Typography.Text strong>{item.optionText}</Typography.Text>
                {item.isResult ? <Tag color="success">开奖结果</Tag> : null}
              </Space>
              <Typography.Text type="secondary">
                赔率 {item.odds.toFixed(2)} · {item.voteCount} 次参与 · 参与额{' '}
                {formatAmount(item.voteAmount)}
              </Typography.Text>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

function ParticipantsTab({
  guessId,
  stats,
}: {
  guessId: string;
  stats: AdminGuessDetailResult['stats'];
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminGuessParticipantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchAdminGuessParticipants(guessId, page, pageSize)
      .then((result) => {
        if (alive) {
          setItems(result.items);
          setTotal(result.total);
        }
      })
      .catch(() => {
        if (alive) setItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [guessId, page]);

  const columns = [
    {
      title: '参与者',
      key: 'user',
      render: (_: unknown, record: AdminGuessParticipantItem) => (
        <div>
          <Typography.Text>{record.userName}</Typography.Text>
          {record.phoneNumber ? (
            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              {record.phoneNumber}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: '选择选项',
      dataIndex: 'optionText',
      render: (text: string) => <Typography.Text>{text}</Typography.Text>,
    },
    {
      title: '参与金额',
      dataIndex: 'amount',
      render: (v: number) => formatAmount(v),
    },
    {
      title: '支付状态',
      dataIndex: 'payStatus',
      render: (v: AdminGuessParticipantItem['payStatus']) => {
        const meta = PAY_STATUS_LABELS[v] ?? { label: v, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '结果',
      dataIndex: 'betStatus',
      render: (v: AdminGuessParticipantItem['betStatus']) => {
        const label = BET_STATUS_LABELS[v] ?? v;
        const color =
          v === 'won' ? 'success' : v === 'lost' ? 'default' : v === 'cancelled' ? 'error' : 'processing';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '参与时间',
      dataIndex: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Space size={16} wrap>
        <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 20px' }}>
          <Statistic title="参与次数" value={stats.totalBets} />
        </div>
        <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 20px' }}>
          <Statistic title="参与人数" value={stats.totalParticipants} />
        </div>
        <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 20px' }}>
          <Statistic title="总参与额" value={formatAmount(stats.totalAmount)} />
        </div>
      </Space>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={items}
        columns={columns}
        pagination={false}
        locale={{ emptyText: <Empty description="暂无参与记录" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />

      {total > pageSize ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            size="small"
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(p) => setPage(p)}
            showTotal={(t) => `共 ${t} 条`}
          />
        </div>
      ) : null}
    </div>
  );
}

function LogsTab({ detail }: { detail: AdminGuessDetailResult }) {
  return detail.reviewLogs.length > 0 ? (
    <List
      dataSource={detail.reviewLogs}
      renderItem={(item) => (
        <List.Item>
          <div style={{ display: 'grid', gap: 4, width: '100%' }}>
            <Space align="center">
              <Tag>{item.actionLabel}</Tag>
              <Typography.Text>{item.reviewerName || '未知管理员'}</Typography.Text>
              <Typography.Text type="secondary">{formatDateTime(item.createdAt)}</Typography.Text>
            </Space>
            <Typography.Text type="secondary">
              {guessStatusLabel(item.fromStatus)} → {guessStatusLabel(item.toStatus)}
            </Typography.Text>
            {item.note ? <Typography.Text>{item.note}</Typography.Text> : null}
          </div>
        </List.Item>
      )}
    />
  ) : (
    <Empty description="暂无审核记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );
}

function OracleTab({ detail }: { detail: AdminGuessDetailResult }) {
  return detail.oracleEvidence.length > 0 ? (
    <List
      dataSource={detail.oracleEvidence}
      renderItem={(item) => (
        <List.Item>
          <div style={{ display: 'grid', gap: 6, width: '100%' }}>
            <Space align="center">
              <Tag>{item.sourceType}</Tag>
              <Typography.Text type="secondary">{formatDateTime(item.createdAt)}</Typography.Text>
            </Space>
            <Typography.Text>
              匹配结果：{item.matchedIndex == null ? '-' : `选项 ${item.matchedIndex + 1}`}
              {item.confidence != null
                ? ` · 置信度 ${(item.confidence * 100).toFixed(1)}%`
                : ''}
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
  );
}

function CommentsTab({ detail }: { detail: AdminGuessDetailResult }) {
  return detail.comments.length > 0 ? (
    <List
      dataSource={detail.comments}
      renderItem={(item) => (
        <List.Item>
          <div style={{ display: 'grid', gap: 4, width: '100%' }}>
            <Space align="center">
              <Typography.Text strong>{item.authorName}</Typography.Text>
              <Typography.Text type="secondary">{formatDateTime(item.createdAt)}</Typography.Text>
              {item.replyCount > 0 ? <Tag>{item.replyCount} 条回复</Tag> : null}
            </Space>
            <Typography.Text>{item.content}</Typography.Text>
          </div>
        </List.Item>
      )}
    />
  ) : (
    <Empty description="暂无评论" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );
}
