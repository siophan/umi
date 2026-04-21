import type { AdminCouponGrantBatchItem, AdminCouponTemplateItem } from '@umi/shared';
import { Descriptions, Drawer, Tag, Typography } from 'antd';

import { couponStatusColor, grantStatusColor } from '../lib/admin-coupon';
import { formatAmount, formatDateTime, formatNumber } from '../lib/format';

interface AdminCouponDetailDrawerProps {
  open: boolean;
  coupon: AdminCouponTemplateItem | null;
  batches: AdminCouponGrantBatchItem[];
  batchLoading: boolean;
  onClose: () => void;
}

export function AdminCouponDetailDrawer({
  open,
  coupon,
  batches,
  batchLoading,
  onClose,
}: AdminCouponDetailDrawerProps) {
  return (
    <Drawer open={open} title="优惠券详情" width={560} onClose={onClose}>
      {coupon ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="优惠券名称">{coupon.name}</Descriptions.Item>
            <Descriptions.Item label="优惠券编码">{coupon.code}</Descriptions.Item>
            <Descriptions.Item label="券类型">{coupon.typeLabel}</Descriptions.Item>
            <Descriptions.Item label="适用范围">
              {coupon.scopeType === 'shop'
                ? coupon.shopName
                  ? `${coupon.scopeTypeLabel} · ${coupon.shopName}`
                  : `${coupon.scopeTypeLabel} · 店铺ID ${coupon.shopId ?? '-'}`
                : coupon.scopeTypeLabel}
            </Descriptions.Item>
            {coupon.scopeType === 'shop' ? (
              <Descriptions.Item label="指定店铺 ID">{coupon.shopId ?? '-'}</Descriptions.Item>
            ) : null}
            <Descriptions.Item label="来源">{coupon.sourceTypeLabel}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={couponStatusColor(coupon.status)}>{coupon.statusLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="使用门槛">{formatAmount(coupon.minAmount)}</Descriptions.Item>
            {coupon.type === 'discount' ? (
              <>
                <Descriptions.Item label="折扣率">
                  {coupon.discountRate == null ? '-' : `${coupon.discountRate} 折`}
                </Descriptions.Item>
                <Descriptions.Item label="最高优惠">
                  {formatAmount(coupon.maxDiscountAmount)}
                </Descriptions.Item>
              </>
            ) : (
              <Descriptions.Item label={coupon.type === 'shipping' ? '减免金额' : '优惠金额'}>
                {formatAmount(coupon.discountAmount)}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="有效期">
              {coupon.validityType === 'fixed'
                ? `${formatDateTime(coupon.startAt)} ~ ${formatDateTime(coupon.endAt)}`
                : `领取后 ${coupon.validDays} 天`}
            </Descriptions.Item>
            <Descriptions.Item label="发放总量">
              {coupon.totalQuantity < 0 ? '不限' : formatNumber(coupon.totalQuantity)}
            </Descriptions.Item>
            <Descriptions.Item label="每人限领">{formatNumber(coupon.userLimit)}</Descriptions.Item>
            <Descriptions.Item label="已发放">{formatNumber(coupon.grantedCount)}</Descriptions.Item>
            <Descriptions.Item label="剩余数量">
              {coupon.remainingQuantity == null ? '不限' : formatNumber(coupon.remainingQuantity)}
            </Descriptions.Item>
            <Descriptions.Item label="说明">{coupon.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(coupon.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(coupon.updatedAt)}</Descriptions.Item>
          </Descriptions>

          <div style={{ display: 'grid', gap: 12 }}>
            <Typography.Text strong>最近发券批次</Typography.Text>
            {batchLoading ? (
              <Typography.Text type="secondary">发券批次加载中...</Typography.Text>
            ) : batches.length === 0 ? (
              <Typography.Text type="secondary">暂无发券批次</Typography.Text>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    style={{
                      border: '1px solid #f1f5f9',
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Typography.Text strong>{batch.batchNo}</Typography.Text>
                      <Tag color={grantStatusColor(batch.status)}>{batch.statusLabel}</Tag>
                    </div>
                    <Typography.Text style={{ display: 'block' }} type="secondary">
                      目标用户 {formatNumber(batch.targetUserCount)} / 实发 {formatNumber(batch.grantedCount)}
                    </Typography.Text>
                    <Typography.Text style={{ display: 'block' }} type="secondary">
                      发起人 {batch.operatorName || '-'} · {formatDateTime(batch.createdAt)}
                    </Typography.Text>
                    <Typography.Text style={{ display: 'block' }} type="secondary">
                      备注 {batch.note || '-'}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
