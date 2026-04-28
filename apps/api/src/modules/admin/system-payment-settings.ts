import type { RowDataPacket } from 'mysql2';

import type {
  AlipayPaymentConfig,
  AlipayPaymentSecretsMasked,
  AlipayPaymentSettingsData,
  PaymentChannel,
  PaymentSecretMaskedField,
  PaymentSettingsResponse,
  UpdateAlipayPaymentSettingsPayload,
  UpdatePaymentSettingsPayload,
  UpdateWechatPaymentSettingsPayload,
  WechatPaymentConfig,
  WechatPaymentSecretsMasked,
  WechatPaymentSettingsData,
} from '@umi/shared';

import { getDbPool } from '../../lib/db';
import { decryptSecretJson, encryptSecretJson } from '../../lib/secret-crypto';

const CHANNEL_WECHAT = 'wechat' as const;
const CHANNEL_ALIPAY = 'alipay' as const;

type WechatSecrets = {
  api_v3_key: string;
  api_client_private_key: string;
};

type AlipaySecrets = {
  app_private_key: string;
};

type PaymentSettingsRow = RowDataPacket & {
  channel: string;
  config_public: string | object | null;
  secrets_enc: Buffer | null;
  updated_by: number | null;
  updated_at: Date | string;
  updated_by_username: string | null;
};

function parseConfigPublic(raw: string | object | null): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return raw as Record<string, unknown>;
}

function maskApiV3Key(value: string): string {
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}

function maskPem(_value: string): string {
  return 'PEM 已配置';
}

function emptyMaskedField(): PaymentSecretMaskedField {
  return { hasValue: false, preview: null };
}

function rowToUpdatedBy(row: PaymentSettingsRow) {
  if (row.updated_by == null || !row.updated_by_username) return null;
  return { id: row.updated_by, username: row.updated_by_username };
}

function rowToUpdatedAtISO(row: PaymentSettingsRow): string {
  if (row.updated_at instanceof Date) return row.updated_at.toISOString();
  return new Date(row.updated_at).toISOString();
}

async function selectRow(channel: PaymentChannel): Promise<PaymentSettingsRow | null> {
  const db = getDbPool();
  const [rows] = await db.execute<PaymentSettingsRow[]>(
    `
      SELECT
        ps.channel,
        ps.config_public,
        ps.secrets_enc,
        ps.updated_by,
        ps.updated_at,
        au.username AS updated_by_username
      FROM payment_settings ps
      LEFT JOIN admin_user au ON au.id = ps.updated_by
      WHERE ps.channel = ?
      LIMIT 1
    `,
    [channel],
  );
  return rows[0] ?? null;
}

function rowToWechatData(row: PaymentSettingsRow | null): WechatPaymentSettingsData {
  if (!row) {
    return {
      config: {},
      secrets_masked: {
        api_v3_key: emptyMaskedField(),
        api_client_private_key: emptyMaskedField(),
      },
      updated_at: null,
      updated_by: null,
    };
  }

  const secretsMasked: WechatPaymentSecretsMasked = {
    api_v3_key: emptyMaskedField(),
    api_client_private_key: emptyMaskedField(),
  };

  if (row.secrets_enc) {
    const secrets = decryptSecretJson<Partial<WechatSecrets>>(row.secrets_enc);
    if (secrets.api_v3_key) {
      secretsMasked.api_v3_key = {
        hasValue: true,
        preview: maskApiV3Key(secrets.api_v3_key),
      };
    }
    if (secrets.api_client_private_key) {
      secretsMasked.api_client_private_key = {
        hasValue: true,
        preview: maskPem(secrets.api_client_private_key),
      };
    }
  }

  return {
    config: parseConfigPublic(row.config_public) as Partial<WechatPaymentConfig>,
    secrets_masked: secretsMasked,
    updated_at: rowToUpdatedAtISO(row),
    updated_by: rowToUpdatedBy(row),
  };
}

function rowToAlipayData(row: PaymentSettingsRow | null): AlipayPaymentSettingsData {
  if (!row) {
    return {
      config: {},
      secrets_masked: {
        app_private_key: emptyMaskedField(),
      },
      updated_at: null,
      updated_by: null,
    };
  }

  const secretsMasked: AlipayPaymentSecretsMasked = {
    app_private_key: emptyMaskedField(),
  };

  if (row.secrets_enc) {
    const secrets = decryptSecretJson<Partial<AlipaySecrets>>(row.secrets_enc);
    if (secrets.app_private_key) {
      secretsMasked.app_private_key = {
        hasValue: true,
        preview: maskPem(secrets.app_private_key),
      };
    }
  }

  return {
    config: parseConfigPublic(row.config_public) as Partial<AlipayPaymentConfig>,
    secrets_masked: secretsMasked,
    updated_at: rowToUpdatedAtISO(row),
    updated_by: rowToUpdatedBy(row),
  };
}

