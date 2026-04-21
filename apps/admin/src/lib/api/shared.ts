import type { ApiEnvelope } from '@umi/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const AUTH_TOKEN_KEY = 'umi_admin_token';
const REQUEST_TIMEOUT_MS = 8000;

export class ApiRequestError extends Error {
  status: number;
  path: string;

  constructor(path: string, status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.path = path;
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
}

export function hasAuthToken() {
  return getAuthToken() !== '';
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      signal: controller.signal,
      headers: getAuthToken()
        ? {
            Authorization: `Bearer ${getAuthToken()}`,
          }
        : undefined,
    });

    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok) {
      throw new ApiRequestError(
        path,
        response.status,
        payload.message || `请求失败: ${path}`,
      );
    }

    return payload.data;
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiRequestError(path, 408, '请求超时，请稍后重试');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function sendJson<TResponse, TPayload>(
  method: 'POST' | 'PUT',
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthToken()
          ? {
              Authorization: `Bearer ${getAuthToken()}`,
            }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ApiEnvelope<TResponse>;
    if (!response.ok) {
      throw new ApiRequestError(
        path,
        response.status,
        data.message || `请求失败: ${path}`,
      );
    }

    return data.data;
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiRequestError(path, 408, '请求超时，请稍后重试');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function postJson<TResponse, TPayload>(path: string, payload: TPayload) {
  return sendJson<TResponse, TPayload>('POST', path, payload);
}

export function putJson<TResponse, TPayload>(path: string, payload: TPayload) {
  return sendJson<TResponse, TPayload>('PUT', path, payload);
}

export async function deleteJson<TResponse>(path: string): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'DELETE',
      signal: controller.signal,
      headers: getAuthToken()
        ? {
            Authorization: `Bearer ${getAuthToken()}`,
          }
        : undefined,
    });

    const data = (await response.json()) as ApiEnvelope<TResponse>;
    if (!response.ok) {
      throw new ApiRequestError(
        path,
        response.status,
        data.message || `请求失败: ${path}`,
      );
    }

    return data.data;
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiRequestError(path, 408, '请求超时，请稍后重试');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
