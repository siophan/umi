# Admin 参数设置（微信支付 / 支付宝） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 admin「系统设置 → 参数设置」下加微信支付（v3 H5/Native）/ 支付宝（公钥证书 WAP）参数管理，sercrets 用 AES-256-GCM 加密落库。

**Architecture:** 单表 `payment_settings(channel PK, config_public JSON, secrets_enc BLOB)`；后端 `apps/api/src/modules/admin/system-payment-settings.ts` 提供 GET（脱敏） / PUT（合并加密）/ 内部 `loadXxxPaySettings()` helper；前端 `apps/admin/src/pages/system-settings-page.tsx` + 两个 form 组件，secret 字段 placeholder 显示 preview，留空保持不变。

**Tech Stack:** Express + mysql2 + zod（如未引入则用手写校验，本计划走手写）+ Node `crypto` AES-256-GCM；前端 React + antd Form/Tabs/Input.TextArea/Input.Password。

**Spec:** `docs/superpowers/specs/2026-04-28-admin-payment-settings-design.md`

**Codebase 测试现状:** `apps/api` `test` 脚本是 `echo "api test pending"`；admin 模块无单测。本计划按 spec §10 的"手动验收清单"路线，不引入测试基础设施。

**Codebase 路由权限规则补充（spec 之外发现）：** 现有 `auth.ts:resolveAdminRoutePermissionCodes` 模式是 `GET → ['xxx.view', 'system.manage']`、`其他方法 → ['system.manage']`。这跟 spec 写的"单 view 权限同时控制读写"略不同——实际是 view 权限只过 GET，写操作要 `system.manage`。**本计划按现有 codebase 模式执行**（与 categories/notifications 完全一致）。

---

## File Structure

**Backend:**
- Create `apps/api/src/lib/secret-crypto.ts` — AES-256-GCM encrypt/decrypt JSON
- Modify `apps/api/src/env.ts` — 加 `paymentSecretKek`
- Create `apps/api/src/modules/admin/system-payment-settings.ts` — service：`getPaymentSettings()` / `updatePaymentSettings(channel, payload)` / `loadWechatPaySettings()` / `loadAlipaySettings()`
- Modify `apps/api/src/modules/admin/routes/system-routes.ts` — 注册 payment-settings 子 router
- Create `apps/api/src/modules/admin/routes/payment-settings-routes.ts` — `GET /payment-settings` + `PUT /payment-settings/:channel`
- Modify `apps/api/src/modules/admin/auth.ts:resolveAdminRoutePermissionCodes` — 加 `/payment-settings` 路由权限规则

**Shared:**
- Modify `packages/shared/src/admin-permissions.ts` — 加 `system.settings.view` 定义
- Modify `packages/shared/src/api-admin-system.ts` — 加 PaymentChannel / PaymentSettingsResponse / UpdatePaymentSettingsPayload 等类型

**Admin frontend:**
- Create `apps/admin/src/lib/api/system-settings.ts` — fetcher
- Create `apps/admin/src/components/payment-settings-wechat-form.tsx` — wechat 表单组件
- Create `apps/admin/src/components/payment-settings-alipay-form.tsx` — alipay 表单组件
- Create `apps/admin/src/pages/system-settings-page.tsx` — Tabs 容器 + 数据加载
- Modify `apps/admin/src/lib/admin-page-registry.tsx` — 注册 `/system/settings` → `SystemSettingsPage`
- Modify `apps/admin/src/lib/admin-menu-config.tsx` — `system-group.children` 末尾加菜单项

**DB:**
- 一条 DDL 手动执行（SQL 见 Task 1）

---

## Task 1: DB Schema 手动执行

**Files:** 无（DDL 由 owner 手动跑）

- [ ] **Step 1: 在目标库执行 DDL**

```sql
CREATE TABLE payment_settings (
  channel       VARCHAR(32)  NOT NULL PRIMARY KEY,
  config_public JSON         NOT NULL,
  secrets_enc   MEDIUMBLOB,
  updated_by    INT UNSIGNED,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_payment_settings_channel CHECK (channel IN ('wechat','alipay'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付参数设置（平台全局，按 channel 一行）';
```

- [ ] **Step 2: 验证表存在且为空**

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW CREATE TABLE payment_settings\G; SELECT COUNT(*) FROM payment_settings;"
```

预期：能看到完整表结构，`COUNT(*) = 0`。

---

## Task 2: 加 PAYMENT_SECRET_KEK 到 env

**Files:**
- Modify: `apps/api/src/env.ts`

- [ ] **Step 1: 在 env 对象末尾追加 paymentSecretKek 字段**

`apps/api/src/env.ts` 在 `ossBaseUrl` 这一行下面（即 `}` 之前）追加一行：

```ts
  paymentSecretKek: process.env.PAYMENT_SECRET_KEK ?? '',
