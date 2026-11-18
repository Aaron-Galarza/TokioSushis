import { z } from 'zod';
import { createCouponSchema, updateCouponSchema } from '../coupons/coupons.schema';
import { createCategoriaSchema, updateCategoriaSchema } from '../categorias/categorias.schema';
import { createProductSchema, updateProductSchema } from '../productos/products.schema';
import { toggleRainSchema } from '../delivery/delivery.schema';
import { validOrderStatus } from '../orders/orders.model';

const target = z.string().trim().min(1).max(100);
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const range = z.enum(['hoy', 'ayer', 'semana', 'mes']);
const empty = z.object({}).strict();

type Operation = {
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  path: string;
  schema: z.ZodTypeAny;
  input: string;
  guidance?: string;
  write?: boolean;
  collection?: 'products' | 'categories' | 'coupons';
};

export const operations = {
  'products.list': { description: 'Listar productos y precios', method: 'GET', path: '/products/admin', schema: empty, input: '{}' },
  'categories.list': { description: 'Listar categorías', method: 'GET', path: '/categories/admin', schema: empty, input: '{}' },
  'coupons.list': { description: 'Listar cupones', method: 'GET', path: '/coupons/admin', schema: empty, input: '{}' },
  'orders.list': { description: 'Resumir pedidos por estado de un período', method: 'GET', path: '/orders/admin/range', schema: z.object({ range }).strict(), input: '{"range":"hoy|ayer|semana|mes"}' },
  'analytics.read': { description: 'Consultar ventas, métricas y productos más vendidos de un período', method: 'GET', path: '/analytics', schema: z.object({ range }).strict(), input: '{"range":"hoy|ayer|semana|mes"}' },
  'delivery.config': { description: 'Consultar configuración de envío y lluvia', method: 'GET', path: '/delivery/config', schema: empty, input: '{}' },
  'store.status': { description: 'Consultar si el local está abierto', method: 'GET', path: '/config/status', schema: empty, input: '{}' },
  'coupons.create': { description: 'Crear cupón', method: 'POST', path: '/coupons/admin', schema: createCouponSchema, input: '{"code":"TEXTO","discountPercent":15}', write: true },
  'coupons.update': { description: 'Editar o desactivar cupón', method: 'PUT', path: '/coupons/admin/:id', schema: z.object({ target, body: updateCouponSchema }).strict(), input: '{"target":"código exacto","body":{"active":false}}', write: true, collection: 'coupons' },
  'products.create': { description: 'Crear producto', guidance: 'Requiere una categoría activa; categories.list permite consultar las disponibles.', method: 'POST', path: '/products/admin', schema: createProductSchema.extend({ category: target }), input: '{"title":"...","description":"...","price":1000,"category":"nombre exacto o ID de categoría","active":false}', write: true },
  'products.update': { description: 'Editar o desactivar producto', method: 'PUT', path: '/products/admin/:id', schema: z.object({ target, body: updateProductSchema.extend({ category: target.optional() }) }).strict(), input: '{"target":"nombre exacto","body":{"active":false}}', write: true, collection: 'products' },
  'categories.create': { description: 'Crear categoría', method: 'POST', path: '/categories/admin', schema: createCategoriaSchema, input: '{"name":"...","active":true}', write: true },
  'categories.update': { description: 'Editar o desactivar categoría', method: 'PUT', path: '/categories/admin/:id', schema: z.object({ target, body: updateCategoriaSchema }).strict(), input: '{"target":"nombre exacto","body":{"active":false}}', write: true, collection: 'categories' },
  'delivery.rain': { description: 'Activar o desactivar lluvia y su recargo', method: 'PATCH', path: '/delivery/config/rain', schema: toggleRainSchema, input: '{"isRaining":true,"extraRain":500}', write: true },
  'orders.status': { description: 'Cambiar el estado de un pedido identificado por ID', method: 'PUT', path: '/orders/admin/:id', schema: z.object({ target: objectId, body: z.object({ status: z.enum(validOrderStatus as [string, ...string[]]) }).strict() }).strict(), input: '{"target":"ID de 24 caracteres","body":{"status":"pending|in-preparation|ready|delivered|cancelled"}}', write: true },
} satisfies Record<string, Operation>;

export type OperationName = keyof typeof operations;
export const operationNames = Object.keys(operations) as OperationName[];

export const operationCatalog = operationNames.map((name) =>
  `${name}: ${operations[name].method} ${operations[name].path}. ${operations[name].description}. ${'guidance' in operations[name] ? operations[name].guidance : ''} Entrada: ${operations[name].input}`
).join('\n');

export const parseOperation = (name: string, input: unknown) => {
  if (!Object.prototype.hasOwnProperty.call(operations, name)) return null;
  const operation = operations[name as OperationName] as Operation;
  const result = operation.schema.safeParse(input);
  return result.success ? { name: name as OperationName, operation, input: result.data as Record<string, unknown> } : null;
};

export const operationErrors = (name: OperationName, input: unknown) =>
  (operations[name] as Operation).schema.safeParse(input).error?.issues.map((issue) => `${issue.path.join('.') || 'datos'}: ${issue.message}`) ?? [];