export async function getPaymentSettings(): Promise<PaymentSettingsResponse> {
  const [wechatRow, alipayRow] = await Promise.all([
    selectRow(CHANNEL_WECHAT),
    selectRow(CHANNEL_ALIPAY),
  ]);

  return {
    wechat: rowToWechatData(wechatRow),
    alipay: rowToAlipayData(alipayRow),
  };
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isCertText(value: unknown): value is string {
  return typeof value === 'string' && value.includes('BEGIN CERTIFICATE');
}

function isPrivateKeyText(value: unknown): value is string {
  return typeof value === 'string' && value.includes('BEGIN') && value.includes('PRIVATE KEY');
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateWechatConfig(config: unknown): WechatPaymentConfig {
  assert(config && typeof config === 'object', '微信支付配置缺失');
  const c = config as Record<string, unknown>;

  assert(typeof c.mchid === 'string' && /^\d+$/.test(c.mchid), 'mchid 必须是数字串');
  assert(
    typeof c.cert_serial_no === 'string' && c.cert_serial_no.length > 0,
    '商户证书序列号不能为空',
  );
  assert(isCertText(c.platform_cert), '平台证书格式不正确');
  assert(isHttpUrl(c.notify_url), '支付回调地址必须是 http(s) URL');
  assert(Array.isArray(c.scenes) && c.scenes.length > 0, '至少启用一个支付场景');
  for (const scene of c.scenes) {
    assert(scene === 'h5' || scene === 'native', `不支持的场景: ${String(scene)}`);
  }

  return {
    mchid: c.mchid,
    cert_serial_no: c.cert_serial_no,
    platform_cert: c.platform_cert as string,
    notify_url: c.notify_url as string,
    scenes: c.scenes as ('h5' | 'native')[],
  };
}

function validateAlipayConfig(config: unknown): AlipayPaymentConfig {
  assert(config && typeof config === 'object', '支付宝配置缺失');
  const c = config as Record<string, unknown>;

  assert(typeof c.app_id === 'string' && c.app_id.length > 0, 'AppID 不能为空');
  assert(isCertText(c.app_public_cert), '应用公钥证书格式不正确');
  assert(isCertText(c.alipay_public_cert), '支付宝公钥证书格式不正确');
  assert(isCertText(c.alipay_root_cert), '支付宝根证书格式不正确');
  assert(isHttpUrl(c.notify_url), '支付通知地址必须是 http(s) URL');
  assert(isHttpUrl(c.return_url), '同步返回地址必须是 http(s) URL');
  assert(Array.isArray(c.scenes) && c.scenes.length > 0, '至少启用一个支付场景');
  for (const scene of c.scenes) {
    assert(scene === 'wap', `不支持的场景: ${String(scene)}`);
  }

  return {
    app_id: c.app_id,
    app_public_cert: c.app_public_cert as string,
    alipay_public_cert: c.alipay_public_cert as string,
    alipay_root_cert: c.alipay_root_cert as string,
    notify_url: c.notify_url as string,
    return_url: c.return_url as string,
    scenes: c.scenes as ('wap')[],
  };
}

function mergeWechatSecrets(
  existing: Partial<WechatSecrets>,
  incoming: { api_v3_key: string | null; api_client_private_key: string | null },
): WechatSecrets {
  const merged: Partial<WechatSecrets> = { ...existing };
  if (incoming.api_v3_key !== null) {
    assert(
      typeof incoming.api_v3_key === 'string' && incoming.api_v3_key.length === 32,
      'APIv3 密钥必须是 32 个字符',
    );
    merged.api_v3_key = incoming.api_v3_key;
  }
  if (incoming.api_client_private_key !== null) {
    assert(isPrivateKeyText(incoming.api_client_private_key), '商户私钥格式不正确');
    merged.api_client_private_key = incoming.api_client_private_key;
  }

  assert(merged.api_v3_key, 'APIv3 密钥未配置');
  assert(merged.api_client_private_key, '商户私钥未配置');
  return merged as WechatSecrets;
}

function mergeAlipaySecrets(
  existing: Partial<AlipaySecrets>,
  incoming: { app_private_key: string | null },
): AlipaySecrets {
  const merged: Partial<AlipaySecrets> = { ...existing };
  if (incoming.app_private_key !== null) {
    assert(isPrivateKeyText(incoming.app_private_key), '应用私钥格式不正确');
    merged.app_private_key = incoming.app_private_key;
  }

  assert(merged.app_private_key, '应用私钥未配置');
  return merged as AlipaySecrets;
}

export async function updatePaymentSettings(
  channel: PaymentChannel,
  payload: UpdatePaymentSettingsPayload<typeof channel>,
  adminUserId: number,
): Promise<PaymentSettingsResponse> {
  const db = getDbPool();
  const existingRow = await selectRow(channel);
  const existingSecrets = existingRow?.secrets_enc
    ? decryptSecretJson<Record<string, string>>(existingRow.secrets_enc)
    : {};

  let configPublicJson: string;
  let secretsBlob: Buffer;

  if (channel === CHANNEL_WECHAT) {
    const p = payload as UpdateWechatPaymentSettingsPayload;
    const config = validateWechatConfig(p.config);
    const merged = mergeWechatSecrets(existingSecrets as Partial<WechatSecrets>, p.secrets);
    configPublicJson = JSON.stringify(config);
    secretsBlob = encryptSecretJson(merged);
  } else if (channel === CHANNEL_ALIPAY) {
    const p = payload as UpdateAlipayPaymentSettingsPayload;
    const config = validateAlipayConfig(p.config);
    const merged = mergeAlipaySecrets(existingSecrets as Partial<AlipaySecrets>, p.secrets);
    configPublicJson = JSON.stringify(config);
    secretsBlob = encryptSecretJson(merged);
  } else {
    throw new Error(`未知支付渠道: ${channel}`);
  }

  await db.execute(
    `
      INSERT INTO payment_settings (channel, config_public, secrets_enc, updated_by)
      VALUES (?, CAST(? AS JSON), ?, ?)
      ON DUPLICATE KEY UPDATE
        config_public = VALUES(config_public),
        secrets_enc   = VALUES(secrets_enc),
        updated_by    = VALUES(updated_by)
    `,
    [channel, configPublicJson, secretsBlob, adminUserId],
  );

  console.log(
    `[payment-settings] channel=${channel} updated_by=${adminUserId} at=${new Date().toISOString()}`,
  );

  return getPaymentSettings();
}

export type LoadedWechatPaySettings = {
  mchid: string;
  certSerialNo: string;
  platformCert: string;
  notifyUrl: string;
  scenes: ('h5' | 'native')[];
  apiV3Key: string;
  apiClientPrivateKey: string;
};

export type LoadedAlipaySettings = {
  appId: string;
  appPublicCert: string;
  alipayPublicCert: string;
  alipayRootCert: string;
  notifyUrl: string;
  returnUrl: string;
  scenes: ('wap')[];
  appPrivateKey: string;
};

export async function loadWechatPaySettings(): Promise<LoadedWechatPaySettings | null> {
  const row = await selectRow(CHANNEL_WECHAT);
  if (!row || !row.secrets_enc) return null;
  const config = parseConfigPublic(row.config_public) as Partial<WechatPaymentConfig>;
  const secrets = decryptSecretJson<Partial<WechatSecrets>>(row.secrets_enc);

  if (
    !config.mchid ||
    !config.cert_serial_no ||
    !config.platform_cert ||
    !config.notify_url ||
    !config.scenes ||
    !secrets.api_v3_key ||
    !secrets.api_client_private_key
  ) {
    return null;
  }

  return {
    mchid: config.mchid,
    certSerialNo: config.cert_serial_no,
    platformCert: config.platform_cert,
    notifyUrl: config.notify_url,
    scenes: config.scenes,
    apiV3Key: secrets.api_v3_key,
    apiClientPrivateKey: secrets.api_client_private_key,
  };
}

export async function loadAlipaySettings(): Promise<LoadedAlipaySettings | null> {
  const row = await selectRow(CHANNEL_ALIPAY);
  if (!row || !row.secrets_enc) return null;
  const config = parseConfigPublic(row.config_public) as Partial<AlipayPaymentConfig>;
  const secrets = decryptSecretJson<Partial<AlipaySecrets>>(row.secrets_enc);

  if (
    !config.app_id ||
    !config.app_public_cert ||
    !config.alipay_public_cert ||
    !config.alipay_root_cert ||
    !config.notify_url ||
    !config.return_url ||
    !config.scenes ||
    !secrets.app_private_key
  ) {
    return null;
  }

  return {
    appId: config.app_id,
    appPublicCert: config.app_public_cert,
    alipayPublicCert: config.alipay_public_cert,
    alipayRootCert: config.alipay_root_cert,
    notifyUrl: config.notify_url,
    returnUrl: config.return_url,
    scenes: config.scenes,
    appPrivateKey: secrets.app_private_key,
  };
}