```

- [ ] **Step 2: 生成 KEK 写入 .env.local**

```bash
openssl rand -base64 32
```

把输出（例：`abcDEF...44字符`）追加到 workspace 根的 `.env.local`：

```bash
PAYMENT_SECRET_KEK=<openssl输出>
```

- [ ] **Step 3: 启动 api 验证 env 加载（不报错）**

```bash
pnpm --filter @umi/api dev
```

预期：dev 进程正常起，无新增报错。Ctrl+C 终止。

- [ ] **Step 4: 提交**

```bash
git add apps/api/src/env.ts
git commit -m "feat(api): add PAYMENT_SECRET_KEK env for payment settings encryption"
```

---

## Task 3: 加密 helper

**Files:**
- Create: `apps/api/src/lib/secret-crypto.ts`

- [ ] **Step 1: 创建 secret-crypto.ts**

```ts
// apps/api/src/lib/secret-crypto.ts
import crypto from 'node:crypto';

import { env } from '../env';

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  if (!env.paymentSecretKek) {
    throw new Error('PAYMENT_SECRET_KEK 未配置（需 32 字节 base64）');
  }
  const key = Buffer.from(env.paymentSecretKek, 'base64');
  if (key.length !== 32) {
    throw new Error('PAYMENT_SECRET_KEK 必须是 32 字节（base64 后 44 字符）');
  }
  return key;
}

export function encryptSecretJson(plaintext: object): Buffer {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, getKey(), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]);
}

export function decryptSecretJson<T>(blob: Buffer): T {
  const iv = blob.subarray(0, IV_LEN);
  const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = blob.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALG, getKey(), iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(out.toString('utf8')) as T;
}
```

- [ ] **Step 2: 手工 round-trip 验证**

在 `apps/api` 目录跑一次性脚本（不入库）：

```bash
cd /root/projects/umi/apps/api && pnpm exec tsx -e "
import('./src/lib/secret-crypto').then(async ({ encryptSecretJson, decryptSecretJson }) => {
  const blob = encryptSecretJson({ secret: 'hello' });
  const back = decryptSecretJson(blob);
  console.log('blob length:', blob.length, 'decrypted:', back);
});
"
```

预期：`blob length: 51` 之类（28B 头部 + 23B 密文）；`decrypted: { secret: 'hello' }`。

- [ ] **Step 3: 提交**

```bash
git add apps/api/src/lib/secret-crypto.ts
git commit -m "feat(api): AES-256-GCM helper for encrypting JSON secrets"
```

---

## Task 4: shared admin-permissions 加 system.settings.view

**Files:**
- Modify: `packages/shared/src/admin-permissions.ts`

- [ ] **Step 1: 找到 system.notifications.view 这条，在它后面追加 system.settings.view**

读 `packages/shared/src/admin-permissions.ts`，找到（约第 364 行起）：

```ts
  {
    code: 'system.notifications.view',
    name: '通知管理',
    module: 'system',
    action: 'view',
    parentCode: 'system.manage',
    sort: 1050,
    path: '/system/notifications',
  },
];
```

在 `};` 闭合 `]` 之前追加一项：

```ts
  {
    code: 'system.notifications.view',
    name: '通知管理',
    module: 'system',
    action: 'view',
    parentCode: 'system.manage',
    sort: 1050,
    path: '/system/notifications',
  },
  {
    code: 'system.settings.view',
    name: '参数设置',
    module: 'system',
    action: 'view',
    parentCode: 'system.manage',
    sort: 1060,
    path: '/system/settings',
  },
];
```

- [ ] **Step 2: 提交（先不动 admin 菜单，留到 Task 11 一起）**

```bash
git add packages/shared/src/admin-permissions.ts
git commit -m "feat(shared): add system.settings.view permission for payment settings page"
```

---

## Task 5: shared 类型 — PaymentChannel / Response / Payload

**Files:**
- Modify: `packages/shared/src/api-admin-system.ts`

- [ ] **Step 1: 在文件末尾追加支付参数相关类型**

```ts
// === 支付参数设置（platform-wide）===

export type PaymentChannel = 'wechat' | 'alipay';

export type WechatPaymentScene = 'h5' | 'native';
export type AlipayPaymentScene = 'wap';

export interface WechatPaymentConfig {
  mchid: string;
  cert_serial_no: string;
  platform_cert: string;
  notify_url: string;
  scenes: WechatPaymentScene[];
}

export interface AlipayPaymentConfig {
  app_id: string;
  app_public_cert: string;
  alipay_public_cert: string;
  alipay_root_cert: string;
  notify_url: string;
  return_url: string;
  scenes: AlipayPaymentScene[];
}

export interface PaymentSecretMaskedField {
  hasValue: boolean;
  preview: string | null;
}

export type WechatPaymentSecretsMasked = {
  api_v3_key: PaymentSecretMaskedField;
  api_client_private_key: PaymentSecretMaskedField;
};

export type AlipayPaymentSecretsMasked = {
  app_private_key: PaymentSecretMaskedField;
};

export interface PaymentSettingsUpdaterRef {
  id: number;
  username: string;
}

export interface WechatPaymentSettingsData {
  config: Partial<WechatPaymentConfig>;
  secrets_masked: WechatPaymentSecretsMasked;
  updated_at: string | null;
  updated_by: PaymentSettingsUpdaterRef | null;
}

export interface AlipayPaymentSettingsData {
  config: Partial<AlipayPaymentConfig>;
  secrets_masked: AlipayPaymentSecretsMasked;
  updated_at: string | null;
  updated_by: PaymentSettingsUpdaterRef | null;
}

