import WxPay from 'wechatpay-node-v3';

import { HttpError } from '../../lib/errors';
import { loadWechatPaySettings } from '../admin/system-payment-settings';
import {
  type CreatePayOrderInput,
  type CreatePayOrderResult,
  type QueryPayOrderResult,
  type RefundOrderInput,
  type RefundOrderResult,
} from './payment-shared';

async function getWxClient(): Promise<{
  client: WxPay;
  notifyUrl: string;
  appid: string;
}> {
  const settings = await loadWechatPaySettings();
  if (!settings) {
    throw new HttpError(503, 'PAY_WECHAT_NOT_CONFIGURED', '微信支付未在管理后台配置');
  }
  const client = new WxPay({
    appid: settings.appid,
    mchid: settings.mchid,
    publicKey: Buffer.from(settings.platformCert),
    privateKey: Buffer.from(settings.apiClientPrivateKey),
    serial_no: settings.certSerialNo,
    key: settings.apiV3Key,
  });
  return { client, notifyUrl: settings.notifyUrl, appid: settings.appid };
}

type WxOutput = { status: number; error?: unknown; data?: Record<string, unknown> };

export async function createWechatH5Order(
  input: CreatePayOrderInput,
): Promise<CreatePayOrderResult> {
  const { client, notifyUrl } = await getWxClient();
  const expiresAt = new Date(Date.now() + input.expiresInSec * 1000);

  const result = (await client.transactions_h5({
    description: input.subject,
    out_trade_no: input.payNo,
    notify_url: notifyUrl,
    amount: { total: input.amountCents, currency: 'CNY' },
    scene_info: {
      payer_client_ip: input.clientIp,
      h5_info: { type: 'Wap', app_name: 'Joy Umi' },
    },
    time_expire: expiresAt.toISOString(),
  })) as WxOutput;

  if (result.status !== 200) {
    throw new HttpError(503, 'PAY_GATEWAY_UNAVAILABLE', '微信支付下单失败');
  }
  const h5Url = result.data?.h5_url as string | undefined;
  if (!h5Url) {
    throw new HttpError(503, 'PAY_GATEWAY_UNAVAILABLE', '微信支付下单返回缺少 h5_url');
  }
  return { payUrl: h5Url, expiresAt };
}

export async function queryWechatOrder(payNo: string): Promise<QueryPayOrderResult> {
  const { client } = await getWxClient();
  const result = (await client.query({ out_trade_no: payNo })) as WxOutput;
  if (result.status !== 200 || !result.data) {
    return { status: 'failed', tradeNo: null, paidAt: null };
  }
  const data = result.data as {
    trade_state?: string;
    transaction_id?: string;
    success_time?: string;
  };
  switch (data.trade_state) {
    case 'SUCCESS':
      return {
        status: 'paid',
        tradeNo: data.transaction_id ?? null,
        paidAt: data.success_time ? new Date(data.success_time) : new Date(),
      };
    case 'NOTPAY':
    case 'USERPAYING':
      return { status: 'waiting', tradeNo: null, paidAt: null };
    case 'CLOSED':
    case 'REVOKED':
      return { status: 'closed', tradeNo: null, paidAt: null };
    case 'PAYERROR':
    default:
      return { status: 'failed', tradeNo: null, paidAt: null };
  }
}

export async function closeWechatOrder(payNo: string): Promise<void> {
  try {
    const { client } = await getWxClient();
    await client.close(payNo);
  } catch {
    // best-effort
  }
}

export async function refundWechatOrder(input: RefundOrderInput): Promise<RefundOrderResult> {
  const { client } = await getWxClient();
  const result = (await client.refunds({
    out_trade_no: input.payNo,
    out_refund_no: input.refundNo,
    reason: input.reason ?? '原路退款',
    amount: {
      total: input.totalCents,
      currency: 'CNY',
      refund: input.refundCents,
    },
  })) as WxOutput;

  if (result.status !== 200 || !result.data) {
    throw new HttpError(503, 'PAY_REFUND_FAILED', '微信退款发起失败');
  }
  const data = result.data as { refund_id?: string; status?: string };
  return { gatewayRefundNo: data.refund_id ?? null };
}

export type WechatVerifiedNotify = {
  payNo: string;
  tradeNo: string;
  paidAt: Date;
};

/**
 * 验证 WeChat v3 异步通知。失败返回 null, 调用方应回 401。
 */
export async function verifyWechatNotify(
  rawBody: string,
  headers: Record<string, string>,
): Promise<WechatVerifiedNotify | null> {
  try {
    const { client } = await getWxClient();
    const signature = headers['wechatpay-signature'];
    const serial = headers['wechatpay-serial'];
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    if (!signature || !serial || !timestamp || !nonce) return null;

    const verified = await client.verifySign({
      timestamp,
      nonce,
      body: rawBody,
      serial,
      signature,
    });
    if (!verified) return null;

    const envelope = JSON.parse(rawBody) as {
      resource?: {
        ciphertext: string;
        associated_data?: string;
        nonce: string;
      };
    };
    if (!envelope.resource) return null;

    const decrypted = client.decipher_gcm<Record<string, string>>(
      envelope.resource.ciphertext,
      envelope.resource.associated_data ?? '',
      envelope.resource.nonce,
    );

    if (decrypted.trade_state !== 'SUCCESS') return null;

    return {
      payNo: decrypted.out_trade_no,
      tradeNo: decrypted.transaction_id,
      paidAt: decrypted.success_time ? new Date(decrypted.success_time) : new Date(),
    };
  } catch {
    return null;
  }
}
