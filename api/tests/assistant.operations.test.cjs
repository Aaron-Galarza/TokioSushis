const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareOperation, executeOperation, previewOperation, AssistantOperationError } = require('../dist/modules/assistant/assistant.executor');
const { planOperation } = require('../dist/modules/assistant/llm.provider');

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
