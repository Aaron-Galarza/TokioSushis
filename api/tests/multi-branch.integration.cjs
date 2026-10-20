const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../dist/app').default;
const { initSocket, getIO } = require('../dist/socket/socket');
const { BranchModel } = require('../dist/modules/branches/branch.model');
const { UserModel } = require('../dist/modules/users/user.model');
const { CategoriaModel } = require('../dist/modules/categorias/categorias.model');
const { ProductModel } = require('../dist/modules/productos/products.model');
const { AdicionalModel } = require('../dist/modules/adicionales/adicionales.model');
const { ConfigModel } = require('../dist/modules/Schedules/Schedule.module');
const { OrderModel } = require('../dist/modules/orders/orders.model');

const uri = process.env.MONGODB_TEST_URI;
if (!uri || !/^mongodb:\/\/(?:127\.0\.0\.1|localhost):\d+\/tokio_multibranch_test_[a-z0-9]+(?:\?|$)/.test(uri)) {
  throw new Error('MONGODB_TEST_URI debe apuntar a una BBDD local llamada tokio_multibranch_test_<id>');
}

process.env.JWT_SECRET = 'local-integration-test-secret';
let server;

const request = async (url, route, { method = 'GET', token, slug, body, key } = {}) => {
  const response = await fetch(`${url}/api${route}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(slug ? { 'X-Branch-Slug': slug } : {}),
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
};

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([BranchModel.init(), UserModel.init(), CategoriaModel.init(), ProductModel.init(), OrderModel.init()]);
  const makeBranch = (slug) => BranchModel.create({ name: slug, slug, address: `Calle ${slug} 1`,
    coordinates: { lat: -27.45, lng: -59 }, timezone: 'America/Argentina/Buenos_Aires',
    paymentMethods: ['cash'], active: true });
  const [a, b] = await Promise.all([makeBranch('branch-a'), makeBranch('branch-b')]);
  const schedule = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
    .map((day) => ({ day, openTime: '00:00', closeTime: '23:59', isStoreOpen: true }));
  await ConfigModel.create([{ branchId: a._id, dailySchedule: schedule }, { branchId: b._id, dailySchedule: schedule }]);
  const [catA, catB] = await CategoriaModel.create([
    { branchId: a._id, name: 'Sushi', active: true },
    { branchId: b._id, name: 'Sushi', active: true },
  ]);
  const [productA, productB, limited] = await ProductModel.create([
    { branchId: a._id, title: 'A', price: 100, category: catA._id, active: true, controlStock: true, stock: 1 },
    { branchId: b._id, title: 'B', price: 200, category: catB._id, active: true, controlStock: true, stock: 2 },
    { branchId: a._id, title: 'Limited', price: 300, category: catA._id, active: true, controlStock: true, stock: 1 },
  ]);
  const [cashier, manager, owner, managerA] = await UserModel.create([
    { email: 'cashier@test.local', passwordHash: 'unused', role: 'admin', branchId: a._id },
    { email: 'manager@test.local', passwordHash: 'unused', role: 'encargado', branchId: b._id },
    { email: 'owner@test.local', passwordHash: 'unused', role: 'owner' },
    { email: 'manager-a@test.local', passwordHash: 'unused', role: 'encargado', branchId: a._id },
  ]);
  const token = (user) => jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET);
  server = await new Promise((resolve) => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  initSocket(server);
  const url = `http://127.0.0.1:${server.address().port}`;

  const menuA = await request(url, '/products', { slug: a.slug });
  assert.equal(menuA.status, 200);
  assert.deepEqual(menuA.body.data.map((p) => p.title).sort(), ['A', 'Limited']);
  const menuB = await request(url, '/products', { slug: b.slug });
  assert.deepEqual(menuB.body.data.map((p) => p.title), ['B']);
  assert.equal((await request(url, '/products')).status, 400);

  assert.equal((await request(url, '/categories/admin', {
    method: 'POST', token: token(cashier), body: { name: 'Forbidden' },
  })).status, 403);
  assert.equal((await request(url, `/products/admin/toggleActive/${productB._id}`, {
    method: 'PUT', token: token(cashier),
  })).status, 404);
  assert.equal((await request(url, '/owner/overview', { token: token(cashier) })).status, 403);
  assert.equal((await request(url, '/owner/overview', { token: token(owner) })).status, 200);
  assert.equal((await request(url, '/orders/admin', { token: token(owner) })).status, 403);
  assert.equal((await request(url, '/categories/admin', {
    method: 'POST', token: token(manager), body: { name: 'Maki' },
  })).status, 201);
  assert.equal((await request(url, `/categories/admin/${catB._id}`, {
    method: 'DELETE', token: token(manager),
  })).status, 409);

  const payload = (productId) => ({ customer: { name: 'Cliente', phone: '123456789' },
    items: [{ productId: productId.toString(), quantity: 1 }], deliveryType: 'pickup', paymentMethod: 'cash' });
  const otherCategory = await CategoriaModel.create({ branchId: a._id, name: 'Other', active: true });
  const noStock = await ProductModel.create({ branchId: a._id, title: 'NoStock', price: 100,
    category: catA._id, active: true, controlStock: false });
  const validAddon = await AdicionalModel.create({ branchId: a._id, title: 'Valid', price: 10,
    categories: [catA._id], active: true });
  const addonOrder = payload(noStock._id);
  addonOrder.items[0].quantity = 2;
  addonOrder.items[0].addons = [{ addonId: validAddon._id.toString(), quantity: 2 }];
  const priced = await request(url, '/orders', { method: 'POST', slug: a.slug,
    key: 'addon-price-00001', body: addonOrder });
  assert.equal(priced.status, 201);
  assert.equal(priced.body.data.subtotal, 240);
  const wrongAddon = await AdicionalModel.create({ branchId: a._id, title: 'Wrong', price: 10,
    categories: [otherCategory._id], active: true });
  const invalidAddonOrder = payload(limited._id);
  invalidAddonOrder.items[0].addons = [{ addonId: wrongAddon._id.toString(), quantity: 1 }];
  assert.equal((await request(url, '/orders', { method: 'POST', slug: a.slug,
    key: 'wrong-addon-00001', body: invalidAddonOrder })).status, 400);
  assert.equal((await request(url, '/orders', {
    method: 'POST', slug: b.slug, key: 'cross-branch-0001', body: payload(productA._id),
  })).status, 404);
  const first = await request(url, '/orders', {
    method: 'POST', slug: a.slug, key: 'first-order-00001', body: payload(productA._id),
  });
  assert.equal(first.status, 201);
  const retry = await request(url, '/orders', {
    method: 'POST', slug: a.slug, key: 'first-order-00001', body: payload(productA._id),
  });
  assert.equal(retry.status, 200);
  assert.equal(retry.body.data._id, first.body.data._id);
  assert.equal((await request(url, '/orders', {
    method: 'POST', slug: a.slug, key: 'first-order-00001', body: payload(limited._id),
  })).status, 409);
  assert.equal((await ProductModel.findById(productA._id)).stock, 0);
  assert.equal((await request(url, `/orders/admin/${first.body.data._id}`, {
    method: 'PUT', token: token(manager), body: { status: 'cancelled' },
  })).status, 404);
  assert.equal((await request(url, `/orders/admin/${first.body.data._id}`, {
    method: 'PUT', token: token(cashier), body: { status: 'cancelled' },
  })).status, 200);
  assert.equal((await ProductModel.findById(productA._id)).stock, 1);

  const originalSave = OrderModel.prototype.save;
  OrderModel.prototype.save = async function () { throw new Error('injected order write failure'); };
  try {
    const failed = await request(url, '/orders', {
      method: 'POST', slug: a.slug, key: 'write-failure-001', body: payload(limited._id),
    });
    assert.equal(failed.status, 500);
    assert.equal((await ProductModel.findById(limited._id)).stock, 1);
    assert.equal(await OrderModel.countDocuments({ branchId: a._id, idempotencyKey: 'write-failure-001' }), 0);
  } finally {
    OrderModel.prototype.save = originalSave;
  }

  const originalTo = getIO().to;
  getIO().to = () => { throw new Error('injected socket failure'); };
  try {
    const savedWithoutSocket = await request(url, '/orders', {
      method: 'POST', slug: a.slug, key: 'socket-failure-001', body: payload(noStock._id),
    });
    assert.equal(savedWithoutSocket.status, 201);
    assert.equal(await OrderModel.countDocuments({ branchId: a._id, idempotencyKey: 'socket-failure-001' }), 1);
    assert.equal((await request(url, `/orders/admin/${savedWithoutSocket.body.data._id}`, {
      method: 'PUT', token: token(cashier), body: { status: 'in-preparation' },
    })).status, 200);
  } finally {
    getIO().to = originalTo;
  }

  const second = await request(url, '/orders', {
    method: 'POST', slug: a.slug, key: 'second-order-0001', body: payload(productA._id),
  });
  assert.equal(second.status, 201);
  assert.equal((await request(url, `/products/admin/${productA._id}`, {
    method: 'DELETE', token: token(managerA),
  })).status, 200);
  assert.equal((await request(url, `/orders/admin/${second.body.data._id}`, {
    method: 'PUT', token: token(cashier), body: { status: 'cancelled' },
  })).status, 200);
  assert.equal((await ProductModel.findById(productA._id)).stock, 1);
  assert.equal((await request(url, '/products', { slug: a.slug })).body.data.some((p) => p._id === productA._id.toString()), false);
  assert.equal((await request(url, `/orders/admin/${first.body.data._id}`, {
    method: 'PUT', token: token(cashier), body: { status: 'cancelled' },
  })).status, 200);
  assert.equal((await ProductModel.findById(productA._id)).stock, 1);

  const [r1, r2] = await Promise.all(['parallel-order-001', 'parallel-order-002'].map((key) =>
    request(url, '/orders', { method: 'POST', slug: a.slug, key, body: payload(limited._id) })));
  assert.deepEqual([r1.status, r2.status].sort(), [201, 409]);
  assert.equal((await ProductModel.findById(limited._id)).stock, 0);
  assert.equal(await OrderModel.countDocuments({ branchId: a._id, 'items.productId': limited._id.toString() }), 1);

  const delivery = { ...payload(productB._id), deliveryType: 'delivery',
    customer: { name: 'Cliente', phone: '123456789', address: 'Calle 1' }, delivery: { address: 'Calle 1' } };
  assert.equal((await request(url, '/orders', { method: 'POST', slug: b.slug,
    key: 'delivery-no-coord', body: delivery })).status, 400);
  const originalFetch = global.fetch;
  const originalMapboxToken = process.env.MAPBOX_TOKEN;
  process.env.MAPBOX_TOKEN = 'local-test-token';
  global.fetch = (input, init) => String(input).startsWith('https://api.mapbox.com/')
    ? Promise.reject(new Error('injected Mapbox failure')) : originalFetch(input, init);
  try {
    const failedDelivery = await request(url, '/orders', { method: 'POST', slug: b.slug,
      key: 'mapbox-failure-001', body: { ...delivery,
        delivery: { address: 'Calle 1', coordinates: { lat: -27.45, lng: -59 } } } });
    assert.equal(failedDelivery.status, 503);
    assert.equal(await OrderModel.countDocuments({ branchId: b._id, idempotencyKey: 'mapbox-failure-001' }), 0);
    assert.equal((await ProductModel.findById(productB._id)).stock, 2);
  } finally {
    global.fetch = originalFetch;
    if (originalMapboxToken === undefined) delete process.env.MAPBOX_TOKEN;
    else process.env.MAPBOX_TOKEN = originalMapboxToken;
  }
  const delivered = await request(url, '/orders', {
    method: 'POST', slug: b.slug, key: 'branch-b-order-001', body: payload(productB._id),
  });
  assert.equal(delivered.status, 201);
  for (const status of ['in-preparation', 'ready', 'delivered']) {
    assert.equal((await request(url, `/orders/admin/${delivered.body.data._id}`, {
      method: 'PUT', token: token(manager), body: { status },
    })).status, 200);
  }
  const report = await request(url, '/owner/overview', { token: token(owner) });
  assert.equal(report.body.data.totals.revenue, 200);
  console.log('multi-branch integration: PASS');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => { getIO().close(); server.close(resolve); });
  await mongoose.disconnect();
});
