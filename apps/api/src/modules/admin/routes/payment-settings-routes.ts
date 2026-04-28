import type { Router as ExpressRouter } from 'express';

import type {
  PaymentChannel,
  UpdateAlipayPaymentSettingsPayload,
  UpdateWechatPaymentSettingsPayload,
} from '@umi/shared';

import { asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import { getRequestAdmin } from '../auth';
import {
  getPaymentSettings,
  updatePaymentSettings,
} from '../system-payment-settings';
import { toRouteHttpError } from '../route-helpers';

function parseChannel(raw: string): PaymentChannel {
  if (raw === 'wechat' || raw === 'alipay') return raw;
  throw new Error('未知支付渠道');
}

export function registerAdminPaymentSettingsRoutes(adminRouter: ExpressRouter) {
  adminRouter.get(
    '/payment-settings',
    asyncHandler(async (_request, response) => {
      ok(response, await getPaymentSettings());
    }),
  );

  adminRouter.put(
    '/payment-settings/:channel',
    asyncHandler(async (request, response) => {
      const admin = getRequestAdmin(request);
      try {
        const channel = parseChannel(String(request.params.channel ?? ''));
        const payload = request.body as
          | UpdateWechatPaymentSettingsPayload
          | UpdateAlipayPaymentSettingsPayload;
        ok(
          response,
          await updatePaymentSettings(channel, payload, admin.id),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_PAYMENT_SETTINGS_UPDATE_FAILED',
            message: '保存支付参数失败',
          },
          [
            { message: '未知支付渠道', status: 400, code: 'ADMIN_PAYMENT_SETTINGS_UNKNOWN_CHANNEL' },
            {
              message: 'PAYMENT_SECRET_KEK 未配置（需 32 字节 base64）',
              status: 500,
              code: 'ADMIN_PAYMENT_SETTINGS_KEK_MISSING',
            },
          ],
        );
      }
    }),
  );
}
