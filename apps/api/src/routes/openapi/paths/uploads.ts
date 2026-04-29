import { bearerSecurity, errorResponse, successResponse } from '../shared';

export const uploadPaths = {
  '/api/uploads/oss/images': {
    post: {
      tags: ['Upload'],
      summary: '上传图片到阿里云 OSS',
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fileName', 'contentType', 'contentBase64', 'usage'],
              properties: {
                fileName: { type: 'string', example: 'cover.png' },
                contentType: {
                  type: 'string',
                  enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
                },
                contentBase64: {
                  type: 'string',
                  description: '图片 base64，可带 data URL 前缀',
                },
                usage: {
                  type: 'string',
                  enum: ['guess_cover', 'community_post'],
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
            key: { type: 'string', example: 'uploads/guess_cover/2026/04/27/1-123.png' },
            url: { type: 'string', example: 'https://bucket.oss-cn-beijing.aliyuncs.com/uploads/guess_cover/cover.png' },
            etag: { type: 'string', nullable: true },
            size: { type: 'integer', example: 1024 },
            contentType: { type: 'string', example: 'image/png' },
          },
        }),
        400: errorResponse(400, '图片参数不合法'),
        401: errorResponse(401, '请先登录'),
        502: errorResponse(502, 'OSS 上传失败'),
      },
    },
  },
  '/api/admin/uploads/oss/videos': {
    post: {
      tags: ['Admin'],
      summary: '上传视频到阿里云 OSS（admin 专用，最大 50MB）',
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fileName', 'contentType', 'contentBase64', 'usage'],
              properties: {
                fileName: { type: 'string', example: 'demo.mp4' },
                contentType: {
                  type: 'string',
                  enum: ['video/mp4', 'video/webm', 'video/quicktime'],
                },
                contentBase64: {
                  type: 'string',
                  description: '视频 base64，可带 data URL 前缀',
                },
                usage: {
                  type: 'string',
                  enum: ['brand_product'],
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
            key: { type: 'string', example: 'uploads/brand_product/2026/04/29/1-123.mp4' },
            url: { type: 'string', example: 'https://bucket.oss-cn-beijing.aliyuncs.com/uploads/brand_product/demo.mp4' },
            etag: { type: 'string', nullable: true },
            size: { type: 'integer', example: 1048576 },
            contentType: { type: 'string', example: 'video/mp4' },
          },
        }),
        400: errorResponse(400, '视频参数不合法'),
        401: errorResponse(401, '请先登录'),
        502: errorResponse(502, 'OSS 上传失败'),
      },
    },
  },
} as const;
