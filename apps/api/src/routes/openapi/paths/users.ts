import {
  bearerSecurity,
  errorResponse,
  jsonRequestBody,
  pathIdParameter,
  successResponse,
} from '../shared';

export const userPaths = {
  '/api/users/me': {
    get: {
      tags: ['User'],
      summary: '获取当前用户',
      security: bearerSecurity,
      responses: {
        200: successResponse({
          type: 'object',
          additionalProperties: true,
          example: {
            id: '1',
            name: 'Joy User',
            phone: '13800138000',
          },
        }),
        401: errorResponse(401, '请先登录'),
      },
    },
    put: {
      tags: ['User'],
      summary: '更新当前用户资料',
      security: bearerSecurity,
      requestBody: jsonRequestBody({
        $ref: '#/components/schemas/UpdateMePayload',
      }),
      responses: {
        200: successResponse({
          type: 'object',
          additionalProperties: true,
          example: {
            id: '1',
            name: '新昵称',
          },
        }),
        400: errorResponse(400, '更新资料失败'),
        401: errorResponse(401, '请先登录'),
      },
    },
  },
  '/api/users/me/activity': {
    get: {
      tags: ['User'],
      summary: '获取我的动态',
      security: bearerSecurity,
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            unreadMessageCount: { type: 'integer', example: 3 },
            works: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
            bookmarks: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
            likes: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
        }),
        401: errorResponse(401, '请先登录'),
      },
    },
  },
  '/api/users/me/summary': {
    get: {
      tags: ['User'],
      summary: '获取我的页汇总数据',
      security: bearerSecurity,
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            activeOrderCount: { type: 'integer', example: 2 },
            warehouseItemCount: { type: 'integer', example: 8 },
            availableCouponCount: { type: 'integer', example: 3 },
          },
        }),
        401: errorResponse(401, '请先登录'),
      },
    },
  },
  '/api/users/search': {
    get: {
      tags: ['User'],
      summary: '搜索或推荐用户',
      security: bearerSecurity,
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
          },
          description: '搜索关键词，支持昵称、签名、优米号、店铺名',
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
        401: errorResponse(401, '请先登录'),
      },
    },
  },
  '/api/users/{id}': {
    get: {
      tags: ['User'],
      summary: '获取用户资料',
      parameters: [pathIdParameter('id', '用户 UID')],
      responses: {
        200: successResponse({
          type: 'object',
          additionalProperties: true,
          example: {
            id: '1',
            name: 'Joy User',
            signature: '有点准',
            worksVisible: false,
            likedVisible: true,
          },
        }),
        404: errorResponse(404, '用户不存在'),
      },
    },
  },
  '/api/users/{id}/activity': {
    get: {
      tags: ['User'],
      summary: '获取用户公开动态',
      parameters: [pathIdParameter('id', '用户 UID')],
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            worksVisible: { type: 'boolean', example: true },
            likedVisible: { type: 'boolean', example: false },
            works: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
            likes: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
        }),
        404: errorResponse(404, '用户不存在'),
      },
    },
  },
  '/api/users/{id}/follow': {
    post: {
      tags: ['User'],
      summary: '关注用户',
      security: bearerSecurity,
      parameters: [pathIdParameter('id', '用户内部 ID')],
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
          },
        }),
        400: errorResponse(400, '关注失败'),
        401: errorResponse(401, '请先登录'),
      },
    },
    delete: {
      tags: ['User'],
      summary: '取消关注用户',
      security: bearerSecurity,
      parameters: [pathIdParameter('id', '用户内部 ID')],
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
          },
        }),
        400: errorResponse(400, '取消关注失败'),
        401: errorResponse(401, '请先登录'),
      },
    },
  },
} as const;
