const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAssistant } = require('../dist/modules/assistant/assistant.agent');
const { prepareOperation, readOperation, executeOperation, AssistantOperationError } = require('../dist/modules/assistant/assistant.executor');

const req = { get: () => 'Bearer example-token' };
const productId = '507f1f77bcf86cd799439011';
const modelReply = (parts) => ({ ok: true, json: async () => ({ candidates: [{ content: { role: 'model', parts } }] }) });
const toolCall = (operation, input = {}) => [{ functionCall: { name: 'use_tokyo_api', args: { operation, input_json: JSON.stringify(input) } } }];
const apiReply = (data) => ({ ok: true, json: async () => ({ success: true, data }) });

test('a greeting is answered by the model without phrase-specific rules', async () => {
  const key = process.env.GEMINI_API_KEY;
  const fetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  global.fetch = async () => modelReply([{ text: '¡Hola! ¿En qué te ayudo con Tokyo?' }]);
  try {
    const reply = await runAssistant(req, 'Hola', [], async () => { throw new Error('unexpected write'); });
    assert.equal(reply.message, '¡Hola! ¿En qué te ayudo con Tokyo?');
  } finally { global.fetch = fetch; if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key; }
});

test('the model reads products, receives actual prices, then answers the comparison', async () => {
  const key = process.env.GEMINI_API_KEY;
  const fetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  const modelRequests = [];
  let turns = 0;
  global.fetch = async (url, options) => {
    if (String(url).includes('generativelanguage')) {
      modelRequests.push(JSON.parse(options.body));
      return ++turns === 1 ? modelReply(toolCall('products.list')) : modelReply([{ text: 'El producto más caro es Tablas Clásicas: $18.999.' }]);
    }
    assert.match(String(url), /\/products\/admin$/);
    assert.equal(options.headers.Authorization, 'Bearer example-token');
    return apiReply([{ _id: productId, title: 'Tablas Clásicas', price: 18999, active: true }, { _id: '507f1f77bcf86cd799439012', title: 'Wok', price: 16999, active: true }]);
  };
  try {
    const reply = await runAssistant(req, '¿Cuál es el producto más caro?', [], async () => { throw new Error('unexpected write'); });
    assert.match(reply.message, /Tablas Clásicas.*18\.999/);
    assert.equal(turns, 2);
    assert.match(JSON.stringify(modelRequests[1].contents), /18999/);
    assert.match(JSON.stringify(modelRequests[1].contents), /functionResponse/);
  } finally { global.fetch = fetch; if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key; }
});

test('the model may consult categories before proposing a product, without writing yet', async () => {
  const key = process.env.GEMINI_API_KEY;
  const fetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  let turns = 0;
  const apiMethods = [];
  global.fetch = async (url, options) => {
    if (String(url).includes('generativelanguage')) {
      turns++;
      return turns === 1
        ? modelReply(toolCall('categories.list'))
        : turns === 2
          ? modelReply(toolCall('products.create', { title: 'Roll de prueba', description: 'Producto inventado para probar', price: 8000, category: 'Rolls' }))
          : modelReply([{ text: 'Listo para confirmar.' }]);
    }
    apiMethods.push(options.method);
    assert.match(String(url), /\/categories\/admin$/);
    return apiReply([{ _id: productId, name: 'Rolls', active: true }]);
  };
  try {
    const reply = await runAssistant(req, 'Inventá un producto de ejemplo; elegí una categoría cualquiera', [], async (operations) => {
      assert.equal(operations.length, 1);
      const operation = operations[0];
      assert.equal(operation.name, 'products.create');
      assert.equal(operation.body.category, productId);
      assert.equal(operation.body.active, false);
      return 'pending-test-id';
    });
    assert.equal(reply.pendingId, 'pending-test-id');
    assert.match(reply.message, /Roll de prueba/);
    assert.deepEqual(apiMethods, ['GET', 'GET']);
  } finally { global.fetch = fetch; if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key; }
});

