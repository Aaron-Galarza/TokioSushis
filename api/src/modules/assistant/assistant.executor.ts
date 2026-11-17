import { Request } from 'express';
import { randomInt } from 'crypto';
import { OperationName, operations, parseOperation } from './assistant.operations';
import { createProductSchema, updateProductSchema } from '../productos/products.schema';

type ApiResult = { success: boolean; data?: unknown; error?: string; message?: string };

export class AssistantOperationError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

const baseUrl = () => process.env.ASSISTANT_API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 4000}/api`;
const asObject = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const asArray = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.map(asObject) : [];
const normalized = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const price = (value: unknown) => `$${Number(value).toLocaleString('es-AR')}`;

const callApi = async (req: Request, method: string, path: string, body?: unknown): Promise<unknown> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: { Authorization: req.get('authorization') || '', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json() as ApiResult;
    if (!response.ok || !payload.success) throw new AssistantOperationError(payload.error || payload.message || `La API respondió ${response.status}`, response.status);
    return payload.data;
  } catch (error) {
    if (error instanceof AssistantOperationError) throw error;
    throw new AssistantOperationError('No se pudo contactar la API de Tokyo. Intentá nuevamente.', 503);
  } finally { clearTimeout(timer); }
};

export const prepareOperation = async (req: Request, name: string, rawInput: unknown) => {
  const parsed = parseOperation(name, rawInput);
  if (!parsed) throw new AssistantOperationError('La operación o sus datos no son válidos');
  const { operation, input } = parsed;
  if ('body' in input && Object.keys(asObject(input.body)).length === 0) throw new AssistantOperationError('Indicá al menos un dato para modificar.');
  let path = operation.path;
  let resolvedTarget: string | undefined;
  if (path.includes(':id')) {
    const requested = String(input.target);
    if (operation.collection) {
      const records = asArray(await callApi(req, 'GET', `/${operation.collection}/admin`));
      const field = operation.collection === 'coupons' ? 'code' : operation.collection === 'categories' ? 'name' : 'title';
      const matches = records.filter((row) => normalized(row[field]) === normalized(requested) || String(row._id) === requested);
      if (matches.length !== 1) throw new AssistantOperationError(matches.length ? 'El nombre coincide con más de un registro. Indicá el ID.' : `No encontré ${requested}. Indicá el nombre exacto o ID.`);
      path = path.replace(':id', encodeURIComponent(String(matches[0]._id)));
      resolvedTarget = String(matches[0][field]);
    } else {
      path = path.replace(':id', encodeURIComponent(requested));
      resolvedTarget = requested;
    }
  }
  if (operation.method === 'GET' && 'range' in input) path += `?range=${encodeURIComponent(String(input.range))}`;
  let body = 'body' in input ? input.body : operation.method === 'GET' ? undefined : input;
  if (parsed.name === 'products.sample') {
    const categories = asArray(await callApi(req, 'GET', '/categories/admin'))
      .filter((row) => row._id && row.active !== false);
    if (!categories.length) throw new AssistantOperationError('No hay categorías activas. Creá o activá una categoría antes de preparar un producto de prueba.');
    const category = categories[randomInt(categories.length)];
    resolvedTarget = String(category.name);
    body = {
      title: `Producto de prueba IA ${randomInt(100000, 1000000)}`,
      description: 'Producto de ejemplo generado para probar el asistente',
      price: randomInt(4, 13) * 1000,
      category: String(category._id),
      active: false,
    };
  }
  if ((parsed.name === 'products.create' || parsed.name === 'products.update') && body) {
    const product = { ...asObject(body) };
    if (product.category && !/^[a-f\d]{24}$/i.test(String(product.category))) {
      const categories = asArray(await callApi(req, 'GET', '/categories/admin'));
      const matches = categories.filter((row) => normalized(row.name) === normalized(product.category));
      if (matches.length !== 1) throw new AssistantOperationError('Indicá el nombre exacto o ID de una categoría activa.');
      if (matches[0].active === false) throw new AssistantOperationError(`La categoría «${matches[0].name}» está inactiva. Elegí otra categoría.`);
      product.category = matches[0]._id;
    }
    body = product;
  }
  if (parsed.name === 'products.create' || parsed.name === 'products.sample') {
    const checked = createProductSchema.safeParse(body);
    if (!checked.success) throw new AssistantOperationError('No se pudo preparar un producto válido. Revisá nombre, precio y categoría.');
    body = checked.data;
  }
  if (parsed.name === 'products.update') {
    const checked = updateProductSchema.safeParse(body);
    if (!checked.success) throw new AssistantOperationError('Los cambios del producto no son válidos.');
    body = checked.data;
  }
  return { name: parsed.name, method: operation.method, path, body, write: !!operation.write, description: operation.description, resolvedTarget, activeOnly: input.activeOnly === true };
};

export type PreparedOperation = Awaited<ReturnType<typeof prepareOperation>>;

export const executeOperation = async (req: Request, operation: PreparedOperation) => {
  // Revalidate persisted actions before dispatch. The model never controls the URL or HTTP method.
  const definition = operations[operation.name] as { method: string; path: string; write?: boolean };
  if (!definition || definition.method !== operation.method || !!definition.write !== operation.write ||
      !new RegExp(`^${definition.path.replace(':id', '[a-f\\d]{24}').split('/').join('\\/')}(?:\\?range=(?:hoy|ayer|semana|mes))?$`, 'i').test(operation.path)) {
    throw new AssistantOperationError('La acción pendiente ya no es válida');
  }
  const data = await callApi(req, operation.method, operation.path, operation.body);
  return describeResult(operation, data);
};

export const previewOperation = (operation: PreparedOperation) =>
  operation.name === 'products.sample'
    ? `Preparé «${asObject(operation.body).title}» por ${price(asObject(operation.body).price)} en la categoría «${operation.resolvedTarget}». Quedará inactivo para que puedas revisarlo. ¿Confirmás la creación?`
    : `${operation.description}${operation.resolvedTarget ? `: ${operation.resolvedTarget}` : ''}. ${operation.body === undefined ? '' : `Datos: ${JSON.stringify(operation.body)}. `}¿Confirmás?`;

const describeResult = (operation: PreparedOperation, raw: unknown): string => {
  const data = asObject(raw);
  if (operation.write) {
    const result = asObject(data.data ?? raw);
    const label = result.title || result.name || result.code || result._id || operation.resolvedTarget;
    return `${operation.description} completado${label ? `: ${label}` : ''}${result.price !== undefined ? ` (${price(result.price)})` : ''}. La API confirmó el cambio.`;
  }
  if (operation.name === 'products.most_expensive' || operation.name === 'products.cheapest') {
    const rows = asArray(raw).filter((row) => typeof row.price === 'number' && Number.isFinite(row.price) && (!operation.activeOnly || row.active !== false));
    if (!rows.length) return 'No hay productos con precio para comparar.';
    const selected = operation.name === 'products.most_expensive'
      ? Math.max(...rows.map((row) => Number(row.price)))
      : Math.min(...rows.map((row) => Number(row.price)));
    const names = [...new Set(rows.filter((row) => row.price === selected).map((row) => String(row.title)))];
    return `${operation.name === 'products.most_expensive' ? 'El precio más alto' : 'El precio más bajo'}${operation.activeOnly ? ' entre los productos activos' : ''} es ${price(selected)}: ${names.join(', ')}${names.length > 1 ? ' (empate)' : ''}.`;
  }
  if (operation.name === 'orders.list') {
    const rows = asArray(raw);
    const counts = rows.reduce<Record<string, number>>((acc, row) => { const status = String(row.status || 'sin estado'); acc[status] = (acc[status] || 0) + 1; return acc; }, {});
    return `Pedidos del período ${operation.path.split('range=')[1]}: ${rows.length}. ${Object.entries(counts).map(([status, count]) => `${status}: ${count}`).join(', ') || 'No hay pedidos.'}`;
  }
  if (operation.name === 'analytics.read') return `Métricas de ${operation.path.split('range=')[1]}: ventas $${data.total ?? 0}, pedidos entregados ${data.entregados ?? 0}, producto destacado ${asObject(data.topProduct).title || 'ninguno'}.`;
  if (operation.name === 'products.top') {
    const rows = asArray(data.topProducts);
    return `Productos más vendidos de ${operation.path.split('range=')[1]}: ${rows.map((row, index) => `${index + 1}. ${row.title} (${row.quantity})`).join(', ') || 'No hay ventas entregadas.'}`;
  }
  if (operation.name === 'products.list' || operation.name === 'categories.list' || operation.name === 'coupons.list') {
    const rows = asArray(raw);
    const field = operation.name === 'products.list' ? 'title' : operation.name === 'categories.list' ? 'name' : 'code';
    const grouped = new Map<string, { label: string; count: number }>();
    for (const row of rows) {
      const label = `${row[field]}${field === 'title' ? ` (${price(row.price)})` : field === 'code' ? ` (${row.discountPercent}%)` : ''}${row.active === false ? ' [inactivo]' : ''}`;
      const key = normalized(label);
      const item = grouped.get(key);
      if (item) item.count++;
      else grouped.set(key, { label, count: 1 });
    }
    const details = [...grouped.values()].slice(0, 30).map(({ label, count }) => `${label}${count > 1 ? ` ×${count}` : ''}`).join(', ');
    return `${operation.description}: ${rows.length} registros, ${grouped.size} distintos por nombre, precio y estado. ${details || 'No hay registros.'}${grouped.size > 30 ? ' Se muestran los primeros 30.' : ''}`;
  }
  if (operation.name === 'delivery.config') return `Envíos: lluvia ${data.isRaining ? 'activa' : 'inactiva'}, recargo $${data.extraRain ?? 0}, rangos configurados ${Array.isArray(data.kmRanges) ? data.kmRanges.length : 0}.`;
  return `Estado del local: ${JSON.stringify(raw).slice(0, 500)}.`;
};
