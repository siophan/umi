import {
  bearerSecurity,
  errorResponse,
  pathIdParameter,
  successResponse,
} from '../shared';

export const notificationPaths = {
  '/api/notifications': {
    get: {
      tags: ['Notification'],
      summary: '获取通知列表',
      security: bearerSecurity,
      responses: {
        200: successResponse({
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
              },
              example: [
                {
                  id: 1,
                  title: '竞猜开奖',
                  content: '你参与的竞猜已结算',
                  read: false,
                  createdAt: '2026-04-19T10:00:00.000Z',
                },
              ],
            },
          },
        }),
        401: errorResponse(401, '请先登录'),
      },
    },
  },
  '/api/notifications/read-all': {
    post: {
      tags: ['Notification'],
      summary: '全部通知标记已读',
      security: bearerSecurity,
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
  '/api/notifications/{id}/read': {
    post: {
      tags: ['Notification'],
      summary: '单条通知标记已读',
      security: bearerSecurity,
      parameters: [pathIdParameter('id', '通知 ID')],
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
} as const;
