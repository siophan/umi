# 竞猜参与对接真实支付 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/guess/[id]` 的"参与竞猜"从 stub 改成真实微信 H5 / 支付宝 WAP 支付，复用 admin `payment_settings` 配置。

**Architecture:** 新增 `apps/api/src/modules/payment/` 通用支付服务模块（wechatpay-node-v3 + alipay-sdk 包装），`guess-pay.ts` 桥接 bet 跟支付，前端 bet 弹层加渠道选择 → 跳网关 → 回跳 + 轮询确认。回调 + 主动查询双保险解决 dev 无公网回调问题。

**Tech Stack:** TypeScript, Express, mysql2, wechatpay-node-v3, alipay-sdk, Next.js 15

**Spec:** `docs/superpowers/specs/2026-04-28-guess-payment-design.md`

**Pre-condition:** SQL `packages/db/sql/guess_bet_payment.sql` 已执行（DROP unique key + 加 5 字段 + 加 2 索引）

**Testing approach:** 此 monorepo `apps/api`/`apps/web` 没有单元测试 runner（package.json `"test": "echo \"... pending\""`），用 `pnpm typecheck` + dev 启动 + curl 烟测 + 浏览器手动 e2e 替代 TDD。每个 task 末尾验证编译通过 + 必要的 curl smoke。

---

## File Structure

**新增（11 个文件）：**
- `apps/api/src/modules/payment/payment-shared.ts` — 类型 + 常量
- `apps/api/src/modules/payment/payment-wechat.ts` — wechat 包装
- `apps/api/src/modules/payment/payment-alipay.ts` — alipay 包装
- `apps/api/src/modules/payment/payment-service.ts` — 渠道分派
- `apps/api/src/modules/payment/router.ts` — 回调端点路由
- `apps/api/src/modules/guess/guess-pay.ts` — bet × payment 桥接

**修改（10 个文件）：**
- `apps/api/package.json` — 加 wechatpay-node-v3 + alipay-sdk
- `apps/api/src/app.ts` — 挂 payment 路由
- `apps/api/src/modules/guess/guess-shared.ts` — 加常量 + voteRows 过滤
- `apps/api/src/modules/guess/guess-read.ts` — totalOrders + userBet 过滤
- `apps/api/src/modules/guess/guess-write.ts` — 删旧 participateInGuess（移到 guess-pay.ts）
- `apps/api/src/modules/guess/router.ts` — participate 切实现 + 新端点
- `packages/shared/src/api-user-commerce.ts` — 类型扩展
- `apps/web/src/lib/api/guesses.ts` — 客户端 API
- `apps/web/src/app/guess/[id]/guess-detail-overlays.tsx` — 渠道选择
- `apps/web/src/app/guess/[id]/page.tsx` — 跳支付 + 回跳轮询
- `apps/web/src/app/guess/[id]/page.module.css` — 确认 overlay 样式

---

### Task 1: 装 SDK + 写 payment 模块基础类型

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/modules/payment/payment-shared.ts`

- [ ] **Step 1: 装 SDK**

```bash
pnpm --filter @umi/api add wechatpay-node-v3 alipay-sdk
```

- [ ] **Step 2: 创建 `payment-shared.ts`**

```ts
// apps/api/src/modules/payment/payment-shared.ts

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

