---
date: 2026-04-28
status: draft
owner: ezrealyin2026@gmail.com
---

# Admin 参数设置 — 微信支付 / 支付宝支付 配置

## 1. 背景与目标

P0 #15 支付链路尚未对接。本设计为支付链路落地前置：在管理后台「系统设置」分组下新增「参数设置」页面，承载微信支付（v3）与支付宝支付的商户/密钥参数管理。

本期不做：支付 SDK 集成、调用方接入、沙箱切换、连通性测试。仅落「参数能存能读」。

## 2. 范围与决策

| 项 | 决定 |
|---|---|
| 作用域 | 平台全局一套（不区分店铺） |
| 微信支付版本 | v3，启用场景：H5 + Native |
| 支付宝模式 | 公钥证书模式，启用场景：WAP |
| 敏感字段加密 | AES-256-GCM，KEK 从 `PAYMENT_SECRET_KEK` env 读取 |
| 列表脱敏 + 留空保持不变 | 是 |
| 沙箱切换 | 不做（单一正式参数；future 加 `env` 字段时一次迁移） |
| 测试连通性按钮 | 不做（属于支付链路接入工作） |
| 多管理员并发 | 不加乐观锁（配置场景并发风险极低；后写赢，靠 `updated_by` 复盘） |
| 审计日志 | 不专门起表；记录 `updated_by` + `updated_at` + 进程 log |

## 3. 菜单 / 路由 / 权限

### 3.1 菜单

`apps/admin/src/lib/admin-menu-config.tsx` 的 `system-group.children` 末尾追加：

```tsx
{
  key: '/system/settings',
  path: '/system/settings',
  icon: <SettingOutlined />,
  name: '参数设置',
  access: menuAccess('/system/settings'),
}
```

### 3.2 权限

`packages/shared/src/admin-permissions.ts` 在 `system.manage` 子项末尾追加：

```ts
{
  code: 'system.settings.view',
  name: '参数设置',
  module: 'system',
  action: 'view',
  parentCode: 'system.manage',
  sort: 1060,
  path: '/system/settings',
}
```

只一个 `view` 权限同时控制读/写，与同组 `system.users.view` / `system.categories.view` 等粒度对齐。

### 3.3 路由

`apps/admin/src/lib/admin-page-registry.tsx` 加：

```ts
'/system/settings': SystemSettingsPage,
```

新建页面 `apps/admin/src/pages/system-settings-page.tsx`。

## 4. 数据库

### 4.1 DDL（手动执行）

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

注：仓库未启用迁移工具，DDL 随 PR 描述给出，由 owner 手动执行。

### 4.2 `config_public` JSON 形状

**wechat**：
```json
{
  "mchid": "1900000001",
  "cert_serial_no": "5BB3C...",
  "platform_cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "notify_url": "https://your.domain/api/payment/wechat/notify",
  "scenes": ["h5", "native"]
}
```

**alipay**：
```json
{
  "app_id": "2021000000000000",
  "app_public_cert": "-----BEGIN CERTIFICATE-----\n...",
  "alipay_public_cert": "-----BEGIN CERTIFICATE-----\n...",
  "alipay_root_cert": "-----BEGIN CERTIFICATE-----\n...",
  "notify_url": "https://your.domain/api/payment/alipay/notify",
  "return_url": "https://your.domain/payment/return/alipay",
  "scenes": ["wap"]
}
```

证书均为公开内容（任何人能从对方 cert chain 读取），不加密。

### 4.3 `secrets_enc` 解密后 JSON 形状

**wechat**：
```json
{
  "api_v3_key": "32 字符 APIv3 密钥",
  "api_client_private_key": "-----BEGIN PRIVATE KEY-----\n..."
}
```

**alipay**：
```json
{
  "app_private_key": "-----BEGIN PRIVATE KEY-----\n..."
}
```

`secrets_enc` 二进制布局：`iv(12B) || tag(16B) || ciphertext`。

## 5. 加密 helper

新文件 `apps/api/src/lib/secret-crypto.ts`：

