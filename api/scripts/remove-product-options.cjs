/** One-time removal of product option fields. Dry-run by default. */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('node:fs/promises');
const path = require('node:path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const confirmedDb = args.find((arg) => arg.startsWith('--confirm-db='))?.slice('--confirm-db='.length);
const productFilter = { configurator: { $exists: true } };
const orderFilter = { $or: [
  { 'items.selections': { $exists: true } },
  { 'items.configSummary': { $exists: true } },
] };

async function main() {
  const uri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Falta la conexión a MongoDB');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('Base de datos no disponible');
  const products = db.collection('productos');
  const orders = db.collection('orders');
  const [productCount, orderCount] = await Promise.all([
    products.countDocuments(productFilter), orders.countDocuments(orderFilter),
  ]);
  console.log(JSON.stringify({ database: db.databaseName, mode: apply ? 'apply' : 'dry-run',
    products: productCount, orders: orderCount }, null, 2));
  if (!apply) return;
  if (confirmedDb !== db.databaseName) throw new Error(`Para aplicar, indicar --confirm-db=${db.databaseName}`);
  if (!productCount && !orderCount) return;

  const backupDir = path.resolve(__dirname, '../../backups');
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `product-options-${db.databaseName}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const backup = {
    database: db.databaseName,
    createdAt: new Date(),
    products: await products.find(productFilter, { projection: { _id: 1, configurator: 1 } }).toArray(),
    orders: await orders.find(orderFilter, { projection: { _id: 1, items: 1, subtotal: 1, total: 1 } }).toArray(),
  };
  if (backup.products.length !== productCount || backup.orders.length !== orderCount) {
    throw new Error('Los datos cambiaron durante el respaldo; ejecutá de nuevo el diagnóstico');
  }
  await fs.writeFile(backupPath, mongoose.mongo.BSON.EJSON.stringify(backup), { flag: 'wx', mode: 0o600 });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const currentProducts = await products.countDocuments(productFilter, { session });
      const currentOrders = await orders.countDocuments(orderFilter, { session });
      if (currentProducts !== productCount || currentOrders !== orderCount) {
        throw new Error('Los datos cambiaron antes de aplicar la migración');
      }
      await products.updateMany(productFilter, { $unset: { configurator: '' } }, { session });
      await orders.updateMany(orderFilter, { $unset: {
        'items.$[].selections': '', 'items.$[].configSummary': '',
      } }, { session });
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally { await session.endSession(); }
  const remainingProducts = await products.countDocuments(productFilter);
  const remainingOrders = await orders.countDocuments(orderFilter);
  console.log(JSON.stringify({ applied: true, backupPath, remainingProducts, remainingOrders }, null, 2));
  if (remainingProducts || remainingOrders) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
