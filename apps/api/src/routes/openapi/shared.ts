export function bigintStringSchema(example = '1001', description?: string) {
  return {
    type: 'string',
    pattern: '^[0-9]+$',
    example,
    ...(description ? { description } : {}),
  };
}

export function successResponse(
  dataSchema: Record<string, unknown>,
  description = 'OK',
) {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: dataSchema,
            message: {
              type: 'string',
            },
          },
        },
      },
    },
  };
}

export function errorResponse(
  status: number,
  message: string,
  description = 'Request failed',
  code = 'REQUEST_FAILED',
) {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['success', 'code', 'message', 'status'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            code: {
              type: 'string',
              example: code,
            },
            message: {
              type: 'string',
              example: message,
            },
            status: {
              type: 'integer',
              example: status,
            },
            fields: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              nullable: true,
            },
          },
        },
      },
    },
  };
}

export function jsonRequestBody(
  schema: Record<string, unknown>,
  description?: string,
) {
  return {
    required: true,
    description,
    content: {
      'application/json': {
        schema,
      },
    },
  };
}

export function pathIdParameter(name: string, description: string) {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: bigintStringSchema('1001', '数据库 BIGINT 主键通过 JSON 按十进制字符串传输'),
  };
}

export const bearerSecurity = [{ bearerAuth: [] }];
