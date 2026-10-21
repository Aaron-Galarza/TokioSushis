/** Clone a branch's catalog and store settings into one empty branch. Dry-run by default. */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const args = process.argv.slice(2);
const valueOf = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const sourceSlug = valueOf('source-slug');
const targetSlug = valueOf('target-slug');
const apply = args.includes('--apply');
const collections = ['categorias', 'productos', 'adicionals', 'coupons', 'configs', 'deliveryconfigs'];

const readCatalog = async (db, session) => {
  const options = session ? { session } : {};
  const source = await db.collection('branches').findOne({ slug: sourceSlug }, options);
  const target = await db.collection('branches').findOne({ slug: targetSlug }, options);
  if (!source || !target) throw new Error('Sucursal de origen o destino inexistente');
  const sourceDocs = {};
  for (const name of collections) {
    sourceDocs[name] = await db.collection(name).find({ branchId: source._id }, options).toArray();
    if (await db.collection(name).countDocuments({ branchId: target._id }, options)) {
      throw new Error(`${name}: la sucursal destino ya tiene catálogo o configuración`);
    }
  }
  const categoryIds = new Set(sourceDocs.categorias.map((doc) => doc._id.toString()));
  if (sourceDocs.productos.some((doc) => !categoryIds.has(doc.category?.toString()))) {
    throw new Error('Un producto apunta a una categoría ausente en origen');
  }
  if (sourceDocs.adicionals.some((doc) => (doc.categories ?? []).some((id) => !categoryIds.has(id.toString())))) {
    throw new Error('Un adicional apunta a una categoría ausente en origen');
  }
  return { sourceDocs, target };
};

const transformCatalog = (sourceDocs, target) => {
  const categoryMap = new Map(sourceDocs.categorias.map((doc) => [doc._id.toString(), new mongoose.Types.ObjectId()]));
  const cloned = (doc, id, transform = {}) => {
    const { _id, branchId, createdAt, updatedAt, __v, legacyOrphanCategoryIds, ...fields } = doc;
    return { _id: id, branchId: target._id, ...fields, ...transform, createdAt: new Date(), updatedAt: new Date() };
  };
  return {
    categorias: sourceDocs.categorias.map((doc) => cloned(doc, categoryMap.get(doc._id.toString()))),
    productos: sourceDocs.productos.map((doc) => cloned(doc, new mongoose.Types.ObjectId(),
      { category: categoryMap.get(doc.category.toString()) })),
    adicionals: sourceDocs.adicionals.map((doc) => cloned(doc, new mongoose.Types.ObjectId(),
      { categories: (doc.categories ?? []).map((id) => categoryMap.get(id.toString())) })),
    coupons: sourceDocs.coupons.map((doc) => cloned(doc, new mongoose.Types.ObjectId())),
    configs: sourceDocs.configs.map((doc) => cloned(doc, new mongoose.Types.ObjectId())),
    deliveryconfigs: sourceDocs.deliveryconfigs.map((doc) => cloned(doc, new mongoose.Types.ObjectId(),
      { kmRanges: (doc.kmRanges ?? []).map((range) => ({ ...range, _id: new mongoose.Types.ObjectId() })) })),
  };
};

async function main() {
  if (!sourceSlug || !targetSlug || sourceSlug === targetSlug) {
    throw new Error('Indicar --source-slug y --target-slug diferentes');
  }
  if (apply && valueOf('confirm-target-slug') !== targetSlug) {
    throw new Error(`Para aplicar, indicar --confirm-target-slug=${targetSlug}`);
  }
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Falta MONGODB_URI o MONGO_URI');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('No se pudo abrir la base de datos');
  const { sourceDocs } = await readCatalog(db);
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', sourceSlug, targetSlug,
    counts: Object.fromEntries(collections.map((name) => [name, sourceDocs[name].length])) }, null, 2));
  if (!apply) return;

  let target;
  let counts;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const current = await readCatalog(db, session);
      target = current.target;
      const transformed = transformCatalog(current.sourceDocs, target);
      for (const name of collections) {
        if (transformed[name].length) await db.collection(name).insertMany(transformed[name], { session });
      }
      counts = Object.fromEntries(collections.map((name) => [name, transformed[name].length]));
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally {
    await session.endSession();
  }
  for (const name of collections) {
    const count = await db.collection(name).countDocuments({ branchId: target._id });
    if (count !== counts[name]) throw new Error(`${name}: cantidad copiada incorrecta`);
  }
  console.log(JSON.stringify({ cloned: true, targetSlug, counts }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
