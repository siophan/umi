import { bearerSecurity, errorResponse, pathIdParameter, successResponse, } from '../shared';
export const socialPaths = {
    '/api/social': {
        get: {
            tags: ['Social'],
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
    '/api/social/requests/{id}/accept': {
        post: {
            tags: ['Social'],
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
    '/api/social/requests/{id}/reject': {
        post: {
            tags: ['Social'],
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
};
