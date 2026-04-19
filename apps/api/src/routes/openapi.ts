import type { Express, Request, Response } from 'express';

function successResponse(
  dataSchema: Record<string, unknown>,
  description = 'OK',
) {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: dataSchema,
            message: {
              type: 'string',
            },
          },
        },
      },
    },
  };
}

function errorResponse(
  status: number,
  message: string,
  description = 'Request failed',
) {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: message,
            },
            status: {
              type: 'integer',
              example: status,
            },
          },
        },
      },
    },
  };
}

function jsonRequestBody(
  schema: Record<string, unknown>,
  description?: string,
) {
  return {
    required: true,
    description,
    content: {
      'application/json': {
        schema,
      },
    },
  };
}

function pathIdParameter(name: string, description: string) {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: {
      type: 'string',
    },
  };
}

const bearerSecurity = [{ bearerAuth: [] }];

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Joy API',
    version: '0.1.0',
    description: '`umi/apps/api` 当前接口在线调试文档。',
  },
  servers: [
    {
      url: '/',
      description: 'Current server',
    },
  ],
  tags: [
    { name: 'Health', description: '健康检查' },
    { name: 'Auth', description: '登录、用户资料、消息和社交' },
    { name: 'Guess', description: '竞猜相关接口' },
    { name: 'Product', description: '商城商品接口' },
    { name: 'Order', description: '订单相关接口' },
    { name: 'Wallet', description: '余额流水接口' },
    { name: 'Warehouse', description: '仓库接口' },
    { name: 'Shop', description: '店铺与品牌授权接口' },
    { name: 'Admin', description: '管理台接口' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '在这里填登录接口返回的 token，不需要手动加 Bearer 前缀。',
      },
    },
    schemas: {
      LoginPayload: {
        type: 'object',
        required: ['phone', 'method'],
        properties: {
          phone: { type: 'string', example: '13800138000' },
          method: {
            type: 'string',
            enum: ['code', 'password'],
            example: 'password',
          },
          code: { type: 'string', example: '123456' },
          password: { type: 'string', example: '123456' },
        },
      },
      AdminLoginPayload: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin_root' },
          password: { type: 'string', example: '123456' },
        },
      },
      AdminRoleItem: {
        type: 'object',
        required: ['id', 'code', 'name'],
        properties: {
          id: { type: 'string', example: '1' },
          code: { type: 'string', example: 'super_admin' },
          name: { type: 'string', example: '超级管理员' },
        },
      },
      AdminProfile: {
        type: 'object',
        required: ['id', 'username', 'displayName', 'status', 'roles', 'permissions'],
        properties: {
          id: { type: 'string', example: '1' },
          username: { type: 'string', example: 'admin_root' },
          displayName: { type: 'string', example: 'JOY 管理员' },
          phoneNumber: { type: 'string', nullable: true, example: '13800138000' },
          email: { type: 'string', nullable: true, example: 'admin@example.com' },
          status: {
            type: 'string',
            enum: ['active', 'disabled'],
            example: 'active',
          },
          roles: {
            type: 'array',
            items: { $ref: '#/components/schemas/AdminRoleItem' },
          },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            example: ['admin.dashboard.view', 'admin.user.manage'],
          },
        },
      },
      UserSummary: {
        type: 'object',
        required: ['id', 'uid', 'phone', 'name', 'role', 'coins'],
        properties: {
          id: { type: 'string', example: '1001' },
          uid: { type: 'string', example: 'aZkLmNqP' },
          phone: { type: 'string', example: '13800138000' },
          name: { type: 'string', example: '优米用户' },
          role: {
            type: 'string',
            enum: ['user', 'admin', 'shop_owner'],
            example: 'shop_owner',
          },
          banned: { type: 'boolean', example: false },
          coins: { type: 'integer', example: 128800 },
          avatar: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' },
          level: { type: 'integer', example: 6 },
          title: { type: 'string', nullable: true, example: '潮流猜手' },
          signature: { type: 'string', nullable: true, example: '今天也要上分' },
          gender: { type: 'string', nullable: true, example: 'male' },
          birthday: { type: 'string', nullable: true, format: 'date', example: '1998-06-18' },
          region: { type: 'string', nullable: true, example: 'Shanghai' },
          shopName: { type: 'string', nullable: true, example: 'Umi Select' },
          worksPrivacy: {
            type: 'string',
            enum: ['all', 'friends', 'me'],
            example: 'friends',
          },
          favPrivacy: {
            type: 'string',
            enum: ['all', 'me'],
            example: 'me',
          },
          followers: { type: 'integer', example: 128 },
          following: { type: 'integer', example: 42 },
          totalOrders: { type: 'integer', example: 123 },
          winRate: { type: 'number', example: 62.5 },
          totalGuess: { type: 'integer', example: 48 },
          wins: { type: 'integer', example: 30 },
          joinDate: {
            type: 'string',
            nullable: true,
            format: 'date-time',
            example: '2026-04-19T10:30:00.000Z',
          },
          shopVerified: { type: 'boolean', example: true },
        },
      },
      UpdateUserBanPayload: {
        type: 'object',
        required: ['banned'],
        properties: {
          banned: { type: 'boolean', example: true },
        },
      },
      UserListResult: {
        type: 'object',
        required: ['items', 'total', 'page', 'pageSize', 'summary'],
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserSummary' },
          },
          total: { type: 'integer', example: 326 },
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 20 },
          summary: {
            type: 'object',
            required: ['totalUsers', 'verifiedUsers', 'bannedUsers'],
            properties: {
              totalUsers: { type: 'integer', example: 326 },
              verifiedUsers: { type: 'integer', example: 48 },
              bannedUsers: { type: 'integer', example: 3 },
            },
          },
        },
      },
      PaginatedGuessListResult: {
        type: 'object',
        required: ['items', 'total', 'page', 'pageSize'],
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 10 },
        },
      },
      PaginatedOrderListResult: {
        type: 'object',
        required: ['items', 'total', 'page', 'pageSize'],
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          total: { type: 'integer', example: 18 },
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 10 },
        },
      },
      SendCodePayload: {
        type: 'object',
        required: ['phone', 'bizType'],
        properties: {
          phone: { type: 'string', example: '13800138000' },
          bizType: {
            type: 'string',
            enum: ['register', 'login', 'reset_password'],
            example: 'login',
          },
        },
      },
      RegisterPayload: {
        type: 'object',
        required: ['phone', 'code', 'password', 'name'],
        properties: {
          phone: { type: 'string', example: '13800138000' },
          code: { type: 'string', example: '123456' },
          password: { type: 'string', example: '123456' },
          name: { type: 'string', example: 'Joy User' },
        },
      },
      ChangePasswordPayload: {
        type: 'object',
        required: ['newPassword'],
        properties: {
          currentPassword: { type: 'string', example: '123456' },
          newPassword: { type: 'string', example: '654321' },
        },
      },
      AdminChangePasswordPayload: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: '123456' },
          newPassword: { type: 'string', example: '654321' },
        },
      },
      UpdateMePayload: {
        type: 'object',
        properties: {
          name: { type: 'string', example: '新昵称' },
          avatar: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/avatar.png',
          },
          signature: { type: 'string', nullable: true, example: '有点准' },
          gender: { type: 'string', nullable: true, example: 'male' },
          birthday: {
            type: 'string',
            nullable: true,
            format: 'date',
            example: '1998-06-18',
          },
          region: { type: 'string', nullable: true, example: 'Shanghai' },
          worksPrivacy: {
            type: 'string',
            enum: ['all', 'friends', 'me'],
            example: 'friends',
          },
          favPrivacy: {
            type: 'string',
            enum: ['all', 'me'],
            example: 'me',
          },
        },
      },
      SendChatMessagePayload: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', example: '你好，聊聊这场竞猜？' },
        },
      },
      SubmitBrandAuthApplicationPayload: {
        type: 'object',
        required: ['brandId', 'reason'],
        properties: {
          brandId: { type: 'string', example: '101' },
          reason: {
            type: 'string',
            example: '门店已取得线下经销资格，申请线上上架。',
          },
          license: {
            type: 'string',
            example: 'https://example.com/license.png',
          },
        },
      },
      SubmitShopApplicationPayload: {
        type: 'object',
        required: ['shopName', 'categoryId', 'reason'],
        properties: {
          shopName: { type: 'string', example: 'Joy Select' },
          categoryId: { type: 'string', example: '12' },
          reason: {
            type: 'string',
            example: '主营零食好物，希望开通店铺后承接竞猜和商品销售。',
          },
        },
      },
      AddShopProductsPayload: {
        type: 'object',
        required: ['brandId', 'brandProductIds'],
        properties: {
          brandId: { type: 'string', example: '101' },
          brandProductIds: {
            type: 'array',
            items: { type: 'string' },
            example: ['2001', '2002'],
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              ok: { type: 'boolean', example: true },
              service: { type: 'string', example: 'api' },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2026-04-19T10:00:00.000Z',
              },
            },
          }),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: '登录',
        requestBody: jsonRequestBody({
          $ref: '#/components/schemas/LoginPayload',
        }),
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              token: { type: 'string', example: 'demo-token' },
              user: {
                type: 'object',
                additionalProperties: true,
                example: {
                  id: '1',
                  name: 'Joy User',
                  phone: '13800138000',
                },
              },
            },
          }),
          400: errorResponse(400, '登录失败'),
        },
      },
    },
    '/api/admin/auth/login': {
      post: {
        tags: ['Admin'],
        summary: '后台管理员登录',
        requestBody: jsonRequestBody({
          $ref: '#/components/schemas/AdminLoginPayload',
        }),
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              token: { type: 'string', example: 'admin-token' },
              user: { $ref: '#/components/schemas/AdminProfile' },
            },
          }),
          400: errorResponse(400, '后台登录失败'),
        },
      },
    },
    '/api/admin/auth/me': {
      get: {
        tags: ['Admin'],
        summary: '获取当前后台管理员信息',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            $ref: '#/components/schemas/AdminProfile',
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/auth/change-password': {
      post: {
        tags: ['Admin'],
        summary: '修改当前后台管理员密码',
        security: bearerSecurity,
        requestBody: jsonRequestBody({
          $ref: '#/components/schemas/AdminChangePasswordPayload',
        }),
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '修改密码失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/auth/logout': {
      post: {
        tags: ['Admin'],
        summary: '后台管理员退出登录',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
        },
      },
    },
    '/api/auth/send-code': {
      post: {
        tags: ['Auth'],
        summary: '发送验证码',
        requestBody: jsonRequestBody({
          $ref: '#/components/schemas/SendCodePayload',
        }),
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              sent: { type: 'boolean', example: true },
              devCode: { type: 'string', example: '123456' },
            },
          }),
          400: errorResponse(400, '验证码发送失败'),
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: '注册',
        requestBody: jsonRequestBody({
          $ref: '#/components/schemas/RegisterPayload',
        }),
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              token: { type: 'string', example: 'demo-token' },
              user: {
                type: 'object',
                additionalProperties: true,
                example: {
                  id: '2',
                  name: '新用户',
                  phone: '13800138000',
                },
              },
            },
          }),
          400: errorResponse(400, '注册失败'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
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
        tags: ['Auth'],
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
    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: '修改当前用户密码',
        security: bearerSecurity,
        requestBody: jsonRequestBody({
          $ref: '#/components/schemas/ChangePasswordPayload',
        }),
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '修改密码失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: '退出登录',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
        },
      },
    },
    '/api/auth/me/activity': {
      get: {
        tags: ['Auth'],
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
    '/api/auth/me/summary': {
      get: {
        tags: ['Auth'],
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
    '/api/auth/users/search': {
      get: {
        tags: ['Auth'],
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
    '/api/auth/users/{id}': {
      get: {
        tags: ['Auth'],
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
    '/api/auth/users/{id}/activity': {
      get: {
        tags: ['Auth'],
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
    '/api/auth/users/{id}/follow': {
      post: {
        tags: ['Auth'],
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
        tags: ['Auth'],
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
    '/api/auth/friends/requests/{id}/accept': {
      post: {
        tags: ['Auth'],
        summary: '接受好友申请',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '申请发起人用户内部 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '接受好友申请失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/friends/requests/{id}/reject': {
      post: {
        tags: ['Auth'],
        summary: '忽略好友申请',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '申请发起人用户内部 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '忽略好友申请失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/notifications': {
      get: {
        tags: ['Auth'],
        summary: '获取通知列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                },
                example: [
                  {
                    id: 1,
                    title: '竞猜开奖',
                    content: '你参与的竞猜已结算',
                    read: false,
                    createdAt: '2026-04-19T10:00:00.000Z',
                  },
                ],
              },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/notifications/read-all': {
      post: {
        tags: ['Auth'],
        summary: '全部通知标记已读',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/notifications/{id}/read': {
      post: {
        tags: ['Auth'],
        summary: '单条通知标记已读',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '通知 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/social': {
      get: {
        tags: ['Auth'],
        summary: '获取社交概览',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              friends: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              following: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              fans: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              requests: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/community/feed': {
      get: {
        tags: ['Auth'],
        summary: '获取社区动态流',
        security: bearerSecurity,
        parameters: [
          {
            name: 'tab',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['recommend', 'follow'],
              default: 'recommend',
            },
            description: '动态流类型',
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
    '/api/auth/community/discovery': {
      get: {
        tags: ['Auth'],
        summary: '获取社区发现区数据',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              hero: { type: 'object', nullable: true, additionalProperties: true },
              hotTopics: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/community/search': {
      get: {
        tags: ['Auth'],
        summary: '搜索社区内容',
        security: bearerSecurity,
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: '搜索关键词',
          },
        ],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              posts: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              users: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/community/posts': {
      post: {
        tags: ['Auth'],
        summary: '发布社区动态',
        security: bearerSecurity,
        requestBody: jsonRequestBody({
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: '今天这波竞猜我看好黄瓜味反超。' },
            tag: { type: 'string', nullable: true, example: '竞猜心得' },
            scope: { type: 'string', enum: ['public', 'followers', 'private'], example: 'public' },
            guessId: { type: 'string', nullable: true, example: '1' },
            location: { type: 'string', nullable: true, example: '北京·朝阳区' },
            images: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        }),
        responses: {
          200: successResponse({
            type: 'object',
            additionalProperties: true,
          }),
          400: errorResponse(400, '发布动态失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/community/posts/{id}/repost': {
      post: {
        tags: ['Auth'],
        summary: '转发社区动态',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '动态 ID')],
        requestBody: jsonRequestBody({
          type: 'object',
          properties: {
            content: { type: 'string', example: '这条判断我认同。' },
            scope: { type: 'string', enum: ['public', 'followers', 'private'], example: 'public' },
            location: { type: 'string', nullable: true, example: '北京·朝阳区' },
            images: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        }),
        responses: {
          200: successResponse({
            type: 'object',
            additionalProperties: true,
          }),
          400: errorResponse(400, '转发失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/community/posts/{id}': {
      get: {
        tags: ['Auth'],
        summary: '获取社区动态详情',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '动态 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              post: { type: 'object', additionalProperties: true },
              comments: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              related: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
            },
          }),
          401: errorResponse(401, '请先登录'),
          404: errorResponse(404, '动态不存在或不可见'),
        },
      },
    },
    '/api/auth/community/posts/{id}/comments': {
      post: {
        tags: ['Auth'],
        summary: '发表评论',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '动态 ID')],
        requestBody: jsonRequestBody({
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: '这一条我也认同。' },
            parentId: { type: 'string', nullable: true, example: '12' },
          },
        }),
        responses: {
          200: successResponse({
            type: 'object',
            additionalProperties: true,
          }),
          400: errorResponse(400, '发表评论失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/community/comments/{id}/like': {
      post: {
        tags: ['Auth'],
        summary: '点赞社区评论',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '评论 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '评论点赞失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
      delete: {
        tags: ['Auth'],
        summary: '取消点赞社区评论',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '评论 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '取消评论点赞失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/community/posts/{id}/like': {
      post: {
        tags: ['Auth'],
        summary: '点赞社区动态',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '动态 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '点赞失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
      delete: {
        tags: ['Auth'],
        summary: '取消点赞社区动态',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '动态 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '取消点赞失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/community/posts/{id}/bookmark': {
      post: {
        tags: ['Auth'],
        summary: '收藏社区动态',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '动态 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '收藏失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
      delete: {
        tags: ['Auth'],
        summary: '取消收藏社区动态',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '动态 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
            },
          }),
          400: errorResponse(400, '取消收藏失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/auth/chats': {
      get: {
        tags: ['Auth'],
        summary: '获取聊天会话列表',
        security: bearerSecurity,
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
    '/api/auth/chats/{userId}': {
      get: {
        tags: ['Auth'],
        summary: '获取与指定用户的聊天记录',
        security: bearerSecurity,
        parameters: [pathIdParameter('userId', '对方用户 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              peer: { type: 'object', additionalProperties: true },
              items: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
            },
          }),
          400: errorResponse(400, '获取聊天记录失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
      post: {
        tags: ['Auth'],
        summary: '发送聊天消息',
        security: bearerSecurity,
        parameters: [pathIdParameter('userId', '对方用户 ID')],
        requestBody: jsonRequestBody({
          $ref: '#/components/schemas/SendChatMessagePayload',
        }),
        responses: {
          200: successResponse({
            type: 'object',
            additionalProperties: true,
            example: {
              id: 1,
              from: 'me',
              content: '你好，聊聊这场竞猜？',
            },
          }),
          400: errorResponse(400, '发送消息失败'),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/guesses/user/history': {
      get: {
        tags: ['Guess'],
        summary: '获取当前用户竞猜历史',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              stats: { type: 'object', additionalProperties: true },
              active: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              history: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              pk: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/guesses/my-bets': {
      get: {
        tags: ['Guess'],
        summary: '获取当前用户下注记录',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              stats: { type: 'object', additionalProperties: true },
              active: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              history: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              pk: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/guesses': {
      get: {
        tags: ['Guess'],
        summary: '获取竞猜列表',
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
        },
      },
    },
    '/api/guesses/{id}': {
      get: {
        tags: ['Guess'],
        summary: '获取竞猜详情',
        parameters: [pathIdParameter('id', '竞猜 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            additionalProperties: true,
          }),
          404: errorResponse(404, 'Guess not found'),
        },
      },
    },
    '/api/guesses/{id}/stats': {
      get: {
        tags: ['Guess'],
        summary: '获取竞猜统计',
        parameters: [pathIdParameter('id', '竞猜 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              totalVotes: { type: 'integer', example: 120 },
              optionCount: { type: 'integer', example: 2 },
            },
          }),
          404: errorResponse(404, 'Guess not found'),
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Product'],
        summary: '获取商城商品列表',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', example: 20, minimum: 1, maximum: 50 },
            description: '返回商品数量，默认 20，最大 50',
          },
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: { type: 'string', example: '乐事' },
            description: '按商品名、品牌名或类目搜索',
          },
          {
            name: 'categoryId',
            in: 'query',
            required: false,
            schema: { type: 'string', example: '301' },
            description: '按商品分类 ID 过滤，分类来源为 category.biz_type=30',
          },
        ],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: '101' },
                    name: { type: 'string', example: '乐事薯片原味分享装' },
                    categoryId: { type: 'string', nullable: true, example: '301' },
                    category: { type: 'string', example: '食品饮料' },
                    price: { type: 'number', example: 19.9 },
                    originalPrice: { type: 'number', example: 29.9 },
                    discountAmount: { type: 'number', example: 10 },
                    sales: { type: 'integer', example: 1860 },
                    rating: { type: 'number', example: 4.8 },
                    stock: { type: 'integer', example: 240 },
                    img: { type: 'string', nullable: true, example: 'https://example.com/lays.jpg' },
                    tag: { type: 'string', example: '特惠' },
                    miniTag: { type: 'string', example: 'mt-sale' },
                    height: { type: 'integer', example: 192 },
                    brand: { type: 'string', example: '乐事' },
                    guessPrice: { type: 'number', example: 9.9 },
                    status: { type: 'string', example: 'active' },
                    shopName: { type: 'string', nullable: true, example: '乐事优选店' },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['限时特惠', '零食必买'],
                    },
                    collab: { type: 'string', nullable: true, example: '乐事 × 优米精选' },
                    isNew: { type: 'boolean', example: true },
                  },
                },
              },
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: '301' },
                    name: { type: 'string', example: '食品饮料' },
                    iconUrl: { type: 'string', nullable: true, example: 'https://example.com/cat-food.png' },
                    parentId: { type: 'string', nullable: true, example: '300' },
                    level: { type: 'integer', example: 2 },
                    sort: { type: 'integer', example: 10 },
                    count: { type: 'integer', example: 18 },
                  },
                },
              },
            },
          }),
          500: errorResponse(500, '读取商品列表失败'),
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Product'],
        summary: '获取商品详情',
        parameters: [pathIdParameter('id', '商品 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              product: { type: 'object', additionalProperties: true },
              activeGuess: {
                anyOf: [
                  { type: 'object', additionalProperties: true },
                  { type: 'null' },
                ],
              },
              warehouseItems: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              recommendations: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
            },
          }),
          404: errorResponse(404, '商品不存在'),
        },
      },
    },
    '/api/orders': {
      get: {
        tags: ['Order'],
        summary: '获取我的订单列表',
        security: bearerSecurity,
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
    '/api/orders/admin/stats/overview': {
      get: {
        tags: ['Order'],
        summary: '订单概览统计',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              totalOrders: { type: 'integer', example: 100 },
              paidOrders: { type: 'integer', example: 76 },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Order'],
        summary: '获取订单详情',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '订单 ID')],
        responses: {
          200: successResponse({
            type: 'object',
            additionalProperties: true,
          }),
          401: errorResponse(401, '请先登录'),
          404: errorResponse(404, '订单不存在'),
        },
      },
    },
    '/api/wallet/ledger': {
      get: {
        tags: ['Wallet'],
        summary: '获取余额流水',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              balance: { type: 'integer', example: 10000 },
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
    '/api/warehouse/virtual': {
      get: {
        tags: ['Warehouse'],
        summary: '获取虚拟仓库',
        security: bearerSecurity,
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
    '/api/warehouse/physical': {
      get: {
        tags: ['Warehouse'],
        summary: '获取实体仓库',
        security: bearerSecurity,
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
    '/api/warehouse/admin/stats': {
      get: {
        tags: ['Warehouse'],
        summary: '仓库统计',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              totalVirtual: { type: 'integer', example: 20 },
              totalPhysical: { type: 'integer', example: 8 },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/warehouse/admin/virtual': {
      get: {
        tags: ['Warehouse'],
        summary: '管理台获取虚拟仓库列表',
        security: bearerSecurity,
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
    '/api/warehouse/admin/physical': {
      get: {
        tags: ['Warehouse'],
        summary: '管理台获取实体仓库列表',
        security: bearerSecurity,
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
    '/api/admin/dashboard/stats': {
      get: {
        tags: ['Admin'],
        summary: '管理台仪表盘统计',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              generatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-04-19T08:30:00.000Z',
              },
              users: { type: 'integer', example: 12840 },
              products: { type: 'integer', example: 218 },
              activeGuesses: { type: 'integer', example: 18 },
              orders: { type: 'integer', example: 326 },
              todayUsers: { type: 'integer', example: 126 },
              todayBets: { type: 'integer', example: 284 },
              todayOrders: { type: 'integer', example: 46 },
              todayGmv: { type: 'integer', example: 2389000 },
              trend: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', example: '4/19' },
                    bets: { type: 'integer', example: 284 },
                    orders: { type: 'integer', example: 46 },
                    users: { type: 'integer', example: 126 },
                    gmv: { type: 'integer', example: 2389000 },
                  },
                },
              },
              orderDistribution: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: '已支付' },
                    value: { type: 'integer', example: 64 },
                  },
                },
              },
              guessCategories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: '球鞋' },
                    value: { type: 'integer', example: 8 },
                  },
                },
              },
              hotGuesses: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: '901' },
                    title: { type: 'string', example: 'Panda 本周会不会继续涨价' },
                    category: { type: 'string', example: '球鞋' },
                    participants: { type: 'integer', example: 842 },
                    poolAmount: { type: 'integer', example: 2580000 },
                    endTime: {
                      type: 'string',
                      format: 'date-time',
                      example: '2026-04-20T12:00:00.000Z',
                    },
                  },
                },
              },
              hotProducts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: '501' },
                    name: { type: 'string', example: 'Nike Dunk Low Panda' },
                    imageUrl: { type: 'string', nullable: true, example: 'https://example.com/panda.png' },
                    price: { type: 'integer', example: 89900 },
                    stock: { type: 'integer', example: 42 },
                    sales: { type: 'integer', example: 1280 },
                    status: { type: 'string', example: 'active' },
                  },
                },
              },
              pendingQueues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'pending-guesses' },
                    title: { type: 'string', example: '待审核竞猜' },
                    count: { type: 'integer', example: 6 },
                    tone: { type: 'string', example: 'warning' },
                    description: { type: 'string', example: '需要运营或风控完成审核后才能进入正式流转。' },
                  },
                },
              },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: '管理台用户列表',
        security: bearerSecurity,
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', example: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', example: 20 },
          },
          {
            name: 'keyword',
            in: 'query',
            schema: { type: 'string', example: '1380013' },
          },
          {
            name: 'role',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['all', 'user', 'shop_owner', 'banned'],
              example: 'shop_owner',
            },
          },
        ],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/UserListResult' }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: '管理台用户详情',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '用户 ID')],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/UserSummary' }),
          401: errorResponse(401, '请先登录'),
          404: errorResponse(404, '用户不存在'),
        },
      },
    },
    '/api/admin/users/{id}/guesses': {
      get: {
        tags: ['Admin'],
        summary: '管理台用户竞猜记录',
        security: bearerSecurity,
        parameters: [
          pathIdParameter('id', '用户 ID'),
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', example: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', example: 10 },
          },
        ],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PaginatedGuessListResult' }),
          401: errorResponse(401, '请先登录'),
          404: errorResponse(404, '用户不存在'),
        },
      },
    },
    '/api/admin/users/{id}/orders': {
      get: {
        tags: ['Admin'],
        summary: '管理台用户订单记录',
        security: bearerSecurity,
        parameters: [
          pathIdParameter('id', '用户 ID'),
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', example: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', example: 10 },
          },
        ],
        responses: {
          200: successResponse({ $ref: '#/components/schemas/PaginatedOrderListResult' }),
          401: errorResponse(401, '请先登录'),
          404: errorResponse(404, '用户不存在'),
        },
      },
    },
    '/api/admin/users/{id}/ban': {
      put: {
        tags: ['Admin'],
        summary: '管理台封禁或解封用户',
        security: bearerSecurity,
        parameters: [pathIdParameter('id', '用户 ID')],
        requestBody: jsonRequestBody(
          { $ref: '#/components/schemas/UpdateUserBanPayload' },
          '封禁状态变更',
        ),
        responses: {
          200: successResponse({
            type: 'object',
            required: ['id', 'banned'],
            properties: {
              id: { type: 'string', example: '1001' },
              banned: { type: 'boolean', example: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
          404: errorResponse(404, '用户不存在'),
        },
      },
    },
    '/api/admin/guesses': {
      get: {
        tags: ['Admin'],
        summary: '管理台竞猜列表',
        security: bearerSecurity,
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
    '/api/admin/orders': {
      get: {
        tags: ['Admin'],
        summary: '管理台订单列表',
        security: bearerSecurity,
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
    '/api/admin/products': {
      get: {
        tags: ['Admin'],
        summary: '管理台商品列表',
        security: bearerSecurity,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 20 } },
          { name: 'keyword', in: 'query', schema: { type: 'string', example: 'Panda' } },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['all', 'active', 'low_stock', 'paused', 'off_shelf', 'disabled'],
              example: 'active',
            },
          },
        ],
        responses: {
          200: successResponse({
            type: 'object',
            required: ['items', 'total', 'page', 'pageSize'],
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              total: { type: 'integer', example: 128 },
              page: { type: 'integer', example: 1 },
              pageSize: { type: 'integer', example: 20 },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/products/brand-library': {
      get: {
        tags: ['Admin'],
        summary: '管理台品牌商品库',
        security: bearerSecurity,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 20 } },
          { name: 'keyword', in: 'query', schema: { type: 'string', example: 'Nike' } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['all', 'active', 'disabled'], example: 'active' },
          },
        ],
        responses: {
          200: successResponse({
            type: 'object',
            required: ['items', 'total', 'page', 'pageSize'],
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              total: { type: 'integer', example: 68 },
              page: { type: 'integer', example: 1 },
              pageSize: { type: 'integer', example: 20 },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/guesses/friends': {
      get: {
        tags: ['Admin'],
        summary: '管理台好友竞猜列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/pk': {
      get: {
        tags: ['Admin'],
        summary: '管理台 PK 对战列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/orders/transactions': {
      get: {
        tags: ['Admin'],
        summary: '管理台交易流水',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/orders/logistics': {
      get: {
        tags: ['Admin'],
        summary: '管理台物流列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/orders/consign': {
      get: {
        tags: ['Admin'],
        summary: '管理台寄售列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/shops': {
      get: {
        tags: ['Admin'],
        summary: '管理台店铺列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/shops/applies': {
      get: {
        tags: ['Admin'],
        summary: '管理台开店审核列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/brands': {
      get: {
        tags: ['Admin'],
        summary: '管理台品牌方列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/brands/applies': {
      get: {
        tags: ['Admin'],
        summary: '管理台品牌入驻审核列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/brands/auth-applies': {
      get: {
        tags: ['Admin'],
        summary: '管理台品牌授权审核列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/brands/auth-records': {
      get: {
        tags: ['Admin'],
        summary: '管理台品牌授权记录',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/shops/products': {
      get: {
        tags: ['Admin'],
        summary: '管理台店铺授权商品列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/product-auth': {
      get: {
        tags: ['Admin'],
        summary: '管理台商品授权列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/product-auth/records': {
      get: {
        tags: ['Admin'],
        summary: '管理台商品授权记录',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/notifications': {
      get: {
        tags: ['Admin'],
        summary: '管理台通知批次列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
              basis: { type: 'string', example: '按通知内容聚合后的已发送批次视图' },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/chats': {
      get: {
        tags: ['Admin'],
        summary: '管理台聊天会话列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
              basis: { type: 'string', example: '按 chat_message 聚合的双人会话视图' },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/system-users': {
      get: {
        tags: ['Admin'],
        summary: '管理台系统用户列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/roles': {
      get: {
        tags: ['Admin'],
        summary: '管理台角色列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/permissions/matrix': {
      get: {
        tags: ['Admin'],
        summary: '管理台权限矩阵',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              roles: { type: 'array', items: { type: 'object', additionalProperties: true } },
              modules: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
    '/api/admin/categories': {
      get: {
        tags: ['Admin'],
        summary: '管理台分类列表',
        security: bearerSecurity,
        responses: {
          200: successResponse({
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
              summary: { type: 'object', additionalProperties: true },
            },
          }),
          401: errorResponse(401, '请先登录'),
        },
      },
    },
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
  },
} as const;

function renderSwaggerUiHtml() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Joy API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html {
        box-sizing: border-box;
        overflow-y: scroll;
      }
      *,
      *::before,
      *::after {
        box-sizing: inherit;
      }
      body {
        margin: 0;
        background: #f5f7fb;
      }
      .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
      });
    </script>
  </body>
</html>`;
}

export function registerOpenApiRoutes(app: Express) {
  app.get('/openapi.json', (_request: Request, response: Response) => {
    response.json(openApiDocument);
  });

  app.get('/docs', (_request: Request, response: Response) => {
    response.type('html').send(renderSwaggerUiHtml());
  });
}
