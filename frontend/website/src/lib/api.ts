import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './auth';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

let isRefreshing = false;
let failedQueue: { resolve: (token: string | null) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

function createApiClient(getToken?: () => string | null): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: unknown) => {
      const axiosError = error as AxiosError & { config: AxiosRequestConfig & { _retry?: boolean } };

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        typeof window !== 'undefined' &&
        !axiosError.config?._retry &&
        !axiosError.config?.url?.includes('/auth/refresh') &&
        !axiosError.config?.url?.includes('/auth/login')
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (axiosError.config) {
                axiosError.config.headers = axiosError.config.headers || {};
                (axiosError.config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
                return client.request(axiosError.config);
              }
              return Promise.reject(new Error('Missing config in retry'));
            })
            .catch((err) => Promise.reject(err));
        }

        axiosError.config._retry = true;
        isRefreshing = true;

        try {
          const refreshRes = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            { withCredentials: true },
          );
          const newToken = refreshRes.data?.data?.accessToken ?? refreshRes.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            processQueue(null, newToken);

            if (axiosError.config) {
              axiosError.config.headers = axiosError.config.headers || {};
              (axiosError.config.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
              return client.request(axiosError.config);
            }
          } else {
            throw new Error('No access token in refresh response');
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          clearAccessToken();
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

// Server-side client (no token management)
export const apiServer = createApiClient();

// Client-side factory — call with token getter
export function createClientApi(getToken: () => string | null): AxiosInstance {
  return createApiClient(getToken);
}

// Typed API response unwrapper
export function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}
