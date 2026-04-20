import { bearerSecurity, errorResponse, jsonRequestBody, successResponse, } from '../shared';
export const authPaths = {
    '/api/auth/login': {
        post: {
            tags: ['Auth'],
            summary: '用户登录',
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
                400: errorResponse(400, '手机号或验证码错误'),
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
    '/api/auth/reset-password': {
        post: {
            tags: ['Auth'],
            summary: '重置密码',
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/ResetPasswordPayload',
            }),
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                    },
                }),
                400: errorResponse(400, '重置密码失败'),
            },
        },
    },
};
