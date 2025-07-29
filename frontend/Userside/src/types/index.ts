import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  stack?: string;
}

export type AxiosApiError = AxiosError<ApiErrorResponse>;