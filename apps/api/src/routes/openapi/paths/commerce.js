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
            parameters: [
                {
                    name: 'q',
                    in: 'query',
                    required: false,
                    description: '按竞猜标题、商品名、品牌名、分类名搜索',
                    schema: {
                        type: 'string',
                    },
                },
                {
                    name: 'limit',
                    in: 'query',
                    required: false,
                    description: '返回条数上限，最大 100',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
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
    '/api/cart': {
        get: {
            tags: ['Cart'],
            summary: '获取当前用户购物车',
            security: bearerSecurity,
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: '1' },
                                    productId: { type: 'string', example: '101' },
                                    shopId: { type: 'string', nullable: true, example: '12' },
                                    brand: { type: 'string', example: '乐事' },
                                    shop: { type: 'string', example: '乐事官方旗舰店' },
                                    shopLogo: {
                                        type: 'string',
                                        example: 'https://example.com/shop.png',
                                    },
                                    name: {
                                        type: 'string',
                                        example: '乐事薯片春日限定大礼包 组合装',
                                    },
                                    specs: { type: 'string', example: '混合口味 / 6 包' },
                                    img: {
                                        type: 'string',
                                        example: 'https://example.com/product.png',
                                    },
                                    price: { type: 'number', example: 39.9 },
                                    originalPrice: { type: 'number', example: 49.9 },
                                    quantity: { type: 'integer', example: 2 },
                                    checked: { type: 'boolean', example: true },
                                    stock: { type: 'integer', example: 30 },
                                    status: { type: 'string', example: 'active' },
                                },
                            },
                        },
                    },
                }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/cart/items': {
        post: {
            tags: ['Cart'],
            summary: '加入购物车',
            security: bearerSecurity,
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['productId'],
                            properties: {
                                productId: { type: 'string', example: '101' },
                                quantity: { type: 'integer', example: 1 },
                                specs: { type: 'string', nullable: true, example: '默认规格' },
                                checked: { type: 'boolean', example: true },
                            },
                        },
                    },
                },
            },
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        id: { type: 'string', example: '1' },
                    },
                }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '商品不存在'),
            },
        },
    },
    '/api/cart/items/{id}': {
        put: {
            tags: ['Cart'],
            summary: '更新购物车商品',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '购物车项 ID')],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                quantity: { type: 'integer', example: 3 },
                                checked: { type: 'boolean', example: true },
                            },
                        },
                    },
                },
            },
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        id: { type: 'string', example: '1' },
                    },
                }),
                400: errorResponse(400, '更新购物车失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '购物车商品不存在'),
            },
        },
        delete: {
            tags: ['Cart'],
            summary: '移除购物车商品',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '购物车项 ID')],
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        id: { type: 'string', example: '1' },
                    },
                }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '购物车商品不存在'),
            },
        },
    },
    '/api/addresses': {
        get: {
            tags: ['Address'],
            summary: '获取当前用户收货地址',
            security: bearerSecurity,
            responses: {
                200: successResponse({
                    type: 'array',
                    items: { type: 'object', additionalProperties: true },
                }),
                401: errorResponse(401, '请先登录'),
            },
        },
        post: {
            tags: ['Address'],
            summary: '新增收货地址',
            security: bearerSecurity,
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: [
                                'name',
                                'phone',
                                'province',
                                'city',
                                'district',
                                'detail',
                            ],
                            properties: {
                                name: { type: 'string', example: '张三' },
                                phone: { type: 'string', example: '13800000000' },
                                province: { type: 'string', example: '上海市' },
                                city: { type: 'string', example: '上海市' },
                                district: { type: 'string', example: '浦东新区' },
                                detail: { type: 'string', example: '张江高科技园区 88 号' },
                                tag: { type: 'string', nullable: true, example: '家' },
                                isDefault: { type: 'boolean', example: true },
                            },
                        },
                    },
                },
            },
            responses: {
                200: successResponse({ type: 'object', additionalProperties: true }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/addresses/{id}': {
        put: {
            tags: ['Address'],
            summary: '更新收货地址',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '地址 ID')],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: [
                                'name',
                                'phone',
                                'province',
                                'city',
                                'district',
                                'detail',
                            ],
                            properties: {
                                name: { type: 'string', example: '张三' },
                                phone: { type: 'string', example: '13800000000' },
                                province: { type: 'string', example: '上海市' },
                                city: { type: 'string', example: '上海市' },
                                district: { type: 'string', example: '浦东新区' },
                                detail: { type: 'string', example: '张江高科技园区 88 号' },
                                tag: { type: 'string', nullable: true, example: '公司' },
                                isDefault: { type: 'boolean', example: false },
                            },
                        },
                    },
                },
            },
            responses: {
                200: successResponse({ type: 'object', additionalProperties: true }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '地址不存在'),
            },
        },
        delete: {
            tags: ['Address'],
            summary: '删除收货地址',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '地址 ID')],
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        id: { type: 'string', example: '1' },
                    },
                }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '地址不存在'),
            },
        },
    },
    '/api/coupons': {
        get: {
            tags: ['Coupon'],
            summary: '获取当前用户优惠券',
            security: bearerSecurity,
            responses: {
                200: successResponse({
                    type: 'array',
                    items: { type: 'object', additionalProperties: true },
                }),
                401: errorResponse(401, '请先登录'),
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
                                    categoryId: {
                                        type: 'string',
                                        nullable: true,
                                        example: '301',
                                    },
                                    category: { type: 'string', example: '食品饮料' },
                                    price: { type: 'number', example: 19.9 },
                                    originalPrice: { type: 'number', example: 29.9 },
                                    discountAmount: { type: 'number', example: 10 },
                                    sales: { type: 'integer', example: 1860 },
                                    rating: { type: 'number', example: 4.8 },
                                    stock: { type: 'integer', example: 240 },
                                    img: {
                                        type: 'string',
                                        nullable: true,
                                        example: 'https://example.com/lays.jpg',
                                    },
                                    tag: { type: 'string', example: '特惠' },
                                    miniTag: { type: 'string', example: 'mt-sale' },
                                    height: { type: 'integer', example: 192 },
                                    brand: { type: 'string', example: '乐事' },
                                    guessPrice: { type: 'number', example: 9.9 },
                                    status: { type: 'string', example: 'active' },
                                    shopName: {
                                        type: 'string',
                                        nullable: true,
                                        example: '乐事优选店',
                                    },
                                    tags: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        example: ['限时特惠', '零食必买'],
                                    },
                                    collab: {
                                        type: 'string',
                                        nullable: true,
                                        example: '乐事 × 优米精选',
                                    },
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
                                    iconUrl: {
                                        type: 'string',
                                        nullable: true,
                                        example: 'https://example.com/cat-food.png',
                                    },
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
        post: {
            tags: ['Order'],
            summary: '创建订单',
            security: bearerSecurity,
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['source', 'addressId'],
                            properties: {
                                source: { type: 'string', enum: ['product', 'cart'] },
                                addressId: { type: 'string', example: '1' },
                                couponId: { type: 'string', nullable: true, example: '9' },
                                paymentMethod: { type: 'string', enum: ['wechat', 'alipay'] },
                                note: { type: 'string', nullable: true, example: '请尽快发货' },
                                productId: { type: 'string', nullable: true, example: '101' },
                                quantity: { type: 'integer', nullable: true, example: 1 },
                                cartItemIds: {
                                    type: 'array',
                                    nullable: true,
                                    items: { type: 'string', example: '1' },
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '5001' },
                    },
                }),
                400: errorResponse(400, '创建订单失败'),
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
    '/api/orders/{id}/confirm': {
        post: {
            tags: ['Order'],
            summary: '确认收货',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '订单 ID')],
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        id: { type: 'string', example: '5001' },
                        status: { type: 'string', example: 'completed' },
                    },
                }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '订单不存在'),
            },
        },
    },
    '/api/orders/{id}/urge': {
        post: {
            tags: ['Order'],
            summary: '催发货',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '订单 ID')],
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                    },
                }),
                400: errorResponse(400, '催发货失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '订单不存在'),
            },
        },
    },
    '/api/orders/{id}/review': {
        post: {
            tags: ['Order'],
            summary: '提交订单评价',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '订单 ID')],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['productId', 'rating'],
                            properties: {
                                productId: {
                                    type: 'string',
                                    example: '101',
                                },
                                rating: {
                                    type: 'integer',
                                    minimum: 1,
                                    maximum: 5,
                                    example: 5,
                                },
                                content: {
                                    type: 'string',
                                    nullable: true,
                                    example: '包装完整，发货很快。',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                    },
                }),
                400: errorResponse(400, '提交评价失败'),
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
    '/api/warehouse/physical/{id}/consign': {
        post: {
            tags: ['Warehouse'],
            summary: '发起实体仓库商品寄售',
            security: bearerSecurity,
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: '实体仓库商品 ID，需传 `pw-` 前缀值',
                    schema: {
                        type: 'string',
                        pattern: '^pw-[0-9]+$',
                        example: 'pw-1001',
                    },
                },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['price'],
                            properties: {
                                price: {
                                    type: 'number',
                                    example: 199,
                                    description: '寄售价，单位元',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        estimateDays: { type: 'integer', example: 3 },
                    },
                }),
                400: errorResponse(400, '只有实体仓库商品可以寄售'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '商品不存在'),
            },
        },
    },
    '/api/warehouse/physical/{id}/cancel-consign': {
        post: {
            tags: ['Warehouse'],
            summary: '取消实体仓库商品寄售',
            security: bearerSecurity,
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: '实体仓库商品 ID，需传 `pw-` 前缀值',
                    schema: {
                        type: 'string',
                        pattern: '^pw-[0-9]+$',
                        example: 'pw-1001',
                    },
                },
            ],
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                    },
                }),
                400: errorResponse(400, '无效的商品 ID'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '商品不存在'),
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
