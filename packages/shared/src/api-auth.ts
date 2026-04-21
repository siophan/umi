import type { EntityId, UserSummary } from './domain';

export type AuthMethod = 'code' | 'password';
export type SmsBizType = 'register' | 'login' | 'reset_password';

export interface LoginPayload {
  phone: string;
  method: AuthMethod;
  code?: string;
  password?: string;
}

export interface LoginResult {
  token: string;
  user: UserSummary;
}

export interface AdminRoleItem {
  id: EntityId;
  code: string;
  name: string;
}

export interface AdminProfile {
  id: EntityId;
  username: string;
  displayName: string;
  phoneNumber?: string | null;
  email?: string | null;
  status: 'active' | 'disabled';
  roles: AdminRoleItem[];
  permissions: string[];
  permissionModules: string[];
}

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface AdminLoginResult {
  token: string;
  user: AdminProfile;
}

export interface SendCodePayload {
  phone: string;
  bizType: SmsBizType;
}

export interface SendCodeResult {
  sent: boolean;
  devCode?: string;
}

export interface VerifyCodePayload {
  phone: string;
  code: string;
  bizType: SmsBizType;
}

export interface VerifyCodeResult {
  verified: true;
}

export interface RegisterPayload {
  phone: string;
  code: string;
  password: string;
  name: string;
  avatar?: string;
}

export interface LogoutResult {
  success: true;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword: string;
}

export interface ResetPasswordPayload {
  phone: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordResult {
  success: true;
}
