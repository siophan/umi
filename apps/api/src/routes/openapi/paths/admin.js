import { bearerSecurity, errorResponse, jsonRequestBody, pathIdParameter, successResponse, } from '../shared';
export const adminPaths = {
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
                400: errorResponse(400, '用户名或密码错误'),
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
    '/api/admin/community/posts': {
        get: {
            tags: ['Admin'],
            summary: '管理台社区动态列表',
            security: bearerSecurity,
            parameters: [
                { name: 'title', in: 'query', schema: { type: 'string', example: '今天这双会不会继续涨' } },
                { name: 'author', in: 'query', schema: { type: 'string', example: '乐事不服榜' } },
                { name: 'tag', in: 'query', schema: { type: 'string', example: '球鞋' } },
            ],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminCommunityPostListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/community/posts/{id}': {
        delete: {
            tags: ['Admin'],
            summary: '管理台删除社区动态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '动态 ID')],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/DeleteAdminCommunityPostResult' }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '动态不存在'),
            },
        },
    },
    '/api/admin/community/comments': {
        get: {
            tags: ['Admin'],
            summary: '管理台社区评论列表',
            security: bearerSecurity,
            parameters: [
                { name: 'content', in: 'query', schema: { type: 'string', example: '我觉得还会涨' } },
                { name: 'author', in: 'query', schema: { type: 'string', example: '鞋柜研究所' } },
                { name: 'postTitle', in: 'query', schema: { type: 'string', example: '今天这双会不会继续涨' } },
            ],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminCommunityCommentListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/community/comments/{id}': {
        delete: {
            tags: ['Admin'],
            summary: '管理台删除社区评论',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '评论 ID')],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/DeleteAdminCommunityCommentResult' }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '评论不存在'),
            },
        },
    },
    '/api/admin/community/reports': {
        get: {
            tags: ['Admin'],
            summary: '管理台举报记录列表',
            security: bearerSecurity,
            parameters: [
                { name: 'reporter', in: 'query', schema: { type: 'string', example: '举报用户' } },
                {
                    name: 'reasonType',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['spam', 'explicit', 'abuse', 'false_info', 'other'],
                        example: 'spam',
                    },
                },
                { name: 'targetKeyword', in: 'query', schema: { type: 'string', example: '今天这双会不会继续涨' } },
                {
                    name: 'status',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['pending', 'reviewing', 'resolved', 'rejected'],
                        example: 'pending',
                    },
                },
            ],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminCommunityReportListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/community/reports/{id}': {
        put: {
            tags: ['Admin'],
            summary: '管理台处理举报记录',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '举报记录 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminCommunityReportPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminCommunityReportResult' }),
                400: errorResponse(400, '举报处理失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '举报记录不存在'),
            },
        },
    },
    '/api/admin/lives': {
        get: {
            tags: ['Admin'],
            summary: '管理台直播列表',
            security: bearerSecurity,
            parameters: [
                { name: 'title', in: 'query', schema: { type: 'string', example: '今晚聊聊球鞋行情' } },
                { name: 'host', in: 'query', schema: { type: 'string', example: '乐事不服榜' } },
                { name: 'guessTitle', in: 'query', schema: { type: 'string', example: 'Panda 本周会不会继续涨价' } },
            ],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminLiveRoomListResult' }),
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
                { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 20 } },
                { name: 'keyword', in: 'query', schema: { type: 'string', example: '1380013' } },
                { name: 'phone', in: 'query', schema: { type: 'string', example: '13800138000' } },
                { name: 'shopName', in: 'query', schema: { type: 'string', example: 'Joy Select' } },
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
                { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 10 } },
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
                { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 10 } },
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
            requestBody: jsonRequestBody({ $ref: '#/components/schemas/UpdateUserBanPayload' }, '封禁状态变更'),
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
                        items: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    },
                }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/guesses/{id}/review': {
        put: {
            tags: ['Admin'],
            summary: '管理台审核竞猜',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '竞猜 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/ReviewAdminGuessPayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/ReviewAdminGuessResult',
                }),
                400: errorResponse(400, '竞猜审核失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '竞猜不存在'),
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
                        items: { type: 'array', items: { type: 'object', additionalProperties: true } },
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
            summary: '管理台品牌商品列表',
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
        post: {
            tags: ['Admin'],
            summary: '新增品牌商品',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminBrandProductPayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/CreateAdminBrandProductResult',
                }),
                400: errorResponse(400, '新增品牌商品失败'),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/products/brand-library/{id}': {
        put: {
            tags: ['Admin'],
            summary: '编辑品牌商品',
            security: bearerSecurity,
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', example: '108' },
                },
            ],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminBrandProductPayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/UpdateAdminBrandProductResult',
                }),
                400: errorResponse(400, '编辑品牌商品失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '品牌商品不存在'),
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
    '/api/admin/equity': {
        get: {
            tags: ['Admin'],
            summary: '管理台权益金账户列表',
            security: bearerSecurity,
            parameters: [
                { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 10 } },
                { name: 'userId', in: 'query', schema: { type: 'string', example: '1001' } },
                { name: 'userName', in: 'query', schema: { type: 'string', example: '张三' } },
                { name: 'phone', in: 'query', schema: { type: 'string', example: '13800138000' } },
            ],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminEquityListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/equity/{id}': {
        get: {
            tags: ['Admin'],
            summary: '管理台权益金账户详情',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '用户 ID')],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminEquityDetailResult' }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '权益金账户不存在'),
            },
        },
    },
    '/api/admin/equity/adjust': {
        post: {
            tags: ['Admin'],
            summary: '管理台权益金调账',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/AdjustAdminEquityPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdjustAdminEquityResult' }),
                400: errorResponse(400, '权益金调账失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '用户不存在'),
            },
        },
    },
    '/api/admin/banners': {
        get: {
            tags: ['Admin'],
            summary: '管理台轮播列表',
            security: bearerSecurity,
            parameters: [
                { name: 'title', in: 'query', schema: { type: 'string', example: 'Panda' } },
                { name: 'position', in: 'query', schema: { type: 'string', example: 'home_hero' } },
                {
                    name: 'targetType',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['guess', 'post', 'product', 'shop', 'external'],
                        example: 'guess',
                    },
                },
                {
                    name: 'status',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['all', 'active', 'scheduled', 'paused', 'ended'],
                        example: 'active',
                    },
                },
            ],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminBannerListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
        post: {
            tags: ['Admin'],
            summary: '管理台新增轮播',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminBannerPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/CreateAdminBannerResult' }),
                400: errorResponse(400, '轮播创建失败'),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/banners/{id}': {
        put: {
            tags: ['Admin'],
            summary: '管理台编辑轮播',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '轮播 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminBannerPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminBannerResult' }),
                400: errorResponse(400, '轮播更新失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '轮播不存在'),
            },
        },
        delete: {
            tags: ['Admin'],
            summary: '管理台删除轮播',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '轮播 ID')],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/DeleteAdminBannerResult' }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '轮播不存在'),
            },
        },
    },
    '/api/admin/banners/{id}/status': {
        put: {
            tags: ['Admin'],
            summary: '管理台更新轮播状态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '轮播 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminBannerStatusPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminBannerStatusResult' }),
                400: errorResponse(400, '轮播状态更新失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '轮播不存在'),
            },
        },
    },
    '/api/admin/checkin/rewards': {
        get: {
            tags: ['Admin'],
            summary: '管理台签到奖励配置列表',
            security: bearerSecurity,
            parameters: [
                { name: 'dayNo', in: 'query', schema: { type: 'integer', example: 7 } },
                {
                    name: 'rewardType',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['coin', 'coupon', 'physical'],
                        example: 'coupon',
                    },
                },
                { name: 'title', in: 'query', schema: { type: 'string', example: '第 7 天大奖' } },
                {
                    name: 'status',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['all', 'active', 'disabled'],
                        example: 'active',
                    },
                },
            ],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminCheckinRewardConfigListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
        post: {
            tags: ['Admin'],
            summary: '新增签到奖励配置',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminCheckinRewardConfigPayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/CreateAdminCheckinRewardConfigResult',
                }),
                400: errorResponse(400, '签到奖励创建失败'),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/checkin/rewards/{id}': {
        put: {
            tags: ['Admin'],
            summary: '编辑签到奖励配置',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '签到奖励配置 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminCheckinRewardConfigPayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/UpdateAdminCheckinRewardConfigResult',
                }),
                400: errorResponse(400, '签到奖励更新失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '签到奖励配置不存在'),
            },
        },
    },
    '/api/admin/checkin/rewards/{id}/status': {
        put: {
            tags: ['Admin'],
            summary: '更新签到奖励配置状态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '签到奖励配置 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminCheckinRewardConfigStatusPayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/UpdateAdminCheckinRewardConfigStatusResult',
                }),
                400: errorResponse(400, '签到奖励状态更新失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '签到奖励配置不存在'),
            },
        },
    },
    '/api/admin/invites/config': {
        get: {
            tags: ['Admin'],
            summary: '获取邀请奖励配置',
            security: bearerSecurity,
            responses: {
                200: successResponse({
                    anyOf: [
                        { $ref: '#/components/schemas/AdminInviteRewardConfigItem' },
                        { type: 'null' },
                    ],
                }),
                401: errorResponse(401, '请先登录'),
            },
        },
        put: {
            tags: ['Admin'],
            summary: '保存邀请奖励配置',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminInviteRewardConfigPayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/UpdateAdminInviteRewardConfigResult',
                }),
                400: errorResponse(400, '邀请奖励配置保存失败'),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/invites/records': {
        get: {
            tags: ['Admin'],
            summary: '邀请记录列表',
            security: bearerSecurity,
            parameters: [
                { name: 'inviter', in: 'query', schema: { type: 'string', example: '张三' } },
                { name: 'invitee', in: 'query', schema: { type: 'string', example: '李四' } },
                { name: 'inviteCode', in: 'query', schema: { type: 'string', example: 'INVITE101' } },
            ],
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/AdminInviteRecordListResult',
                }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/rankings': {
        get: {
            tags: ['Admin'],
            summary: '后台排行榜结果列表',
            security: bearerSecurity,
            parameters: [
                {
                    name: 'boardType',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['guessWins', 'winRate', 'inviteCount'],
                        example: 'guessWins',
                    },
                },
                {
                    name: 'periodType',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['daily', 'weekly', 'monthly', 'allTime'],
                        example: 'daily',
                    },
                },
                {
                    name: 'periodValue',
                    in: 'query',
                    schema: { type: 'string', example: '20260421' },
                },
                {
                    name: 'topUser',
                    in: 'query',
                    schema: { type: 'string', example: 'DOACgEkT' },
                },
            ],
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/AdminRankingListResult',
                }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/rankings/{boardType}/{periodType}/{periodValue}': {
        get: {
            tags: ['Admin'],
            summary: '后台某一期排行榜明细',
            security: bearerSecurity,
            parameters: [
                {
                    name: 'boardType',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                        enum: ['guessWins', 'winRate', 'inviteCount'],
                        example: 'guessWins',
                    },
                },
                {
                    name: 'periodType',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                        enum: ['daily', 'weekly', 'monthly', 'allTime'],
                        example: 'daily',
                    },
                },
                {
                    name: 'periodValue',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', example: '20260421' },
                },
            ],
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/AdminRankingDetailResult',
                }),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/coupons': {
        get: {
            tags: ['Admin'],
            summary: '优惠券模板列表',
            security: bearerSecurity,
            parameters: [
                { name: 'name', in: 'query', schema: { type: 'string', example: '新客券' } },
                { name: 'code', in: 'query', schema: { type: 'string', example: 'TPL_WELCOME_10' } },
                {
                    name: 'type',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['cash', 'discount', 'shipping'],
                        example: 'cash',
                    },
                },
                {
                    name: 'scopeType',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['platform', 'shop'],
                        example: 'platform',
                    },
                },
                {
                    name: 'status',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['all', 'active', 'scheduled', 'paused', 'disabled', 'ended'],
                        example: 'active',
                    },
                },
            ],
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminCouponListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
        post: {
            tags: ['Admin'],
            summary: '新增优惠券模板',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminCouponTemplatePayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/CreateAdminCouponTemplateResult',
                }),
                400: errorResponse(400, '优惠券模板创建失败'),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/coupons/{id}': {
        put: {
            tags: ['Admin'],
            summary: '编辑优惠券模板',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '优惠券模板 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminCouponTemplatePayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/UpdateAdminCouponTemplateResult',
                }),
                400: errorResponse(400, '优惠券模板更新失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '优惠券模板不存在'),
            },
        },
    },
    '/api/admin/coupons/{id}/status': {
        put: {
            tags: ['Admin'],
            summary: '更新优惠券模板状态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '优惠券模板 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminCouponTemplateStatusPayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/UpdateAdminCouponTemplateStatusResult',
                }),
                400: errorResponse(400, '优惠券状态更新失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '优惠券模板不存在'),
            },
        },
    },
    '/api/admin/coupons/{id}/batches': {
        get: {
            tags: ['Admin'],
            summary: '优惠券发券批次列表',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '优惠券模板 ID')],
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/AdminCouponGrantBatchListResult',
                }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '优惠券模板不存在'),
            },
        },
    },
    '/api/admin/coupons/{id}/grants': {
        post: {
            tags: ['Admin'],
            summary: '创建发券批次',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '优惠券模板 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminCouponGrantBatchPayload',
            }),
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/CreateAdminCouponGrantBatchResult',
                }),
                400: errorResponse(400, '发券失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '优惠券模板不存在'),
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
    '/api/admin/shops/{id}': {
        get: {
            tags: ['Admin'],
            summary: '管理台店铺详情',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '店铺 ID')],
            responses: {
                200: successResponse({
                    type: 'object',
                    properties: {
                        shop: { type: 'object', additionalProperties: true },
                        products: { type: 'array', items: { type: 'object', additionalProperties: true } },
                        orders: { type: 'array', items: { type: 'object', additionalProperties: true } },
                        guesses: { type: 'array', items: { type: 'object', additionalProperties: true } },
                        brandAuths: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    },
                }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '店铺不存在'),
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
    '/api/admin/shops/applies/{id}/review': {
        put: {
            tags: ['Admin'],
            summary: '审核开店申请',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '开店申请 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/ReviewAdminShopApplyPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/ReviewAdminShopApplyResult' }),
                400: errorResponse(400, '请填写拒绝原因'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '开店申请不存在'),
            },
        },
    },
    '/api/admin/brands': {
        get: {
            tags: ['Admin'],
            summary: '管理台品牌管理列表',
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
        post: {
            tags: ['Admin'],
            summary: '管理台新增品牌',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminBrandPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/CreateAdminBrandResult' }),
                400: errorResponse(400, '新增品牌失败'),
                401: errorResponse(401, '请先登录'),
                409: errorResponse(409, '品牌名称已存在'),
            },
        },
    },
    '/api/admin/brands/{id}': {
        put: {
            tags: ['Admin'],
            summary: '管理台编辑品牌',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '品牌 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminBrandPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminBrandResult' }),
                400: errorResponse(400, '编辑品牌失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '品牌不存在'),
                409: errorResponse(409, '品牌名称已存在'),
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
    '/api/admin/brands/auth-applies/{id}/review': {
        put: {
            tags: ['Admin'],
            summary: '审核品牌授权申请',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '品牌授权申请 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/ReviewAdminBrandAuthApplyPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/ReviewAdminBrandAuthApplyResult' }),
                400: errorResponse(400, '请填写拒绝原因'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '品牌授权申请不存在'),
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
    '/api/admin/brands/auth-records/{id}/revoke': {
        put: {
            tags: ['Admin'],
            summary: '撤销品牌授权记录',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '品牌授权记录 ID')],
            responses: {
                200: successResponse({
                    $ref: '#/components/schemas/RevokeAdminBrandAuthRecordResult',
                }),
                400: errorResponse(400, '撤销品牌授权失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '品牌授权记录不存在'),
            },
        },
    },
    '/api/admin/shops/products': {
        get: {
            tags: ['Admin'],
            summary: '管理台店铺商品列表',
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
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    title: { type: 'string' },
                                    content: { type: 'string', nullable: true },
                                },
                                additionalProperties: true,
                            },
                        },
                        summary: { type: 'object', additionalProperties: true },
                        basis: { type: 'string', example: '按通知内容聚合后的已发送批次视图' },
                    },
                }),
                401: errorResponse(401, '请先登录'),
            },
        },
        post: {
            tags: ['Admin'],
            summary: '发送通知',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminNotificationPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/CreateAdminNotificationResult' }),
                400: errorResponse(400, '通知标题不能为空'),
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
    '/api/admin/shops/{id}/status': {
        put: {
            tags: ['Admin'],
            summary: '更新店铺状态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '店铺 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminShopStatusPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminShopStatusResult' }),
                400: errorResponse(400, '更新店铺状态失败'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '店铺不存在'),
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
        post: {
            tags: ['Admin'],
            summary: '新增系统用户',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminSystemUserPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminSystemUserMutationResult' }),
                400: errorResponse(400, '系统用户名已存在'),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/system-users/{id}': {
        put: {
            tags: ['Admin'],
            summary: '编辑系统用户',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '系统用户 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminSystemUserPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminSystemUserMutationResult' }),
                400: errorResponse(400, '系统用户名已存在'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '系统用户不存在'),
            },
        },
    },
    '/api/admin/system-users/{id}/reset-password': {
        post: {
            tags: ['Admin'],
            summary: '重置系统用户密码',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '系统用户 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/ResetAdminSystemUserPasswordPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminSystemUserMutationResult' }),
                400: errorResponse(400, '密码长度不能少于 6 位'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '系统用户不存在'),
            },
        },
    },
    '/api/admin/roles': {
        get: {
            tags: ['Admin'],
            summary: '管理台角色列表',
            security: bearerSecurity,
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminRoleListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
        post: {
            tags: ['Admin'],
            summary: '新增角色',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminRolePayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/CreateAdminRoleResult' }),
                400: errorResponse(400, '角色编码不能为空'),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/roles/{id}': {
        put: {
            tags: ['Admin'],
            summary: '更新角色基础信息',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '角色 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminRolePayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminRoleResult' }),
                400: errorResponse(400, '角色编码不能为空'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '角色不存在'),
            },
        },
    },
    '/api/admin/permissions': {
        get: {
            tags: ['Admin'],
            summary: '管理台权限定义列表',
            security: bearerSecurity,
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminPermissionListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
        post: {
            tags: ['Admin'],
            summary: '新增权限',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminPermissionPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminPermissionMutationResult' }),
                400: errorResponse(400, '权限编码不能为空'),
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
    '/api/admin/permissions/{id}/status': {
        put: {
            tags: ['Admin'],
            summary: '更新权限状态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '权限 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminPermissionStatusPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminPermissionStatusResult' }),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '权限不存在'),
            },
        },
    },
    '/api/admin/permissions/{id}': {
        put: {
            tags: ['Admin'],
            summary: '编辑权限',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '权限 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminPermissionPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminPermissionMutationResult' }),
                400: errorResponse(400, '权限编码不能为空'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '权限不存在'),
            },
        },
    },
    '/api/admin/categories': {
        get: {
            tags: ['Admin'],
            summary: '管理台分类列表',
            security: bearerSecurity,
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminCategoryListResult' }),
                401: errorResponse(401, '请先登录'),
            },
        },
        post: {
            tags: ['Admin'],
            summary: '新增分类',
            security: bearerSecurity,
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/CreateAdminCategoryPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminCategoryItem' }),
                400: errorResponse(400, '分类名称不能为空'),
                401: errorResponse(401, '请先登录'),
            },
        },
    },
    '/api/admin/categories/{id}': {
        put: {
            tags: ['Admin'],
            summary: '编辑分类',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '分类 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminCategoryPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/AdminCategoryItem' }),
                400: errorResponse(400, '分类名称不能为空'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '分类不存在'),
            },
        },
    },
    '/api/admin/categories/{id}/status': {
        put: {
            tags: ['Admin'],
            summary: '更新分类状态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '分类 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminCategoryStatusPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminCategoryResult' }),
                400: errorResponse(400, '请先启用父分类'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '分类不存在'),
            },
        },
    },
    '/api/admin/system-users/{id}/status': {
        put: {
            tags: ['Admin'],
            summary: '更新系统用户状态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '系统用户 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminSystemUserStatusPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminSystemUserStatusResult' }),
                400: errorResponse(400, '不能停用当前登录账号'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '系统用户不存在'),
            },
        },
    },
    '/api/admin/roles/{id}/status': {
        put: {
            tags: ['Admin'],
            summary: '更新角色状态',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '角色 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminRoleStatusPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminRoleStatusResult' }),
                400: errorResponse(400, '系统内置角色不允许停用'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '角色不存在'),
            },
        },
    },
    '/api/admin/roles/{id}/permissions': {
        put: {
            tags: ['Admin'],
            summary: '更新角色权限',
            security: bearerSecurity,
            parameters: [pathIdParameter('id', '角色 ID')],
            requestBody: jsonRequestBody({
                $ref: '#/components/schemas/UpdateAdminRolePermissionsPayload',
            }),
            responses: {
                200: successResponse({ $ref: '#/components/schemas/UpdateAdminRolePermissionsResult' }),
                400: errorResponse(400, '存在无效权限或停用权限'),
                401: errorResponse(401, '请先登录'),
                404: errorResponse(404, '角色不存在'),
            },
        },
    },
};
