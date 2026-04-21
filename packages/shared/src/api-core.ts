export interface ApiEnvelope<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorEnvelope {
  success: false;
  code: string;
  message: string;
  status: number;
  fields?: Record<string, string>;
}

export type ApiResponse<T> = ApiEnvelope<T> | ApiErrorEnvelope;
