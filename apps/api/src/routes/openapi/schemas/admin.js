export const adminSchemas = {
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
                example: ['dashboard.view', 'user.manage'],
            },
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
    AdminChangePasswordPayload: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
            currentPassword: { type: 'string', example: '123456' },
            newPassword: { type: 'string', example: '654321' },
        },
    },
    AdminCategoryItem: {
        type: 'object',
        required: [
            'id',
            'bizType',
            'bizTypeCode',
            'bizTypeLabel',
            'level',
            'name',
            'sort',
            'status',
            'statusLabel',
            'usageCount',
            'usageBreakdown',
            'createdAt',
            'updatedAt',
        ],
        properties: {
            id: { type: 'string', example: '12' },
            bizType: {
                type: 'string',
                enum: ['brand', 'shop', 'product', 'guess', 'unknown'],
                example: 'product',
            },
            bizTypeCode: { type: 'integer', enum: [10, 20, 30, 40], example: 30 },
            bizTypeLabel: { type: 'string', example: '商品分类' },
            parentId: { type: 'string', nullable: true, example: '9' },
            parentName: { type: 'string', nullable: true, example: '食品饮料' },
            level: { type: 'integer', example: 2 },
            path: { type: 'string', nullable: true, example: '9/12' },
            name: { type: 'string', example: '膨化零食' },
            iconUrl: { type: 'string', nullable: true, example: 'https://example.com/icon.png' },
            description: { type: 'string', nullable: true, example: '平台商品分类' },
            sort: { type: 'integer', example: 10 },
            status: {
                type: 'string',
                enum: ['active', 'disabled'],
                example: 'active',
            },
            statusLabel: { type: 'string', example: '启用' },
            usageCount: { type: 'integer', example: 18 },
            usageBreakdown: {
                type: 'object',
                required: ['brands', 'brandApplies', 'brandProducts', 'shops', 'shopApplies', 'guesses'],
                properties: {
                    brands: { type: 'integer', example: 0 },
                    brandApplies: { type: 'integer', example: 0 },
                    brandProducts: { type: 'integer', example: 18 },
                    shops: { type: 'integer', example: 0 },
                    shopApplies: { type: 'integer', example: 0 },
                    guesses: { type: 'integer', example: 0 },
                },
            },
            createdAt: { type: 'string', format: 'date-time', example: '2026-04-19T10:30:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-04-19T12:00:00.000Z' },
        },
    },
    AdminCategoryListResult: {
        type: 'object',
        required: ['items', 'summary'],
        properties: {
            items: {
                type: 'array',
                items: { $ref: '#/components/schemas/AdminCategoryItem' },
            },
            summary: {
                type: 'object',
                required: ['total', 'active', 'disabled', 'byBizType'],
                properties: {
                    total: { type: 'integer', example: 32 },
                    active: { type: 'integer', example: 29 },
                    disabled: { type: 'integer', example: 3 },
                    byBizType: { type: 'object', additionalProperties: { type: 'integer' } },
                },
            },
        },
    },
    CreateAdminCategoryPayload: {
        type: 'object',
        required: ['bizTypeCode', 'name'],
        properties: {
            bizTypeCode: { type: 'integer', enum: [10, 20, 30, 40], example: 30 },
            parentId: { type: 'string', nullable: true, example: '9' },
            name: { type: 'string', example: '膨化零食' },
            iconUrl: { type: 'string', nullable: true, example: 'https://example.com/icon.png' },
            description: { type: 'string', nullable: true, example: '平台商品分类' },
            sort: { type: 'integer', example: 10 },
            status: {
                type: 'string',
                enum: ['active', 'disabled'],
                example: 'active',
            },
        },
    },
    UpdateAdminCategoryPayload: {
        type: 'object',
        required: ['name'],
        properties: {
            name: { type: 'string', example: '膨化零食' },
            iconUrl: { type: 'string', nullable: true, example: 'https://example.com/icon.png' },
            description: { type: 'string', nullable: true, example: '平台商品分类' },
            sort: { type: 'integer', example: 10 },
        },
    },
    UpdateAdminCategoryStatusPayload: {
        type: 'object',
        required: ['status'],
        properties: {
            status: {
                type: 'string',
                enum: ['active', 'disabled'],
                example: 'disabled',
            },
        },
    },
    UpdateAdminCategoryResult: {
        type: 'object',
        required: ['id', 'status'],
        properties: {
            id: { type: 'string', example: '12' },
            status: {
                type: 'string',
                enum: ['active', 'disabled'],
                example: 'disabled',
            },
        },
    },
    UpdateAdminSystemUserStatusPayload: {
        type: 'object',
        required: ['status'],
        properties: {
            status: {
                type: 'string',
                enum: ['active', 'disabled'],
                example: 'disabled',
            },
        },
    },
    UpdateAdminSystemUserStatusResult: {
        type: 'object',
        required: ['id', 'status'],
        properties: {
            id: { type: 'string', example: '1' },
            status: {
                type: 'string',
                enum: ['active', 'disabled'],
                example: 'disabled',
            },
        },
    },
    CreateAdminSystemUserPayload: {
        type: 'object',
        required: ['username', 'password', 'displayName', 'roleIds'],
        properties: {
            username: { type: 'string', example: 'ops_manager' },
            password: { type: 'string', example: '123456' },
            displayName: { type: 'string', example: '运营经理' },
            phoneNumber: { type: 'string', nullable: true, example: '13800138000' },
            email: { type: 'string', nullable: true, example: 'ops@example.com' },
            roleIds: {
                type: 'array',
                items: { type: 'string', example: '2' },
            },
            status: {
                type: 'string',
                enum: ['active', 'disabled'],
                example: 'active',
            },
        },
    },
    UpdateAdminSystemUserPayload: {
        type: 'object',
        required: ['username', 'displayName', 'roleIds'],
        properties: {
            username: { type: 'string', example: 'ops_manager' },
            displayName: { type: 'string', example: '运营经理' },
            phoneNumber: { type: 'string', nullable: true, example: '13800138000' },
            email: { type: 'string', nullable: true, example: 'ops@example.com' },
            roleIds: {
                type: 'array',
                items: { type: 'string', example: '2' },
            },
        },
    },
    ResetAdminSystemUserPasswordPayload: {
        type: 'object',
        required: ['newPassword'],
        properties: {
            newPassword: { type: 'string', example: '654321' },
        },
    },
    AdminSystemUserMutationResult: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', example: '3' },
        },
    },
    UpdateAdminRoleStatusPayload: {
        type: 'object',
        required: ['status'],
        properties: {
            status: {
                type: 'string',
                enum: ['active', 'disabled'],
                example: 'disabled',
            },
        },
    },
    UpdateAdminRoleStatusResult: {
        type: 'object',
        required: ['id', 'status'],
        properties: {
            id: { type: 'string', example: '2' },
            status: {
                type: 'string',
                enum: ['active', 'disabled'],
                example: 'disabled',
            },
        },
    },
    UpdateAdminRolePermissionsPayload: {
        type: 'object',
        required: ['permissionIds'],
        properties: {
            permissionIds: {
                type: 'array',
                items: { type: 'string', example: '11' },
            },
        },
    },
    UpdateAdminRolePermissionsResult: {
        type: 'object',
        required: ['id', 'permissionIds'],
        properties: {
            id: { type: 'string', example: '2' },
            permissionIds: {
                type: 'array',
                items: { type: 'string', example: '11' },
            },
        },
    },
};
