import type { CategoryId, EntityId } from './domain';

export type AdminCategoryBizTypeCode = 10 | 20 | 30 | 40;
export type AdminCategoryStatusValue = 'active' | 'disabled';

export interface CreateAdminCategoryPayload {
  bizTypeCode: AdminCategoryBizTypeCode;
  parentId?: CategoryId | null;
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  sort?: number;
  status?: AdminCategoryStatusValue;
}

export interface UpdateAdminCategoryPayload {
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  sort?: number;
}

export interface UpdateAdminCategoryStatusPayload {
  status: AdminCategoryStatusValue;
}

export interface UpdateAdminCategoryResult {
  id: CategoryId;
  status: AdminCategoryStatusValue;
}

export interface UpdateAdminSystemUserStatusPayload {
  status: 'active' | 'disabled';
}

export interface UpdateAdminSystemUserStatusResult {
  id: EntityId;
  status: 'active' | 'disabled';
}

export interface CreateAdminSystemUserPayload {
  username: string;
  password: string;
  displayName: string;
  phoneNumber?: string | null;
  email?: string | null;
  roleIds: EntityId[];
  status?: 'active' | 'disabled';
}

export interface UpdateAdminSystemUserPayload {
  username: string;
  displayName: string;
  phoneNumber?: string | null;
  email?: string | null;
  roleIds: EntityId[];
}

export interface ResetAdminSystemUserPasswordPayload {
  newPassword: string;
}

export interface AdminSystemUserMutationResult {
  id: EntityId;
}

export interface UpdateAdminRoleStatusPayload {
  status: 'active' | 'disabled';
}

export interface UpdateAdminRoleStatusResult {
  id: EntityId;
  status: 'active' | 'disabled';
}

export interface UpdateAdminRolePermissionsPayload {
  permissionIds: EntityId[];
}

export interface UpdateAdminRolePermissionsResult {
  id: EntityId;
  permissionIds: EntityId[];
}

export interface UpdateAdminPermissionStatusPayload {
  status: 'active' | 'disabled';
}

export interface UpdateAdminPermissionStatusResult {
  id: EntityId;
  status: 'active' | 'disabled';
}

export interface CreateAdminPermissionPayload {
  code: string;
  name: string;
  module: string;
  action: 'view' | 'create' | 'edit' | 'manage';
  parentId?: EntityId | null;
  sort?: number;
  status?: 'active' | 'disabled';
}

export interface CreateAdminRolePayload {
  code: string;
  name: string;
  description?: string;
  sort?: number;
  status?: 'active' | 'disabled';
}

export interface CreateAdminRoleResult {
  id: EntityId;
}

export interface UpdateAdminRolePayload {
  code: string;
  name: string;
  description?: string;
  sort?: number;
}

export interface UpdateAdminRoleResult {
  id: EntityId;
}

export interface CreateAdminNotificationPayload {
  title: string;
  content: string;
  type: 'system' | 'order' | 'guess' | 'social';
  audience: 'all_users' | 'order_users' | 'guess_users' | 'post_users' | 'chat_users';
  actionUrl?: string | null;
}

export interface CreateAdminNotificationResult {
  sentCount: number;
}

export interface UpdateAdminPermissionPayload {
  code: string;
  name: string;
  module: string;
  action: 'view' | 'create' | 'edit' | 'manage';
  parentId?: EntityId | null;
  sort?: number;
}

export interface AdminPermissionMutationResult {
  id: EntityId;
}

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
