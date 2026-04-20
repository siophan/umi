import { bearerSecurity, errorResponse, pathIdParameter, successResponse, } from '../shared';
export const commercePaths = {
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
                                    favorited: { type: 'boolean', example: false },
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
    '/api/products/{id}/favorite': {
        post: {
            tags: ['Product'],
            summary: '收藏商品',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '商品 ID')],
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                    },
                }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '商品不存在'),
            },
        },
        delete: {
            tags: ['Product'],
            summary: '取消收藏商品',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '商品 ID')],
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
};
