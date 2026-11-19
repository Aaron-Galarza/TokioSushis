import axios from 'axios';

// El servidor de Next adjunta la sesión al hablar con la API; el JWT nunca llega a JavaScript.
const adminApi = axios.create({ baseURL: '/api/admin-api' });

adminApi.interceptors.response.use(
  response => response,
  error => {
    if (typeof window !== 'undefined' && (error.response?.status === 401 || error.response?.status === 403)) {
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default adminApi;