/** Generates an out_trade_no: GB{yyyyMMddHHmmss}{6 random}{betId last 6}. */
export function generatePayNo(betIdLast6: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GB${yyyy}${mm}${dd}${hh}${mi}${ss}${rand}${betIdLast6.padStart(6, '0')}`;
}
```

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @umi/api typecheck
```

Expected: 无 error。

- [ ] **Step 4: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml apps/api/src/modules/payment/payment-shared.ts
git commit -m "feat(api): scaffold payment module with shared types and SDK deps

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 实现 payment-wechat.ts

**Files:**
- Create: `apps/api/src/modules/payment/payment-wechat.ts`

- [ ] **Step 1: 创建文件**

```ts
// apps/api/src/modules/payment/payment-wechat.ts

import WxPay from 'wechatpay-node-v3';

import { HttpError } from '../../lib/errors';
import { loadWechatPaySettings } from '../admin/system-payment-settings';
import {
  type CreatePayOrderInput,
  type CreatePayOrderResult,
  type QueryPayOrderResult,
} from './payment-shared';

async function getWxClient(): Promise<{ client: WxPay; notifyUrl: string }> {
  const settings = await loadWechatPaySettings();
  if (!settings) {
    throw new HttpError(503, 'PAY_WECHAT_NOT_CONFIGURED', '微信支付未在管理后台配置');
  }
  // wechatpay-node-v3 内部不持久化 socket, 每次实例化代价低, 这里不缓存以确保 admin 改配置即生效
  const client = new WxPay({
    appid: settings.mchid, // H5 支付不强制要求 appid; 占位
    mchid: settings.mchid,
    publicKey: Buffer.from(settings.platformCert),
    privateKey: Buffer.from(settings.apiClientPrivateKey),
    serial_no: settings.certSerialNo,
    key: settings.apiV3Key,
  });
  return { client, notifyUrl: settings.notifyUrl };
}

export async function createWechatH5Order(
  input: CreatePayOrderInput,
): Promise<CreatePayOrderResult> {
  const { client, notifyUrl } = await getWxClient();
  const expiresAt = new Date(Date.now() + input.expiresInSec * 1000);

  // wechatpay-node-v3 transactions_h5 的参数 schema (摘自官方 README)
  const result = await client.transactions_h5({
    description: input.subject,
    out_trade_no: input.payNo,
    notify_url: notifyUrl,
    amount: { total: input.amountCents, currency: 'CNY' },
    scene_info: {
      payer_client_ip: input.clientIp,
      h5_info: { type: 'Wap' },
    },
    time_expire: expiresAt.toISOString(),
  });

  const h5Url = (result as { data?: { h5_url?: string }; h5_url?: string }).h5_url
    ?? (result as { data?: { h5_url?: string } }).data?.h5_url;
  if (!h5Url) {
    throw new HttpError(503, 'PAY_GATEWAY_UNAVAILABLE', '微信支付下单失败');
  }
  return { payUrl: h5Url, expiresAt };
}

export async function queryWechatOrder(payNo: string): Promise<QueryPayOrderResult> {
  const { client } = await getWxClient();
  const raw = await client.query({ out_trade_no: payNo });
  const data = (raw as { data?: Record<string, string> }).data ?? (raw as Record<string, string>);
  const tradeState = data.trade_state;
  switch (tradeState) {
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
    // best-effort: 已 paid 或 closed 都会抛, 忽略
  }
}

export type WechatVerifiedNotify = {
  payNo: string;
  tradeNo: string;
  paidAt: Date;
};

/**
 * 验证 WeChat v3 异步通知。失败返回 null, 调用方应回 401。
 *
 * @param rawBody 原始 utf-8 请求体（不能被 express.json() 解析过）
 * @param headers Wechatpay-* 头部（lowercase）
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

    // SDK verifySign 校验签名头
    const verified = client.verifySign({
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

    // SDK decipher_gcm 解密
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
```

- [ ] **Step 2: typecheck**

```bash
pnpm --filter @umi/api typecheck
```

Expected: 无 error。如 SDK 类型不严格匹配，对应位置加 `as` 断言。

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/payment/payment-wechat.ts
git commit -m "feat(api): wechat pay h5 order + query + close + notify verify

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 实现 payment-alipay.ts

**Files:**
- Create: `apps/api/src/modules/payment/payment-alipay.ts`

- [ ] **Step 1: 创建文件**

```ts
// apps/api/src/modules/payment/payment-alipay.ts

import AlipaySdk from 'alipay-sdk';

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
  // Alipay 接受 'yyyy-MM-dd HH:mm:ss' (北京时间). 这里直接用本机时间, 假设服务器在 +08
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export async function createAlipayWapOrder(
  input: CreatePayOrderInput,
): Promise<CreatePayOrderResult> {
  const { client, notifyUrl, returnUrl: defaultReturnUrl } = await getAliClient();
  const expiresAt = new Date(Date.now() + input.expiresInSec * 1000);

  const payUrl = await client.pageExec('alipay.trade.wap.pay', {
    method: 'GET',
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
  const result = (await client.exec('alipay.trade.query', {
    bizContent: { out_trade_no: payNo },
  })) as {
    tradeStatus?: string;
    trade_status?: string;
    tradeNo?: string;
    trade_no?: string;
    sendPayDate?: string;
    send_pay_date?: string;
  };
  const tradeStatus = result.tradeStatus ?? result.trade_status;
  const tradeNo = result.tradeNo ?? result.trade_no ?? null;
  const sendPayDate = result.sendPayDate ?? result.send_pay_date;
  switch (tradeStatus) {
    case 'TRADE_SUCCESS':
    case 'TRADE_FINISHED':
      return {
        status: 'paid',
        tradeNo,
        paidAt: sendPayDate ? new Date(sendPayDate) : new Date(),
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
 * 验证支付宝异步通知。失败返回 null, 调用方应返回 'failure' 文本。
 */
export async function verifyAlipayNotify(
  form: Record<string, string>,
): Promise<AlipayVerifiedNotify | null> {
  try {
    const { client } = await getAliClient();
    const ok = client.checkNotifySignV2 ? client.checkNotifySignV2(form) : client.checkNotifySign(form);
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
```

- [ ] **Step 2: typecheck**

```bash
pnpm --filter @umi/api typecheck
```

如 alipay-sdk 类型不严格，对应位置加 `as`。如 `client.checkNotifySignV2` 类型缺失，可加 `(client as unknown as { checkNotifySignV2?: ... })`。

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/payment/payment-alipay.ts
git commit -m "feat(api): alipay wap order + query + close + notify verify

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 实现 payment-service.ts (渠道分派)

**Files:**
- Create: `apps/api/src/modules/payment/payment-service.ts`

- [ ] **Step 1: 创建文件**

```ts
// apps/api/src/modules/payment/payment-service.ts

import { HttpError } from '../../lib/errors';
import {
  closeAlipayOrder,
  createAlipayWapOrder,
  queryAlipayOrder,
  verifyAlipayNotify,
  type AlipayVerifiedNotify,
} from './payment-alipay';
import {
  closeWechatOrder,
  createWechatH5Order,
  queryWechatOrder,
  verifyWechatNotify,
  type WechatVerifiedNotify,
} from './payment-wechat';
import {
  type CreatePayOrderInput,
  type CreatePayOrderResult,
  type PayChannelKey,
  type QueryPayOrderResult,
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

export { verifyWechatNotify, verifyAlipayNotify, type WechatVerifiedNotify, type AlipayVerifiedNotify };
```

- [ ] **Step 2: typecheck**

```bash
pnpm --filter @umi/api typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/payment/payment-service.ts
git commit -m "feat(api): payment service unified channel dispatcher

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: payment/router.ts 回调端点

注意：本任务跨文件 — wechat 回调要 raw body，必须在 `app.ts` 挂全局 `express.json()` **之前**单独挂 raw body 中间件。

**Files:**
- Create: `apps/api/src/modules/payment/router.ts`

- [ ] **Step 1: 创建 router 文件**

```ts
// apps/api/src/modules/payment/router.ts

import express, { Router } from 'express';
import type { Request, Response, Router as ExpressRouter } from 'express';

import { asyncHandler } from '../../lib/errors';
import { appLogger } from '../../lib/logger';
import { markBetPaid } from '../guess/guess-pay';
import {
  verifyAlipayNotify,
  verifyWechatNotify,
} from './payment-service';

export const paymentRouter: ExpressRouter = Router();

// WeChat: 必须用 raw body 验签
paymentRouter.post(
  '/notify/wechat',
  express.raw({ type: 'application/json', limit: '256kb' }),
  asyncHandler(async (request: Request, response: Response) => {
    const rawBody = (request.body as Buffer).toString('utf-8');
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(request.headers)) {
      if (typeof v === 'string') headers[k.toLowerCase()] = v;
    }
    const verified = await verifyWechatNotify(rawBody, headers);
    if (!verified) {
      appLogger.warn({ headers }, '[pay/notify/wechat] verify failed');
      response.status(401).json({ code: 'FAIL', message: 'verify failed' });
      return;
    }
    appLogger.info({ payNo: verified.payNo, tradeNo: verified.tradeNo }, '[pay/notify/wechat] verified');
    await markBetPaid(verified.payNo, verified.tradeNo, verified.paidAt);
    response.status(200).json({ code: 'SUCCESS' });
  }),
);

// Alipay: 表单 form-urlencoded
paymentRouter.post(
  '/notify/alipay',
  express.urlencoded({ extended: false, limit: '256kb' }),
  asyncHandler(async (request: Request, response: Response) => {
    const form = request.body as Record<string, string>;
    const verified = await verifyAlipayNotify(form);
    if (!verified) {
      appLogger.warn({ outTradeNo: form.out_trade_no }, '[pay/notify/alipay] verify failed');
      response.status(200).type('text').send('failure');
      return;
    }
    appLogger.info({ payNo: verified.payNo, tradeNo: verified.tradeNo }, '[pay/notify/alipay] verified');
    await markBetPaid(verified.payNo, verified.tradeNo, verified.paidAt);
    response.status(200).type('text').send('success');
  }),
);
```

- [ ] **Step 2: 挂到 app.ts**

修改 `apps/api/src/app.ts`，在 `app.use(express.json(...))` 之前 import 并挂载：

```ts
// 顶部 import 区
import { paymentRouter } from './modules/payment/router';

// createApp 内, 在 app.use(express.json(...)) 之前:
app.use('/api/pay', paymentRouter);
app.use(express.json({ limit: '16mb' }));
```

⚠️ 顺序很重要：raw body 中间件必须先于 json，否则 wechat 路由收不到 Buffer。

- [ ] **Step 3: typecheck**

注意此时 `markBetPaid` 还没实现，会报 import 错误。先 stub 一个空的 `markBetPaid` 在 guess-pay.ts 让 typecheck 过：

```ts
// apps/api/src/modules/guess/guess-pay.ts (stub for now)
export async function markBetPaid(_payNo: string, _tradeNo: string, _paidAt: Date): Promise<void> {
  throw new Error('markBetPaid not yet implemented');
}
```

```bash
pnpm --filter @umi/api typecheck
```

- [ ] **Step 4: 启动 dev 验证路由挂上**

```bash
pnpm --filter @umi/api dev &
sleep 3
curl -i -X POST http://localhost:4000/api/pay/notify/wechat -H 'Content-Type: application/json' -d '{}'
```

Expected: HTTP 401 + `{"code":"FAIL"}` (验签失败但路由命中)。

```bash
curl -i -X POST http://localhost:4000/api/pay/notify/alipay -d 'foo=bar'
```

Expected: HTTP 200 + `failure`。

杀掉 dev：`pkill -f 'tsx watch'` 或者按 ctrl-c。

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/payment/router.ts apps/api/src/app.ts apps/api/src/modules/guess/guess-pay.ts
git commit -m "feat(api): mount /api/pay/notify endpoints with raw body for wechat

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: shared 类型扩展

**Files:**
- Modify: `packages/shared/src/api-user-commerce.ts:104-113`

- [ ] **Step 1: 改 `ParticipateGuessPayload` / `ParticipateGuessResult` + 加新类型**

替换 `apps/.../api-user-commerce.ts` 第 104-113 行附近：

```ts
export type GuessPayChannel = 'wechat' | 'alipay';

export interface ParticipateGuessPayload {
  choiceIdx: number;
  quantity?: number;
  payChannel: GuessPayChannel;
}

export interface ParticipateGuessResult {
  betId: EntityId;
  guessId: GuessId;
  choiceIdx: number;
  payNo: string;
  payChannel: GuessPayChannel;
  payUrl: string;
  expiresAt: string;
}

export type GuessBetPayStatus = 'waiting' | 'paid' | 'failed' | 'closed';

export interface FetchBetPayStatusResult {
  betId: EntityId;
  payStatus: GuessBetPayStatus;
  paidAt: string | null;
}

export interface CancelBetResult {
  success: true;
  betId: EntityId;
}
```

- [ ] **Step 2: domain.ts 中 `GuessSummary.userBet` 已有，无需改动**

确认 `packages/shared/src/domain.ts` 中 `userBet` 字段类型没受影响（只是新增字段，不动现有）。

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @umi/shared typecheck
pnpm --filter @umi/api typecheck
pnpm --filter @umi/web typecheck
```

会报错：apps/api 的 `participateInGuess` 没传 payChannel；apps/web 的 `participateInGuess(...)` 调用没传 payChannel。这些在后续 task 修复，本 task 仅在 shared 上加类型。**临时处理**：把 payChannel 改成可选字段过 typecheck，下个 task 再改回必选。或者直接进入下一个 task 合并 commit。

为了保持 commit 干净，把 `payChannel` **暂时改成可选**：

```ts
export interface ParticipateGuessPayload {
  choiceIdx: number;
  quantity?: number;
  payChannel?: GuessPayChannel; // Task 12 后改为必选
}
```

```bash
pnpm typecheck
```

Expected：所有 package 通过。

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/api-user-commerce.ts
git commit -m "feat(shared): add pay channel + bet pay status types for guess

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 更新 guess-shared.ts (常量 + voteRows 过滤)

**Files:**
- Modify: `apps/api/src/modules/guess/guess-shared.ts:14-17, 141-160`

- [ ] **Step 1: 在常量段加 BET_WAITING_PAY 和 PAY_STATUS_*** 

修改 `guess-shared.ts` 14-17 行附近的 `BET_PENDING` 等常量：

```ts
export const BET_WAITING_PAY = 5;
export const BET_PENDING = 10;
export const BET_WON = 30;
export const BET_LOST = 40;
export const BET_CANCELED = 90;
```

- [ ] **Step 2: 改 `getGuessVoteRows` 加 paid 过滤**

改 141-160 行的 SQL：

```sql
SELECT
  guess_id,
  choice_idx AS option_index,
  COUNT(*) AS vote_count
FROM guess_bet
WHERE guess_id IN (?) AND pay_status = 20
GROUP BY guess_id, choice_idx
```

具体来说把第 152 行的 `WHERE guess_id IN (?)` 替换成 `WHERE guess_id IN (?) AND pay_status = 20`。

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @umi/api typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/guess/guess-shared.ts
git commit -m "feat(api): add BET_WAITING_PAY constant and filter votes by pay_status=paid

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 更新 guess-read.ts (totalOrders + userBet 过滤)

**Files:**
- Modify: `apps/api/src/modules/guess/guess-read.ts:147-150, 169-172`

- [ ] **Step 1: totalOrders 查询加 pay_status 过滤**

`guess-read.ts:147-150` 的 SQL：

```ts
db.execute<mysql.RowDataPacket[]>(
  'SELECT COUNT(*) AS cnt FROM guess_bet WHERE guess_id = ? AND pay_status = 20',
  [guessId],
),
```

- [ ] **Step 2: userBet 查询加 pay_status 过滤**

`guess-read.ts:169-172`：

```ts
const [betRows] = await db.execute<mysql.RowDataPacket[]>(
  'SELECT id, choice_idx FROM guess_bet WHERE user_id = ? AND guess_id = ? AND pay_status = 20 ORDER BY id DESC LIMIT 1',
  [currentUserId, guessId],
);
```

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @umi/api typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/guess/guess-read.ts
git commit -m "feat(api): filter totalOrders and userBet to paid bets only

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: 实现 guess-pay.ts createGuessBetPayment + markBetPaid

**Files:**
- Modify: `apps/api/src/modules/guess/guess-pay.ts` (覆盖之前的 stub)

- [ ] **Step 1: 写入完整内容**

```ts
// apps/api/src/modules/guess/guess-pay.ts

import type mysql from 'mysql2/promise';

import { toEntityId } from '@umi/shared';
import type { GuessPayChannel, ParticipateGuessResult } from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { appLogger } from '../../lib/logger';
import {
  closePayOrder,
  createPayOrder,
} from '../payment/payment-service';
import {
  generatePayNo,
  payChannelKeyToCode,
  PAY_STATUS_CLOSED,
  PAY_STATUS_FAILED,
  PAY_STATUS_PAID,
  PAY_STATUS_REFUNDED,
  PAY_STATUS_WAITING,
} from '../payment/payment-shared';
import {
  BET_CANCELED,
  BET_PENDING,
  BET_WAITING_PAY,
  GUESS_ACTIVE,
} from './guess-shared';

const PAY_EXPIRES_SEC = 5 * 60; // 5 分钟

type GuessForBetRow = {
  id: number | string;
  status: number | string;
  end_time: Date | string;
  product_id: number | string | null;
  product_price: number | string | null;
};

async function loadGuessForBet(guessId: string): Promise<GuessForBetRow> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `
      SELECT
        g.id,
        g.status,
        g.end_time,
        gp.product_id,
        COALESCE(p.guess_price, p.price) AS product_price,
        p.name AS product_name
      FROM guess g
      LEFT JOIN (
        SELECT guess_id, MIN(product_id) AS product_id
        FROM guess_product
        GROUP BY guess_id
      ) gp ON gp.guess_id = g.id
      LEFT JOIN product p ON p.id = gp.product_id
      WHERE g.id = ?
      LIMIT 1
    `,
    [guessId],
  );
  if (!rows.length) {
    throw new HttpError(404, 'GUESS_NOT_FOUND', '竞猜不存在');
  }
  return rows[0] as GuessForBetRow & { product_name?: string | null };
}

async function ensureGuessOptionExists(guessId: string, choiceIdx: number): Promise<void> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT 1 FROM guess_option WHERE guess_id = ? AND option_index = ? LIMIT 1',
    [guessId, choiceIdx],
  );
  if (!rows.length) {
    throw new HttpError(400, 'GUESS_OPTION_NOT_FOUND', '竞猜选项不存在');
  }
}

