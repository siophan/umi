import crypto from 'node:crypto';
import https from 'node:https';
import path from 'node:path';

import type {
  UploadOssImagePayload,
  UploadOssImageResult,
  UploadOssVideoPayload,
  UploadOssVideoResult,
} from '@umi/shared';

import { env } from '../../env';
import { HttpError } from '../../lib/errors';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set<UploadOssImagePayload['contentType']>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const ALLOWED_VIDEO_TYPES = new Set<UploadOssVideoPayload['contentType']>([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);
const ALLOWED_IMAGE_USAGES = new Set([
  'guess_cover',
  'community_post',
  'product_review',
  'brand_product',
  'brand_logo',
  'banner',
]);
const ALLOWED_VIDEO_USAGES = new Set(['brand_product']);

function assertOssConfigured() {
  if (!env.ossAccessKeyId || !env.ossAccessKeySecret || !env.ossBucket || !env.ossBaseUrl) {
    throw new HttpError(500, 'OSS_NOT_CONFIGURED', 'OSS 配置不完整');
  }
}

function decodeBase64(contentBase64: string, maxBytes: number, errorPrefix: '图片' | '视频') {
  const rawBase64 = contentBase64.replace(/^data:[^;]+;base64,/, '').trim();
  if (!rawBase64) {
    throw new HttpError(
      400,
      errorPrefix === '图片' ? 'UPLOAD_IMAGE_EMPTY' : 'UPLOAD_VIDEO_EMPTY',
      `${errorPrefix}内容不能为空`,
    );
  }
  const buffer = Buffer.from(rawBase64, 'base64');
  if (!buffer.length) {
    throw new HttpError(
      400,
      errorPrefix === '图片' ? 'UPLOAD_IMAGE_EMPTY' : 'UPLOAD_VIDEO_EMPTY',
      `${errorPrefix}内容不能为空`,
    );
  }
  if (buffer.byteLength > maxBytes) {
    const limitMb = Math.round(maxBytes / 1024 / 1024);
    throw new HttpError(
      400,
      errorPrefix === '图片' ? 'UPLOAD_IMAGE_TOO_LARGE' : 'UPLOAD_VIDEO_TOO_LARGE',
      `${errorPrefix}不能超过${limitMb}MB`,
    );
  }
  return buffer;
}

function normalizeImagePayload(payload: UploadOssImagePayload) {
  if (!ALLOWED_IMAGE_USAGES.has(String(payload.usage))) {
    throw new HttpError(400, 'UPLOAD_USAGE_INVALID', '上传用途不支持');
  }
  if (!ALLOWED_IMAGE_TYPES.has(payload.contentType)) {
    throw new HttpError(400, 'UPLOAD_IMAGE_TYPE_INVALID', '仅支持 jpg/png/webp/gif 图片');
  }
  const buffer = decodeBase64(payload.contentBase64, MAX_IMAGE_BYTES, '图片');
  return { buffer, contentType: payload.contentType };
}

function normalizeVideoPayload(payload: UploadOssVideoPayload) {
  if (!ALLOWED_VIDEO_USAGES.has(String(payload.usage))) {
    throw new HttpError(400, 'UPLOAD_USAGE_INVALID', '上传用途不支持');
  }
  if (!ALLOWED_VIDEO_TYPES.has(payload.contentType)) {
    throw new HttpError(400, 'UPLOAD_VIDEO_TYPE_INVALID', '仅支持 mp4/webm/mov 视频');
  }
  const buffer = decodeBase64(payload.contentBase64, MAX_VIDEO_BYTES, '视频');
  return { buffer, contentType: payload.contentType };
}

function getObjectExtension(fileName: string, contentType: string) {
  const ext = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (ext) {
    return ext;
  }
  if (contentType === 'image/png') return '.png';
  if (contentType === 'image/webp') return '.webp';
  if (contentType === 'image/gif') return '.gif';
  if (contentType === 'image/jpeg') return '.jpg';
  if (contentType === 'video/mp4') return '.mp4';
  if (contentType === 'video/webm') return '.webm';
  if (contentType === 'video/quicktime') return '.mov';
  return '.bin';
}

function buildObjectKey(userId: string, usage: string, fileName: string, contentType: string) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const random = crypto.randomBytes(8).toString('hex');
  const ext = getObjectExtension(fileName, contentType);
  return `uploads/${usage}/${yyyy}/${mm}/${dd}/${userId}-${Date.now()}-${random}${ext}`;
}

function encodeObjectKey(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function buildPublicUrl(key: string) {
  return `${env.ossBaseUrl.replace(/\/$/, '')}/${encodeObjectKey(key)}`;
}

function putObjectToOss(options: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string | null> {
  assertOssConfigured();

  return new Promise((resolve, reject) => {
    const baseUrl = new URL(env.ossBaseUrl);
    const encodedKey = encodeObjectKey(options.key);
    const requestPath = `${baseUrl.pathname.replace(/\/$/, '')}/${encodedKey}`;
    const date = new Date().toUTCString();
    const contentMd5 = crypto.createHash('md5').update(options.buffer).digest('base64');
    const canonicalizedResource = `/${env.ossBucket}/${options.key}`;
    const stringToSign = `PUT\n${contentMd5}\n${options.contentType}\n${date}\n${canonicalizedResource}`;
    const signature = crypto
      .createHmac('sha1', env.ossAccessKeySecret)
      .update(stringToSign)
      .digest('base64');

    const request = https.request(
      {
        method: 'PUT',
        protocol: baseUrl.protocol,
        hostname: baseUrl.hostname,
        path: requestPath,
        headers: {
          Authorization: `OSS ${env.ossAccessKeyId}:${signature}`,
          Date: date,
          'Content-Type': options.contentType,
          'Content-MD5': contentMd5,
          'Content-Length': options.buffer.byteLength,
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            const etag = response.headers.etag;
            resolve(Array.isArray(etag) ? etag[0] : etag ?? null);
            return;
          }

          const body = Buffer.concat(chunks).toString('utf8');
          reject(new HttpError(502, 'OSS_UPLOAD_FAILED', body || 'OSS 上传失败'));
        });
      },
    );

    request.on('error', (error) => {
      reject(new HttpError(502, 'OSS_UPLOAD_FAILED', error.message || 'OSS 上传失败'));
    });
    request.write(options.buffer);
    request.end();
  });
}

export async function uploadOssImage(
  payload: UploadOssImagePayload,
  userId: string,
): Promise<UploadOssImageResult> {
  const normalized = normalizeImagePayload(payload);
  const key = buildObjectKey(userId, payload.usage, payload.fileName, normalized.contentType);
  const etag = await putObjectToOss({
    key,
    buffer: normalized.buffer,
    contentType: normalized.contentType,
  });

  return {
    key,
    url: buildPublicUrl(key),
    etag,
    size: normalized.buffer.byteLength,
    contentType: normalized.contentType,
  };
}

export async function uploadOssVideo(
  payload: UploadOssVideoPayload,
  userId: string,
): Promise<UploadOssVideoResult> {
  const normalized = normalizeVideoPayload(payload);
  const key = buildObjectKey(userId, payload.usage, payload.fileName, normalized.contentType);
  const etag = await putObjectToOss({
    key,
    buffer: normalized.buffer,
    contentType: normalized.contentType,
  });

  return {
    key,
    url: buildPublicUrl(key),
    etag,
    size: normalized.buffer.byteLength,
    contentType: normalized.contentType,
  };
}
