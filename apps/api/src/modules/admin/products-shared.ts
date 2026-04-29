import sanitizeHtml from 'sanitize-html';
import type {
  AdminBrandProductSpecRow,
  CreateAdminBrandProductPayload,
  UpdateAdminBrandProductPayload,
} from '@umi/shared';

// 商品详情 HTML 写入数据库前必须 sanitize, 哪怕来源是 admin。
// 用户端 product-detail 页面是 dangerouslySetInnerHTML 渲染, admin 帐号被攻陷
// 即可注入 script / onerror 拿到访客 cookie。
const PRODUCT_DETAIL_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'div', 'span', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'small', 'sub', 'sup', 'mark', 'code', 'pre',
    'ul', 'ol', 'li',
    'blockquote',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'img', 'a',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    '*': ['style'],
  },
  allowedSchemes: ['http', 'https', 'data'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowProtocolRelative: false,
  // style 只允许少量基础样式, 防止 expression / url() 注入
  allowedStyles: {
    '*': {
      color: [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
      'background-color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
      'text-align': [/^(?:left|right|center|justify)$/],
      'font-size': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
      'font-weight': [/^(?:bold|normal|\d{3})$/],
      width: [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
      'max-width': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
  },
};

export function sanitizeProductDetailHtml(value: string): string {
  return sanitizeHtml(value, PRODUCT_DETAIL_SANITIZE_OPTIONS);
}

export const PRODUCT_STATUS_ACTIVE = 10;
export const PRODUCT_STATUS_OFF_SHELF = 20;
export const PRODUCT_STATUS_DISABLED = 90;

export const SHOP_STATUS_ACTIVE = 10;
export const SHOP_STATUS_PAUSED = 20;

export const BRAND_STATUS_ACTIVE = 10;
export const BRAND_STATUS_DISABLED = 90;
export const BRAND_PRODUCT_STATUS_ACTIVE = 10;
export const BRAND_PRODUCT_STATUS_DISABLED = 90;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const LOW_STOCK_THRESHOLD = 10;

export type AdminProductRow = {
  id: number | string;
  brand_product_id: number | string | null;
  shop_id: number | string | null;
  name: string;
  price: number | string | null;
  stock: number | string | null;
  frozen_stock: number | string | null;
  status: number | string;
  updated_at: Date | string;
  tags: string | null;
  collab: string | null;
  image_url: string | null;
  shop_name: string | null;
  shop_status: number | string | null;
  brand_name: string | null;
  brand_status: number | string | null;
  category_id: number | string | null;
  category_name: string | null;
  brand_product_status: number | string | null;
};

export type AdminBrandLibraryRow = {
  id: number | string;
  brand_id: number | string | null;
  name: string;
  category_id: number | string | null;
  guide_price: number | string | null;
  supply_price: number | string | null;
  description: string | null;
  status: number | string;
  created_at: Date | string;
  updated_at: Date | string;
  default_img: string | null;
  images: unknown;
  video_url: string | null;
  detail_html: string | null;
  spec_table: unknown;
  package_list: unknown;
  freight: number | string | null;
  ship_from: string | null;
  delivery_days: string | null;
  brand_name: string | null;
  brand_status: number | string | null;
  category_name: string | null;
  product_count: number | string | null;
  active_product_count: number | string | null;
};

export type CountRow = {
  total?: number | string | null;
};

export type AdminProductStatus =
  | 'active'
  | 'low_stock'
  | 'paused'
  | 'off_shelf'
  | 'disabled';

export type AdminBrandLibraryStatus = 'active' | 'disabled';

export interface AdminProductListItem {
  id: string;
  name: string;
  brand: string;
  categoryId: string | null;
  category: string;
  shopId: string | null;
  shopName: string;
  price: number;
  stock: number;
  availableStock: number;
  frozenStock: number;
  status: AdminProductStatus;
  updatedAt: string;
  tags: string[];
  imageUrl: string | null;
  brandProductId: string | null;
  rawStatusCode: number;
  shopStatusCode: number | null;
  brandStatusCode: number | null;
  brandProductStatusCode: number | null;
}

export interface AdminBrandLibraryItem {
  id: string;
  brandId: string | null;
  brandName: string;
  productName: string;
  categoryId: string | null;
  category: string;
  guidePrice: number;
  supplyPrice: number;
  status: AdminBrandLibraryStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
  imageList: string[];
  videoUrl: string | null;
  detailHtml: string | null;
  specTable: AdminBrandProductSpecRow[];
  packageList: string[];
  freight: number | null;
  shipFrom: string | null;
  deliveryDays: string | null;
  productCount: number;
  activeProductCount: number;
  rawStatusCode: number;
  brandStatusCode: number | null;
}

export interface AdminProductListResult {
  items: AdminProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export interface AdminBrandLibraryResult {
  items: AdminBrandLibraryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminProductQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: string;
  shopName?: string;
  status?: 'all' | AdminProductStatus;
}

export interface AdminBrandLibraryQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'all' | AdminBrandLibraryStatus;
  brandId?: string;
  categoryId?: string;
}

export function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function toNullableNumber(value: number | string | null | undefined) {
  if (value == null) {
    return null;
  }
  return Number(value);
}

export function normalizePage(page?: number) {
  return Math.max(DEFAULT_PAGE, Number(page ?? DEFAULT_PAGE) || DEFAULT_PAGE);
}

export function normalizePageSize(pageSize?: number) {
  const value = Number(pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, value));
}

export function safeJsonArray(value: unknown): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function uniqueStrings(items: string[]) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

export function formatDateTime(value: Date | string) {
  return new Date(value).toISOString();
}

export function resolveProductStatus(
  row: AdminProductRow,
  availableStock: number,
): AdminProductStatus {
  const productStatus = toNumber(row.status);
  const shopStatus = toNullableNumber(row.shop_status);
  const brandStatus = toNullableNumber(row.brand_status);
  const brandProductStatus = toNullableNumber(row.brand_product_status);

  if (
    productStatus === PRODUCT_STATUS_DISABLED ||
    brandStatus === BRAND_STATUS_DISABLED ||
    brandProductStatus === BRAND_PRODUCT_STATUS_DISABLED
  ) {
    return 'disabled';
  }

  if (shopStatus === SHOP_STATUS_PAUSED) {
    return 'paused';
  }

  if (productStatus === PRODUCT_STATUS_OFF_SHELF) {
    return 'off_shelf';
  }

  if (availableStock <= LOW_STOCK_THRESHOLD) {
    return 'low_stock';
  }

  return 'active';
}

export function resolveBrandLibraryStatus(
  row: AdminBrandLibraryRow,
): AdminBrandLibraryStatus {
  const status = toNumber(row.status);
  const brandStatus = toNullableNumber(row.brand_status);

  if (status === BRAND_PRODUCT_STATUS_DISABLED || brandStatus === BRAND_STATUS_DISABLED) {
    return 'disabled';
  }

  return 'active';
}

export function buildProductTags(
  row: AdminProductRow,
  status: AdminProductStatus,
  availableStock: number,
) {
  const sourceTags = safeJsonArray(row.tags);
  const tags = [...sourceTags];

  if (row.collab?.trim()) {
    tags.push(row.collab.trim());
  }
  if (availableStock <= LOW_STOCK_THRESHOLD) {
    tags.push('低库存');
  }
  if (status === 'off_shelf') {
    tags.push('已下架');
  }
  if (status === 'paused') {
    tags.push('店铺暂停');
  }
  if (status === 'disabled') {
    tags.push('不可售');
  }

  return uniqueStrings(tags);
}

export function sanitizeAdminProduct(row: AdminProductRow): AdminProductListItem {
  const stock = Math.max(0, toNumber(row.stock));
  const frozenStock = Math.max(0, toNumber(row.frozen_stock));
  const availableStock = Math.max(0, stock - frozenStock);
  const status = resolveProductStatus(row, availableStock);

  return {
    id: String(row.id),
    name: row.name,
    brand: row.brand_name || '未知品牌',
    categoryId: row.category_id == null ? null : String(row.category_id),
    category: row.category_name || '未分类',
    shopId: row.shop_id == null ? null : String(row.shop_id),
    shopName: row.shop_name || '未归属店铺',
    price: toNumber(row.price),
    stock,
    availableStock,
    frozenStock,
    status,
    updatedAt: formatDateTime(row.updated_at),
    tags: buildProductTags(row, status, availableStock),
    imageUrl: row.image_url,
    brandProductId: row.brand_product_id == null ? null : String(row.brand_product_id),
    rawStatusCode: toNumber(row.status),
    shopStatusCode: toNullableNumber(row.shop_status),
    brandStatusCode: toNullableNumber(row.brand_status),
    brandProductStatusCode: toNullableNumber(row.brand_product_status),
  };
}

export function sanitizeAdminBrandLibrary(
  row: AdminBrandLibraryRow,
): AdminBrandLibraryItem {
  const freightCents = row.freight == null ? null : Number(row.freight);
  return {
    id: String(row.id),
    brandId: row.brand_id == null ? null : String(row.brand_id),
    brandName: row.brand_name || '未知品牌',
    productName: row.name,
    categoryId: row.category_id == null ? null : String(row.category_id),
    category: row.category_name || '未分类',
    guidePrice: toNumber(row.guide_price),
    supplyPrice: toNumber(row.supply_price),
    status: resolveBrandLibraryStatus(row),
    description: row.description ?? null,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    imageUrl: row.default_img,
    imageList: parseBrandProductStringList(row.images),
    videoUrl: row.video_url ?? null,
    detailHtml: row.detail_html ?? null,
    specTable: parseBrandProductSpecTable(row.spec_table),
    packageList: parseBrandProductStringList(row.package_list),
    freight: freightCents == null || Number.isNaN(freightCents) ? null : freightCents,
    shipFrom: row.ship_from ?? null,
    deliveryDays: row.delivery_days ?? null,
    productCount: Math.max(0, toNumber(row.product_count)),
    activeProductCount: Math.max(0, toNumber(row.active_product_count)),
    rawStatusCode: toNumber(row.status),
    brandStatusCode: toNullableNumber(row.brand_status),
  };
}

export function parseBrandProductStringList(value: unknown): string[] {
  if (value == null) {
    return [];
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export function parseBrandProductSpecTable(value: unknown): AdminBrandProductSpecRow[] {
  if (value == null) {
    return [];
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const list: AdminBrandProductSpecRow[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        const key = typeof (item as { key?: unknown }).key === 'string'
          ? (item as { key: string }).key.trim()
          : '';
        const val = typeof (item as { value?: unknown }).value === 'string'
          ? (item as { value: string }).value.trim()
          : '';
        if (key) {
          list.push({ key, value: val });
        }
      }
    }
    return list;
  } catch {
    return [];
  }
}

export function buildAdminProductFilters(
  query: AdminProductQuery,
  options: { includeStatus: boolean } = { includeStatus: true },
) {
  const whereClauses = ['1 = 1'];
  const params: Array<string | number> = [];
  const keyword = query.keyword?.trim();
  const categoryId = query.categoryId?.trim();
  const shopName = query.shopName?.trim();
  const status = query.status ?? 'all';

  if (keyword) {
    const like = `%${keyword}%`;
    whereClauses.push('(p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ? OR s.name LIKE ?)');
    params.push(like, like, like, like);
  }

  if (categoryId) {
    whereClauses.push('bp.category_id = ?');
    params.push(categoryId);
  }

  if (shopName) {
    whereClauses.push('s.name LIKE ?');
    params.push(`%${shopName}%`);
  }

  if (options.includeStatus && status === 'active') {
    whereClauses.push(
      'p.status = ? AND COALESCE(s.status, ?) <> ? AND COALESCE(b.status, ?) <> ? AND COALESCE(bp.status, ?) <> ? AND (p.stock - COALESCE(p.frozen_stock, 0)) > ?',
    );
    params.push(
      PRODUCT_STATUS_ACTIVE,
      SHOP_STATUS_ACTIVE,
      SHOP_STATUS_PAUSED,
      BRAND_STATUS_ACTIVE,
      BRAND_STATUS_DISABLED,
      BRAND_PRODUCT_STATUS_ACTIVE,
      BRAND_PRODUCT_STATUS_DISABLED,
      LOW_STOCK_THRESHOLD,
    );
  } else if (options.includeStatus && status === 'low_stock') {
    whereClauses.push(
      'p.status = ? AND COALESCE(s.status, ?) <> ? AND COALESCE(b.status, ?) <> ? AND COALESCE(bp.status, ?) <> ? AND (p.stock - COALESCE(p.frozen_stock, 0)) <= ?',
    );
    params.push(
      PRODUCT_STATUS_ACTIVE,
      SHOP_STATUS_ACTIVE,
      SHOP_STATUS_PAUSED,
      BRAND_STATUS_ACTIVE,
      BRAND_STATUS_DISABLED,
      BRAND_PRODUCT_STATUS_ACTIVE,
      BRAND_PRODUCT_STATUS_DISABLED,
      LOW_STOCK_THRESHOLD,
    );
  } else if (options.includeStatus && status === 'paused') {
    whereClauses.push('COALESCE(s.status, ?) = ?');
    params.push(SHOP_STATUS_ACTIVE, SHOP_STATUS_PAUSED);
  } else if (options.includeStatus && status === 'off_shelf') {
    whereClauses.push('p.status = ?');
    params.push(PRODUCT_STATUS_OFF_SHELF);
  } else if (options.includeStatus && status === 'disabled') {
    whereClauses.push(
      '(p.status = ? OR COALESCE(b.status, ?) = ? OR COALESCE(bp.status, ?) = ?)',
    );
    params.push(
      PRODUCT_STATUS_DISABLED,
      BRAND_STATUS_ACTIVE,
      BRAND_STATUS_DISABLED,
      BRAND_PRODUCT_STATUS_ACTIVE,
      BRAND_PRODUCT_STATUS_DISABLED,
    );
  }

  return { whereSql: whereClauses.join(' AND '), params };
}

export function buildAdminBrandLibraryFilters(query: AdminBrandLibraryQuery) {
  const whereClauses = ['1 = 1'];
  const params: Array<string | number> = [];
  const keyword = query.keyword?.trim();
  const status = query.status ?? 'all';
  const brandId = query.brandId?.trim();
  const categoryId = query.categoryId?.trim();

  if (keyword) {
    const like = `%${keyword}%`;
    whereClauses.push('(bp.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');
    params.push(like, like, like);
  }

  if (status === 'active') {
    whereClauses.push('bp.status = ? AND COALESCE(b.status, ?) <> ?');
    params.push(BRAND_PRODUCT_STATUS_ACTIVE, BRAND_STATUS_ACTIVE, BRAND_STATUS_DISABLED);
  } else if (status === 'disabled') {
    whereClauses.push('(bp.status = ? OR COALESCE(b.status, ?) = ?)');
    params.push(BRAND_PRODUCT_STATUS_DISABLED, BRAND_STATUS_ACTIVE, BRAND_STATUS_DISABLED);
  }

  if (brandId) {
    whereClauses.push('bp.brand_id = ?');
    params.push(brandId);
  }

  if (categoryId) {
    whereClauses.push('bp.category_id = ?');
    params.push(categoryId);
  }

  return { whereSql: whereClauses.join(' AND '), params };
}

export function normalizeBrandProductStatus(status: string | null | undefined) {
  if (status === 'disabled') {
    return BRAND_PRODUCT_STATUS_DISABLED;
  }

  return BRAND_PRODUCT_STATUS_ACTIVE;
}

export function normalizeAdminBrandProductPayload(
  payload: CreateAdminBrandProductPayload | UpdateAdminBrandProductPayload,
) {
  const name = payload.name.trim();
  const brandId = payload.brandId;
  const categoryId = payload.categoryId;
  const guidePrice = Math.round(Number(payload.guidePrice ?? 0));
  const supplyPrice =
    payload.supplyPrice == null ? null : Math.round(Number(payload.supplyPrice));
  const defaultImg = payload.defaultImg?.trim() || null;
  const description = payload.description?.trim() || null;
  const videoUrl = payload.videoUrl?.trim() || null;
  const detailHtmlRaw = payload.detailHtml == null ? null : payload.detailHtml;
  const detailHtml =
    detailHtmlRaw == null
      ? null
      : (() => {
          const cleaned = sanitizeProductDetailHtml(detailHtmlRaw).trim();
          return cleaned.length > 0 ? cleaned : null;
        })();
  const shipFrom = payload.shipFrom?.trim() || null;
  const deliveryDays = payload.deliveryDays?.trim() || null;
  const freight =
    payload.freight == null ? null : Math.round(Number(payload.freight));

  if (!name) {
    throw new Error('品牌商品名称不能为空');
  }
  if (!brandId) {
    throw new Error('请选择品牌');
  }
  if (!categoryId) {
    throw new Error('请选择类目');
  }
  if (!Number.isInteger(guidePrice) || guidePrice < 0) {
    throw new Error('指导价不合法');
  }
  if (supplyPrice != null && (!Number.isInteger(supplyPrice) || supplyPrice < 0)) {
    throw new Error('供货价不合法');
  }
  if (freight != null && (!Number.isInteger(freight) || freight < 0)) {
    throw new Error('运费不合法');
  }

  const specTable: AdminBrandProductSpecRow[] = [];
  if (Array.isArray(payload.specTable)) {
    for (const item of payload.specTable) {
      if (!item) continue;
      const key = typeof item.key === 'string' ? item.key.trim() : '';
      const val = typeof item.value === 'string' ? item.value.trim() : '';
      if (key) {
        specTable.push({ key, value: val });
      }
    }
  }

  const packageList: string[] = [];
  if (Array.isArray(payload.packageList)) {
    for (const item of payload.packageList) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed) packageList.push(trimmed);
      }
    }
  }

  const imageList: string[] = [];
  if (Array.isArray(payload.imageList)) {
    for (const item of payload.imageList) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed) imageList.push(trimmed);
      }
    }
  }

  return {
    name,
    brandId,
    categoryId,
    guidePrice,
    supplyPrice,
    defaultImg,
    description,
    videoUrl,
    detailHtml,
    specTableJson: specTable.length ? JSON.stringify(specTable) : null,
    packageListJson: packageList.length ? JSON.stringify(packageList) : null,
    imageListJson: JSON.stringify(imageList),
    freight,
    shipFrom,
    deliveryDays,
  };
}
