import crypto from 'node:crypto';

import { env } from '../env';

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  if (!env.paymentSecretKek) {
    throw new Error('PAYMENT_SECRET_KEK 未配置（需 32 字节 base64）');
  }
  const key = Buffer.from(env.paymentSecretKek, 'base64');
  if (key.length !== 32) {
    throw new Error('PAYMENT_SECRET_KEK 必须是 32 字节（base64 后 44 字符）');
  }
  return key;
}

export function encryptSecretJson(plaintext: object): Buffer {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, getKey(), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]);
}

export function decryptSecretJson<T>(blob: Buffer): T {
  const iv = blob.subarray(0, IV_LEN);
  const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = blob.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALG, getKey(), iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(out.toString('utf8')) as T;
}
