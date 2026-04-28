import { AlipaySdk } from 'alipay-sdk';

import { HttpError } from '../../lib/errors';
import { loadAlipaySettings } from '../admin/system-payment-settings';
import {
  type CreatePayOrderInput,
  type CreatePayOrderResult,
  type QueryPayOrderResult,
} from './payment-shared';

async function getAliClient(): Promise<{
  client: AlipaySdk;
  notifyUrl: string;
  returnUrl: string;
}> {
  const settings = await loadAlipaySettings();
  if (!settings) {
    throw new HttpError(503, 'PAY_ALIPAY_NOT_CONFIGURED', '支付宝未在管理后台配置');
  }
  const client = new AlipaySdk({
    appId: settings.appId,
    privateKey: settings.appPrivateKey,
    appCertContent: settings.appPublicCert,
    alipayPublicCertContent: settings.alipayPublicCert,
    alipayRootCertContent: settings.alipayRootCert,
    signType: 'RSA2',
  });
  return { client, notifyUrl: settings.notifyUrl, returnUrl: settings.returnUrl };
}

function formatAlipayDateTime(date: Date): string {
  // Alipay 'yyyy-MM-dd HH:mm:ss' (北京时间). 假设服务器在 +08; 否则需调整为 toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export async function createAlipayWapOrder(
  input: CreatePayOrderInput,
): Promise<CreatePayOrderResult> {
  const { client, notifyUrl, returnUrl: defaultReturnUrl } = await getAliClient();
  const expiresAt = new Date(Date.now() + input.expiresInSec * 1000);

  // pageExec 是同步方法, 返回 URL 字符串
  const payUrl = client.pageExec('alipay.trade.wap.pay', 'GET', {
    bizContent: {
      out_trade_no: input.payNo,
      total_amount: (input.amountCents / 100).toFixed(2),
      subject: input.subject,
      product_code: 'QUICK_WAP_WAY',
      time_expire: formatAlipayDateTime(expiresAt),
    },
    notify_url: notifyUrl,
    return_url: input.returnUrl ?? defaultReturnUrl,
  });

  if (typeof payUrl !== 'string' || !payUrl.startsWith('http')) {
    throw new HttpError(503, 'PAY_GATEWAY_UNAVAILABLE', '支付宝下单失败');
  }
  return { payUrl, expiresAt };
}

export async function queryAlipayOrder(payNo: string): Promise<QueryPayOrderResult> {
  const { client } = await getAliClient();
  // alipay-sdk 默认 camelcase=true, 返回字段是驼峰
  const result = (await client.exec('alipay.trade.query', {
    bizContent: { out_trade_no: payNo },
  })) as {
    code: string;
    tradeStatus?: string;
    tradeNo?: string;
    sendPayDate?: string;
  };
  if (result.code !== '10000') {
    return { status: 'failed', tradeNo: null, paidAt: null };
  }
  switch (result.tradeStatus) {
    case 'TRADE_SUCCESS':
    case 'TRADE_FINISHED':
      return {
        status: 'paid',
        tradeNo: result.tradeNo ?? null,
        paidAt: result.sendPayDate ? new Date(result.sendPayDate) : new Date(),
      };
    case 'WAIT_BUYER_PAY':
      return { status: 'waiting', tradeNo: null, paidAt: null };
    case 'TRADE_CLOSED':
      return { status: 'closed', tradeNo: null, paidAt: null };
    default:
      return { status: 'failed', tradeNo: null, paidAt: null };
  }
}

export async function closeAlipayOrder(payNo: string): Promise<void> {
  try {
    const { client } = await getAliClient();
    await client.exec('alipay.trade.close', { bizContent: { out_trade_no: payNo } });
  } catch {
    // best-effort
  }
}

export type AlipayVerifiedNotify = {
  payNo: string;
  tradeNo: string;
  paidAt: Date;
};

/**
 * 验证支付宝异步通知。失败返回 null, 调用方应回 'failure' 文本。
 *
 * @param form 原始 form-urlencoded 表单字段（snake_case）
 */
export async function verifyAlipayNotify(
  form: Record<string, string>,
): Promise<AlipayVerifiedNotify | null> {
  try {
    const { client } = await getAliClient();
    const ok = client.checkNotifySignV2(form);
    if (!ok) return null;
    if (form.trade_status !== 'TRADE_SUCCESS' && form.trade_status !== 'TRADE_FINISHED') {
      return null;
    }
    return {
      payNo: form.out_trade_no,
      tradeNo: form.trade_no,
      paidAt: form.gmt_payment ? new Date(form.gmt_payment) : new Date(),
    };
  } catch {
    return null;
  }
}
