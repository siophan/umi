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
    required: ['id', 'username', 'displayName', 'status', 'roles', 'permissions', 'permissionModules'],
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
      permissionModules: {
        type: 'array',
        items: { type: 'string' },
        example: ['仪表盘', '用户管理', '角色管理'],
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
  AdminPermissionItem: {
    type: 'object',
    required: [
      'id',
      'code',
      'name',
      'module',
      'action',
      'status',
      'sort',
      'assignedRoleCount',
    ],
    properties: {
      id: { type: 'string', example: '11' },
      code: { type: 'string', example: 'user.manage' },
      name: { type: 'string', example: '查看用户' },
      module: { type: 'string', example: '用户管理' },
      action: {
        type: 'string',
        enum: ['view', 'create', 'edit', 'manage', 'unknown'],
        example: 'view',
      },
      parentId: { type: 'string', nullable: true, example: '10' },
      parentName: { type: 'string', nullable: true, example: '用户管理' },
      status: {
        type: 'string',
        enum: ['active', 'disabled'],
        example: 'active',
      },
      sort: { type: 'integer', example: 10 },
      assignedRoleCount: { type: 'integer', example: 3 },
    },
  },
  AdminPermissionListResult: {
    type: 'object',
    required: ['items', 'summary'],
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/AdminPermissionItem' },
      },
      summary: {
        type: 'object',
        required: ['total', 'active', 'disabled', 'modules'],
        properties: {
          total: { type: 'integer', example: 24 },
          active: { type: 'integer', example: 20 },
          disabled: { type: 'integer', example: 4 },
          modules: { type: 'integer', example: 6 },
        },
      },
    },
  },
  UpdateAdminPermissionStatusPayload: {
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
  UpdateAdminPermissionStatusResult: {
    type: 'object',
    required: ['id', 'status'],
    properties: {
      id: { type: 'string', example: '11' },
      status: {
        type: 'string',
        enum: ['active', 'disabled'],
        example: 'disabled',
      },
    },
  },
  CreateAdminPermissionPayload: {
    type: 'object',
    required: ['code', 'name', 'module', 'action'],
    properties: {
      code: { type: 'string', example: 'user.manage' },
      name: { type: 'string', example: '查看用户' },
      module: { type: 'string', example: '用户管理' },
      action: {
        type: 'string',
        enum: ['view', 'create', 'edit', 'manage'],
        example: 'view',
      },
      parentId: { type: 'string', nullable: true, example: '10' },
      sort: { type: 'integer', example: 10 },
      status: {
        type: 'string',
        enum: ['active', 'disabled'],
        example: 'active',
      },
    },
  },
  UpdateAdminPermissionPayload: {
    type: 'object',
    required: ['code', 'name', 'module', 'action'],
    properties: {
      code: { type: 'string', example: 'user.manage' },
      name: { type: 'string', example: '查看用户' },
      module: { type: 'string', example: '用户管理' },
      action: {
        type: 'string',
        enum: ['view', 'create', 'edit', 'manage'],
        example: 'view',
      },
      parentId: { type: 'string', nullable: true, example: '10' },
      sort: { type: 'integer', example: 10 },
    },
  },
  AdminPermissionMutationResult: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: '11' },
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
  AdminRoleListItem: {
    type: 'object',
    required: [
      'id',
      'code',
      'name',
      'permissionRange',
      'memberCount',
      'permissionCount',
      'status',
      'isSystem',
      'sort',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      id: { type: 'string', example: '2' },
      code: { type: 'string', example: 'ops_manager' },
      name: { type: 'string', example: '运营经理' },
      description: { type: 'string', nullable: true, example: '负责活动与内容运营' },
      permissionRange: { type: 'string', example: '用户 / 订单 等 3 个模块' },
      permissionModules: {
        type: 'array',
        items: { type: 'string', example: '用户' },
      },
      memberCount: { type: 'integer', example: 6 },
      permissionCount: { type: 'integer', example: 18 },
      status: {
        type: 'string',
        enum: ['active', 'disabled'],
        example: 'active',
      },
      isSystem: { type: 'boolean', example: false },
      sort: { type: 'integer', example: 20 },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-20T08:30:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-20T10:15:00.000Z',
      },
    },
  },
  AdminRoleListResult: {
    type: 'object',
    required: ['items', 'summary'],
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/AdminRoleListItem' },
      },
      summary: {
        type: 'object',
        required: ['total', 'active', 'disabled', 'members'],
        properties: {
          total: { type: 'integer', example: 5 },
          active: { type: 'integer', example: 4 },
          disabled: { type: 'integer', example: 1 },
          members: { type: 'integer', example: 23 },
        },
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
} as const;
