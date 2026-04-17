export const guessStatuses = [
  'draft',
  'pending_review',
  'active',
  'settled',
  'cancelled',
] as const;

export const guessReviewStatuses = [
  'pending',
  'approved',
  'rejected',
] as const;

export const orderStatuses = [
  'pending',
  'paid',
  'shipping',
  'delivered',
  'completed',
  'refund_pending',
  'refunded',
  'cancelled',
] as const;

export const warehouseStatuses = [
  'stored',
  'locked',
  'converted',
  'consigning',
  'shipping',
  'delivered',
  'completed',
] as const;

export const ledgerTypes = [
  'credit',
  'debit',
  'refund',
  'reward',
  'adjust',
  'init',
] as const;

export type GuessStatus = (typeof guessStatuses)[number];
export type GuessReviewStatus = (typeof guessReviewStatuses)[number];
export type OrderStatus = (typeof orderStatuses)[number];
export type WarehouseStatus = (typeof warehouseStatuses)[number];
export type LedgerType = (typeof ledgerTypes)[number];
