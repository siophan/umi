import { asyncHandler } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import { createAdminBrandProduct, getAdminBrandLibrary, getAdminProducts, updateAdminBrandProduct, } from '../products';
import { getAdminRankingDetail, getAdminRankings } from '../rankings';
import { getRouteParam, toRouteHttpError } from '../route-helpers';
export function registerAdminCatalogRoutes(adminRouter) {
    adminRouter.get('/rankings', asyncHandler(async (request, response) => {
        ok(response, await getAdminRankings({
            boardType: typeof request.query.boardType === 'string'
                ? request.query.boardType
                : undefined,
            periodType: typeof request.query.periodType === 'string'
                ? request.query.periodType
                : undefined,
            periodValue: typeof request.query.periodValue === 'string'
                ? request.query.periodValue
                : undefined,
            topUser: typeof request.query.topUser === 'string' ? request.query.topUser : undefined,
        }));
    }));
    adminRouter.get('/rankings/:boardType/:periodType/:periodValue', asyncHandler(async (request, response) => {
        ok(response, await getAdminRankingDetail(getRouteParam(request.params.boardType), getRouteParam(request.params.periodType), decodeURIComponent(getRouteParam(request.params.periodValue))));
    }));
    adminRouter.get('/products', asyncHandler(async (request, response) => {
        ok(response, await getAdminProducts({
            page: Number(request.query.page ?? 1),
            pageSize: Number(request.query.pageSize ?? 20),
            keyword: typeof request.query.keyword === 'string'
                ? request.query.keyword
                : undefined,
            status: typeof request.query.status === 'string'
                ? request.query.status
                : undefined,
        }));
    }));
    adminRouter.get('/products/brand-library', asyncHandler(async (request, response) => {
        ok(response, await getAdminBrandLibrary({
            page: Number(request.query.page ?? 1),
            pageSize: Number(request.query.pageSize ?? 20),
            keyword: typeof request.query.keyword === 'string'
                ? request.query.keyword
                : undefined,
            status: typeof request.query.status === 'string'
                ? request.query.status
                : undefined,
            brandId: typeof request.query.brandId === 'string'
                ? request.query.brandId
                : undefined,
            categoryId: typeof request.query.categoryId === 'string'
                ? request.query.categoryId
                : undefined,
        }));
    }));
    adminRouter.post('/products/brand-library', asyncHandler(async (request, response) => {
        try {
            ok(response, await createAdminBrandProduct(request.body));
        }
        catch (error) {
            throw toRouteHttpError(error, {
                status: 400,
                code: 'ADMIN_BRAND_PRODUCT_CREATE_FAILED',
                message: '新增品牌商品失败',
            }, [
                { message: '品牌商品名称不能为空', status: 400, code: 'ADMIN_BRAND_PRODUCT_NAME_REQUIRED' },
                { message: '请选择品牌', status: 400, code: 'ADMIN_BRAND_PRODUCT_BRAND_REQUIRED' },
                { message: '请选择类目', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_REQUIRED' },
                { message: '指导价不合法', status: 400, code: 'ADMIN_BRAND_PRODUCT_GUIDE_PRICE_INVALID' },
                { message: '供货价不合法', status: 400, code: 'ADMIN_BRAND_PRODUCT_SUPPLY_PRICE_INVALID' },
                { message: '品牌不存在', status: 404, code: 'ADMIN_BRAND_PRODUCT_BRAND_NOT_FOUND' },
                { message: '品牌已停用', status: 400, code: 'ADMIN_BRAND_PRODUCT_BRAND_DISABLED' },
                { message: '品牌商品类目不存在', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_INVALID' },
                { message: '品牌商品类目已停用', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_DISABLED' },
                { message: '品牌商品名称已存在', status: 409, code: 'ADMIN_BRAND_PRODUCT_NAME_DUPLICATED' },
            ]);
        }
    }));
    adminRouter.put('/products/brand-library/:id', asyncHandler(async (request, response) => {
        try {
            ok(response, await updateAdminBrandProduct(getRouteParam(request.params.id), request.body));
        }
        catch (error) {
            throw toRouteHttpError(error, {
                status: 400,
                code: 'ADMIN_BRAND_PRODUCT_UPDATE_FAILED',
                message: '编辑品牌商品失败',
            }, [
                { message: '品牌商品名称不能为空', status: 400, code: 'ADMIN_BRAND_PRODUCT_NAME_REQUIRED' },
                { message: '请选择品牌', status: 400, code: 'ADMIN_BRAND_PRODUCT_BRAND_REQUIRED' },
                { message: '请选择类目', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_REQUIRED' },
                { message: '指导价不合法', status: 400, code: 'ADMIN_BRAND_PRODUCT_GUIDE_PRICE_INVALID' },
                { message: '供货价不合法', status: 400, code: 'ADMIN_BRAND_PRODUCT_SUPPLY_PRICE_INVALID' },
                { message: '品牌商品不存在', status: 404, code: 'ADMIN_BRAND_PRODUCT_NOT_FOUND' },
                { message: '品牌不存在', status: 404, code: 'ADMIN_BRAND_PRODUCT_BRAND_NOT_FOUND' },
                { message: '品牌已停用', status: 400, code: 'ADMIN_BRAND_PRODUCT_BRAND_DISABLED' },
                { message: '品牌商品类目不存在', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_INVALID' },
                { message: '品牌商品类目已停用', status: 400, code: 'ADMIN_BRAND_PRODUCT_CATEGORY_DISABLED' },
                { message: '品牌商品名称已存在', status: 409, code: 'ADMIN_BRAND_PRODUCT_NAME_DUPLICATED' },
            ]);
        }
    }));
}