export interface PaymentSettingsResponse {
  wechat: WechatPaymentSettingsData;
  alipay: AlipayPaymentSettingsData;
}

export interface UpdateWechatPaymentSettingsPayload {
  config: WechatPaymentConfig;
  secrets: {
    api_v3_key: string | null;
    api_client_private_key: string | null;
  };
}

export interface UpdateAlipayPaymentSettingsPayload {
  config: AlipayPaymentConfig;
  secrets: {
    app_private_key: string | null;
  };
}

export type UpdatePaymentSettingsPayload<C extends PaymentChannel> =
  C extends 'wechat'
    ? UpdateWechatPaymentSettingsPayload
    : C extends 'alipay'
      ? UpdateAlipayPaymentSettingsPayload
      : never;
```

- [ ] **Step 2: 提交**

```bash
git add packages/shared/src/api-admin-system.ts
git commit -m "feat(shared): add payment settings request/response types"
```

---

## Task 6: 后端 service 模块 — system-payment-settings.ts

**Files:**
- Create: `apps/api/src/modules/admin/system-payment-settings.ts`

> 这个 task 步骤多，按"先建框架 → 加 GET → 加 PUT → 加内部 helper"的节奏。每步结束都跑一次 `pnpm --filter @umi/api dev` 起一下确认无 syntax/import 错（不需要逐步 commit，整 task 结束一次提交即可）。

- [ ] **Step 1: 创建文件并写常量、行 → 类型映射**

```ts
// apps/api/src/modules/admin/system-payment-settings.ts
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
```

- [ ] **Step 2: 写"按 channel 取一行"的内部 helper**

接着写：

```ts
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
```

- [ ] **Step 3: 写 wechat / alipay 行 → 前端 Data 的 mapper**

```ts
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

  let secretsMasked: WechatPaymentSecretsMasked = {
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

  let secretsMasked: AlipayPaymentSecretsMasked = {
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
```

- [ ] **Step 4: 写 GET 公开服务函数**

```ts
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
```

- [ ] **Step 5: 写公开字段校验（手写，不引 zod）**

```ts
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
  assert(typeof c.cert_serial_no === 'string' && c.cert_serial_no.length > 0, '商户证书序列号不能为空');
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
```

- [ ] **Step 6: 写 secrets 合并 + 校验函数**

```ts
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
```

- [ ] **Step 7: 写 PUT 公开服务函数**

```ts
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
```

> import 已在 Step 1 中包含 `UpdateWechatPaymentSettingsPayload` / `UpdateAlipayPaymentSettingsPayload`，无需再改。

- [ ] **Step 8: 写内部 load helpers（给未来支付链路用）**

```ts
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
```

- [ ] **Step 9: 起 dev 验证编译通过**

```bash
pnpm --filter @umi/api dev
```

预期：dev 进程起来无报错。Ctrl+C 终止。

- [ ] **Step 10: 提交**

```bash
git add apps/api/src/modules/admin/system-payment-settings.ts
git commit -m "feat(api): admin payment-settings service (GET/PUT/load helpers)"
```

---

## Task 7: 后端路由 + 权限规则

**Files:**
- Create: `apps/api/src/modules/admin/routes/payment-settings-routes.ts`
- Modify: `apps/api/src/modules/admin/routes/system-routes.ts`
- Modify: `apps/api/src/modules/admin/auth.ts`

- [ ] **Step 1: 创建 payment-settings-routes.ts**

```ts
// apps/api/src/modules/admin/routes/payment-settings-routes.ts
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

const ALLOWED_CHANNELS = new Set<PaymentChannel>(['wechat', 'alipay']);

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
            { message: 'PAYMENT_SECRET_KEK 未配置（需 32 字节 base64）', status: 500, code: 'ADMIN_PAYMENT_SETTINGS_KEK_MISSING' },
          ],
        );
      }
    }),
  );
}
```

- [ ] **Step 2: 在 system-routes.ts 注册新路由**

把 `apps/api/src/modules/admin/routes/system-routes.ts` 改成：

```ts
import type { Router as ExpressRouter } from 'express';

import { registerAdminPaymentSettingsRoutes } from './payment-settings-routes';
import { registerAdminRbacRoutes } from './rbac-routes';
import { registerAdminSystemOpsRoutes } from './system-ops-routes';
import { registerAdminSystemUserRoutes } from './system-user-routes';

export function registerAdminSystemRoutes(adminRouter: ExpressRouter) {
  registerAdminSystemUserRoutes(adminRouter);
  registerAdminRbacRoutes(adminRouter);
  registerAdminSystemOpsRoutes(adminRouter);
  registerAdminPaymentSettingsRoutes(adminRouter);
}
```

- [ ] **Step 3: 在 auth.ts 加路由权限规则**

打开 `apps/api/src/modules/admin/auth.ts`，找到 `if (matchesRoutePrefix(path, '/notifications'))` 这块（约第 399 行），在它**后面**插入：

```ts
  if (matchesRoutePrefix(path, '/payment-settings')) {
    return normalizedMethod === 'GET'
      ? ['system.settings.view', 'system.manage']
      : ['system.manage'];
  }
