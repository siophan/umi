export type UploadImageUsage = 'guess_cover';

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
