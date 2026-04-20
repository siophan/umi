import {
  bearerSecurity,
  errorResponse,
  jsonRequestBody,
  successResponse,
} from '../shared';

export const shopPaths = {
  '/api/shops/me': {
    get: {
      tags: ['Shop'],
      summary: '获取我的店铺信息',
      security: bearerSecurity,
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            shop: {
              oneOf: [
                { type: 'object', additionalProperties: true },
                { type: 'null' },
              ],
            },
            brandAuths: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
            products: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
        }),
        401: errorResponse(401, '请先登录'),
        500: errorResponse(500, '读取店铺失败'),
      },
    },
  },
  '/api/shops/me/status': {
    get: {
      tags: ['Shop'],
      summary: '获取我的开店状态',
      security: bearerSecurity,
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['none', 'pending', 'rejected', 'active'],
              example: 'pending',
            },
            shop: {
              oneOf: [
                { type: 'object', additionalProperties: true },
                { type: 'null' },
              ],
            },
            latestApplication: {
              oneOf: [
                { type: 'object', additionalProperties: true },
                { type: 'null' },
              ],
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'name'],
                properties: {
                  id: { type: 'string', example: '12' },
                  name: { type: 'string', example: '零食百货' },
                },
              },
            },
          },
        }),
        401: errorResponse(401, '请先登录'),
        500: errorResponse(500, '读取开店状态失败'),
      },
    },
  },
  '/api/shops/apply': {
    post: {
      tags: ['Shop'],
      summary: '提交开店申请',
      security: bearerSecurity,
      requestBody: jsonRequestBody({
        $ref: '#/components/schemas/SubmitShopApplicationPayload',
      }),
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            id: { type: 'string', example: '301' },
            applyNo: { type: 'string', example: 'SAa1b2c3d4e5f6' },
            status: { type: 'string', example: 'pending' },
          },
        }),
        400: errorResponse(400, '请填写店铺名称'),
        401: errorResponse(401, '请先登录'),
        500: errorResponse(500, '提交开店申请失败'),
      },
    },
  },
  '/api/shops/brand-auth': {
    get: {
      tags: ['Shop'],
      summary: '获取品牌授权概览',
      security: bearerSecurity,
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            shopName: {
              type: 'string',
              nullable: true,
              example: 'Joy Select',
            },
            mine: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
            available: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
        }),
        401: errorResponse(401, '请先登录'),
        500: errorResponse(500, '读取品牌授权失败'),
      },
    },
    post: {
      tags: ['Shop'],
      summary: '提交品牌授权申请',
      security: bearerSecurity,
      requestBody: jsonRequestBody({
        $ref: '#/components/schemas/SubmitBrandAuthApplicationPayload',
      }),
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            id: { type: 'string', example: '501' },
            status: { type: 'string', example: 'pending' },
          },
        }),
        400: errorResponse(400, '请先创建店铺'),
        401: errorResponse(401, '请先登录'),
        500: errorResponse(500, '提交品牌授权失败'),
      },
    },
  },
  '/api/shops/brand-products': {
    get: {
      tags: ['Shop'],
      summary: '获取品牌商品列表',
      security: bearerSecurity,
      parameters: [
        {
          name: 'brandId',
          in: 'query',
          required: true,
          description: '品牌 ID',
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
        }),
        400: errorResponse(400, '缺少 brandId'),
        401: errorResponse(401, '请先登录'),
        403: errorResponse(403, '该品牌尚未授权'),
        500: errorResponse(500, '读取品牌商品失败'),
      },
    },
  },
  '/api/shops/products': {
    post: {
      tags: ['Shop'],
      summary: '上架品牌商品到店铺',
      security: bearerSecurity,
      requestBody: jsonRequestBody({
        $ref: '#/components/schemas/AddShopProductsPayload',
      }),
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            count: { type: 'integer', example: 2 },
          },
        }),
        400: errorResponse(400, '请选择品牌和商品'),
        401: errorResponse(401, '请先登录'),
        403: errorResponse(403, '该品牌尚未授权'),
        500: errorResponse(500, '上架商品失败'),
      },
    },
  },
} as const;
