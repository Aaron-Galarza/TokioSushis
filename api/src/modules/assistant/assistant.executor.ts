import { Request } from 'express';
import { OperationName, operations, parseOperation } from './assistant.operations';

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
  if ((parsed.name === 'products.create' || parsed.name === 'products.update') && body) {
    const product = { ...asObject(body) };
    if (product.category && !/^[a-f\d]{24}$/i.test(String(product.category))) {
      const categories = asArray(await callApi(req, 'GET', '/categories/admin'));
      const matches = categories.filter((row) => normalized(row.name) === normalized(product.category));
      if (matches.length !== 1) throw new AssistantOperationError('Indicá el nombre exacto o ID de una categoría activa.');
      product.category = matches[0]._id;
    }
    body = product;
  }
  return { name: parsed.name, method: operation.method, path, body, write: !!operation.write, description: operation.description, resolvedTarget };
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
  `${operation.description}${operation.resolvedTarget ? `: ${operation.resolvedTarget}` : ''}. ${operation.body === undefined ? '' : `Datos: ${JSON.stringify(operation.body)}. `}¿Confirmás?`;

const describeResult = (operation: PreparedOperation, raw: unknown): string => {
  const data = asObject(raw);
  if (operation.write) {
    const result = asObject(data.data ?? raw);
    const label = result.title || result.name || result.code || result._id || operation.resolvedTarget;
    return `${operation.description} completado${label ? `: ${label}` : ''}. La API confirmó el cambio.`;
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
    const details = rows.slice(0, 30).map((row) => `${row[field]}${field === 'title' ? ` ($${row.price})` : field === 'code' ? ` (${row.discountPercent}%)` : ''}`).join(', ');
    return `${operation.description}: ${rows.length} en total. ${details || 'No hay registros.'}${rows.length > 30 ? ' Se muestran los primeros 30.' : ''}`;
  }
  if (operation.name === 'delivery.config') return `Envíos: lluvia ${data.isRaining ? 'activa' : 'inactiva'}, recargo $${data.extraRain ?? 0}, rangos configurados ${Array.isArray(data.kmRanges) ? data.kmRanges.length : 0}.`;
  return `Estado del local: ${JSON.stringify(raw).slice(0, 500)}.`;
};
