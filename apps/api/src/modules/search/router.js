import { Router } from 'express';
import { getRequestUser, optionalUser } from '../../lib/auth';
import { HttpError, asyncHandler } from '../../lib/errors';
import { ok } from '../../lib/http';
import { getHotSearches, getSearchSuggestions } from './search-discovery';
import { searchGuesses } from './search-guesses';
import { searchProducts } from './search-products';
import { SEARCH_LIMIT_DEFAULT, SEARCH_LIMIT_MAX } from './search-shared';
export const searchRouter = Router();
searchRouter.get('/', optionalUser, asyncHandler(async (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    if (!query) {
        throw new HttpError(400, 'SEARCH_QUERY_REQUIRED', '缺少搜索关键词');
    }
    const tab = request.query.tab === 'product' || request.query.tab === 'guess' || request.query.tab === 'all'
        ? request.query.tab
        : 'all';
    const sort = request.query.sort === 'sales' ||
        request.query.sort === 'price-asc' ||
        request.query.sort === 'price-desc' ||
        request.query.sort === 'rating' ||
        request.query.sort === 'default'
        ? request.query.sort
        : 'default';
    const rawLimit = typeof request.query.limit === 'string' ? Number.parseInt(request.query.limit, 10) : NaN;
    const limit = Number.isFinite(rawLimit)
        ? Math.min(Math.max(rawLimit, 1), SEARCH_LIMIT_MAX)
        : SEARCH_LIMIT_DEFAULT;
    const user = request.user ? getRequestUser(request) : null;
    const [products, guesses] = await Promise.all([
        tab === 'guess' ? Promise.resolve({ items: [], total: 0 }) : searchProducts(query, sort, limit, user?.id),
        tab === 'product' ? Promise.resolve({ items: [], total: 0 }) : searchGuesses(query, limit),
    ]);
    ok(response, {
        query,
        tab,
        sort,
        products,
        guesses,
    });
}));
searchRouter.get('/hot', asyncHandler(async (request, response) => {
    const rawLimit = typeof request.query.limit === 'string' ? Number.parseInt(request.query.limit, 10) : NaN;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 8;
    ok(response, await getHotSearches(limit));
}));
searchRouter.get('/suggest', asyncHandler(async (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    const rawLimit = typeof request.query.limit === 'string' ? Number.parseInt(request.query.limit, 10) : NaN;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 8;
    ok(response, await getSearchSuggestions(query, limit));
}));
