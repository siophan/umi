import { HttpError } from '../../lib/errors';
import {
  closeAlipayOrder,
  createAlipayWapOrder,
  queryAlipayOrder,
  refundAlipayOrder,
  verifyAlipayNotify,
  type AlipayVerifiedNotify,
} from './payment-alipay';
import {
  closeWechatOrder,
  createWechatH5Order,
  queryWechatOrder,
  refundWechatOrder,
  verifyWechatNotify,
  type WechatVerifiedNotify,
} from './payment-wechat';
import {
  type CreatePayOrderInput,
  type CreatePayOrderResult,
  type PayChannelKey,
  type QueryPayOrderResult,
  type RefundOrderInput,
  type RefundOrderResult,
} from './payment-shared';

export async function createPayOrder(
  channel: PayChannelKey,
  input: CreatePayOrderInput,
): Promise<CreatePayOrderResult> {
  if (channel === 'wechat') return createWechatH5Order(input);
  if (channel === 'alipay') return createAlipayWapOrder(input);
  throw new HttpError(400, 'PAY_CHANNEL_INVALID', '不支持的支付渠道');
}

export async function queryPayOrder(
  channel: PayChannelKey,
  payNo: string,
): Promise<QueryPayOrderResult> {
  if (channel === 'wechat') return queryWechatOrder(payNo);
  if (channel === 'alipay') return queryAlipayOrder(payNo);
  throw new HttpError(400, 'PAY_CHANNEL_INVALID', '不支持的支付渠道');
}

export async function closePayOrder(channel: PayChannelKey, payNo: string): Promise<void> {
  if (channel === 'wechat') return closeWechatOrder(payNo);
  if (channel === 'alipay') return closeAlipayOrder(payNo);
}

export async function refundPayOrder(
  channel: PayChannelKey,
  input: RefundOrderInput,
): Promise<RefundOrderResult> {
  if (channel === 'wechat') return refundWechatOrder(input);
  if (channel === 'alipay') return refundAlipayOrder(input);
  throw new HttpError(400, 'PAY_CHANNEL_INVALID', '不支持的支付渠道');
}

export {
  verifyAlipayNotify,
  verifyWechatNotify,
  type AlipayVerifiedNotify,
  type WechatVerifiedNotify,
};
