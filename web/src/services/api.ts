import axios from 'axios';
import { PUBLIC_API_URL } from '@/lib/public-api-url';

// Solo para operaciones públicas: menú, carrito y checkout.
const api = axios.create({
  baseURL: PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
