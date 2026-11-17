const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const uri = process.env.MONGODB_TEST_URI;
let url;
try { url = new URL(uri); } catch { throw new Error('MONGODB_TEST_URI inválida'); }
if (!/^\/tokio_options_test_[a-f0-9]{12}$/.test(url.pathname) || process.env.OPTIONS_TEST_DROP !== '1') {
  throw new Error('Usar una base temporal tokio_options_test_<12 hex> y OPTIONS_TEST_DROP=1');
}
const dbName = url.pathname.slice(1);
const backupDir = path.resolve(__dirname, '../../backups');

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const productId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();
  await db.collection('productos').insertOne({ _id: productId, title: 'Producto', price: 100,
    configurator: { enabled: true, steps: [{ id: 'paso', options: [{ id: 'opcion', price: 50 }] }] } });
  await db.collection('orders').insertOne({ _id: orderId, subtotal: 150, total: 150,
    items: [{ productId: productId.toString(), title: 'Producto', price: 150, quantity: 1,
      selections: [{ stepId: 'paso', optionId: 'opcion' }], configSummary: 'Opción' }] });
  const run = (...args) => spawnSync(process.execPath,
    [path.resolve(__dirname, '../scripts/remove-product-options.cjs'), ...args],
    { encoding: 'utf8', env: { ...process.env, MONGODB_TEST_URI: uri } });
  const dry = run();
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /"products": 1/);
  assert.match(dry.stdout, /"orders": 1/);
  const applied = run('--apply', `--confirm-db=${dbName}`);
  assert.equal(applied.status, 0, applied.stderr);
  const product = await db.collection('productos').findOne({ _id: productId });
  const order = await db.collection('orders').findOne({ _id: orderId });
  assert.equal(product.configurator, undefined);
  assert.equal(order.items[0].selections, undefined);
  assert.equal(order.items[0].configSummary, undefined);
  assert.equal(order.items[0].price, 150);
  assert.equal(order.total, 150);
  const backupFile = fs.readdirSync(backupDir).find((name) => name.startsWith(`product-options-${dbName}-`));
  assert.ok(backupFile);
  const backupPath = path.join(backupDir, backupFile);
  const backup = mongoose.mongo.BSON.EJSON.parse(fs.readFileSync(backupPath, 'utf8'));
  assert.equal(backup.products[0].configurator.enabled, true);
  assert.equal(backup.orders[0].items[0].configSummary, 'Opción');
  fs.unlinkSync(backupPath);
  console.log('Migración de opciones: respaldo, eliminación y totales verificados');
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => {
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
