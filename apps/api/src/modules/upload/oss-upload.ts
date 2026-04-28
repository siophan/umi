import crypto from 'node:crypto';
import https from 'node:https';
import path from 'node:path';

import type { UploadOssImagePayload, UploadOssImageResult } from '@umi/shared';

import { env } from '../../env';
import { HttpError } from '../../lib/errors';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set<UploadOssImagePayload['contentType']>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const ALLOWED_UPLOAD_USAGES = new Set(['guess_cover', 'community_post']);

function assertOssConfigured() {
  if (!env.ossAccessKeyId || !env.ossAccessKeySecret || !env.ossBucket || !env.ossBaseUrl) {
    throw new HttpError(500, 'OSS_NOT_CONFIGURED', 'OSS 配置不完整');
  }
}

function normalizeImagePayload(payload: UploadOssImagePayload) {
  if (!ALLOWED_UPLOAD_USAGES.has(String(payload.usage))) {
    throw new HttpError(400, 'UPLOAD_USAGE_INVALID', '上传用途不支持');
  }

  const contentType = payload.contentType;
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new HttpError(400, 'UPLOAD_IMAGE_TYPE_INVALID', '仅支持 jpg/png/webp/gif 图片');
  }

  const rawBase64 = payload.contentBase64.replace(/^data:[^;]+;base64,/, '').trim();
  if (!rawBase64) {
    throw new HttpError(400, 'UPLOAD_IMAGE_EMPTY', '图片内容不能为空');
  }

  const buffer = Buffer.from(rawBase64, 'base64');
  if (!buffer.length) {
    throw new HttpError(400, 'UPLOAD_IMAGE_EMPTY', '图片内容不能为空');
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new HttpError(400, 'UPLOAD_IMAGE_TOO_LARGE', '图片不能超过10MB');
  }

  return { buffer, contentType };
}

function getObjectExtension(fileName: string, contentType: string) {
  const ext = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (ext) {
    return ext;
  }
  if (contentType === 'image/png') {
    return '.png';
  }
  if (contentType === 'image/webp') {
    return '.webp';
  }
  if (contentType === 'image/gif') {
    return '.gif';
  }
  return '.jpg';
}

function buildObjectKey(userId: string, payload: UploadOssImagePayload) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const random = crypto.randomBytes(8).toString('hex');
  const ext = getObjectExtension(payload.fileName, payload.contentType);
  return `uploads/${payload.usage}/${yyyy}/${mm}/${dd}/${userId}-${Date.now()}-${random}${ext}`;
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
  const key = buildObjectKey(userId, payload);
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
