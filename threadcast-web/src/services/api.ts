import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiResponse } from '../types';

// In development, use relative URLs to leverage Vite proxy
// In production, use the configured API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Demo mode - skip all API calls and use local demo data
// true: 백엔드 없이 프론트엔드 데모 데이터만 사용
// false: 실제 백엔드 API 호출
export const DEMO_MODE = false;

// User-friendly error messages
const ERROR_MESSAGES: Record<number, string> = {
  400: '입력 정보를 확인해주세요.',
  401: '이메일 또는 비밀번호가 올바르지 않습니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  409: '이미 존재하는 정보입니다.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

function getErrorMessage(error: AxiosError<{ error?: { message?: string } }>): string {
  // Try to get message from backend response
  const backendMessage = error.response?.data?.error?.message;
  if (backendMessage) {
    return backendMessage;
  }

  // Use predefined user-friendly message based on status code
  const status = error.response?.status;
  if (status && ERROR_MESSAGES[status]) {
    return ERROR_MESSAGES[status];
  }

  // Network error
  if (!error.response) {
    return '네트워크 연결을 확인해주세요.';
  }

  return '오류가 발생했습니다. 다시 시도해주세요.';
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ error?: { message?: string } }>) => {
        const originalRequest = error.config;

        // Skip token refresh for auth endpoints
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

        if (error.response?.status === 401 && !isAuthEndpoint) {
          // Try to refresh token for non-auth endpoints
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              const { accessToken } = response.data.data;
              localStorage.setItem('accessToken', accessToken);

              // Retry original request
              if (originalRequest) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.client.request(originalRequest);
              }
            } catch {
              // Refresh failed, logout
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }
          }
        }

        // Create a new error with user-friendly message
        const friendlyMessage = getErrorMessage(error);
        const friendlyError = new Error(friendlyMessage);
        return Promise.reject(friendlyError);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data.data;
  }

  // Silent get using fetch - completely bypasses Axios error logging
  async silentGet<T>(url: string, params?: Record<string, unknown>): Promise<T | null> {
    try {
      const token = localStorage.getItem('accessToken');
      const queryString = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      const fullUrl = `${API_BASE_URL}${url}${queryString}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) return null;
      const data = await response.json() as ApiResponse<T>;
      return data.data;
    } catch {
      return null;
    }
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data.data;
  }
}

export const api = new ApiService();
