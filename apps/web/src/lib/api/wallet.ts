import type { WalletLedgerResult } from '@umi/shared';

import { getJson } from './shared';

export function fetchWalletLedger() {
  return getJson<WalletLedgerResult>('/api/wallet/ledger');
}
