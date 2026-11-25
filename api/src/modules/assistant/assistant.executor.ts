import { Request } from 'express';
import { operations, parseOperation } from './assistant.operations';
import { createProductSchema, updateProductSchema } from '../productos/products.schema';

type ApiResult = { success: boolean; data?: unknown; error?: string; message?: string };
export class AssistantOperationError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

const baseUrl = () => process.env.ASSISTANT_API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 4000}/api`;
const asObject = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const asArray = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.map(asObject) : [];
const normalized = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

const callApi = async (req: Request, method: string, path: string, body?: unknown): Promise<unknown> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: { Authorization: req.get('authorization') || '', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
    });
    const payload = await response.json() as ApiResult;
    if (!response.ok || !payload.success) throw new AssistantOperationError(payload.error || payload.message || `La API respondió ${response.status}`, response.status);
    return payload.data;
  } catch (error) {
    if (error instanceof AssistantOperationError) throw error;
    throw new AssistantOperationError('No se pudo contactar la API de Tokyo.', 503);
  } finally { clearTimeout(timer); }
};

export const prepareOperation = async (req: Request, name: string, rawInput: unknown) => {
  const parsed = parseOperation(name, rawInput);
  if (!parsed) throw new AssistantOperationError('La operación o sus datos no son válidos');
  const { operation, input } = parsed;
  if ('body' in input && Object.keys(asObject(input.body)).length === 0) throw new AssistantOperationError('Indicá al menos un dato para modificar.');
  let path = operation.path;
  let resolvedTarget: string | undefined;
  let previousValues: Record<string, unknown> | undefined;
  let categoryName: string | undefined;
  if (path.includes(':id')) {
    const requested = String(input.target);
    if (operation.collection) {
      const records = asArray(await callApi(req, 'GET', `/${operation.collection}/admin`));
      const field = operation.collection === 'coupons' ? 'code' : operation.collection === 'categories' ? 'name' : 'title';
      const matches = records.filter((row) => normalized(row[field]) === normalized(requested) || String(row._id) === requested);
      if (matches.length !== 1) throw new AssistantOperationError(matches.length ? 'El nombre coincide con más de un registro. Indicá el ID.' : `No encontré ${requested}. Indicá el nombre exacto o ID.`);
      path = path.replace(':id', encodeURIComponent(String(matches[0]._id)));
      resolvedTarget = String(matches[0][field]);
      if ('body' in input) {
        const body = asObject(input.body);
        previousValues = Object.fromEntries(Object.keys(body).map((key) => [key, matches[0][key]]));
      }
    } else {
      path = path.replace(':id', encodeURIComponent(requested));
      resolvedTarget = requested;
    }
  }
  if (operation.method === 'GET' && 'range' in input) path += `?range=${encodeURIComponent(String(input.range))}`;
  let body = 'body' in input ? input.body : operation.method === 'GET' ? undefined : input;
  if ((parsed.name === 'products.create' || parsed.name === 'products.update') && body) {
    const product = { ...asObject(body) };
    if (parsed.name === 'products.create' && product.active === undefined) product.active = false;
    if (product.category) {
      const categories = asArray(await callApi(req, 'GET', '/categories/admin'));
      const matches = categories.filter((row) => normalized(row.name) === normalized(product.category) || String(row._id) === String(product.category));
      if (matches.length !== 1) throw new AssistantOperationError('Indicá el nombre exacto o ID de una categoría activa.');
      if (matches[0].active === false) throw new AssistantOperationError(`La categoría «${matches[0].name}» está inactiva.`);
      product.category = matches[0]._id;
      categoryName = String(matches[0].name);
    }
    body = product;
  }
  if (parsed.name === 'products.create' || parsed.name === 'products.update') {
    const schema = parsed.name === 'products.create' ? createProductSchema : updateProductSchema;
    const checked = schema.safeParse(body);
    if (!checked.success) throw new AssistantOperationError('Los datos del producto no son válidos.');
    body = checked.data;
  }
  return { name: parsed.name, method: operation.method, path, body, write: !!operation.write, description: operation.description, resolvedTarget, categoryName, previousValues };
};

export type PreparedOperation = Awaited<ReturnType<typeof prepareOperation>>;

const assertPrepared = (operation: PreparedOperation) => {
  const definition = operations[operation.name] as { method: string; path: string; write?: boolean } | undefined;
  if (!definition || definition.method !== operation.method || !!definition.write !== operation.write ||
      !new RegExp(`^${definition.path.replace(':id', '[a-f\\d]{24}').split('/').join('\\/')}(?:\\?range=(?:hoy|ayer|semana|mes))?$`, 'i').test(operation.path)) {
    throw new AssistantOperationError('La operación ya no es válida');
  }
};

export const readOperation = async (req: Request, operation: PreparedOperation): Promise<unknown> => {
  assertPrepared(operation);
  if (operation.write) throw new AssistantOperationError('Esta operación requiere confirmación.');
  const raw = await callApi(req, operation.method, operation.path);
  if (operation.name === 'products.list') {
    const rows = asArray(raw);
    return { total: rows.length, products: rows.slice(0, 100).map(({ _id, title, price, active, category }) => ({ id: _id, title, price, active, category })), truncated: rows.length > 100 };
  }
  if (operation.name === 'categories.list') {
    const rows = asArray(raw);
    return { total: rows.length, categories: rows.slice(0, 100).map(({ _id, name, active, order }) => ({ id: _id, name, active, order })), truncated: rows.length > 100 };
  }
  if (operation.name === 'coupons.list') {
    const rows = asArray(raw);
    return { total: rows.length, coupons: rows.slice(0, 100).map(({ _id, code, discountPercent, active, validDays }) => ({ id: _id, code, discountPercent, active, validDays })), truncated: rows.length > 100 };
  }
  if (operation.name === 'orders.list') {
    const rows = asArray(raw);
    const byStatus = rows.reduce<Record<string, number>>((counts, row) => { const key = String(row.status || 'sin estado'); counts[key] = (counts[key] || 0) + 1; return counts; }, {});
    return { total: rows.length, byStatus, range: operation.path.split('range=')[1] };
  }
  if (operation.name === 'analytics.read') return asObject(raw);
  if (operation.name === 'delivery.config') {
    const config = asObject(raw);
    return { isRaining: config.isRaining, extraRain: config.extraRain, kmRanges: config.kmRanges };
  }
  return raw;
};

export const executeOperation = async (req: Request, operation: PreparedOperation): Promise<string> => {
  assertPrepared(operation);
  if (!operation.write) throw new AssistantOperationError('Solo las acciones confirmadas se ejecutan aquí.');
  const result = asObject(await callApi(req, operation.method, operation.path, operation.body));
  const value = asObject(result.data ?? result);
  const label = value.title || value.name || value.code || value._id || operation.resolvedTarget;
  return `${operation.description} completado${label ? `: ${label}` : ''}. La API confirmó el cambio.`;
};

export const verifyOperation = async (req: Request, operation: PreparedOperation): Promise<boolean> => {
  if (!operation.write || !operation.resolvedTarget) return true;
  const collection = operation.name.startsWith('products.') ? 'products' : operation.name.startsWith('categories.') ? 'categories' : operation.name.startsWith('coupons.') ? 'coupons' : null;
  if (!collection) return true;
  const rows = asArray(await callApi(req, 'GET', `/${collection}/admin`));
  const field = collection === 'products' ? 'title' : collection === 'categories' ? 'name' : 'code';
  const row = rows.find((item) => normalized(item[field]) === normalized(operation.resolvedTarget) || String(item._id) === operation.resolvedTarget);
  if (!row) return false;
  const body = asObject(operation.body);
  return Object.entries(body).every(([key, value]) => String(row[key]) === String(value) || (value === undefined));
};

export const checkOperationPrecondition = async (req: Request, operation: PreparedOperation): Promise<boolean> => {
  if (!operation.previousValues || !operation.resolvedTarget) return true;
  const collection = operation.name.startsWith('products.') ? 'products' : operation.name.startsWith('categories.') ? 'categories' : operation.name.startsWith('coupons.') ? 'coupons' : null;
  if (!collection) return true;
  const rows = asArray(await callApi(req, 'GET', `/${collection}/admin`));
  const field = collection === 'products' ? 'title' : collection === 'categories' ? 'name' : 'code';
  const row = rows.find((item) => normalized(item[field]) === normalized(operation.resolvedTarget) || String(item._id) === operation.resolvedTarget);
  return !!row && Object.entries(operation.previousValues).every(([key, value]) => String(row[key]) === String(value));
};

export const previewOperation = (operation: PreparedOperation) => {
  const body = { ...asObject(operation.body), ...(operation.categoryName ? { category: operation.categoryName } : {}) };
  return `${operation.description}${operation.resolvedTarget ? `: ${operation.resolvedTarget}` : ''}. ${operation.body === undefined ? '' : `Datos: ${JSON.stringify(body)}. `}¿Confirmás?`;
};
