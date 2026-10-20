const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const uri = process.env.MONGODB_TEST_URI;
if (!uri || !/^mongodb:\/\/(?:127\.0\.0\.1|localhost):\d+\/tokio_multibranch_test_[a-z0-9]+(?:\?|$)/.test(uri)) {
  throw new Error('MONGODB_TEST_URI debe apuntar a una BBDD local llamada tokio_multibranch_test_<id>');
}

const runMigration = (apply) => {
  const args = [path.resolve(__dirname, '../scripts/backfill-branches.cjs'),
    '--slug=original', '--name=Original', '--address=Calle 1', '--lat=-27.45', '--lng=-59',
    ...(apply ? ['--apply', '--confirm-slug=original'] : [])];
  return spawnSync(process.execPath, args, { cwd: path.resolve(__dirname, '..'), encoding: 'utf8',
    env: { ...process.env, MONGODB_URI: uri } });
};

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const categoryId = new mongoose.Types.ObjectId();
  const productId = new mongoose.Types.ObjectId();
  await db.collection('categorias').insertOne({ _id: categoryId, name: 'Sushi', active: true });
  await db.collection('productos').insertOne({ _id: productId, category: categoryId, title: 'Roll', price: 100, active: true });
  await db.collection('adicionals').insertOne({ title: 'Extra', price: 10, categories: [categoryId], active: true });
  await db.collection('coupons').insertOne({ code: 'TEN', discountPercent: 10, active: true });
  await db.collection('orders').insertOne({ customer: { name: 'Test', phone: '123' }, items: [{ productId: productId.toString(), quantity: 1 }], total: 100 });
  await db.collection('configs').insertOne({ isOpen: true });
  await db.collection('deliveryconfigs').insertOne({ extraRain: 1000 });
  await db.collection('analyticsdailies').insertOne({ date: '2026-10-20', total: 100 });
  await db.collection('users').insertOne({ email: 'legacy@test.local', passwordHash: 'unused', role: 'admin' });
  await db.collection('categorias').createIndex({ name: 1 }, { unique: true });
  await db.collection('coupons').createIndex({ code: 1 }, { unique: true });
  await db.collection('analyticsdailies').createIndex({ date: 1 }, { unique: true });

  const dry = runMigration(false);
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(await db.collection('branches').countDocuments(), 0);

  const applied = runMigration(true);
  assert.equal(applied.status, 0, applied.stderr || applied.stdout);
  const branch = await db.collection('branches').findOne({ slug: 'original' });
  assert.ok(branch);
  assert.equal(branch.galleryFolder, 'TokyoSushis');
  assert.equal(branch.transferAlias, 'Tokyo.nx');
  for (const collectionName of ['categorias', 'productos', 'adicionals', 'coupons', 'orders',
    'configs', 'deliveryconfigs', 'analyticsdailies', 'users']) {
    assert.equal(await db.collection(collectionName).countDocuments({ branchId: branch._id }), 1, collectionName);
  }
  assert.equal((await db.collection('users').findOne({ email: 'legacy@test.local' })).role, 'encargado');
  for (const [collectionName, globalKey] of [['categorias', 'name'], ['coupons', 'code'], ['analyticsdailies', 'date']]) {
    const indexes = await db.collection(collectionName).indexes();
    assert.equal(indexes.some((index) => index.unique && Object.keys(index.key).length === 1 && index.key[globalKey] === 1), false);
    assert.equal(indexes.some((index) => index.unique && index.key.branchId === 1 && index.key[globalKey] === 1), true);
  }

  const rerun = runMigration(true);
  assert.equal(rerun.status, 0, rerun.stderr || rerun.stdout);
  assert.equal(await db.collection('branches').countDocuments(), 1);
  assert.equal(await db.collection('users').countDocuments({ role: 'encargado', branchId: branch._id }), 1);
  console.log('branch migration integration: PASS');
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
