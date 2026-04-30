import {
  Avatar,
  Button,
  ConfigProvider,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import { SEARCH_THEME } from './admin-list-controls';
import type { AdminConsignRow } from '../lib/api/orders';
import { cancelAdminConsign, fetchAdminConsignDetail } from '../lib/api/orders';
import { formatDateTime, formatYuanAmount } from '../lib/format';

interface WarehouseConsignDetailDrawerProps {
  consignId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

const CONSIGN_LISTED = 10;
const CONSIGN_TRADED = 20;
const CONSIGN_CANCELED = 30;

function getSettlementLabel(record: AdminConsignRow) {
  if (record.statusCode === CONSIGN_CANCELED) return '-';
  if (record.statusCode !== CONSIGN_TRADED) return '-';
  return record.settledAt ? '已结算' : '待结算';
}

function formatCommissionRate(rate: number | null) {
  if (rate == null) return '-';
  return `${rate.toFixed(2)}%`;
}

export function WarehouseConsignDetailDrawer({
  consignId,
  onClose,
  onRefresh,
}: WarehouseConsignDetailDrawerProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [reasonForm] = Form.useForm<{ reason: string }>();
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<AdminConsignRow | null>(null);
  const [actionSeed, setActionSeed] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!consignId) {
      setRecord(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setRecord(null);

    fetchAdminConsignDetail(consignId)
      .then((result) => {
        if (alive) setRecord(result);
      })
      .catch((error: unknown) => {
        if (alive) messageApi.error(error instanceof Error ? error.message : '寄售详情加载失败');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [consignId, actionSeed, messageApi]);

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
      onRefresh();
    } catch (error) {
      if (error instanceof Error) messageApi.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const footer = record && record.statusCode === CONSIGN_LISTED ? (
    <Space>
      <Button danger onClick={openCancel}>
        强制下架
      </Button>
    </Space>
  ) : null;

  return (
    <>
      {contextHolder}
      <Drawer
        open={consignId != null}
        onClose={onClose}
        width={720}
        title="寄售详情"
        footer={footer}
        footerStyle={{ padding: '12px 24px' }}
        destroyOnClose
      >
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
            <Spin size="large" />
          </div>
        ) : !record ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 14px',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: '#fafafa',
                alignItems: 'center',
              }}
            >
              <Avatar
                shape="square"
                size={72}
                src={record.productImg ?? undefined}
                style={{ flexShrink: 0, background: '#e8e8e8', borderRadius: 6, fontSize: 20 }}
              >
                {record.productName?.[0] ?? '?'}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  交易单号 {record.tradeNo || record.id}
                </Typography.Text>
                <div>
                  <Typography.Text strong style={{ fontSize: 14 }}>
                    {record.productName}
                  </Typography.Text>
                </div>
                <Space size={16} style={{ marginTop: 4 }}>
                  <span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>挂单价 </Typography.Text>
                    <Typography.Text style={{ fontWeight: 600 }}>
                      {record.listingPrice ? formatYuanAmount(record.listingPrice) : '-'}
                    </Typography.Text>
                  </span>
                  <span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>成交价 </Typography.Text>
                    <Typography.Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
                      {formatYuanAmount(record.price)}
                    </Typography.Text>
                  </span>
                  <span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>佣金率 </Typography.Text>
                    <Typography.Text style={{ fontWeight: 600 }}>
                      {formatCommissionRate(record.commissionRate)}
                    </Typography.Text>
                  </span>
                </Space>
              </div>
            </div>

            <Descriptions bordered column={2} size="small">
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
              <Descriptions.Item label="佣金">{formatYuanAmount(record.commissionAmount)}</Descriptions.Item>
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
              <Descriptions.Item label="创建时间" span={2}>
                {formatDateTime(record.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

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
          {record ? (
            <Typography.Paragraph>
              <Typography.Text strong>{record.productName}</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                交易单号 {record.tradeNo || record.id}
              </Typography.Text>
            </Typography.Paragraph>
          ) : null}
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
    </>
  );
}