async function ensureNoPaidBet(userId: string, guessId: string): Promise<void> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT 1 FROM guess_bet WHERE user_id = ? AND guess_id = ? AND pay_status = ? LIMIT 1',
    [userId, guessId, PAY_STATUS_PAID],
  );
  if (rows.length) {
    throw new HttpError(409, 'GUESS_ALREADY_PARTICIPATED', '你已参与本次竞猜');
  }
}

export async function createGuessBetPayment(
  userId: string,
  guessId: string,
  payload: { choiceIdx: number; quantity?: number; payChannel: GuessPayChannel },
  clientIp: string,
): Promise<ParticipateGuessResult & { payChannel: GuessPayChannel }> {
  const choiceIdx = Number(payload.choiceIdx);
  if (!Number.isFinite(choiceIdx) || choiceIdx < 0) {
    throw new HttpError(400, 'GUESS_CHOICE_INVALID', '请选择竞猜选项');
  }
  if (payload.payChannel !== 'wechat' && payload.payChannel !== 'alipay') {
    throw new HttpError(400, 'PAY_CHANNEL_INVALID', '不支持的支付渠道');
  }
  const quantity = Math.max(1, Math.floor(Number(payload.quantity ?? 1)));

  const guess = await loadGuessForBet(guessId);
  if (Number(guess.status) !== GUESS_ACTIVE) {
    throw new HttpError(400, 'GUESS_NOT_ACTIVE', '竞猜不在进行中');
  }
  if (new Date(guess.end_time).getTime() <= Date.now()) {
    throw new HttpError(400, 'GUESS_ENDED', '竞猜已结束');
  }
  await ensureGuessOptionExists(guessId, choiceIdx);
  await ensureNoPaidBet(userId, guessId);

  const unitPriceCents = Math.round(Number(guess.product_price ?? 0));
  const amountCents = unitPriceCents * quantity;
  if (amountCents <= 0) {
    throw new HttpError(400, 'GUESS_AMOUNT_INVALID', '竞猜押金为 0，无法发起支付');
  }

  const expiresAt = new Date(Date.now() + PAY_EXPIRES_SEC * 1000);

  const db = getDbPool();
  // 1. INSERT bet (waiting). pay_no 占位 (id 还没拿到, 用 NULL), 拿到 id 后立刻 UPDATE pay_no
  const [insertResult] = await db.execute<mysql.ResultSetHeader>(
    `
      INSERT INTO guess_bet (
        user_id, guess_id, choice_idx, amount, product_id, coupon_id,
        status, pay_status, pay_channel, pay_expires_at,
        reward_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [
      userId, guessId, choiceIdx, amountCents, guess.product_id ?? null,
      BET_WAITING_PAY, PAY_STATUS_WAITING, payChannelKeyToCode(payload.payChannel), expiresAt,
    ],
  );
  const betId = String(insertResult.insertId);
  const payNo = generatePayNo(betId.slice(-6));

  await db.execute(
    'UPDATE guess_bet SET pay_no = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
    [payNo, betId],
  );

  // 2. 调网关创建预下单
  try {
    const productName = (guess as { product_name?: string | null }).product_name ?? '竞猜参与押金';
    const result = await createPayOrder(payload.payChannel, {
      payNo,
      amountCents,
      subject: productName.slice(0, 64),
      clientIp,
      expiresInSec: PAY_EXPIRES_SEC,
    });
    return {
      betId: toEntityId(betId),
      guessId: toEntityId(guess.id),
      choiceIdx,
      payNo,
      payChannel: payload.payChannel,
      payUrl: result.payUrl,
      expiresAt: result.expiresAt.toISOString(),
    };
  } catch (error) {
    // 网关失败: bet 标 failed, 抛 503
    await db.execute(
      'UPDATE guess_bet SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
      [PAY_STATUS_FAILED, BET_CANCELED, betId],
    );
    appLogger.error({ err: error, payNo, betId }, '[guess-pay] gateway create failed');
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, 'PAY_GATEWAY_UNAVAILABLE', '支付下单失败，请稍后再试');
  }
}

/**
 * 核心幂等点：
 * 1. SELECT FOR UPDATE 锁 bet
 * 2. 已 paid → return（回调重发安全）
 * 3. 状态不是 waiting → 跳过 + warn
 * 4. 检查 user/guess 已有其他 paid bet → 当前这笔 mark refunded + log（本期不调退款 API）
 * 5. UPDATE bet status=PENDING, pay_status=paid, pay_trade_no, paid_at
 */
export async function markBetPaid(
  payNo: string,
  tradeNo: string,
  paidAt: Date,
): Promise<void> {
  const db = getDbPool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id, user_id, guess_id, pay_status FROM guess_bet WHERE pay_no = ? FOR UPDATE',
      [payNo],
    );
    const bet = rows[0] as
      | { id: number | string; user_id: number | string; guess_id: number | string; pay_status: number | string }
      | undefined;
    if (!bet) {
      appLogger.warn({ payNo }, '[markBetPaid] pay_no not found in guess_bet');
      await connection.rollback();
      return;
    }
    const currentStatus = Number(bet.pay_status);
    if (currentStatus === PAY_STATUS_PAID) {
      // 幂等：已处理过
      await connection.rollback();
      return;
    }
    if (currentStatus !== PAY_STATUS_WAITING) {
      appLogger.warn(
        { payNo, currentStatus },
        '[markBetPaid] bet pay_status not waiting; skipping',
      );
      await connection.rollback();
      return;
    }

    // 检查是否已有其他 paid bet（双付场景）
    const [dupes] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM guess_bet WHERE user_id = ? AND guess_id = ? AND pay_status = ? AND id != ? LIMIT 1',
      [bet.user_id, bet.guess_id, PAY_STATUS_PAID, bet.id],
    );
    if (dupes.length) {
      appLogger.warn(
        { payNo, betId: bet.id, otherBetId: (dupes[0] as { id: number }).id },
        '[markBetPaid] duplicate paid bet detected; marking current as refunded (TODO: trigger refund API)',
      );
      await connection.execute(
        `UPDATE guess_bet SET pay_status = ?, pay_trade_no = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [PAY_STATUS_REFUNDED, tradeNo, paidAt, bet.id],
      );
      await connection.commit();
      return;
    }

    await connection.execute(
      `UPDATE guess_bet
         SET status = ?, pay_status = ?, pay_trade_no = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [BET_PENDING, PAY_STATUS_PAID, tradeNo, paidAt, bet.id],
    );
    await connection.commit();
    appLogger.info({ payNo, betId: bet.id }, '[markBetPaid] paid');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export { PAY_STATUS_WAITING, PAY_STATUS_PAID, PAY_STATUS_FAILED, PAY_STATUS_CLOSED, PAY_STATUS_REFUNDED };
```

- [ ] **Step 2: typecheck**

```bash
pnpm --filter @umi/api typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/guess/guess-pay.ts
git commit -m "feat(api): createGuessBetPayment + markBetPaid with FOR UPDATE idempotency

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: 实现 queryGuessBetPayStatus + cancelGuessBet

**Files:**
- Modify: `apps/api/src/modules/guess/guess-pay.ts`

- [ ] **Step 1: 在 guess-pay.ts 末尾追加**

```ts
import { closePayOrder, queryPayOrder } from '../payment/payment-service';
import { payChannelCodeToKey } from '../payment/payment-shared';
import type { FetchBetPayStatusResult, GuessBetPayStatus } from '@umi/shared';

type BetRowForQuery = {
  id: number | string;
  user_id: number | string;
  pay_no: string | null;
  pay_status: number | string;
  pay_channel: number | string | null;
  pay_expires_at: Date | string | null;
  paid_at: Date | string | null;
};

function mapPayStatusCodeToKey(code: number | string): GuessBetPayStatus {
  const value = Number(code);
  if (value === PAY_STATUS_PAID) return 'paid';
  if (value === PAY_STATUS_FAILED) return 'failed';
  if (value === PAY_STATUS_CLOSED) return 'closed';
  return 'waiting'; // PAY_STATUS_WAITING + REFUNDED 当 waiting 显示给用户没意义；refunded 不会在用户视图出现
}

export async function queryGuessBetPayStatus(
  userId: string,
  betId: string,
): Promise<FetchBetPayStatusResult> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT id, user_id, pay_no, pay_status, pay_channel, pay_expires_at, paid_at FROM guess_bet WHERE id = ? LIMIT 1',
    [betId],
  );
  const bet = rows[0] as BetRowForQuery | undefined;
  if (!bet) {
    throw new HttpError(404, 'BET_NOT_FOUND', '竞猜记录不存在');
  }
  if (String(bet.user_id) !== String(userId)) {
    throw new HttpError(403, 'BET_FORBIDDEN', '无权访问该竞猜记录');
  }

  const currentStatus = Number(bet.pay_status);

  // 1. 已是终态 → 直接返回
  if (currentStatus !== PAY_STATUS_WAITING) {
    return {
      betId: toEntityId(bet.id),
      payStatus: mapPayStatusCodeToKey(currentStatus),
      paidAt: bet.paid_at ? new Date(bet.paid_at).toISOString() : null,
    };
  }

  // 2. 过期 → mark closed
  if (bet.pay_expires_at && new Date(bet.pay_expires_at).getTime() < Date.now()) {
    await db.execute(
      'UPDATE guess_bet SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND pay_status = ?',
      [PAY_STATUS_CLOSED, BET_CANCELED, bet.id, PAY_STATUS_WAITING],
    );
    return {
      betId: toEntityId(bet.id),
      payStatus: 'closed',
      paidAt: null,
    };
  }

  // 3. 主动查询网关
  const channelKey = payChannelCodeToKey(bet.pay_channel);
  if (!channelKey || !bet.pay_no) {
    return {
      betId: toEntityId(bet.id),
      payStatus: 'waiting',
      paidAt: null,
    };
  }

  try {
    const queryResult = await queryPayOrder(channelKey, bet.pay_no);
    if (queryResult.status === 'paid' && queryResult.tradeNo) {
      await markBetPaid(bet.pay_no, queryResult.tradeNo, queryResult.paidAt ?? new Date());
      return {
        betId: toEntityId(bet.id),
        payStatus: 'paid',
        paidAt: (queryResult.paidAt ?? new Date()).toISOString(),
      };
    }
    if (queryResult.status === 'closed') {
      await db.execute(
        'UPDATE guess_bet SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND pay_status = ?',
        [PAY_STATUS_CLOSED, BET_CANCELED, bet.id, PAY_STATUS_WAITING],
      );
      return {
        betId: toEntityId(bet.id),
        payStatus: 'closed',
        paidAt: null,
      };
    }
    if (queryResult.status === 'failed') {
      await db.execute(
        'UPDATE guess_bet SET pay_status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND pay_status = ?',
        [PAY_STATUS_FAILED, bet.id, PAY_STATUS_WAITING],
      );
      return {
        betId: toEntityId(bet.id),
        payStatus: 'failed',
        paidAt: null,
      };
    }
    return {
      betId: toEntityId(bet.id),
      payStatus: 'waiting',
      paidAt: null,
    };
  } catch (error) {
    appLogger.warn({ err: error, betId: bet.id }, '[queryGuessBetPayStatus] gateway query failed');
    return {
      betId: toEntityId(bet.id),
      payStatus: 'waiting',
      paidAt: null,
    };
  }
}

