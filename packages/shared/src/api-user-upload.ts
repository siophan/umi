export type UploadImageUsage =
  | 'guess_cover'
  | 'community_post'
  | 'product_review'
  | 'brand_product';

export interface UploadOssImagePayload {
  fileName: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  contentBase64: string;
  usage: UploadImageUsage;
}

export interface UploadOssImageResult {
  key: string;
  url: string;
  etag: string | null;
  size: number;
  contentType: string;
}

export type UploadVideoUsage = 'brand_product';

export type UploadOssVideoContentType =
  | 'video/mp4'
  | 'video/webm'
  | 'video/quicktime';

export interface UploadOssVideoPayload {
  fileName: string;
  contentType: UploadOssVideoContentType;
  contentBase64: string;
  usage: UploadVideoUsage;
}

export interface UploadOssVideoResult {
  key: string;
  url: string;
  etag: string | null;
  size: number;
  contentType: string;
}
