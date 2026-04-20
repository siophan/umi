import { errorResponse, successResponse } from '../shared';
export const searchPaths = {
    '/api/search': {
        get: {
            tags: ['Search'],
            summary: '统一搜索商品与竞猜',
            parameters: [
                {
                    name: 'q',
                    in: 'query',
                    required: true,
                    description: '搜索关键词',
                    schema: { type: 'string', example: '薯片' },
                },
                {
                    name: 'tab',
                    in: 'query',
                    required: false,
                    description: '搜索域',
                    schema: { type: 'string', enum: ['all', 'product', 'guess'], example: 'all' },
                },
                {
                    name: 'sort',
                    in: 'query',
                    required: false,
                    description: '排序方式',
                    schema: {
                        type: 'string',
                        enum: ['default', 'sales', 'price-asc', 'price-desc', 'rating'],
                        example: 'default',
                    },
                },
                {
                    name: 'limit',
                    in: 'query',
                    required: false,
                    description: '每个结果域返回条数上限，最大 50',
                    schema: { type: 'integer', minimum: 1, maximum: 50, example: 12 },
                },
            ],
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        query: { type: 'string', example: '薯片' },
                        tab: { type: 'string', example: 'all' },
                        sort: { type: 'string', example: 'default' },
                        products: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer', example: 12 },
                                items: {
                                    type: 'array',
                                    items: { type: 'object', additionalProperties: true },
                                },
                            },
                        },
                        guesses: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer', example: 6 },
                                items: {
                                    type: 'array',
                                    items: { type: 'object', additionalProperties: true },
                                },
                            },
                        },
                    },
                }),
                400: errorResponse(400, '缺少搜索关键词', '缺少搜索关键词', 'SEARCH_QUERY_REQUIRED'),
            },
        },
    },
    '/api/search/hot': {
        get: {
            tags: ['Search'],
            summary: '获取搜索热词',
            parameters: [
                {
                    name: 'limit',
                    in: 'query',
                    required: false,
                    description: '返回热词数量，默认 8',
                    schema: { type: 'integer', minimum: 1, maximum: 20, example: 8 },
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
                                    keyword: { type: 'string', example: '香辣薯片礼盒' },
                                    rank: { type: 'integer', example: 1 },
                                    badge: { type: 'string', example: '热' },
                                    source: { type: 'string', example: 'product' },
                                },
                            },
                        },
                    },
                }),
            },
        },
    },
    '/api/search/suggest': {
        get: {
            tags: ['Search'],
            summary: '获取搜索联想建议',
            parameters: [
                {
                    name: 'q',
                    in: 'query',
                    required: true,
                    description: '当前输入内容',
                    schema: { type: 'string', example: '薯' },
                },
                {
                    name: 'limit',
                    in: 'query',
                    required: false,
                    description: '返回建议数量，默认 8',
                    schema: { type: 'integer', minimum: 1, maximum: 20, example: 8 },
                },
            ],
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        query: { type: 'string', example: '薯' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    text: { type: 'string', example: '香辣薯片礼盒' },
                                    type: { type: 'string', example: 'product' },
                                },
                            },
                        },
                    },
                }),
            },
        },
    },
};