export async function cancelGuessBet(userId: string, betId: string): Promise<{ success: true; betId: string }> {
  const db = getDbPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    'SELECT id, user_id, pay_no, pay_status, pay_channel FROM guess_bet WHERE id = ? LIMIT 1',
    [betId],
  );
  const bet = rows[0] as
    | { id: number | string; user_id: number | string; pay_no: string | null; pay_status: number | string; pay_channel: number | string | null }
    | undefined;
  if (!bet) {
    throw new HttpError(404, 'BET_NOT_FOUND', '竞猜记录不存在');
  }
  if (String(bet.user_id) !== String(userId)) {
    throw new HttpError(403, 'BET_FORBIDDEN', '无权操作该竞猜记录');
  }
  if (Number(bet.pay_status) !== PAY_STATUS_WAITING) {
    throw new HttpError(409, 'BET_NOT_CANCELLABLE', '当前状态不能取消');
  }

  const channelKey = payChannelCodeToKey(bet.pay_channel);
  if (channelKey && bet.pay_no) {
    await closePayOrder(channelKey, bet.pay_no);
  }

  await db.execute(
    'UPDATE guess_bet SET pay_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND pay_status = ?',
    [PAY_STATUS_CLOSED, BET_CANCELED, bet.id, PAY_STATUS_WAITING],
  );
  return { success: true, betId: String(bet.id) };
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm --filter @umi/api typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/guess/guess-pay.ts
git commit -m "feat(api): queryGuessBetPayStatus + cancelGuessBet with gateway fallback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: 改 guess router (participate 切到新实现 + 新端点)

