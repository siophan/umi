import { Alert, Button, ConfigProvider, Descriptions, Form, Input, Modal, Result, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import { SEARCH_THEME } from '../components/admin-list-controls';
import type { AdminConsignRow } from '../lib/api/orders';
import { cancelAdminConsign, fetchAdminConsignDetail } from '../lib/api/orders';
import { formatDateTime, formatYuanAmount } from '../lib/format';

interface WarehouseConsignDetailPageProps {
  consignId: string;
  refreshToken?: number;
}

const CONSIGN_LISTED = 10;
const CONSIGN_TRADED = 20;
const CONSIGN_CANCELED = 30;

function getSettlementLabel(record: AdminConsignRow) {
  if (record.statusCode === CONSIGN_CANCELED) {
    return '-';
  }
  if (record.statusCode !== CONSIGN_TRADED) {
    return '-';
  }
  return record.settledAt ? '已结算' : '待结算';
}

function formatCommissionRate(rate: number | null) {
  if (rate == null) return '-';
  return `${rate.toFixed(2)}%`;
}

export function WarehouseConsignDetailPage({
  consignId,
  refreshToken = 0,
}: WarehouseConsignDetailPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [reasonForm] = Form.useForm<{ reason: string }>();
  const [record, setRecord] = useState<AdminConsignRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadPage() {
      setLoading(true);
      setIssue(null);
      try {
        const result = await fetchAdminConsignDetail(consignId);
        if (!alive) {
          return;
        }
        setRecord(result);
      } catch (error) {
        if (!alive) {
          return;
        }
        setRecord(null);
        setIssue(error instanceof Error ? error.message : '寄售详情加载失败');
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
  }, [actionSeed, consignId, refreshToken]);

  function openCancel() {
    if (!record) return;
    reasonForm.resetFields();
    setCancelOpen(true);
  }

  async function submitCancel() {
    if (!record) return;
    try {
      const values = await reasonForm.validateFields();
      setSubmitting(true);
      await cancelAdminConsign(record.id, values.reason);
      messageApi.success('寄售商品已强制下架');
      setCancelOpen(false);
      setActionSeed((value) => value + 1);
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !record && !issue) {
    return (
      <div className="page-stack">
        <Typography.Text type="secondary">寄售详情加载中...</Typography.Text>
      </div>
    );
  }

  if (issue && !record) {
    return (
      <div className="page-stack">
        <Button href="#/warehouse/consign" style={{ paddingLeft: 0 }} type="link">
          返回寄售市场
        </Button>
        <Alert message={issue} showIcon type="error" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-stack">
        <Result status="404" title="寄售记录不存在" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      {contextHolder}
      <Button href="#/warehouse/consign" style={{ paddingLeft: 0 }} type="link">
        返回寄售市场
      </Button>
      {issue ? <Alert message={issue} showIcon type="warning" /> : null}

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {record.productImg ? (
            <img
              src={record.productImg}
              alt={record.productName}
              style={{ width: 96, height: 96, borderRadius: 8, objectFit: 'cover', border: '1px solid #f0f0f0' }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 8,
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#bfbfbf',
              }}
            >
              无图
            </div>
          )}
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>{record.productName}</Typography.Title>
            <Typography.Text type="secondary">交易单号 {record.tradeNo || record.id}</Typography.Text>
          </div>
        </div>
        {record.statusCode === CONSIGN_LISTED ? (
          <Button danger onClick={openCancel}>
            强制下架
          </Button>
        ) : null}
      </div>

      <Descriptions bordered column={2} size="small" title="寄售信息">
        <Descriptions.Item label="实物仓记录">{record.physicalItemId || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">{record.statusLabel}</Descriptions.Item>
        <Descriptions.Item label="卖家">
          {record.userName || '-'}
          <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            ID {record.userId}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="买家">
          {record.buyerUserId ? (
            <>
              {record.buyerUserName || '-'}
              <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                ID {record.buyerUserId}
              </Typography.Text>
            </>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="订单号">{record.orderSn || record.orderId || '-'}</Descriptions.Item>
        <Descriptions.Item label="来源类型">{record.sourceType}</Descriptions.Item>
        <Descriptions.Item label="挂单价">{record.listingPrice ? formatYuanAmount(record.listingPrice) : '-'}</Descriptions.Item>
        <Descriptions.Item label="成交价">{formatYuanAmount(record.price)}</Descriptions.Item>
        <Descriptions.Item label="佣金">{formatYuanAmount(record.commissionAmount)}</Descriptions.Item>
        <Descriptions.Item label="佣金率">{formatCommissionRate(record.commissionRate)}</Descriptions.Item>
        <Descriptions.Item label="卖家到账">{formatYuanAmount(record.sellerAmount)}</Descriptions.Item>
        <Descriptions.Item label="结算状态">{getSettlementLabel(record)}</Descriptions.Item>
        <Descriptions.Item label="上架时间">{formatDateTime(record.listedAt || record.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="成交时间">{formatDateTime(record.tradedAt)}</Descriptions.Item>
        <Descriptions.Item label="结算时间">{formatDateTime(record.settledAt)}</Descriptions.Item>
        <Descriptions.Item label="取消时间">{formatDateTime(record.canceledAt)}</Descriptions.Item>
        <Descriptions.Item label="取消理由" span={2}>
          {record.cancelReason ? (
            <Typography.Text>{record.cancelReason}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">{formatDateTime(record.createdAt)}</Descriptions.Item>
      </Descriptions>

      <ConfigProvider theme={SEARCH_THEME}>
        <Modal
          title="强制下架寄售商品"
          open={cancelOpen}
          onCancel={() => {
            if (submitting) return;
            setCancelOpen(false);
          }}
          onOk={() => void submitCancel()}
          confirmLoading={submitting}
          okText="确认下架"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
            下架后该寄售改为已取消，商品回到实体仓。请填写下架理由用于追溯。
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>{record.productName}</Typography.Text>
            <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
              交易单号 {record.tradeNo || record.id}
            </Typography.Text>
          </Typography.Paragraph>
          <Form form={reasonForm} layout="vertical" preserve={false}>
            <Form.Item
              name="reason"
              label="下架理由"
              rules={[
                { required: true, message: '请填写下架理由' },
                { max: 255, message: '最多 255 字' },
              ]}
            >
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="例：商品涉嫌违规 / 卖家申请下架 / 价格异常" />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
}
