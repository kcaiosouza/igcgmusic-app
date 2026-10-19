export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://api-podcrer.minklab.cloud';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let currentAuthToken: string | null = null;
let unauthorizedCallback: (() => void) | null = null;

export function setApiAuthToken(token: string | null) {
  currentAuthToken = token;
}

export function getApiAuthToken(): string | null {
  return currentAuthToken;
}

export function setOnUnauthorizedCallback(cb: (() => void) | null) {
  unauthorizedCallback = cb;
}

const PUBLIC_AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

interface RequestConfig extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<{ data: T; status: number }> {
  const { body, params, headers: customHeaders, ...restConfig } = config;

  let url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (currentAuthToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }

  const response = await fetch(url, {
    ...restConfig,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  let responseData: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      const isPublicRoute = PUBLIC_AUTH_ROUTES.some((route) => endpoint.includes(route));
      if (!isPublicRoute && unauthorizedCallback) {
        unauthorizedCallback();
      }
    }

    const errorMessage =
      (typeof responseData === 'object' && (responseData?.error || responseData?.message)) ||
      `Erro na requisição (${response.status})`;

    throw new ApiError(errorMessage, response.status, responseData);
  }

  return {
    data: responseData as T,
    status: response.status,
  };
}

export const api = {
  get: <T = any>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'PUT', body }),

  delete: <T = any>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),
};

export default api;