**Files:**
- Modify: `apps/api/src/modules/guess/router.ts`
- Modify: `apps/api/src/modules/guess/guess-write.ts` (删旧 participateInGuess)

- [ ] **Step 1: 删 `guess-write.ts` 的旧 `participateInGuess`**

把 `apps/api/src/modules/guess/guess-write.ts` 里的 `participateInGuess` 函数（约 67-116 行）连同 `loadGuessForBet` / `ensureGuessOptionExists`（22-65 行）整段删掉 — 已迁移到 `guess-pay.ts`。

- [ ] **Step 2: router.ts 改 import 和 participate handler**

把 `apps/api/src/modules/guess/router.ts` 的：

```ts
import {
  addGuessFavorite,
  likeGuessComment,
  participateInGuess,
  postGuessComment,
  removeGuessFavorite,
  unlikeGuessComment,
} from './guess-write';
```

改为：

```ts
import {
  addGuessFavorite,
  likeGuessComment,
  postGuessComment,
  removeGuessFavorite,
  unlikeGuessComment,
} from './guess-write';
import {
  cancelGuessBet,
  createGuessBetPayment,
  queryGuessBetPayStatus,
} from './guess-pay';
```

- [ ] **Step 3: 改 participate handler 体**

`router.ts` 中 `/:id/participate` handler 改为：