```

- [ ] **Step 4: 起 dev 验证**

```bash
pnpm --filter @umi/api dev
```

预期：进程起来，无报错。

- [ ] **Step 5: 提交**

```bash
git add apps/api/src/modules/admin/routes/payment-settings-routes.ts \
        apps/api/src/modules/admin/routes/system-routes.ts \
        apps/api/src/modules/admin/auth.ts
git commit -m "feat(api): admin payment-settings routes + permission rule"
```

---

## Task 8: 后端 smoke test（curl）

**Files:** 无（仅 curl 验证）

> 前提：API dev 在跑（`pnpm --filter @umi/api dev`）；admin 用户已登录拿到 token；KEK 已配置。

- [ ] **Step 1: 用 admin token 调 GET 验证空表返回**

获取 token（调登录接口或从浏览器 admin 登录后从 devtools 复制 `Authorization`）。然后：

```bash
curl -sS -H "Authorization: Bearer <ADMIN_TOKEN>" http://127.0.0.1:4000/api/admin/payment-settings | jq
```

预期：

```json
{
  "code": 0,
  "data": {
    "wechat": {
      "config": {},
      "secrets_masked": {
        "api_v3_key": { "hasValue": false, "preview": null },
        "api_client_private_key": { "hasValue": false, "preview": null }
      },
      "updated_at": null,
      "updated_by": null
    },
    "alipay": {
      "config": {},
      "secrets_masked": { "app_private_key": { "hasValue": false, "preview": null } },
      "updated_at": null,
      "updated_by": null
    }
  }
}
```

- [ ] **Step 2: PUT 一份完整 wechat 配置**

```bash
curl -sS -X PUT -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" \
  http://127.0.0.1:4000/api/admin/payment-settings/wechat \
  -d '{
    "config": {
      "mchid": "1900000001",
      "cert_serial_no": "5BB3C12345",
      "platform_cert": "-----BEGIN CERTIFICATE-----\nABCD\n-----END CERTIFICATE-----",
      "notify_url": "https://example.com/api/payment/wechat/notify",
      "scenes": ["h5","native"]
    },
    "secrets": {
      "api_v3_key": "12345678901234567890123456789012",
      "api_client_private_key": "-----BEGIN PRIVATE KEY-----\nXYZ\n-----END PRIVATE KEY-----"
    }
  }' | jq
```

预期：返回更新后的完整结构；`wechat.secrets_masked.api_v3_key.preview = "••••9012"`、`api_client_private_key.preview = "PEM 已配置"`、`hasValue` 都为 `true`。

- [ ] **Step 3: PUT 只改 mchid，secrets 都填 null**

```bash
curl -sS -X PUT -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" \
  http://127.0.0.1:4000/api/admin/payment-settings/wechat \
  -d '{
    "config": {
      "mchid": "1900000999",
      "cert_serial_no": "5BB3C12345",
      "platform_cert": "-----BEGIN CERTIFICATE-----\nABCD\n-----END CERTIFICATE-----",
      "notify_url": "https://example.com/api/payment/wechat/notify",
      "scenes": ["h5","native"]
    },
    "secrets": {
      "api_v3_key": null,
      "api_client_private_key": null
    }
  }' | jq '.data.wechat'
```

预期：`config.mchid = "1900000999"`；`secrets_masked.api_v3_key.preview` 仍是 `"••••9012"`（保持不变）。

- [ ] **Step 4: 调用 loadWechatPaySettings() 验证 helper 返回明文（一次性）**

```bash
cd /root/projects/umi/apps/api && pnpm exec tsx -e "
import('./src/modules/admin/system-payment-settings').then(async ({ loadWechatPaySettings }) => {
  const data = await loadWechatPaySettings();
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
});
"
```

预期：输出 camelCase 的完整对象，`apiV3Key` 是明文 `12345678901234567890123456789012`、`apiClientPrivateKey` 是明文 PEM。

- [ ] **Step 5: 清理测试数据（可选）**

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "DELETE FROM payment_settings WHERE channel='wechat';"
```

- [ ] **Step 6: 无新增文件改动，跳过 commit**

---

## Task 9: 前端 fetcher

**Files:**
- Create: `apps/admin/src/lib/api/system-settings.ts`

- [ ] **Step 1: 创建 system-settings.ts**

> `apps/admin/src/lib/api/shared.ts` 已 export `getJson<T>(path)` 和 `putJson<TResponse, TPayload>(path, payload)`。直接用即可。所有 admin 接口路径走 `/api/admin/...` 前缀（参考 `system-notifications.ts`）。

```ts
// apps/admin/src/lib/api/system-settings.ts
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
```

- [ ] **Step 2: 提交**

```bash
git add apps/admin/src/lib/api/system-settings.ts
git commit -m "feat(admin): payment-settings api fetcher"
```

---

## Task 10: 前端 wechat 表单组件

**Files:**
- Create: `apps/admin/src/components/payment-settings-wechat-form.tsx`

- [ ] **Step 1: 创建组件**