test('orders sent to the model contain counts, not customer details', async () => {
  const fetch = global.fetch;
  global.fetch = async () => apiReply([{ status: 'pending', customer: { phone: 'PRIVATE' } }, { status: 'delivered', customer: { phone: 'PRIVATE' } }]);
  try {
    const operation = await prepareOperation(req, 'orders.list', { range: 'hoy' });
    const facts = await readOperation(req, operation);
    assert.equal(facts.total, 2);
    assert.deepEqual(facts.byStatus, { pending: 1, delivered: 1 });
    assert.doesNotMatch(JSON.stringify(facts), /PRIVATE/);
  } finally { global.fetch = fetch; }
});

test('multiple writes are staged together and are not executed during planning', async () => {
  const key = process.env.GEMINI_API_KEY;
  const fetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  let modelCalls = 0;
  global.fetch = async (url) => String(url).includes('generativelanguage')
    ? (++modelCalls === 1 ? modelReply([{ functionCall: { name: 'use_tokyo_api', args: { operation: 'products.update', input_json: JSON.stringify({ target: productId, body: { price: 100 } }) } } }, { functionCall: { name: 'use_tokyo_api', args: { operation: 'products.update', input_json: JSON.stringify({ target: '507f1f77bcf86cd799439012', body: { price: 200 } }) } } }]) : modelReply([{ text: 'Listo para confirmar.' }]))
    : apiReply([{ _id: productId, title: 'A', price: 50 }, { _id: '507f1f77bcf86cd799439012', title: 'B', price: 60 }]);
  try {
    const reply = await runAssistant(req, 'Subí los dos precios', [], async (operations) => {
      assert.equal(operations.length, 2);
      assert.deepEqual(operations.map((operation) => operation.name), ['products.update', 'products.update']);
      return 'task-id';
    });
    assert.equal(reply.pendingId, 'task-id');
    assert.match(reply.message, /2 operaciones/);
  } finally { global.fetch = fetch; if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key; }
});

test('unlisted routes and unconfirmed writes cannot execute', async () => {
  await assert.rejects(() => prepareOperation(req, 'users.delete', {}), AssistantOperationError);
  const operation = await prepareOperation(req, 'analytics.read', { range: 'hoy' });
  await assert.rejects(() => executeOperation(req, operation), AssistantOperationError);
});

test('an invalid model operation is returned as a tool error without reaching Tokyo', async () => {
  const key = process.env.GEMINI_API_KEY;
  const fetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  let turns = 0;
  let secondRequest;
  global.fetch = async (url, options) => {
    assert.match(String(url), /generativelanguage/);
    if (++turns === 1) return modelReply(toolCall('users.delete'));
    secondRequest = JSON.parse(options.body);
    return modelReply([{ text: 'No tengo acceso a esa operación.' }]);
  };
  try {
    const reply = await runAssistant(req, 'Eliminá todos los usuarios', [], async () => { throw new Error('unexpected write'); });
    assert.match(reply.message, /No tengo acceso/);
    assert.match(JSON.stringify(secondRequest.contents), /Operación no autorizada/);
  } finally { global.fetch = fetch; if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key; }
});

test('a confirmed action calls the catalogued endpoint with validated data', async () => {
  const fetch = global.fetch;
  const methods = [];
  global.fetch = async (url, options) => {
    methods.push(options.method);
    if (options.method === 'GET') return apiReply([{ _id: productId, name: 'Rolls', active: true }]);
    assert.match(String(url), /\/products\/admin$/);
    assert.equal(JSON.parse(options.body).category, productId);
    return apiReply({ _id: '507f1f77bcf86cd799439099', title: 'Roll de prueba' });
  };
  try {
    const operation = await prepareOperation(req, 'products.create', { title: 'Roll de prueba', description: 'Prueba', price: 8000, category: 'Rolls', active: false });
    assert.deepEqual(methods, ['GET']);
    assert.match(await executeOperation(req, operation), /La API confirmó el cambio/);
    assert.deepEqual(methods, ['GET', 'POST']);
  } finally { global.fetch = fetch; }
});
