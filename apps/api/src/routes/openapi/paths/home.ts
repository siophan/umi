import { errorResponse, successResponse } from '../shared';

export const homePaths = {
  '/api/banners': {
    get: {
      tags: ['Banner'],
      summary: '获取运营 Banner 列表',
      parameters: [
        {
          name: 'position',
          in: 'query',
          required: false,
          schema: { type: 'string', example: 'home_hero' },
          description: 'Banner 位置，如首页头图 `home_hero`',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', example: 5, minimum: 1, maximum: 10 },
          description: '返回数量，默认 5，最大 10',
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
                  id: { type: 'string', example: '1' },
                  position: { type: 'string', example: 'home_hero' },
                  title: { type: 'string', example: '世界杯冠军竞猜' },
                  subtitle: { type: 'string', nullable: true, example: '平台推荐' },
                  imageUrl: { type: 'string', nullable: true, example: 'https://example.com/banner.png' },
                  targetType: { type: 'string', example: 'guess' },
                  targetId: { type: 'string', nullable: true, example: '101' },
                  actionUrl: { type: 'string', nullable: true, example: null },
                  sort: { type: 'integer', example: 100 },
                  targetPath: { type: 'string', nullable: true, example: '/guess/101' },
                  guess: { type: 'object', nullable: true, additionalProperties: true },
                },
              },
            },
          },
        }),
      },
    },
  },
  '/api/rankings': {
    get: {
      tags: ['Ranking'],
      summary: '获取排行榜',
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: { type: 'string', example: 'winRate' },
          description: '榜单类型：`winRate`、`guessWins`、`inviteCount`；兼容 `earnings`、`active` 老别名',
        },
        {
          name: 'periodType',
          in: 'query',
          required: false,
          schema: { type: 'string', example: 'allTime' },
          description: '周期类型：`daily`、`weekly`、`monthly`、`allTime`',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', example: 20, minimum: 1, maximum: 100 },
          description: '返回数量，默认 20，最大 100',
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
                  rank: { type: 'integer', example: 1 },
                  userId: { type: 'string', example: '1001' },
                  nickname: { type: 'string', example: '预言大师' },
                  avatar: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' },
                  level: { type: 'integer', example: 8 },
                  value: { type: 'string', example: '82.3%' },
                  score: { type: 'number', example: 82.3 },
                  type: { type: 'string', example: 'winRate' },
                  periodType: { type: 'string', example: 'allTime' },
                  periodValue: { type: 'string', example: '0' },
                },
              },
            },
            total: { type: 'integer', example: 3 },
            type: { type: 'string', example: 'winRate' },
            periodType: { type: 'string', example: 'allTime' },
            periodValue: { type: 'string', example: '0' },
          },
        }),
      },
    },
  },
  '/api/lives': {
    get: {
      tags: ['Live'],
      summary: '获取直播列表',
      parameters: [
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', example: 20, minimum: 1, maximum: 50 },
          description: '返回直播数量，默认 20，最大 50',
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
  '/api/lives/{id}': {
    get: {
      tags: ['Live'],
      summary: '获取直播详情',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', example: '1' },
          description: '直播 ID',
        },
      ],
      responses: {
        200: successResponse({
          type: 'object',
          additionalProperties: true,
        }),
        404: errorResponse(404, '直播不存在', '直播不存在', 'LIVE_NOT_FOUND'),
      },
    },
  },
} as const;
