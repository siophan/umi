export const shopSchemas = {
  SubmitBrandAuthApplicationPayload: {
    type: 'object',
    required: ['brandId', 'reason'],
    properties: {
      brandId: { type: 'string', example: '101' },
      reason: {
        type: 'string',
        example: '门店已取得线下经销资格，申请线上上架。',
      },
      license: {
        type: 'string',
        example: 'https://example.com/license.png',
      },
    },
  },
  SubmitShopApplicationPayload: {
    type: 'object',
    required: ['shopName', 'categoryId', 'reason'],
    properties: {
      shopName: { type: 'string', example: 'Joy Select' },
      categoryId: { type: 'string', example: '12' },
      reason: {
        type: 'string',
        example: '主营零食好物，希望开通店铺后承接竞猜和商品销售。',
      },
    },
  },
  AddShopProductsPayload: {
    type: 'object',
    required: ['brandId', 'brandProductIds'],
    properties: {
      brandId: { type: 'string', example: '101' },
      brandProductIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['2001', '2002'],
      },
    },
  },
} as const;
