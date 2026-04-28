import express, { Router } from 'express';
import type { Request, Response, Router as ExpressRouter } from 'express';

import { asyncHandler } from '../../lib/errors';
import { appLogger } from '../../lib/logger';
import { markBetPaid } from '../guess/guess-pay';
import { verifyAlipayNotify, verifyWechatNotify } from './payment-service';

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
    appLogger.info(
      { payNo: verified.payNo, tradeNo: verified.tradeNo },
      '[pay/notify/wechat] verified',
    );
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
      appLogger.warn({ outTradeNo: form?.out_trade_no }, '[pay/notify/alipay] verify failed');
      response.status(200).type('text').send('failure');
      return;
    }
    appLogger.info(
      { payNo: verified.payNo, tradeNo: verified.tradeNo },
      '[pay/notify/alipay] verified',
    );
    await markBetPaid(verified.payNo, verified.tradeNo, verified.paidAt);
    response.status(200).type('text').send('success');
  }),
);
