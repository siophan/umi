export const authSchemas = {
    LoginPayload: {
        type: 'object',
        required: ['phone', 'method'],
        properties: {
            phone: { type: 'string', example: '13800138000' },
            method: {
                type: 'string',
                enum: ['code', 'password'],
                example: 'password',
            },
            code: { type: 'string', example: '123456' },
            password: { type: 'string', example: '123456' },
        },
    },
    SendCodePayload: {
        type: 'object',
        required: ['phone', 'bizType'],
        properties: {
            phone: { type: 'string', example: '13800138000' },
            bizType: {
                type: 'string',
                enum: ['register', 'login', 'reset_password'],
                example: 'login',
            },
        },
    },
    RegisterPayload: {
        type: 'object',
        required: ['phone', 'code', 'password', 'name'],
        properties: {
            phone: { type: 'string', example: '13800138000' },
            code: { type: 'string', example: '123456' },
            password: { type: 'string', example: '123456' },
            name: { type: 'string', example: 'Joy User' },
        },
    },
    ChangePasswordPayload: {
        type: 'object',
        required: ['newPassword'],
        properties: {
            currentPassword: { type: 'string', example: '123456' },
            newPassword: { type: 'string', example: '654321' },
        },
    },
    UpdateMePayload: {
        type: 'object',
        properties: {
            name: { type: 'string', example: '新昵称' },
            avatar: {
                type: 'string',
                nullable: true,
                example: 'https://example.com/avatar.png',
            },
            signature: { type: 'string', nullable: true, example: '有点准' },
            gender: { type: 'string', nullable: true, example: 'male' },
            birthday: {
                type: 'string',
                nullable: true,
                format: 'date',
                example: '1998-06-18',
            },
            region: { type: 'string', nullable: true, example: 'Shanghai' },
            worksPrivacy: {
                type: 'string',
                enum: ['all', 'friends', 'me'],
                example: 'friends',
            },
            favPrivacy: {
                type: 'string',
                enum: ['all', 'me'],
                example: 'me',
            },
        },
    },
    SendChatMessagePayload: {
        type: 'object',
        required: ['content'],
        properties: {
            content: { type: 'string', example: '你好，聊聊这场竞猜？' },
        },
    },
};
