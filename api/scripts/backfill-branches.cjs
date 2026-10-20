/**
 * One-time migration of the existing single-store data to the first branch.
 * Dry-run by default. Applying requires --apply and --confirm-slug=<slug>.
 * A local Extended JSON backup is written before the transaction starts.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { once } = require('node:events');
const { createHash } = require('node:crypto');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const valueOf = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const apply = args.includes('--apply');
const slug = valueOf('slug')?.toLowerCase();
const name = valueOf('name');
const address = valueOf('address');
const lat = Number(valueOf('lat') ?? process.env.STORE_LAT);
const lng = Number(valueOf('lng') ?? process.env.STORE_LNG);

const sourceCollections = [
  'categorias',
  'productos',
  'adicionals',
  'coupons',
  'orders',
  'configs',
  'deliveryconfigs',
  'analyticsdailies',
  'users',
];

const branchIndexes = {
  categorias: [
    [{ branchId: 1, name: 1 }, { unique: true }],
    [{ branchId: 1, active: 1, order: 1 }, {}],
  ],
  productos: [[{ branchId: 1, active: 1, category: 1 }, {}]],
  adicionals: [
    [{ branchId: 1, active: 1 }, {}],
    [{ branchId: 1, categories: 1 }, {}],
  ],
  coupons: [
    [{ branchId: 1, code: 1 }, { unique: true }],
    [{ branchId: 1, active: 1 }, {}],
  ],
  orders: [
    [{ branchId: 1, createdAt: -1 }, {}],
    [{ branchId: 1, status: 1, createdAt: -1 }, {}],
    [{ createdAt: -1 }, {}],
    [{ branchId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }],
  ],
  configs: [[{ branchId: 1 }, { unique: true }]],
  deliveryconfigs: [[{ branchId: 1 }, { unique: true }]],
  analyticsdailies: [[{ branchId: 1, date: 1 }, { unique: true }]],
  users: [[{ branchId: 1 }, {}]],
};

const retiredGlobalUniqueKeys = {
  categorias: ['name'],
  coupons: ['code'],
  analyticsdailies: ['date'],
};

const missingBranch = { $or: [{ branchId: { $exists: false } }, { branchId: null }] };
const filterFor = (collectionName) => collectionName === 'users'
  ? { ...missingBranch, role: { $ne: 'owner' } }
  : missingBranch;

async function backupCollection(db, collectionName, backupDir) {
  const file = path.join(backupDir, `${collectionName}.jsonl`);
  const stream = fs.createWriteStream(file, { encoding: 'utf8', flags: 'wx' });
  const hash = createHash('sha256');
  let count = 0;
  try {
    for await (const document of db.collection(collectionName).find({})) {
      const line = `${mongoose.mongo.BSON.EJSON.stringify(document)}\n`;
      hash.update(line);
      if (!stream.write(line)) {
        await once(stream, 'drain');
      }
      count += 1;
    }
    const finished = once(stream, 'finish');
    stream.end();
    await finished;
    return { count, sha256: hash.digest('hex') };
  } catch (error) {
    stream.destroy();
    throw error;
  }
}

async function main() {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Indicar --slug=<slug-en-minusculas>');
  }
  if (!name || !address) throw new Error('Indicar --name=<nombre> y --address=<direccion>');
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error('Indicar coordenadas válidas con --lat y --lng o STORE_LAT y STORE_LNG');
  }
  if (apply && valueOf('confirm-slug') !== slug) {
    throw new Error(`Para aplicar, indicar --confirm-slug=${slug}`);
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Falta MONGODB_URI o MONGO_URI');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('No se pudo abrir la base de datos');

  const present = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
  const collections = sourceCollections.filter((collectionName) => present.has(collectionName));
  const existingBranches = present.has('branches')
    ? await db.collection('branches').find({}, { projection: { _id: 1, slug: 1 } }).limit(2).toArray()
    : [];

  if (existingBranches.some((branch) => branch.slug !== slug)) {
    throw new Error('Ya existe otra sucursal. Esta migración solo es válida para la base de un único local.');
  }

  const pending = {};
  const foreignAssignments = {};
  const existingBranchId = existingBranches[0]?._id;
  for (const collectionName of collections) {
    pending[collectionName] = await db.collection(collectionName).countDocuments(filterFor(collectionName));
    foreignAssignments[collectionName] = await db.collection(collectionName).countDocuments({
      branchId: existingBranchId
        ? { $exists: true, $nin: [null, existingBranchId] }
        : { $exists: true, $ne: null },
    });
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', slug, pending, foreignAssignments }, null, 2));
  if (Object.values(foreignAssignments).some((count) => count > 0)) {
    throw new Error('Hay documentos asignados a otra sucursal. Revisar manualmente antes de continuar.');
  }
  for (const collectionName of ['configs', 'deliveryconfigs']) {
    if (pending[collectionName] > 1) {
      throw new Error(`${collectionName}: hay más de un documento global; resolver duplicados antes de migrar`);
    }
  }
  if (!apply) return;

  const backupDir = path.resolve(__dirname, '../../backups', `branch-backfill-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  await fsp.mkdir(backupDir, { recursive: true });
  const backupCounts = {};
  const backupIndexes = {};
  for (const collectionName of [...collections, ...(present.has('branches') ? ['branches'] : [])]) {
    backupCounts[collectionName] = await backupCollection(db, collectionName, backupDir);
    backupIndexes[collectionName] = await db.collection(collectionName).indexes();
  }
  await fsp.writeFile(path.join(backupDir, 'manifest.json'), JSON.stringify({
    createdAt: new Date().toISOString(), slug, databaseName: db.databaseName,
    backupCounts, backupIndexes, pending,
  }, null, 2));
  console.log(`Respaldo EJSON local completo: ${backupDir}`);

  // Collection creation and index setup happen before the data transaction.
  // No operational data is changed if either of these setup steps fails.
  if (!present.has('branches')) await db.createCollection('branches');
  await db.collection('branches').createIndex({ slug: 1 }, { unique: true });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const branches = db.collection('branches');
      let branch = await branches.findOne({ slug }, { session });
      if (!branch) {
        const _id = new mongoose.Types.ObjectId();
        const now = new Date();
        branch = { _id, slug, name, address, coordinates: { lat, lng }, galleryFolder: 'TokyoSushis',
          whatsappPhone: '5493624622366',
          paymentMethods: ['cash', 'debito', 'credito', 'transferencia'],
          transferAlias: 'Tokyo.nx', transferHolder: 'Román Augusto Gomez',
          timezone: 'America/Argentina/Buenos_Aires', active: true, createdAt: now, updatedAt: now };
        await branches.insertOne(branch, { session });
      } else {
        const branchDefaults = {};
        if (branch.galleryFolder === undefined) branchDefaults.galleryFolder = 'TokyoSushis';
        if (branch.paymentMethods === undefined) branchDefaults.paymentMethods = ['cash', 'debito', 'credito', 'transferencia'];
        if (branch.transferAlias === undefined) branchDefaults.transferAlias = 'Tokyo.nx';
        if (branch.transferHolder === undefined) branchDefaults.transferHolder = 'Román Augusto Gomez';
        if (branch.whatsappPhone === undefined) branchDefaults.whatsappPhone = '5493624622366';
        if (Object.keys(branchDefaults).length) {
          await branches.updateOne({ _id: branch._id }, { $set: branchDefaults }, { session });
        }
      }

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        const values = collectionName === 'users'
          ? { branchId: branch._id, role: 'encargado' }
          : { branchId: branch._id };
        await collection.updateMany(filterFor(collectionName), { $set: values }, { session });
        if (collectionName === 'users') {
          await collection.updateMany(
            { branchId: branch._id, active: { $exists: false } },
            { $set: { active: true } },
            { session },
          );
        }
        const remaining = await collection.countDocuments(filterFor(collectionName), { session });
        if (remaining !== 0) throw new Error(`${collectionName}: quedaron ${remaining} documentos sin sucursal`);
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally {
    await session.endSession();
  }

  // First establish branch-specific constraints, then retire legacy global uniqueness.
  // A failure leaves the branch assignment intact and this script can be rerun.
  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    for (const [keys, options] of branchIndexes[collectionName] ?? []) {
      await collection.createIndex(keys, options);
    }
    const oldIndexes = await collection.indexes();
    for (const index of oldIndexes) {
      const legacyKey = retiredGlobalUniqueKeys[collectionName]?.find(
        (key) => index.unique && Object.keys(index.key).length === 1 && index.key[key] === 1,
      );
      if (legacyKey) await collection.dropIndex(index.name);
    }
    const remaining = await collection.countDocuments(filterFor(collectionName));
    if (remaining !== 0) throw new Error(`${collectionName}: quedaron ${remaining} documentos sin sucursal`);
  }

  console.log(JSON.stringify({ applied: true, slug, backupDir, pending }, null, 2));
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
