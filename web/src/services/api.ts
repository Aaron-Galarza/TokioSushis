import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

type AuthStoreModule = typeof import('@/stores/auth.store');

let authStoreModulePromise: Promise<AuthStoreModule> | null = null;

const loadAuthStoreModule = async (): Promise<AuthStoreModule> => {
  authStoreModulePromise ??= import('@/stores/auth.store');
  return authStoreModulePromise;
};

const isBrowser = (): boolean => typeof window !== 'undefined';

const setAuthorizationHeader = (
  config: InternalAxiosRequestConfig,
  token: string
): void => {
  if (config.headers instanceof AxiosHeaders) {
    config.headers.set('Authorization', `Bearer ${token}`);
    return;
  }

  if (!config.headers || typeof config.headers !== 'object') {
    config.headers = new AxiosHeaders();
    config.headers.set('Authorization', `Bearer ${token}`);
    return;
  }

  (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
};

// Instancia base apuntando a la variable de entorno del backend.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request: adjunta token solo en navegador para no tocar Zustand en SSR/build.
api.interceptors.request.use(
  async (config) => {
    if (!isBrowser()) {
      return config;
    }

    try {
      const { useAuthStore } = await loadAuthStoreModule();
      const token = useAuthStore.getState().token;

      if (token) {
        setAuthorizationHeader(config, token);
      }
    } catch {
      // No bloqueamos la request si falla el acceso al store.
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response: maneja expiración de token en cliente.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (isBrowser() && error.response?.status === 401) {
      try {
        const { useAuthStore } = await loadAuthStoreModule();
        useAuthStore.getState().logout();
      } catch {
        // Si el store falla, igual forzamos redirect al login.
      }

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
