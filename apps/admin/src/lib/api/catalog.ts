import type { GuessListResult, WarehouseListResult } from '@umi/shared';

import { getJson } from './shared';

export interface AdminProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  shopId: string | null;
  price: number;
  stock: number;
  availableStock: number;
  frozenStock: number;
  status: 'active' | 'paused' | 'low_stock' | 'off_shelf' | 'disabled';
  shopName: string;
  updatedAt: string;
  tags: string[];
  imageUrl?: string | null;
  brandProductId?: string | null;
}

export interface AdminBrandLibraryItem {
  id: string;
  brandId: string | null;
  brandName: string;
  productName: string;
  category: string;
  guidePrice: number;
  status: 'active' | 'disabled';
  updatedAt: string;
  imageUrl: string | null;
  productCount: number;
  activeProductCount: number;
}

export interface AdminFriendGuessItem {
  id: string;
  guessId: string;
  roomName: string;
  inviterId: string;
  inviter: string;
  participants: number;
  reward: string;
  status: 'pending' | 'active' | 'ended';
  statusLabel: '待开赛' | '进行中' | '已结束';
  endTime: string;
  invitationCount: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  rejectedInvitations: number;
  expiredInvitations: number;
  confirmedResults: number;
  rejectedResults: number;
  betParticipantCount: number;
  paidAmount: number;
  paymentMode: number | null;
  paidBy: string | null;
}

export interface AdminPkMatchItem {
  id: string;
  guessId: string;
  title: string;
  leftUserId: string;
  leftUser: string;
  rightUserId: string;
  rightUser: string;
  leftChoice: string | null;
  rightChoice: string | null;
  stake: number;
  result: string;
  resultCode: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  statusLabel: '待开赛' | '进行中' | '完成' | '已取消';
  rewardType: number | null;
  rewardValue: number | null;
  rewardRefId: string | null;
  createdAt: string;
  settledAt: string | null;
}

export interface AdminWarehouseStats {
  totalVirtual: number;
  totalPhysical: number;
}

type PaginatedListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function fetchAdminProducts(query: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (query.page != null) {
    search.set('page', String(query.page));
  }
  if (query.pageSize != null) {
    search.set('pageSize', String(query.pageSize));
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return getJson<PaginatedListResult<AdminProduct>>(`/api/admin/products${suffix}`);
}

export function fetchAdminGuesses() {
  return getJson<GuessListResult>('/api/admin/guesses');
}

export function fetchAdminBrandLibrary(query: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (query.page != null) {
    search.set('page', String(query.page));
  }
  if (query.pageSize != null) {
    search.set('pageSize', String(query.pageSize));
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return getJson<PaginatedListResult<AdminBrandLibraryItem>>(
    `/api/admin/products/brand-library${suffix}`,
  );
}

export function fetchAdminFriendGuesses() {
  return getJson<{ items: AdminFriendGuessItem[] }>('/api/admin/guesses/friends');
}

export function fetchAdminPkMatches() {
  return getJson<{ items: AdminPkMatchItem[] }>('/api/admin/pk');
}

export function fetchWarehouseStats() {
  return getJson<AdminWarehouseStats>('/api/warehouse/admin/stats');
}

export function fetchAdminWarehouseItems(type: 'virtual' | 'physical') {
  return getJson<WarehouseListResult>(`/api/warehouse/admin/${type}`);
}
