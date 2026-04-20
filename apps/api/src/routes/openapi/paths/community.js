import { bearerSecurity, errorResponse, jsonRequestBody, pathIdParameter, successResponse, } from '../shared';
export const communityPaths = {
    '/api/community/feed': {
        get: {
            tags: ['Community'],
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
    '/api/community/discovery': {
        get: {
            tags: ['Community'],
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
    '/api/community/search': {
        get: {
            tags: ['Community'],
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
    '/api/community/posts': {
        post: {
            tags: ['Community'],
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
    '/api/community/posts/{id}/repost': {
        post: {
            tags: ['Community'],
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
    '/api/community/posts/{id}': {
        get: {
            tags: ['Community'],
            summary: '获取社区动态详情',
            security: bearerSecurity,
            parameters: [
                pathIdParameter('id', '动态 ID'),
                {
                    name: 'sort',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        enum: ['hot', 'newest'],
                        default: 'hot',
                    },
                    description: '评论排序方式',
                },
            ],
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
    '/api/community/posts/{id}/report': {
        post: {
            tags: ['Community'],
            summary: '举报社区动态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '动态 ID')],
            requestBody: jsonRequestBody({
                type: 'object',
                required: ['reasonType'],
                properties: {
                    reasonType: {
                        type: 'integer',
                        enum: [10, 20, 30, 40, 90],
                        example: 20,
                    },
                    reasonDetail: { type: 'string', nullable: true, example: '包含明显广告导流内容' },
                },
            }),
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                    },
                }),
                400: errorResponse(400, '举报失败'),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/community/posts/{id}/comments': {
        post: {
            tags: ['Community'],
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
    '/api/community/comments/{id}/like': {
        post: {
            tags: ['Community'],
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
            tags: ['Community'],
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
    '/api/community/posts/{id}/like': {
        post: {
            tags: ['Community'],
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
            tags: ['Community'],
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
    '/api/community/posts/{id}/bookmark': {
        post: {
            tags: ['Community'],
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
            tags: ['Community'],
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
};