```ts
guessRouter.post(
  '/:id/participate',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const clientIp =
      (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      || request.socket.remoteAddress
      || '127.0.0.1';
    ok(
      response,
      await createGuessBetPayment(
        user.id,
        String(request.params.id),
        request.body as ParticipateGuessPayload,
        clientIp,
      ),
    );
  }),
);
```

- [ ] **Step 4: 加新端点（pay-status + cancel）**

在 `/comments/:commentId/like` 注册位置之前（保证不被 `/:id` 通配） 加：

```ts
guessRouter.get(
  '/bets/:betId/pay-status',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await queryGuessBetPayStatus(user.id, String(request.params.betId)));
  }),
);

guessRouter.post(
  '/bets/:betId/cancel',
  requireUser,
  asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await cancelGuessBet(user.id, String(request.params.betId)));
  }),
);
```

- [ ] **Step 5: shared 把 payChannel 改回必选**

回到 `packages/shared/src/api-user-commerce.ts`：

```ts
export interface ParticipateGuessPayload {
  choiceIdx: number;
  quantity?: number;
  payChannel: GuessPayChannel; // 必选
}
```

- [ ] **Step 6: typecheck + 启 dev 验证**

```bash
pnpm --filter @umi/api typecheck
```

可能 web 会报 `participateInGuess` 调用没传 payChannel — 下个 task 修。先单独 api typecheck 通过即可。

```bash
pnpm --filter @umi/api dev &
sleep 3
# 没 token 应该 401
curl -i -X GET http://localhost:4000/api/guesses/bets/999999/pay-status
# 期望: {"success":false,...AUTH_REQUIRED}
pkill -f 'tsx watch'
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/guess/router.ts apps/api/src/modules/guess/guess-write.ts packages/shared/src/api-user-commerce.ts
git commit -m "feat(api): wire guess router to payment-aware participate + pay-status + cancel endpoints

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: web 客户端 API

**Files:**
- Modify: `apps/web/src/lib/api/guesses.ts`

- [ ] **Step 1: import 加新类型**

把顶部 import 改为：

```ts
import type {
  CancelBetResult,
  CreateGuessPayload,
  CreateGuessResult,
  FetchBetPayStatusResult,
  FriendPkResult,
  GuessCategoryListResult,
  GuessCommentListResult,
  GuessCommentSummary,
  GuessHistoryResult,
  GuessListResult,
  GuessSummary,
  ParticipateGuessPayload,
  ParticipateGuessResult,
  PostGuessCommentPayload,
  ToggleGuessFavoriteResult,
} from '@umi/shared';
```

- [ ] **Step 2: 加新方法 + `participateInGuess` 不需要改函数体（参数透传）**

在文件末尾追加：

```ts
export function fetchBetPayStatus(betId: string) {
  return getJson<FetchBetPayStatusResult>(`/api/guesses/bets/${encodeURIComponent(betId)}/pay-status`);
}

export function cancelBetPayment(betId: string) {
  return postJson<CancelBetResult, Record<string, never>>(
    `/api/guesses/bets/${encodeURIComponent(betId)}/cancel`,
    {},
  );
}
```

注意 `participateInGuess` 因为 `ParticipateGuessPayload` 现在要求 `payChannel`，调用方未传会 typecheck 失败 — 下个 task 修复。

- [ ] **Step 3: typecheck（预期 web 报错）**

```bash
pnpm --filter @umi/web typecheck
```

期望：`participateInGuess(...)` 调用处少 payChannel — 下个 task 修。本 task 仅添方法。可以直接进下一个 task 一起 commit，或先单独 commit 这一步：

```bash
git add apps/web/src/lib/api/guesses.ts
git commit -m "feat(web): add fetchBetPayStatus + cancelBetPayment client methods

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: bet 弹层加渠道选择

