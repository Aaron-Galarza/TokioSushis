const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareOperation, executeOperation, previewOperation, AssistantOperationError } = require('../dist/modules/assistant/assistant.executor');
const { planOperation, answerReadQuestion } = require('../dist/modules/assistant/llm.provider');
const { greeting, isGreeting, missingFieldsMessage } = require('../dist/modules/assistant/assistant.dialog');

const req = { get: () => 'Bearer example-token' };
const productId = '507f1f77bcf86cd799439011';

test('read operation calls only its catalogued endpoint and reports API data', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ success: true, data: { total: 1500, entregados: 2, topProduct: { title: 'Combo' } } }) };
  };
  try {
    const operation = await prepareOperation(req, 'analytics.read', { range: 'semana' });
    assert.equal(operation.write, false);
    assert.match(await executeOperation(req, operation), /ventas \$1500, pedidos entregados 2/);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/api\/analytics\?range=semana$/);
    assert.equal(calls[0].options.headers.Authorization, 'Bearer example-token');
  } finally { global.fetch = original; }
});

test('write operation resolves an exact target and requires a preview before dispatch', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    const data = options.method === 'GET'
      ? [{ _id: productId, title: 'Sushi Veggie' }]
      : { _id: productId, title: 'Sushi Veggie', active: false };
    return { ok: true, json: async () => ({ success: true, data }) };
  };
  try {
    const operation = await prepareOperation(req, 'products.update', { target: 'sushi veggie', body: { active: false } });
    assert.equal(operation.write, true);
    assert.match(previewOperation(operation), /Sushi Veggie/);
    assert.equal(calls.length, 1);
    assert.match(await executeOperation(req, operation), /La API confirmó el cambio/);
    assert.equal(calls.length, 2);
    assert.match(calls[1].url, new RegExp(`/products/admin/${productId}$`));
    assert.deepEqual(JSON.parse(calls[1].options.body), { active: false });
  } finally { global.fetch = original; }
});

test('invalid arguments and a forged URL never reach the API', async () => {
  const original = global.fetch;
  global.fetch = () => { throw new Error('Unexpected API call'); };
  try {
    await assert.rejects(() => prepareOperation(req, 'products.update', { target: 'X', body: { price: -1 } }), AssistantOperationError);
    const operation = await prepareOperation(req, 'analytics.read', { range: 'hoy' });
    await assert.rejects(() => executeOperation(req, { ...operation, path: '/users/admin' }), AssistantOperationError);
  } finally { global.fetch = original; }
});

test('coupon draft can be completed without a model key', async () => {
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const draft = await planOperation('Creá un cupón');
    assert.equal(draft.operation, 'coupons.create');
    const continuation = await planOperation('VERANO 15%', draft);
    assert.deepEqual(continuation.input, { code: 'VERANO', discountPercent: 15 });
  } finally {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
  }
});

test('top products uses the analytics endpoint without exposing order details', async () => {
  const original = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: { topProducts: [{ title: 'Combo', quantity: 4 }] } }) });
  try {
    const operation = await prepareOperation(req, 'products.top', { range: 'mes' });
    assert.equal(await executeOperation(req, operation), 'Productos más vendidos de mes: 1. Combo (4)');
  } finally { global.fetch = original; }
});

test('greeting and incomplete product request receive conversational replies', () => {
  assert.equal(isGreeting('Hola'), true);
  assert.match(greeting, /¡Hola!/);
  assert.match(missingFieldsMessage('products.create', {}), /nombre, precio, descripción, categoría/);
  assert.doesNotMatch(missingFieldsMessage('products.create', {}), /Too small/);
});

test('the short catalog and product creation phrases keep their intent', async () => {
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    assert.equal((await planOperation('Productos')).operation, 'products.list');
    assert.equal((await planOperation('Podrias crear un producto?')).operation, 'products.create');
  } finally {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
  }
});

test('most expensive product answers the question instead of repeating the catalog', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;
  delete process.env.GEMINI_API_KEY;
  global.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: [
    { title: 'Tablas Clásicas', price: 18999 },
    { title: 'Wok Yakisoba', price: 16999 },
    { title: 'Tablas Clásicas', price: 18999 },
  ] }) });
  try {
    const plan = await planOperation('Cual seria el producto mas caro?');
    assert.equal(plan.operation, 'products.most_expensive');
    const operation = await prepareOperation(req, plan.operation, plan.input);
    assert.equal(await executeOperation(req, operation), 'El precio más alto es $18.999: Tablas Clásicas.');
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});

test('an example request resumes a product draft and only prepares an inactive product', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ success: true, data: [{ _id: productId, name: 'Rolls', active: true }] }) };
  };
  try {
    const draft = { operation: 'products.create', input: {} };
    const plan = await planOperation('Podes crear cualquiera, uno de ejemplo con datos inventados', draft);
    assert.equal(plan.operation, 'products.sample');
    const operation = await prepareOperation(req, plan.operation, plan.input);
    assert.equal(operation.write, true);
    assert.equal(operation.body.active, false);
    assert.equal(operation.body.category, productId);
    assert.match(previewOperation(operation), /Quedará inactivo/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.method, 'GET');
    assert.equal((await planOperation('Cualquiera, no importa', draft)).operation, 'products.sample');
  } finally { global.fetch = originalFetch; }
});

test('a follow-up comparison uses the recent product context', async () => {
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const plan = await planOperation('Y el más barato?', undefined, [{ role: 'user', text: 'Productos' }]);
    assert.equal(plan.operation, 'products.cheapest');
  } finally {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
  }
});

test('a specific question may be answered from compact API facts', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  let request;
  global.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Hay 2 productos inactivos.' }] } }] }) };
  };
  try {
    const answer = await answerReadQuestion('¿Cuántos productos inactivos hay?', 'products.list', '23 registros: dos [inactivo]');
    assert.equal(answer, 'Hay 2 productos inactivos.');
    assert.match(request.contents[0].parts[0].text, /Datos de la API/);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
