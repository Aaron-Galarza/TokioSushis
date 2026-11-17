const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../dist/app').default;
const { BranchModel } = require('../dist/modules/branches/branch.model');
const { UserModel } = require('../dist/modules/users/user.model');
const { CategoriaModel } = require('../dist/modules/categorias/categorias.model');
const { ProductModel } = require('../dist/modules/productos/products.model');
const { AdicionalModel } = require('../dist/modules/adicionales/adicionales.model');
const { ConfigModel } = require('../dist/modules/Schedules/Schedule.module');
const { DeliveryConfigModel } = require('../dist/modules/delivery/delivery.model');

const uri = process.env.MONGODB_TEST_URI;
let testUrl;
try { testUrl = new URL(uri); } catch { throw new Error('MONGODB_TEST_URI inválida'); }
if (!['mongodb:', 'mongodb+srv:'].includes(testUrl.protocol)
  || !/^\/tokio_owner_test_[a-f0-9]{12}$/.test(testUrl.pathname)
  || process.env.OWNER_TEST_DROP !== '1') {
  throw new Error('Usar una base temporal tokio_owner_test_<12 hex> y OWNER_TEST_DROP=1; se eliminará al terminar');
}
process.env.JWT_SECRET = 'owner-management-integration-test-secret';
let server;
const call = async (base, path, { method = 'GET', token, body } = {}) => {
  const response = await fetch(`${base}/api${path}`, { method, headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
};

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([BranchModel.init(), UserModel.init(), CategoriaModel.init(), ProductModel.init()]);
  const source = await BranchModel.create({ name: 'Origen', slug: 'origen', address: 'Calle 1',
    coordinates: { lat: -27.45, lng: -59 }, timezone: 'America/Argentina/Buenos_Aires', paymentMethods: ['cash'] });
  const owner = await UserModel.create({ email: 'owner@test.local', passwordHash: 'unused', role: 'owner' });
  const cashier = await UserModel.create({ email: 'cashier@test.local', passwordHash: 'unused', role: 'admin', branchId: source.id });
  const token = (user) => jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  const category = await CategoriaModel.create({ branchId: source.id, name: 'Rolls' });
  await ProductModel.create({ branchId: source.id, title: 'California', price: 100, category: category.id });
  await AdicionalModel.create({ branchId: source.id, title: 'Extra', price: 10, categories: [category.id] });
  server = await new Promise((resolve) => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const base = `http://127.0.0.1:${server.address().port}`;

  assert.equal((await call(base, '/owner/management')).status, 401);
  assert.equal((await call(base, '/owner/management', { token: token(cashier) })).status, 403);
  const created = await call(base, '/owner/branches', { method: 'POST', token: token(owner), body: {
    name: 'Destino', slug: 'destino', address: 'Calle 2', coordinates: { lat: -27.46, lng: -59.01 },
    timezone: 'America/Argentina/Buenos_Aires', paymentMethods: ['cash'], copyCatalogFrom: source.id,
  } });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.data.copied, { categories: 1, products: 1, addons: 1 });
  const targetId = created.body.data.id;
  const targetCategory = await CategoriaModel.findOne({ branchId: targetId });
  const targetProduct = await ProductModel.findOne({ branchId: targetId });
  const targetAddon = await AdicionalModel.findOne({ branchId: targetId });
  assert.notEqual(targetCategory.id, category.id);
  assert.equal(targetProduct.category.toString(), targetCategory.id);
  assert.equal(targetAddon.categories[0].toString(), targetCategory.id);
  assert.ok(await ConfigModel.exists({ branchId: targetId }));
  assert.ok(await DeliveryConfigModel.exists({ branchId: targetId }));
  const edited = await call(base, `/owner/branches/${targetId}`, { method: 'PUT', token: token(owner), body: {
    name: 'Destino actualizado', address: 'Calle 22', coordinates: { lat: -27.47, lng: -59.02 },
    timezone: 'America/Argentina/Buenos_Aires', phone: '123456', whatsappPhone: '',
    paymentMethods: ['cash'], transferAlias: '', transferHolder: '',
  } });
  assert.equal(edited.status, 200);
  assert.equal((await BranchModel.findById(targetId)).name, 'Destino actualizado');
  assert.equal((await call(base, `/owner/branches/${targetId}`, { method: 'PUT', token: token(cashier), body: {
    name: 'Bloqueado', address: 'Calle 22', coordinates: { lat: -27.47, lng: -59.02 },
    timezone: 'America/Argentina/Buenos_Aires', paymentMethods: ['cash'],
  } })).status, 403);
  assert.equal((await call(base, '/owner/branches', { method: 'POST', token: token(owner), body: {
    name: 'Repetida', slug: 'destino', address: 'Calle 3', coordinates: { lat: -27.46, lng: -59.01 }, paymentMethods: ['cash'],
  } })).status, 409);

  const invited = await call(base, '/owner/staff', { method: 'POST', token: token(owner), body: {
    email: 'new@test.local', role: 'admin', branchId: targetId,
  } });
  assert.equal(invited.status, 201);
  assert.match(invited.body.data.inviteToken, /^[a-f0-9]{64}$/);
  assert.equal((await UserModel.findById(invited.body.data.id)).active, false);
  const listing = await call(base, '/owner/management', { token: token(owner) });
  assert.equal(listing.status, 200);
  assert.equal(JSON.stringify(listing.body).includes('passwordHash'), false);
  assert.equal(JSON.stringify(listing.body).includes('inviteTokenHash'), false);
  assert.equal((await call(base, `/owner/staff/${invited.body.data.id}`, { method: 'PATCH', token: token(owner), body: { active: true } })).status, 409);
  assert.equal((await call(base, '/owner/staff', { method: 'POST', token: token(cashier), body: {
    email: 'blocked@test.local', role: 'admin', branchId: targetId,
  } })).status, 403);
  assert.equal((await call(base, '/owner/staff', { method: 'POST', token: token(owner), body: {
    email: 'other@test.local', role: 'owner', branchId: targetId,
  } })).status, 400);
  const renewed = await call(base, `/owner/staff/${invited.body.data.id}/invite`, { method: 'POST', token: token(owner) });
  assert.equal(renewed.status, 200);
  assert.notEqual(renewed.body.data.inviteToken, invited.body.data.inviteToken);
  assert.equal((await call(base, '/users/accept-invite', { method: 'POST', body: {
    token: invited.body.data.inviteToken, password: 'testing-password-123',
  } })).status, 409);
  const accepted = await call(base, '/users/accept-invite', { method: 'POST', body: {
    token: renewed.body.data.inviteToken, password: 'testing-password-123',
  } });
  assert.equal(accepted.status, 200);
  assert.equal((await call(base, '/users/accept-invite', { method: 'POST', body: {
    token: renewed.body.data.inviteToken, password: 'testing-password-123',
  } })).status, 409);
  const login = await call(base, '/users/login', { method: 'POST', body: { email: 'new@test.local', password: 'testing-password-123' } });
  assert.equal(login.status, 200);
  assert.equal(login.body.data.branch.id, targetId);
  const updated = await call(base, `/owner/staff/${invited.body.data.id}`, { method: 'PATCH', token: token(owner), body: {
    role: 'encargado', branchId: source.id, active: false,
  } });
  assert.equal(updated.status, 200);
  assert.equal((await UserModel.findById(invited.body.data.id)).role, 'encargado');
  assert.equal((await UserModel.findById(invited.body.data.id)).active, false);
  console.log('Gestión Owner: permisos, alta transaccional, clonación e invitación verificados');
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
