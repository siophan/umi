import { Router } from 'express';
import { toEntityId, toOptionalEntityId } from '@umi/shared';
import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler } from '../../lib/errors';
import { getDbPool } from '../../lib/db';
import { ok } from '../../lib/http';
export const walletRouter = Router();
const LEDGER_TYPE_MAP = {
    10: 'credit',
    20: 'debit',
    30: 'refund',
    40: 'reward',
    50: 'adjust',
    60: 'init',
};
function sanitizeLedger(row) {
    const code = Number(row.type ?? 0);
    return {
        id: toEntityId(row.id),
        userId: toEntityId(row.user_id),
        type: LEDGER_TYPE_MAP[code] || 'adjust',
        amount: Number(row.amount ?? 0),
        balanceAfter: Number(row.balance_after ?? 0),
        sourceType: row.source_type === null ? '' : String(row.source_type),
        sourceId: toOptionalEntityId(row.source_id),
        note: row.note || '',
        createdAt: new Date(row.created_at).toISOString(),
    };
}
walletRouter.get('/ledger', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    const db = getDbPool();
    const [ledgerRows] = await db.execute(`
        SELECT id, user_id, type, amount, balance_after, source_type, source_id, note, created_at
        FROM coin_ledger
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 100
      `, [user.id]);
    const items = ledgerRows.map((row) => sanitizeLedger(row));
    ok(response, {
        balance: items[0]?.balanceAfter ?? 0,
        items,
    });
}));