```tsx
// apps/admin/src/components/payment-settings-wechat-form.tsx
import {
  Button,
  Checkbox,
  Form,
  Input,
  Space,
  Tag,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import type {
  WechatPaymentSettingsData,
  WechatPaymentScene,
  UpdateWechatPaymentSettingsPayload,
} from '@umi/shared';

const SCENE_OPTIONS: { label: string; value: WechatPaymentScene }[] = [
  { label: 'H5', value: 'h5' },
  { label: 'Native', value: 'native' },
];

type Values = {
  mchid: string;
  cert_serial_no: string;
  api_client_private_key: string;
  api_v3_key: string;
  platform_cert: string;
  notify_url: string;
  scenes: WechatPaymentScene[];
};

const EMPTY_VALUES: Values = {
  mchid: '',
  cert_serial_no: '',
  api_client_private_key: '',
  api_v3_key: '',
  platform_cert: '',
  notify_url: '',
  scenes: [],
};

function buildInitial(data: WechatPaymentSettingsData): Values {
  const c = data.config;
  return {
    mchid: c.mchid ?? '',
    cert_serial_no: c.cert_serial_no ?? '',
    api_client_private_key: '',
    api_v3_key: '',
    platform_cert: c.platform_cert ?? '',
    notify_url: c.notify_url ?? '',
    scenes: c.scenes ?? [],
  };
}

type Props = {
  data: WechatPaymentSettingsData;
  onSubmit: (payload: UpdateWechatPaymentSettingsPayload) => Promise<void>;
};

export function PaymentSettingsWechatForm({ data, onSubmit }: Props) {
  const [form] = Form.useForm<Values>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(buildInitial(data));
  }, [data, form]);

  const masked = data.secrets_masked;
  const apiV3KeyPlaceholder = masked.api_v3_key.hasValue
    ? `${masked.api_v3_key.preview}（已配置，留空保持不变）`
    : '32 字符 APIv3 密钥';
  const privateKeyPlaceholder = masked.api_client_private_key.hasValue
    ? '已配置，留空保持不变'
    : '粘贴 apiclient_key.pem 文本';

  async function handleSubmit() {
    const values = await form.validateFields();
    const payload: UpdateWechatPaymentSettingsPayload = {
      config: {
        mchid: values.mchid.trim(),
        cert_serial_no: values.cert_serial_no.trim(),
        platform_cert: values.platform_cert.trim(),
        notify_url: values.notify_url.trim(),
        scenes: values.scenes,
      },
      secrets: {
        api_v3_key: values.api_v3_key.trim() ? values.api_v3_key.trim() : null,
        api_client_private_key: values.api_client_private_key.trim()
          ? values.api_client_private_key.trim()
          : null,
      },
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      message.success('已保存');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    form.resetFields();
    form.setFieldsValue(buildInitial(data));
  }

  return (
    <Form form={form} layout="vertical" autoComplete="off">
      <Form.Item label="商户号 mchid" name="mchid" rules={[{ required: true, message: '请填写商户号' }]}>
        <Input placeholder="如 1900000001" />
      </Form.Item>

      <Form.Item
        label="商户证书序列号 cert_serial_no"
        name="cert_serial_no"
        rules={[{ required: true, message: '请填写证书序列号' }]}
      >
        <Input placeholder="apiclient_cert.pem 的序列号" />
      </Form.Item>

      <Form.Item
        label={
          <Space>
            商户私钥 api_client_private_key
            {masked.api_client_private_key.hasValue ? (
              <Tag color="green">已配置</Tag>
            ) : (
              <Tag>未配置</Tag>
            )}
          </Space>
        }
        name="api_client_private_key"
        rules={[
          {
            required: !masked.api_client_private_key.hasValue,
            message: '请填写商户私钥',
          },
        ]}
      >
        <Input.TextArea
          autoSize={{ minRows: 8, maxRows: 16 }}
          spellCheck={false}
          autoCorrect="off"
          autoComplete="off"
          placeholder={privateKeyPlaceholder}
        />
      </Form.Item>

      <Form.Item
        label={
          <Space>
            APIv3 密钥 api_v3_key
            {masked.api_v3_key.hasValue ? <Tag color="green">已配置</Tag> : <Tag>未配置</Tag>}
          </Space>
        }
        name="api_v3_key"
        rules={[
          { required: !masked.api_v3_key.hasValue, message: '请填写 APIv3 密钥' },
        ]}
      >
        <Input.Password placeholder={apiV3KeyPlaceholder} autoComplete="off" />
      </Form.Item>

      <Form.Item
        label="平台证书 platform_cert"
        name="platform_cert"
        rules={[{ required: true, message: '请填写平台证书' }]}
      >
        <Input.TextArea
          autoSize={{ minRows: 8, maxRows: 16 }}
          spellCheck={false}
          autoCorrect="off"
          autoComplete="off"
          placeholder="-----BEGIN CERTIFICATE-----..."
        />
      </Form.Item>

      <Form.Item
        label="支付回调地址 notify_url"
        name="notify_url"
        rules={[
          { required: true, message: '请填写回调地址' },
          { type: 'url', message: '必须是 http(s) URL' },
        ]}
      >
        <Input placeholder="https://your.domain/api/payment/wechat/notify" />
      </Form.Item>

      <Form.Item
        label="启用支付场景 scenes"
        name="scenes"
        rules={[{ required: true, message: '至少启用一个场景' }]}
      >
        <Checkbox.Group options={SCENE_OPTIONS} />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            保存
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/admin/src/components/payment-settings-wechat-form.tsx
git commit -m "feat(admin): payment-settings wechat form component"
```

---

## Task 11: 前端 alipay 表单组件