```ts
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
  const data = Buffer.concat([cipher.update(JSON.stringify(plaintext), 'utf8'), cipher.final()]);
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

`apps/api/src/env.ts` 加：

```ts
paymentSecretKek: process.env.PAYMENT_SECRET_KEK ?? '',
```

启动不强校验：未配置时其他模块不受影响；只在访问参数设置且需要解密/加密时抛错。

`.env.example`（如有）追加：

```bash
# 参数设置 KEK，32 字节 base64：openssl rand -base64 32
PAYMENT_SECRET_KEK=
```

## 6. 后端接口

新模块文件 `apps/api/src/modules/admin/system-payment-settings.ts`，挂到 `apps/api/src/modules/admin/router.ts`。

### 6.1 `GET /api/admin/payment-settings`

权限：`system.settings.view`

返回（每个 secret 字段返回 `{ hasValue, preview }` 而不是明文）：

```json
{
  "wechat": {
    "config": {
      "mchid": "1900000001",
      "cert_serial_no": "5BB3C...",
      "platform_cert": "-----BEGIN CERTIFICATE-----\n...",
      "notify_url": "https://...",
      "scenes": ["h5","native"]
    },
    "secrets_masked": {
      "api_v3_key":             { "hasValue": true,  "preview": "••••abcd" },
      "api_client_private_key": { "hasValue": true,  "preview": "PEM 已配置" }
    },
    "updated_at": "2026-04-28T08:30:00.000Z",
    "updated_by": { "id": 1, "username": "admin" }
  },
  "alipay": {
    "config": { },
    "secrets_masked": {
      "app_private_key": { "hasValue": false, "preview": null }
    },
    "updated_at": null,
    "updated_by": null
  }
}
```

行为：
- 行不存在 → 返回 `config: {}`、`secrets_masked.*: { hasValue: false, preview: null }`，前端表单不崩
- preview 规则：
  - `api_v3_key`（32 字符随机串）→ `••••` + 末 4 位
  - PEM 私钥 → 统一 `"PEM 已配置"`，不暴露任何字节

### 6.2 `PUT /api/admin/payment-settings/:channel`

权限：`system.settings.view`，`channel ∈ {wechat, alipay}`

请求体：

```json
{
  "config": { "mchid": "...", "cert_serial_no": "...", "platform_cert": "...", "notify_url": "...", "scenes": ["h5","native"] },
  "secrets": {
    "api_v3_key": "新值，或 null（保持不变）",
    "api_client_private_key": "PEM 文本，或 null"
  }
}
```

服务端流程：

1. 校验 `channel` 白名单
2. zod `.strict()` 校验 `config`，多余 key 拒绝：
   - **wechat**：`mchid` 非空 + 数字串；`cert_serial_no` 非空；`platform_cert` 含 `BEGIN CERTIFICATE`；`notify_url` http(s) URL；`scenes` ⊂ `['h5','native']` 且 `min(1)`
   - **alipay**：`app_id` 非空；3 张 cert 均含 `BEGIN CERTIFICATE`；`notify_url`/`return_url` http(s) URL；`scenes` ⊂ `['wap']` 且 `min(1)`
3. **secrets 合并策略**：读出现有 `secrets_enc` → decrypt → 用 body 中**非 null** 的字段覆盖 → 重新 encrypt 写回。null 值保持原值不变（即"留空保持不变"语义）
4. `INSERT ... ON DUPLICATE KEY UPDATE` 写回，按 `channel` 主键 upsert
5. 进程 log `channel` / `updated_by` / `updated_at`（不 log secret 任何形态，包括 length）
6. 返回与 GET 同结构，让前端直接 setState

### 6.3 内部读取 helper

同模块文件 export，**不挂任何 HTTP 路由**，仅供 server 内部支付链路 import：

```ts
export async function loadWechatPaySettings(): Promise<{
  mchid: string;
  certSerialNo: string;
  platformCert: string;
  notifyUrl: string;
  scenes: ('h5' | 'native')[];
  apiV3Key: string;
  apiClientPrivateKey: string;
} | null>;

