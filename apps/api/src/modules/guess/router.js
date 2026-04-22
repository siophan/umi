import { Router } from 'express';
import { getRequestUser, requireUser } from '../../lib/auth';
import { asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
import { getUserHistoryResult } from './guess-history';
import { getGuessDetail, getGuessList, getGuessStats } from './guess-read';
export const guessRouter = Router();
guessRouter.get('/user/history', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getUserHistoryResult(user.id, user.name));
}));
guessRouter.get('/my-bets', requireUser, asyncHandler(async (request, response) => {
    const user = getRequestUser(request);
    ok(response, await getUserHistoryResult(user.id, user.name));
}));
guessRouter.get('/', asyncHandler(async (request, response) => {
    ok(response, await getGuessList({ q: request.query.q, limit: request.query.limit }));
}));
guessRouter.get('/:id', asyncHandler(async (request, response) => {
    ok(response, await getGuessDetail(request.params.id));
}));
guessRouter.get('/:id/stats', asyncHandler(async (request, response) => {
    ok(response, await getGuessStats(request.params.id));
}));
