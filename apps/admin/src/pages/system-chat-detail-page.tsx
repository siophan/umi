import { Alert, Button, Descriptions, Result, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { fetchAdminChatDetail, type AdminChatDetailResult } from '../lib/api/system';
import { formatDateTime } from '../lib/format';

interface SystemChatDetailPageProps {
  conversationId: string;
  refreshToken?: number;
}

function riskMeta(level: 'low' | 'medium' | 'high') {
  if (level === 'high') {
    return { color: 'error', label: '高风险' };
  }
  if (level === 'medium') {
    return { color: 'warning', label: '中风险' };
  }
  return { color: 'success', label: '低风险' };
}

function statusLabel(status: 'normal' | 'review' | 'escalated') {
  if (status === 'review') {
    return '复核中';
  }
  if (status === 'escalated') {
    return '升级处理';
  }
  return '正常';
}

export function SystemChatDetailPage({
  conversationId,
  refreshToken = 0,
}: SystemChatDetailPageProps) {
  const [detail, setDetail] = useState<AdminChatDetailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminChatDetail(conversationId);
        if (!alive) {
          return;
        }
        setDetail(result);
      } catch (error) {
        if (!alive) {
          return;
        }
        setDetail(null);
        setIssue(error instanceof Error ? error.message : '聊天详情加载失败');
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
  }, [conversationId, refreshToken]);

  if (loading && !detail && !issue) {
    return (
      <div className="page-stack">
        <Typography.Text type="secondary">聊天详情加载中...</Typography.Text>
      </div>
    );
  }

  if (issue && !detail) {
    return (
      <div className="page-stack">
        <Button href="#/system/chats" style={{ paddingLeft: 0 }} type="link">
          返回聊天管理
        </Button>
        <Alert message={issue} showIcon type="error" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="page-stack">
        <Result status="404" title="聊天会话不存在" />
      </div>
    );
  }

  const { conversation, messages } = detail;
  const userARisk = riskMeta(conversation.userA.riskLevel);
  const userBRisk = riskMeta(conversation.userB.riskLevel);
  const conversationRisk = riskMeta(conversation.riskLevel);

  return (
    <div className="page-stack">
      <Button href="#/system/chats" style={{ paddingLeft: 0 }} type="link">
        返回聊天管理
      </Button>
      {issue ? <Alert message={issue} showIcon type="warning" /> : null}

      <section className="admin-detail-block">
        <div className="admin-detail-block__head">
          <Typography.Title className="admin-detail-block__title" level={5}>
            会话信息
          </Typography.Title>
        </div>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="用户 A">
            <div>
              <div>{conversation.userA.name}</div>
              <Typography.Text type="secondary">
                UID：{conversation.userA.uid || '-'} / 用户 ID：{conversation.userA.id}
              </Typography.Text>
              <div>
                <Tag color={userARisk.color}>{userARisk.label}</Tag>
              </div>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="用户 B">
            <div>
              <div>{conversation.userB.name}</div>
              <Typography.Text type="secondary">
                UID：{conversation.userB.uid || '-'} / 用户 ID：{conversation.userB.id}
              </Typography.Text>
              <div>
                <Tag color={userBRisk.color}>{userBRisk.label}</Tag>
              </div>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="消息数">{conversation.messages}</Descriptions.Item>
          <Descriptions.Item label="未读消息">{conversation.unreadMessages}</Descriptions.Item>
          <Descriptions.Item label="风险等级">
            <Tag color={conversationRisk.color}>{conversationRisk.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">{statusLabel(conversation.status)}</Descriptions.Item>
          <Descriptions.Item label="更新时间" span={2}>
            {formatDateTime(conversation.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </section>

      <section className="admin-detail-block">
        <div className="admin-detail-block__head">
          <Typography.Title className="admin-detail-block__title" level={5}>
            消息时间线
          </Typography.Title>
        </div>
        {messages.length === 0 ? (
          <Typography.Text type="secondary">当前会话暂无消息记录。</Typography.Text>
        ) : (
          <div className="admin-chat-thread">
            {messages.map((message) => (
              <article className="admin-chat-thread__item" key={message.id}>
                <div className="admin-chat-thread__meta">
                  <Typography.Text strong>{message.senderName}</Typography.Text>
                  <Typography.Text type="secondary">
                    发送给 {message.receiverName}
                  </Typography.Text>
                  <Tag color={message.read ? 'default' : 'processing'}>
                    {message.read ? '已读' : '未读'}
                  </Tag>
                  <Typography.Text type="secondary">
                    {formatDateTime(message.createdAt)}
                  </Typography.Text>
                </div>
                <div className="admin-chat-thread__content">{message.content}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