export async function loadAlipaySettings(): Promise<{
  appId: string;
  appPublicCert: string;
  alipayPublicCert: string;
  alipayRootCert: string;
  notifyUrl: string;
  returnUrl: string;
  scenes: ('wap')[];
  appPrivateKey: string;
} | null>;
```

约定：
- 字段命名 camelCase（与 ts 风格对齐），与 DB 的 snake_case 在 module 边界转换
- 行不存在 / `secrets_enc` 为空 → 返回 `null`，调用方决定如何处理（一般抛业务错"未配置支付参数"）
- 不做内存缓存：参数改了立刻生效；AES-GCM 单次解密 < 1ms，调用频率本身不高

### 6.4 shared 类型

`packages/shared/src/api-admin-system.ts` 追加：

- `PaymentChannel = 'wechat' | 'alipay'`
- `WechatPaymentConfig` / `AlipayPaymentConfig`：公开字段 shape
- `PaymentSecretsMasked`：`Record<string, { hasValue: boolean; preview: string | null }>`
- `PaymentSettingsChannelData`：`{ config, secrets_masked, updated_at, updated_by }`
- `PaymentSettingsResponse`：`{ wechat: PaymentSettingsChannelData<wechat>, alipay: PaymentSettingsChannelData<alipay> }`
- `UpdatePaymentSettingsPayload<C extends PaymentChannel>`：`{ config, secrets: Record<string, string | null> }`

## 7. 前端

### 7.1 文件结构

```
apps/admin/src/pages/system-settings-page.tsx                ~250 行 — 页面壳 + Tabs + 数据加载
apps/admin/src/components/payment-settings-wechat-form.tsx   ~150 行 — wechat 表单
apps/admin/src/components/payment-settings-alipay-form.tsx   ~150 行 — alipay 表单
apps/admin/src/lib/api/system-settings.ts                    ~40  行 — fetcher
```

拆分原因：单文件控制在 ~400 行内；与同目录 form 组件抽离风格对齐（参考 `admin-notification-form-modal.tsx`）。

### 7.2 页面结构

- **PageHeader** "参数设置"，右侧显示当前 tab 的 `更新时间 + 更新人`
- **Tabs**（受控）：`微信支付` / `支付宝支付`
- 每个 tab 一个 antd `Form`，自有 `[保存] [重置]` 按钮（**单 tab 各自保存**，无全局保存）
- **切换 tab**：当前 tab dirty 时弹 `Modal.confirm` 二次确认；丢弃修改后再切

### 7.3 字段（按 form item 顺序）

**微信支付**：
1. 商户号 `mchid`（Input，required）
2. 商户证书序列号 `cert_serial_no`（Input，required）
3. 商户私钥 `api_client_private_key`（**secret**，Input.TextArea autoSize 10-16，placeholder = `secrets_masked.preview`）
4. APIv3 密钥 `api_v3_key`（**secret**，Input.Password，placeholder = `secrets_masked.preview`）
5. 平台证书 `platform_cert`（Input.TextArea autoSize 8-16，required）
6. 支付回调地址 `notify_url`（Input，required，URL 校验）
7. 启用支付场景 `scenes`（Checkbox.Group：H5 / Native，required，至少选一）

**支付宝支付**：
1. AppID `app_id`（Input，required）
2. 应用私钥 `app_private_key`（**secret**，Input.TextArea，placeholder）
3. 应用公钥证书 `app_public_cert`（Input.TextArea，required）
4. 支付宝公钥证书 `alipay_public_cert`（Input.TextArea，required）
5. 支付宝根证书 `alipay_root_cert`（Input.TextArea，required）
6. 支付通知地址 `notify_url`（Input，required，URL）
7. 同步返回地址 `return_url`（Input，required，URL）
8. 启用支付场景 `scenes`（Checkbox.Group：WAP，required）

### 7.4 secret 字段交互

- form 初始值始终为 `''`（GET 不回传明文，所以输入框首次渲染必然空）
- 提交时：值为 `''` → 映射为 `null` → 后端"保持不变"
- 提交时：值为非空字符串 → 提交原值 → 后端覆盖
- placeholder 用 `secrets_masked.<key>.preview`：未配置时 `"未配置，请填入"`，已配置时 `"••••abcd"` 或 `"PEM 已配置"`
- label 后挂 antd `Tag`：`hasValue=true` 绿色"已配置"，`false` 灰色"未配置"
- 必填 rules：仅在 `secrets_masked.hasValue === false` 时 required；已配置时允许留空
- **无法清空已配置 secret**：留空 = 保持不变；要"清掉"只能覆盖成新值。本期不提供"删除支付配置"功能（支付配置一旦填了就该是常驻状态；删除场景可由 owner 直接操作 DB）

### 7.5 PEM/证书输入体验

`Input.TextArea`：`autoSize={{ minRows: 8, maxRows: 16 }}`、`spellCheck={false}`、`autoComplete="off"`、`autoCorrect="off"`。不做文件上传——证书/私钥本来就是文本，复制粘贴是支付平台官方推荐的接入方式，避免引入文件编码/换行/路径问题。

### 7.6 保存/重置/错误

- **保存**：调 `PUT /api/admin/payment-settings/:channel`，把空字符串映射为 null；成功 `message.success`，用返回数据更新 form 和 secrets_masked；失败 `message.error(error.message)`，表单不清空
- **重置**：恢复到上次 GET 状态（不调接口）
- **校验失败**：antd Form 自动行内提示

## 8. 安全

| 项 | 处理 |
|---|---|
| 列表/详情接口 | secret 字段一律 `{ hasValue, preview }`，**永远不回明文**（含超管） |
| 内部 helper | 不挂 HTTP 路由，仅 server 内部 import |
| 写接口 | zod `.strict()` 白名单；secrets 字段 null 保持原值 |
| KEK 缺失（启动） | 不强校验（其他模块不受影响） |
| KEK 缺失（GET 触发解密）| 返回 500 + 文案"PAYMENT_SECRET_KEK 未配置，无法解密"；首次配置（`secrets_enc` 为空）不触发解密 |
| AES-GCM 解密失败 | 抛"支付参数密钥已变更，无法解密旧数据。请重新配置"（KEK 改了的情况） |
| 日志 | secret 字段任何形态都不进 log（含 length）；只记 `channel` / `updated_by` / `updated_at` |
| 权限 | 路由用 `system.settings.view` RBAC；前端 menu 已按 permission 隐藏 |
| 表单 input | `autoComplete="off"` `spellCheck={false}`；密钥串 `Input.Password`；PEM `Input.TextArea`（多行不能用 password 类型） |

## 9. 错误边界

| 场景 | 行为 |
|---|---|
| 第一次进页面，DB 空 | GET 返回空 config + secrets `hasValue:false`；前端 form 全空，所有 secret tag "未配置" |
| 公开字段格式错 | zod 422，前端按字段展示错误 |
| `scenes` 空数组 | 后端拒绝（`min(1)`） |
| KEK 未设但提交 secret | encrypt 抛 500；前端展示"服务端 KEK 未配置，请联系运维设置 PAYMENT_SECRET_KEK 后再试" |
| 并发更新 | upsert 后写覆盖；不加乐观锁；`updated_by` 复盘 |
| tab 切换有未保存改动 | Modal.confirm 二次确认 |
| 浏览器关 / 刷新 | 不拦截（admin 内部工具，beforeunload 噪音不值） |

## 10. 测试 / 验收

先看 `apps/api/src/modules/admin/` 是否有现成单测：
- 有 → 跟着风格补 `system-payment-settings.test.ts`，覆盖：
  1. GET 空表
  2. PUT 全字段 → GET 回读字段一致 + 脱敏
  3. PUT secrets 留 null → 原值保持
  4. PUT 覆盖 secrets → preview 末 4 位匹配新值
  5. encrypt + decrypt round trip
- 无 → 不专门起测试基础设施；按下方手动验收清单

**手动验收清单**：
1. `openssl rand -base64 32` 生成 KEK，写入 `.env` `PAYMENT_SECRET_KEK=`，重启 API
2. 进 `/system/settings`，wechat tab，全字段填一遍，保存 → 刷新 → 公开字段还在，secret 字段输入框空、placeholder 显示 preview、tag "已配置"
3. wechat tab 只改 mchid，secret 字段留空保存 → 刷新 → mchid 变了，secret 仍标"已配置"，preview 不变
4. wechat tab 重新填 APIv3 密钥保存 → 刷新 → preview 末 4 位匹配新值；DB `secrets_enc` BLOB 长度变化
5. alipay tab 同流程
6. 临时调用 `loadWechatPaySettings()`（node REPL 或一次性临时路由），返回的 `apiV3Key` / `apiClientPrivateKey` 是明文且与填入一致
7. 把 `.env` 里 KEK 改成另一个值重启 → GET 报"密钥已变更，无法解密"
8. 普通管理员（无 `system.settings.view`）登录 → 菜单不显示「参数设置」；直接拼 hash `/system/settings` → 403

## 11. 与 P0 #15（支付链路未完成）的关系

本期是 P0 #15 的前置。后续支付链路 PR：
- import `loadWechatPaySettings()` / `loadAlipaySettings()` 拿配置
- 实现微信支付 v3 H5/Native 下单 + 回调验签
- 实现支付宝 WAP 下单 + return_url + notify_url 验签
- 取代 sessionStorage 传参（CLAUDE.md P1 #14）和 cart→payment 之间的临时数据流

## 12. 不做（YAGNI 兜底）

- 沙箱/正式环境切换
- 测试连通性按钮
- 多商户/分店铺配置
- 文件上传方式录入证书
- 乐观锁 / 版本号
- 专用 audit log 表
- 内存缓存
- 全局"保存全部"按钮