**Files:**
- Modify: `apps/web/src/app/guess/[id]/guess-detail-overlays.tsx`
- Modify: `apps/web/src/app/guess/[id]/page.module.css` (新增 `payChannelRow`、`payChannelOption`、`payChannelActive`)

- [ ] **Step 1: 加 `payChannel` props 到 `GuessDetailOverlaysProps`**

`guess-detail-overlays.tsx` 顶部加 import：

```ts
import type { GuessPayChannel, GuessOption, GuessSummary } from '@umi/shared';
```

`GuessDetailOverlaysProps` 加：

```ts
payChannel: GuessPayChannel;
onSetPayChannel: (channel: GuessPayChannel) => void;
```

函数签名解构：

```tsx
export function GuessDetailOverlays({
  // ...existing
  payChannel,
  onSetPayChannel,
  // ...
}: GuessDetailOverlaysProps) {
```

- [ ] **Step 2: 在 betSummary 之后、betConfirm 按钮之前插入渠道选择**

在 `<div className={styles.betSummary}>...</div>` 之后、`<button className={styles.betConfirm}>` 之前插入：

```tsx
<div className={styles.payChannelRow}>
  <button
    type="button"
    className={`${styles.payChannelOption} ${payChannel === 'wechat' ? styles.payChannelActive : ''}`}
    onClick={() => onSetPayChannel('wechat')}
  >
    <i className="fa-brands fa-weixin" style={{ color: '#1aad19' }} />
    <span>微信支付</span>
    {payChannel === 'wechat' ? <i className="fa-solid fa-check" /> : null}
  </button>
  <button
    type="button"
    className={`${styles.payChannelOption} ${payChannel === 'alipay' ? styles.payChannelActive : ''}`}
    onClick={() => onSetPayChannel('alipay')}
  >
    <i className="fa-brands fa-alipay" style={{ color: '#1677ff' }} />
    <span>支付宝</span>
    {payChannel === 'alipay' ? <i className="fa-solid fa-check" /> : null}
  </button>
</div>
```

- [ ] **Step 3: 改按钮文案**

```tsx
<button
  className={styles.betConfirm}
  type="button"
  disabled={betSubmitting}
  onClick={onConfirmBet}
>
  {betSubmitting ? '提交中…' : `立即支付 ¥${(unitPrice * betAmount).toFixed(2)}`}
</button>
```

- [ ] **Step 4: page.module.css 加样式**

在 `page.module.css` 末尾追加（依据现有 sheet 风格 — 白底圆角、深色 mask、430px 宽度）：

```css
.payChannelRow {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}
.payChannelOption {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.18s;
}
.payChannelOption i:first-child {
  font-size: 18px;
}
.payChannelOption span {
  flex: 1;
  text-align: left;
}
.payChannelOption i.fa-check {
  color: #ff6b9d;
}
.payChannelActive {
  border-color: #ff6b9d;
  background: #fff5f9;
}
```

- [ ] **Step 5: typecheck**

```bash
pnpm --filter @umi/web typecheck
```

依然会报 page.tsx 调 overlays 没传 payChannel — 下一 task 修。

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/guess/\[id\]/guess-detail-overlays.tsx apps/web/src/app/guess/\[id\]/page.module.css
git commit -m "feat(web): add payment channel selector in bet sheet

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: 详情页跳支付 + ?betId 回跳轮询

**Files:**
- Modify: `apps/web/src/app/guess/[id]/page.tsx`

- [ ] **Step 1: import 调整**

```ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { GuessCommentSummary, GuessOption, GuessPayChannel, GuessSummary } from '@umi/shared';

import {
  cancelBetPayment,
  favoriteGuess,
  fetchBetPayStatus,
  fetchGuess,
  fetchGuessComments,
  likeGuessComment,
  participateInGuess,
  postGuessComment,
  unfavoriteGuess,
  unlikeGuessComment,
} from '../../../lib/api/guesses';
```

- [ ] **Step 2: 加 state**

在现有 state 段加：

```ts
const searchParams = useSearchParams();
const [payChannel, setPayChannel] = useState<GuessPayChannel>('wechat');
const [confirmingPay, setConfirmingPay] = useState(false);
const [payConfirmError, setPayConfirmError] = useState<string | null>(null);
```

- [ ] **Step 3: 改 `handleConfirmParticipate`**

替换原函数：

```ts
async function handleConfirmParticipate() {
  if (!guess || betSubmitting) return;
  if (!hasAuthToken()) {
    router.push('/login');
    return;
  }
  setBetSubmitting(true);
  try {
    const result = await participateInGuess(guess.id, {
      choiceIdx: selectedOption,
      quantity: betAmount,
      payChannel,
    });
    setBetOpen(false);
    // 跳转到第三方支付页
    window.location.href = result.payUrl;
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err?.code === 'GUESS_ALREADY_PARTICIPATED') {
      showToast('你已参与本次竞猜');
      const refreshed = await fetchGuess(guess.id);
      setGuess(refreshed);
      setBetOpen(false);
    } else {
      showToast(err?.message || '支付下单失败');
    }
  } finally {
    setBetSubmitting(false);
  }
}
```

- [ ] **Step 4: 加 ?betId 回跳轮询 effect**

在其他 useEffect 之后加：

```ts
useEffect(() => {
  const betId = searchParams.get('betId');
  if (!betId || !guessId) return undefined;

  setConfirmingPay(true);
  setPayConfirmError(null);

  let cancelled = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 30;
  const POLL_MS = 2000;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function poll() {
    if (cancelled) return;
    attempts += 1;
    try {
      const result = await fetchBetPayStatus(betId);
      if (cancelled) return;

      if (result.payStatus === 'paid') {
        setConfirmingPay(false);
        showToast('参与成功');
        router.replace(`/guess/${guessId}`);
        try {
          const refreshed = await fetchGuess(guessId);
          if (!cancelled) setGuess(refreshed);
        } catch {
          // ignore
        }
        return;
      }

      if (result.payStatus === 'failed' || result.payStatus === 'closed') {
        setConfirmingPay(false);
        setPayConfirmError(
          result.payStatus === 'failed' ? '支付失败，请重试' : '支付已取消',
        );
        router.replace(`/guess/${guessId}`);
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        setConfirmingPay(false);
        setPayConfirmError('支付确认超时，请稍后查看订单');
        router.replace(`/guess/${guessId}`);
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    } catch {
      if (cancelled) return;
      if (attempts >= MAX_ATTEMPTS) {
        setConfirmingPay(false);
        setPayConfirmError('支付状态查询失败');
        router.replace(`/guess/${guessId}`);
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    }
  }

  void poll();
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams.get('betId'), guessId]);
```

- [ ] **Step 5: 把 payChannel/onSetPayChannel 传给 GuessDetailOverlays**

