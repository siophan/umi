import type { Router as ExpressRouter } from 'express';

import type {
  CreateAdminBrandPayload,
  ReviewAdminBrandAuthApplyPayload,
  ReviewAdminShopApplyPayload,
  UpdateAdminBrandPayload,
  UpdateAdminShopProductStatusPayload,
  UpdateAdminShopStatusPayload,
} from '@umi/shared';

import { asyncHandler, HttpError } from '../../../lib/errors';
import { ok } from '../../../lib/http';
import {
  createAdminBrand,
  getAdminBrandAuthApplies,
  getAdminBrandAuthRecords,
  getAdminBrands,
  getAdminShopApplies,
  getAdminShopDetail,
  getAdminShopProducts,
  getAdminShops,
  reviewAdminBrandAuthApply,
  reviewAdminShopApply,
  revokeAdminBrandAuthRecord,
  updateAdminBrand,
  updateAdminShopProductStatus,
  updateAdminShopStatus,
} from '../merchant';
import { getRouteParam, toRouteHttpError } from '../route-helpers';

export function registerAdminMerchantRoutes(adminRouter: ExpressRouter) {
  adminRouter.get(
    '/shops',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminShops());
    }),
  );

  adminRouter.put(
    '/shops/:id/status',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await updateAdminShopStatus(
            getRouteParam(request.params.id),
            request.body as UpdateAdminShopStatusPayload,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_SHOP_STATUS_UPDATE_FAILED',
            message: '更新店铺状态失败',
          },
          [{ message: '店铺不存在', status: 404, code: 'ADMIN_SHOP_NOT_FOUND' }],
        );
      }
    }),
  );

  adminRouter.get(
    '/shops/applies',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminShopApplies());
    }),
  );

  adminRouter.put(
    '/shops/applies/:id/review',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await reviewAdminShopApply(
            getRouteParam(request.params.id),
            request.body as ReviewAdminShopApplyPayload,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_SHOP_APPLY_REVIEW_FAILED',
            message: '开店申请审核失败',
          },
          [
            { message: '开店申请不存在', status: 404, code: 'ADMIN_SHOP_APPLY_NOT_FOUND' },
            { message: '申请已审核', status: 400, code: 'ADMIN_SHOP_APPLY_ALREADY_REVIEWED' },
            { message: '审核状态不合法', status: 400, code: 'ADMIN_REVIEW_STATUS_INVALID' },
            { message: '请填写拒绝原因', status: 400, code: 'ADMIN_REJECT_REASON_REQUIRED' },
          ],
        );
      }
    }),
  );

  adminRouter.get(
    '/shops/products',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminShopProducts());
    }),
  );

  adminRouter.put(
    '/shops/products/:id/status',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await updateAdminShopProductStatus(
            getRouteParam(request.params.id),
            request.body as UpdateAdminShopProductStatusPayload,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_SHOP_PRODUCT_STATUS_UPDATE_FAILED',
            message: '更新店铺商品状态失败',
          },
          [
            { message: '店铺商品不存在', status: 404, code: 'ADMIN_SHOP_PRODUCT_NOT_FOUND' },
            { message: '不可售商品不支持直接上下架', status: 400, code: 'ADMIN_SHOP_PRODUCT_DISABLED' },
            { message: '店铺未处于营业中，不能上架商品', status: 400, code: 'ADMIN_SHOP_PRODUCT_SHOP_INVALID' },
            { message: '品牌不可用，不能上架商品', status: 400, code: 'ADMIN_SHOP_PRODUCT_BRAND_INVALID' },
            { message: '品牌商品不可用，不能上架商品', status: 400, code: 'ADMIN_SHOP_PRODUCT_BRAND_PRODUCT_INVALID' },
          ],
        );
      }
    }),
  );

  adminRouter.get(
    '/shops/:id',
    asyncHandler(async (request, response) => {
      const detail = await getAdminShopDetail(getRouteParam(request.params.id));
      if (!detail) {
        throw new HttpError(404, 'ADMIN_SHOP_NOT_FOUND', '店铺不存在');
      }
      ok(response, detail);
    }),
  );

  adminRouter.get(
    '/brands',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminBrands());
    }),
  );

  adminRouter.post(
    '/brands',
    asyncHandler(async (request, response) => {
      try {
        ok(response, await createAdminBrand(request.body as CreateAdminBrandPayload));
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_BRAND_CREATE_FAILED',
            message: '新增品牌失败',
          },
          [
            { message: '品牌名称不能为空', status: 400, code: 'ADMIN_BRAND_NAME_REQUIRED' },
            { message: '请选择类目', status: 400, code: 'ADMIN_BRAND_CATEGORY_REQUIRED' },
            { message: '品牌类目不存在', status: 400, code: 'ADMIN_BRAND_CATEGORY_INVALID' },
            { message: '品牌类目已停用', status: 400, code: 'ADMIN_BRAND_CATEGORY_DISABLED' },
            { message: '品牌名称已存在', status: 409, code: 'ADMIN_BRAND_NAME_DUPLICATED' },
          ],
        );
      }
    }),
  );

  adminRouter.put(
    '/brands/:id',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await updateAdminBrand(
            getRouteParam(request.params.id),
            request.body as UpdateAdminBrandPayload,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_BRAND_UPDATE_FAILED',
            message: '编辑品牌失败',
          },
          [
            { message: '品牌名称不能为空', status: 400, code: 'ADMIN_BRAND_NAME_REQUIRED' },
            { message: '请选择类目', status: 400, code: 'ADMIN_BRAND_CATEGORY_REQUIRED' },
            { message: '品牌类目不存在', status: 400, code: 'ADMIN_BRAND_CATEGORY_INVALID' },
            { message: '品牌类目已停用', status: 400, code: 'ADMIN_BRAND_CATEGORY_DISABLED' },
            { message: '品牌名称已存在', status: 409, code: 'ADMIN_BRAND_NAME_DUPLICATED' },
            { message: '品牌不存在', status: 404, code: 'ADMIN_BRAND_NOT_FOUND' },
          ],
        );
      }
    }),
  );

  adminRouter.get(
    '/brands/auth-applies',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminBrandAuthApplies());
    }),
  );

  adminRouter.put(
    '/brands/auth-applies/:id/review',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await reviewAdminBrandAuthApply(
            getRouteParam(request.params.id),
            request.body as ReviewAdminBrandAuthApplyPayload,
          ),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_BRAND_AUTH_APPLY_REVIEW_FAILED',
            message: '品牌授权申请审核失败',
          },
          [
            { message: '品牌授权申请不存在', status: 404, code: 'ADMIN_BRAND_AUTH_APPLY_NOT_FOUND' },
            { message: '申请已审核', status: 400, code: 'ADMIN_BRAND_AUTH_APPLY_ALREADY_REVIEWED' },
            { message: '审核状态不合法', status: 400, code: 'ADMIN_REVIEW_STATUS_INVALID' },
            { message: '请填写拒绝原因', status: 400, code: 'ADMIN_REJECT_REASON_REQUIRED' },
          ],
        );
      }
    }),
  );

  adminRouter.get(
    '/brands/auth-records',
    asyncHandler(async (_request, response) => {
      ok(response, await getAdminBrandAuthRecords());
    }),
  );

  adminRouter.put(
    '/brands/auth-records/:id/revoke',
    asyncHandler(async (request, response) => {
      try {
        ok(
          response,
          await revokeAdminBrandAuthRecord(getRouteParam(request.params.id)),
        );
      } catch (error) {
        throw toRouteHttpError(
          error,
          {
            status: 400,
            code: 'ADMIN_BRAND_AUTH_RECORD_REVOKE_FAILED',
            message: '撤销品牌授权失败',
          },
          [
            { message: '品牌授权记录不存在', status: 404, code: 'ADMIN_BRAND_AUTH_RECORD_NOT_FOUND' },
            { message: '当前授权不可撤销', status: 400, code: 'ADMIN_BRAND_AUTH_RECORD_NOT_REVOCABLE' },
            { message: '当前授权范围数据不合法', status: 400, code: 'ADMIN_BRAND_AUTH_SCOPE_INVALID' },
          ],
        );
      }
    }),
  );
}
