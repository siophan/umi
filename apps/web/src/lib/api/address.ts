import type {
  AddressPayload,
  UserAddressItem,
} from '@umi/shared';

import { deleteJson, getJson, postJson, putJson } from './shared';

export function fetchAddresses() {
  return getJson<UserAddressItem[]>('/api/addresses');
}

export function createAddress(payload: AddressPayload) {
  return postJson<UserAddressItem, AddressPayload>('/api/addresses', payload);
}

export function updateAddress(addressId: string, payload: AddressPayload) {
  return putJson<UserAddressItem, AddressPayload>(`/api/addresses/${addressId}`, payload);
}

export function deleteAddress(addressId: string) {
  return deleteJson<{ success: true; id: string }>(`/api/addresses/${addressId}`);
}
