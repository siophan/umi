export const PAY_CHANNEL_WECHAT = 10;
export const PAY_CHANNEL_ALIPAY = 20;

export const PAY_STATUS_WAITING = 10;
export const PAY_STATUS_PAID = 20;
export const PAY_STATUS_FAILED = 30;
export const PAY_STATUS_CLOSED = 40;
export const PAY_STATUS_REFUNDED = 50;

export type PayChannelKey = 'wechat' | 'alipay';

export function payChannelKeyToCode(key: PayChannelKey): number {
  return key === 'wechat' ? PAY_CHANNEL_WECHAT : PAY_CHANNEL_ALIPAY;
}

export function payChannelCodeToKey(code: number | string | null): PayChannelKey | null {
  const value = Number(code ?? 0);
  if (value === PAY_CHANNEL_WECHAT) return 'wechat';
  if (value === PAY_CHANNEL_ALIPAY) return 'alipay';
  return null;
}

export type CreatePayOrderInput = {
  payNo: string;
  amountCents: number;
  subject: string;
  /** 一般留空, payment-wechat / payment-alipay 内部以 admin loadXxxSettings 配置为准。 */
  returnUrl?: string;
  clientIp: string;
  expiresInSec: number;
};

export type CreatePayOrderResult = {
  payUrl: string;
  expiresAt: Date;
};

export type GatewayQueryStatus = 'paid' | 'waiting' | 'failed' | 'closed';

export type QueryPayOrderResult = {
  status: GatewayQueryStatus;
  tradeNo: string | null;
  paidAt: Date | null;
};

export const PAY_NO_PREFIX_BET = 'GB';
export const PAY_NO_PREFIX_ORDER = 'OR';
export type PayNoPrefix = typeof PAY_NO_PREFIX_BET | typeof PAY_NO_PREFIX_ORDER;

/**
 * Generates an out_trade_no: {prefix}{yyyyMMddHHmmss}{6 random}{ref last 6}.
 * 前缀用来在支付回调路由里反查到底是竞猜 bet 还是商城 order。
 */
export function generatePayNo(refIdLast6: string, prefix: PayNoPrefix = PAY_NO_PREFIX_BET): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${yyyy}${mm}${dd}${hh}${mi}${ss}${rand}${refIdLast6.padStart(6, '0')}`;
}