修改 `<GuessDetailOverlays ...>` 调用（约 387-415 行附近）加：

```tsx
payChannel={payChannel}
onSetPayChannel={setPayChannel}
```

- [ ] **Step 6: 渲染确认 overlay 跟 error toast**

在 `return (...)` 内最外层 fragment 末尾、`</main>` 之前加：

```tsx
{confirmingPay ? (
  <div className={styles.payConfirmMask}>
    <div className={styles.payConfirmBox}>
      <div className={styles.payConfirmSpinner} />
      <div className={styles.payConfirmText}>支付确认中…</div>
      <small className={styles.payConfirmSub}>已完成支付请稍候</small>
    </div>
  </div>
) : null}
{payConfirmError ? (
  <div className={styles.payErrorBar}>
    <span>{payConfirmError}</span>
    <button type="button" onClick={() => setPayConfirmError(null)}>
      知道了
    </button>
  </div>
) : null}
```

- [ ] **Step 7: 加对应样式到 page.module.css**

```css
.payConfirmMask {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.payConfirmBox {
  width: min(280px, 80vw);
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}
.payConfirmSpinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f0f0f0;
  border-top-color: #ff6b9d;
  border-radius: 50%;
  animation: payConfirmSpin 0.9s linear infinite;
}
@keyframes payConfirmSpin {
  to { transform: rotate(360deg); }
}
.payConfirmText { font-size: 15px; font-weight: 600; color: #333; }
.payConfirmSub { font-size: 12px; color: #999; }

.payErrorBar {
  position: fixed;
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
  width: min(360px, calc(100vw - 32px));
  z-index: 1101;
  background: #fff5f5;
  border: 1px solid #ffd6d6;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #d32f2f;
}
.payErrorBar button {
  background: transparent;
  border: 1px solid #d32f2f;
  border-radius: 14px;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  color: #d32f2f;
  cursor: pointer;
}
```

- [ ] **Step 8: typecheck**

```bash
pnpm --filter @umi/web typecheck
```

Expected: 全 ok。

- [ ] **Step 9: 启 dev + 浏览器手动 e2e**

```bash
pnpm --filter @umi/web dev &
pnpm --filter @umi/api dev &
```

浏览器：
1. 登录用户访问 `/guess/{活跃竞猜ID}`
2. 点选项 → 弹层
3. 选支付方式 → 点"立即支付 ¥XX"
4. 期望：跳到微信/支付宝支付页（admin 配的是 sandbox 时是 sandbox，否则真实网关）
5. 浏览器返回 `/guess/{id}?betId=xxx` → 显示"支付确认中…"
6. 30 秒内若没付完 → "支付确认超时" 错误条

如果 admin 还没配过 payment_settings，第 4 步会得到 503 toast，符合预期。

杀掉 dev: `pkill -f 'tsx watch'; pkill -f 'next dev'`。

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/app/guess/\[id\]/page.tsx apps/web/src/app/guess/\[id\]/page.module.css
git commit -m "feat(web): redirect to gateway and poll bet pay status on return

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: e2e 烟测 + 文档收尾

**Files:**
- Modify: `CLAUDE.md` (item #15 状态变更注释)

- [ ] **Step 1: 全 monorepo typecheck**

```bash
pnpm typecheck
```

Expected: 全 packages/apps 通过。

- [ ] **Step 2: 烟测路由清单**

启动 api dev：

```bash
pnpm --filter @umi/api dev &
sleep 3
```

未鉴权访问应回 401：

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/guesses/1/participate -H 'Content-Type: application/json' -d '{}'
# 期望 401
curl -s -o /dev/null -w "%{http_code}\n" -X GET http://localhost:4000/api/guesses/bets/1/pay-status
# 期望 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/guesses/bets/1/cancel
# 期望 401
```

回调端点（无 token，靠验签）：

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/pay/notify/wechat -H 'Content-Type: application/json' -d '{}'
# 期望 401（验签失败）
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/pay/notify/alipay -d 'foo=bar'
# 期望 200（alipay 验签失败也回 200 'failure'）
```

- [ ] **Step 3: 杀 dev**

```bash
pkill -f 'tsx watch'
```

- [ ] **Step 4: 更新 CLAUDE.md item #15（如可选）**

在 `CLAUDE.md` 第 15 项前加注释：

```md
## 15. 支付链路整体未完成（P0）

> **更新（2026-04-28）**：竞猜参与已对接真实支付（参见 `docs/superpowers/specs/2026-04-28-guess-payment-design.md`）；商城下单仍是 stub，下次复用 `apps/api/src/modules/payment/` 模块改造。
```

- [ ] **Step 5: 最终 Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark guess payment integration done; shop payment still pending

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Checklist (writer 已对照过 spec)

| Spec 段落 | 实现 task |
|---|---|
| §1 架构总览 | Task 1-14 整体覆盖 |
| §2 数据模型 (DDL) | 已 pre-condition 执行；Task 7/8 用新字段 |
| §3 状态机 + 接口契约 | Task 9-11 |
| §4 后端模块结构 | Task 1-5, 9-10 |
| §5 前端 | Task 12-14 |
| §6 边界处理 | Task 9 (markBetPaid 双付兜底) + Task 10 (过期 lazy close) |

**类型一致性核查**：`participateInGuess` 在 shared (Task 6) → api (Task 9) → web client (Task 12) → page.tsx (Task 14) 各处 `payChannel: GuessPayChannel` 必选；`FetchBetPayStatusResult` 在 shared (Task 6) → guess-pay.ts (Task 10) → web client (Task 12) → page.tsx polling (Task 14) 字段一致。

**Placeholder 扫描**：无 TBD / TODO（仅 `markBetPaid` 双付分支日志写 "TODO: trigger refund API" — 这是设计明确切走的本期不做项，spec 中 §6 已声明）。

**已知风险**：
- `wechatpay-node-v3` 和 `alipay-sdk` 的具体类型签名可能跟示例代码有细微出入；遇到时按编辑器提示加 `as` 断言或调整字段名（status name 大小写、`tradeStatus` vs `trade_status` 等）。
- Alipay `checkNotifySignV2` 在不同 SDK 版本可能不存在；fallback 用 `checkNotifySign`。
- WeChat H5 支付要求 admin 配置 `notify_url` 是 https 公网域名；dev 环境无法收到回调，但主动查询 (Task 10) 兜底。

---

## 后续工作（不在本 plan 内）

- 弃赛退款 API 调用：调 wechat refund + alipay refund，更新 pay_status=50（schema 已留位）
- 商城支付（CLAUDE.md #15）：下次复用 `apps/api/src/modules/payment/` 模块
- payment_settings 修改后已发支付链接的失效处理（低优先级）
- admin 后台 guess 订单流水按 channel 分类显示