**Files:**
- Create: `apps/admin/src/components/payment-settings-alipay-form.tsx`

- [ ] **Step 1: 创建组件**

```tsx
// apps/admin/src/components/payment-settings-alipay-form.tsx
import {
  Button,
  Checkbox,
  Form,
  Input,
  Space,
  Tag,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import type {
  AlipayPaymentSettingsData,
  AlipayPaymentScene,
  UpdateAlipayPaymentSettingsPayload,
} from '@umi/shared';

const SCENE_OPTIONS: { label: string; value: AlipayPaymentScene }[] = [
  { label: '手机网站 (WAP)', value: 'wap' },
];

type Values = {
  app_id: string;
  app_private_key: string;
  app_public_cert: string;
  alipay_public_cert: string;
  alipay_root_cert: string;
  notify_url: string;
  return_url: string;
  scenes: AlipayPaymentScene[];
};

function buildInitial(data: AlipayPaymentSettingsData): Values {
  const c = data.config;
  return {
    app_id: c.app_id ?? '',
    app_private_key: '',
    app_public_cert: c.app_public_cert ?? '',
    alipay_public_cert: c.alipay_public_cert ?? '',
    alipay_root_cert: c.alipay_root_cert ?? '',
    notify_url: c.notify_url ?? '',
    return_url: c.return_url ?? '',
    scenes: c.scenes ?? [],
  };
}

type Props = {
  data: AlipayPaymentSettingsData;
  onSubmit: (payload: UpdateAlipayPaymentSettingsPayload) => Promise<void>;
};

export function PaymentSettingsAlipayForm({ data, onSubmit }: Props) {
  const [form] = Form.useForm<Values>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(buildInitial(data));
  }, [data, form]);

  const masked = data.secrets_masked;
  const privateKeyPlaceholder = masked.app_private_key.hasValue
    ? '已配置，留空保持不变'
    : '粘贴应用私钥（PKCS8 PEM）';

  async function handleSubmit() {
    const values = await form.validateFields();
    const payload: UpdateAlipayPaymentSettingsPayload = {
      config: {
        app_id: values.app_id.trim(),
        app_public_cert: values.app_public_cert.trim(),
        alipay_public_cert: values.alipay_public_cert.trim(),
        alipay_root_cert: values.alipay_root_cert.trim(),
        notify_url: values.notify_url.trim(),
        return_url: values.return_url.trim(),
        scenes: values.scenes,
      },
      secrets: {
        app_private_key: values.app_private_key.trim()
          ? values.app_private_key.trim()
          : null,
      },
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      message.success('已保存');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    form.resetFields();
    form.setFieldsValue(buildInitial(data));
  }

  return (
    <Form form={form} layout="vertical" autoComplete="off">
      <Form.Item label="AppID" name="app_id" rules={[{ required: true, message: '请填写 AppID' }]}>
        <Input placeholder="如 2021000000000000" />
      </Form.Item>

      <Form.Item
        label={
          <Space>
            应用私钥 app_private_key
            {masked.app_private_key.hasValue ? <Tag color="green">已配置</Tag> : <Tag>未配置</Tag>}
          </Space>
        }
        name="app_private_key"
        rules={[
          { required: !masked.app_private_key.hasValue, message: '请填写应用私钥' },
        ]}
      >
        <Input.TextArea
          autoSize={{ minRows: 8, maxRows: 16 }}
          spellCheck={false}
          autoCorrect="off"
          autoComplete="off"
          placeholder={privateKeyPlaceholder}
        />
      </Form.Item>

      <Form.Item
        label="应用公钥证书 appCertPublicKey.crt"
        name="app_public_cert"
        rules={[{ required: true, message: '请填写应用公钥证书' }]}
      >
        <Input.TextArea autoSize={{ minRows: 6, maxRows: 12 }} spellCheck={false} placeholder="-----BEGIN CERTIFICATE-----..." />
      </Form.Item>

      <Form.Item
        label="支付宝公钥证书 alipayCertPublicKey_RSA2.crt"
        name="alipay_public_cert"
        rules={[{ required: true, message: '请填写支付宝公钥证书' }]}
      >
        <Input.TextArea autoSize={{ minRows: 6, maxRows: 12 }} spellCheck={false} placeholder="-----BEGIN CERTIFICATE-----..." />
      </Form.Item>

      <Form.Item
        label="支付宝根证书 alipayRootCert.crt"
        name="alipay_root_cert"
        rules={[{ required: true, message: '请填写支付宝根证书' }]}
      >
        <Input.TextArea autoSize={{ minRows: 6, maxRows: 12 }} spellCheck={false} placeholder="-----BEGIN CERTIFICATE-----..." />
      </Form.Item>

      <Form.Item
        label="支付通知地址 notify_url"
        name="notify_url"
        rules={[
          { required: true, message: '请填写通知地址' },
          { type: 'url', message: '必须是 http(s) URL' },
        ]}
      >
        <Input placeholder="https://your.domain/api/payment/alipay/notify" />
      </Form.Item>

      <Form.Item
        label="同步返回地址 return_url"
        name="return_url"
        rules={[
          { required: true, message: '请填写同步返回地址' },
          { type: 'url', message: '必须是 http(s) URL' },
        ]}
      >
        <Input placeholder="https://your.domain/payment/return/alipay" />
      </Form.Item>

      <Form.Item
        label="启用支付场景 scenes"
        name="scenes"
        rules={[{ required: true, message: '至少启用一个场景' }]}
      >
        <Checkbox.Group options={SCENE_OPTIONS} />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            保存
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/admin/src/components/payment-settings-alipay-form.tsx
git commit -m "feat(admin): payment-settings alipay form component"
```

