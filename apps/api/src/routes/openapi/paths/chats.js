import { bearerSecurity, errorResponse, jsonRequestBody, pathIdParameter, successResponse, } from '../shared';
export const chatPaths = {
    '/api/chats': {
        get: {
            tags: ['Chat'],
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
    '/api/chats/{userId}': {
        get: {
            tags: ['Chat'],
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
            tags: ['Chat'],
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
};
