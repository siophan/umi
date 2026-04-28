import type {
  PaymentChannel,
  PaymentSettingsResponse,
  UpdateAlipayPaymentSettingsPayload,
  UpdateWechatPaymentSettingsPayload,
} from '@umi/shared';

import { getJson, putJson } from './shared';

export async function fetchPaymentSettings(): Promise<PaymentSettingsResponse> {
  return getJson<PaymentSettingsResponse>('/api/admin/payment-settings');
}

export async function updateWechatPaymentSettings(
  payload: UpdateWechatPaymentSettingsPayload,
): Promise<PaymentSettingsResponse> {
  return putJson<PaymentSettingsResponse, UpdateWechatPaymentSettingsPayload>(
    '/api/admin/payment-settings/wechat',
    payload,
  );
}

export async function updateAlipayPaymentSettings(
  payload: UpdateAlipayPaymentSettingsPayload,
): Promise<PaymentSettingsResponse> {
  return putJson<PaymentSettingsResponse, UpdateAlipayPaymentSettingsPayload>(
    '/api/admin/payment-settings/alipay',
    payload,
  );
}

export type { PaymentChannel };