---

## Task 12: 前端页面 + 菜单 + 注册

**Files:**
- Create: `apps/admin/src/pages/system-settings-page.tsx`
- Modify: `apps/admin/src/lib/admin-page-registry.tsx`
- Modify: `apps/admin/src/lib/admin-menu-config.tsx`

- [ ] **Step 1: 创建页面 system-settings-page.tsx**

```tsx
// apps/admin/src/pages/system-settings-page.tsx
import {
  Alert,
  Card,
  Modal,
  Skeleton,
  Space,
  Tabs,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

import type {
  PaymentSettingsResponse,
  UpdateAlipayPaymentSettingsPayload,
  UpdateWechatPaymentSettingsPayload,
} from '@umi/shared';

import { PaymentSettingsAlipayForm } from '../components/payment-settings-alipay-form';
import { PaymentSettingsWechatForm } from '../components/payment-settings-wechat-form';
import {
  fetchPaymentSettings,
  updateAlipayPaymentSettings,
  updateWechatPaymentSettings,
} from '../lib/api/system-settings';

type AdminPageProps = { refreshToken?: number };

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return '尚未配置';
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return iso;
  return `${date.toLocaleString('zh-CN', { hour12: false })}`;
}

export function SystemSettingsPage({ refreshToken }: AdminPageProps) {
  const [data, setData] = useState<PaymentSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wechat' | 'alipay'>('wechat');
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchPaymentSettings();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  const handleWechatSubmit = useCallback(
    async (payload: UpdateWechatPaymentSettingsPayload) => {
      const next = await updateWechatPaymentSettings(payload);
      setData(next);
      setDirty(false);
    },
    [],
  );

  const handleAlipaySubmit = useCallback(
    async (payload: UpdateAlipayPaymentSettingsPayload) => {
      const next = await updateAlipayPaymentSettings(payload);
      setData(next);
      setDirty(false);
    },
    [],
  );

  function handleTabChange(next: string) {
    if (!dirty) {
      setActiveTab(next as 'wechat' | 'alipay');
      return;
    }
    Modal.confirm({
      title: '当前 tab 未保存',
      content: '切换将丢弃未保存修改，是否继续？',
      okText: '继续切换',
      cancelText: '留下',
      onOk: () => {
        setDirty(false);
        setActiveTab(next as 'wechat' | 'alipay');
      },
    });
  }

  if (loading && !data) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (error) {
    return <Alert type="error" showIcon message="加载失败" description={error} />;
  }

  if (!data) return null;

  const currentChannel = activeTab === 'wechat' ? data.wechat : data.alipay;

  return (
    <Card
      title="参数设置"
      extra={
        <Typography.Text type="secondary">
          最后更新：{formatUpdatedAt(currentChannel.updated_at)}
          {currentChannel.updated_by ? ` by ${currentChannel.updated_by.username}` : ''}
        </Typography.Text>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'wechat',
            label: '微信支付',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Alert
                  type="info"
                  showIcon
                  message="参数仅供平台支付链路使用，密钥/私钥落库前会经 AES-256-GCM 加密。"
                />
                <PaymentSettingsWechatForm data={data.wechat} onSubmit={handleWechatSubmit} />
              </Space>
            ),
          },
          {
            key: 'alipay',
            label: '支付宝支付',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Alert
                  type="info"
                  showIcon
                  message="参数仅供平台支付链路使用，密钥/私钥落库前会经 AES-256-GCM 加密。"
                />
                <PaymentSettingsAlipayForm data={data.alipay} onSubmit={handleAlipaySubmit} />
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
```

> 注：当前实现的 dirty 标记暂无来源（form 内部自治），切 tab confirm 模态框只在用户主动 setDirty 时触发。本期为简化先这样，未来如需精确拦截可让 form 组件回调 onChange 上抛 dirty 状态——暂跳过，避免组件 props 复杂化。

- [ ] **Step 2: 在 admin-page-registry.tsx 注册**

打开 `apps/admin/src/lib/admin-page-registry.tsx`，在 import 区追加：

```tsx
import { SystemSettingsPage } from '../pages/system-settings-page';
```

并在 `PAGE_COMPONENTS` 对象中按字典序合适位置（`/system/rankings` 后、`/system/users` 前）插入：

```ts
'/system/settings': SystemSettingsPage,
```

- [ ] **Step 3: 在 admin-menu-config.tsx 加菜单项**

打开 `apps/admin/src/lib/admin-menu-config.tsx`，找到 `system-group` 的 children 数组（第 292 行起），在 `/system/notifications` 这一项之后追加：

```tsx
      {
        key: '/system/settings',
        path: '/system/settings',
        icon: <SettingOutlined />,
        name: '参数设置',
        access: menuAccess('/system/settings'),
      },
```

`SettingOutlined` 在文件顶部 import 已存在（line 18）——**先 grep 确认**：

