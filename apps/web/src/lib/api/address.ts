import type {
  AddressPayload,
  UserAddressItem,
} from '@umi/shared';

import { deleteJson, getJson, postJson, putJson } from './shared';

// 读取当前用户地址列表。
export function fetchAddresses() {
  return getJson<UserAddressItem[]>('/api/addresses');
}

// 新增收货地址。
export function createAddress(payload: AddressPayload) {
  return postJson<UserAddressItem, AddressPayload>('/api/addresses', payload);
}

// 更新指定收货地址。
export function updateAddress(addressId: string, payload: AddressPayload) {
  return putJson<UserAddressItem, AddressPayload>(`/api/addresses/${addressId}`, payload);
}

// 删除指定收货地址。
export function deleteAddress(addressId: string) {
  return deleteJson<{ success: true; id: string }>(`/api/addresses/${addressId}`);
}