```bash
grep -n "SettingOutlined" /root/projects/umi/apps/admin/src/lib/admin-menu-config.tsx
```

预期：能在 import 块看到 `SettingOutlined`。如果没有就加。

- [ ] **Step 4: 起 admin dev 验证页面可见**

```bash
pnpm --filter @umi/admin dev
```

打开浏览器到 admin（一般是 `http://localhost:3001` 或 vite 显示的地址），登录超管账号，确认：
- 左侧菜单「系统设置」展开后能看到「参数设置」
- 点进去看到 Tabs（微信支付 / 支付宝支付），表单字段都能渲染、placeholder 显示"未配置，请填入"或类似

Ctrl+C 终止 dev。

- [ ] **Step 5: 提交**

```bash
git add apps/admin/src/pages/system-settings-page.tsx \
        apps/admin/src/lib/admin-page-registry.tsx \
        apps/admin/src/lib/admin-menu-config.tsx
git commit -m "feat(admin): payment-settings page (Tabs + menu + registry)"
```

---

## Task 13: 端到端手动验收（spec §10 清单）

**Files:** 无（仅运行验证）

> 同时跑 `pnpm --filter @umi/api dev` 和 `pnpm --filter @umi/admin dev`，浏览器打开 admin 登录超管账号。

- [ ] **Step 1: 全字段填一遍 wechat tab → 保存 → 刷新**

进 `/system/settings` → 微信支付 tab → 全部字段填上（mchid 数字串，cert_serial_no 任意字符串，私钥 / 平台证书 用 PEM 格式占位文本，notify_url 用合法 https URL，scenes 勾 H5 + Native）→ 点保存 → 看到"已保存"toast → F5 刷新页面。

预期：
- 公开字段（mchid / cert_serial_no / platform_cert / notify_url / scenes）回填到表单
- secret 字段（api_v3_key / api_client_private_key）输入框为空，placeholder 显示 `••••xxxx（已配置，留空保持不变）` 或 `已配置，留空保持不变`
- label 后 Tag 显示绿色"已配置"

- [ ] **Step 2: 只改 mchid，secret 留空 → 保存 → 刷新**

把 mchid 改成新值，其他不动，secret 输入框保持空 → 保存 → 刷新。

预期：mchid 变了，secret 仍标"已配置"，preview 不变。

- [ ] **Step 3: 重新填 APIv3 密钥 → 保存 → 刷新**

输入新的 32 字符 APIv3 密钥（不动其他字段，不重新填私钥）→ 保存 → 刷新。

预期：preview 末 4 位匹配新密钥末 4 位；私钥仍标"已配置"。

- [ ] **Step 4: 同样流程过一遍 alipay tab**

填 app_id、app_private_key、3 张证书、notify_url、return_url、scenes 勾 WAP → 保存 → 刷新 → 公开字段回填、secret 标"已配置"输入框空。

- [ ] **Step 5: 调用 loadXxxPaySettings() helper 验证明文回读**

```bash
cd /root/projects/umi/apps/api && pnpm exec tsx -e "
Promise.all([
  import('./src/modules/admin/system-payment-settings').then(m => m.loadWechatPaySettings()),
  import('./src/modules/admin/system-payment-settings').then(m => m.loadAlipaySettings()),
]).then(([w, a]) => {
  console.log('WECHAT:', JSON.stringify(w, null, 2));
  console.log('ALIPAY:', JSON.stringify(a, null, 2));
  process.exit(0);
});
"
```

预期：两个对象都返回，`apiV3Key` / `apiClientPrivateKey` / `appPrivateKey` 都是明文且与填入一致。

- [ ] **Step 6: KEK 改值重启 → GET 报错**

把 `.env.local` 的 `PAYMENT_SECRET_KEK` 改成另一个 base64 → 重启 api。在浏览器刷新参数设置页或 curl GET：

```bash
curl -sS -H "Authorization: Bearer <ADMIN_TOKEN>" http://127.0.0.1:4000/api/admin/payment-settings | jq
```

预期：500，错误消息体现 GCM 解密失败（如 "Unsupported state or unable to authenticate data" 或自定义抛错）。

> 验证完把 KEK 改回原值，重启 api 恢复。

- [ ] **Step 7: 用普通管理员账号验证权限隔离**

如果有非超管的 admin user 没分配 `system.settings.view` 也没 `system.manage`：用它登录 admin。

预期：
- 左侧菜单「系统设置」分组下不显示「参数设置」
- 直接拼 `#/system/settings` 进入 → 看到 403 / 无权访问页面
- curl GET 返回 403

- [ ] **Step 8: （可选）清理测试数据**

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "DELETE FROM payment_settings;"
```

- [ ] **Step 9: 验收完成，无新增改动，无需 commit**

---

## 完成标志

13 个 task 全 checked，spec §10 验收清单全部 pass，git log 看到 7-8 个干净的 commit。

后续工作（不在本计划范围）：
- P0 #15 支付链路：在新 PR 中 import `loadWechatPaySettings()` / `loadAlipaySettings()`，对接微信支付 v3 H5/Native + 支付宝 WAP 下单 + 验签 + 回调
- P1 #14：sessionStorage 传参替换为创建订单接口（与支付链路同期落）
