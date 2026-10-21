/** Read-only consistency audit. Exit code 1 means the branch data needs repair. */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const operationalCollections = [
  'categorias', 'productos', 'adicionals', 'coupons', 'orders',
  'configs', 'deliveryconfigs', 'analyticsdailies',
];

const countPipeline = async (collection, pipeline) => {
  const result = await collection.aggregate([...pipeline, { $count: 'count' }], { allowDiskUse: true }).toArray();
  return result[0]?.count ?? 0;
};

async function main() {
  const uri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Falta MONGODB_URI o MONGO_URI');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('No se pudo abrir la base de datos');
  const present = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((entry) => entry.name));
  if (!present.has('branches')) throw new Error('No existe la colección branches');

  const errors = {};
  const warnings = {};
  for (const name of operationalCollections.filter((collection) => present.has(collection))) {
    errors[`${name}.invalidBranch`] = await countPipeline(db.collection(name), [
      { $lookup: { from: 'branches', localField: 'branchId', foreignField: '_id', as: 'branchRef' } },
      { $match: { $expr: { $or: [
        { $ne: [{ $type: '$branchId' }, 'objectId'] },
        { $ne: [{ $size: '$branchRef' }, 1] },
      ] } } },
    ]);
  }

  if (present.has('users')) {
    errors['users.invalidStaffBranch'] = await countPipeline(db.collection('users'), [
      { $match: { role: { $in: ['admin', 'encargado'] } } },
      { $lookup: { from: 'branches', localField: 'branchId', foreignField: '_id', as: 'branchRef' } },
      { $match: { $expr: { $or: [
        { $ne: [{ $type: '$branchId' }, 'objectId'] },
        { $ne: [{ $size: '$branchRef' }, 1] },
      ] } } },
    ]);
    errors['users.ownerWithBranch'] = await db.collection('users').countDocuments({
      role: 'owner', branchId: { $exists: true, $ne: null },
    });
    errors['users.invalidRole'] = await db.collection('users').countDocuments({
      role: { $nin: ['admin', 'encargado', 'owner'] },
    });
  }

  if (present.has('productos') && present.has('categorias')) {
    errors['productos.invalidCategory'] = await countPipeline(db.collection('productos'), [
      { $lookup: { from: 'categorias', localField: 'category', foreignField: '_id', as: 'categoryRef' } },
      { $unwind: { path: '$categoryRef', preserveNullAndEmptyArrays: true } },
      { $match: { $expr: { $ne: ['$branchId', '$categoryRef.branchId'] } } },
    ]);
  }

  if (present.has('adicionals') && present.has('categorias')) {
    errors['adicionals.invalidCategories'] = await countPipeline(db.collection('adicionals'), [
      { $lookup: { from: 'categorias', localField: 'categories', foreignField: '_id', as: 'categoryRefs' } },
      { $match: { $expr: { $or: [
        { $gt: [{ $size: { $setDifference: [{ $ifNull: ['$categories', []] }, '$categoryRefs._id'] } }, 0] },
        { $gt: [{ $size: { $filter: { input: '$categoryRefs', as: 'category',
          cond: { $ne: ['$$category.branchId', '$branchId'] } } } }, 0] },
      ] } } },
    ]);
  }

  if (present.has('orders') && present.has('productos')) {
    const orderProducts = [
      { $unwind: '$items' },
      { $addFields: { productRefId: { $convert: { input: '$items.productId', to: 'objectId',
        onError: null, onNull: null } } } },
      { $lookup: { from: 'productos', localField: 'productRefId', foreignField: '_id', as: 'productRef' } },
      { $unwind: { path: '$productRef', preserveNullAndEmptyArrays: true } },
    ];
    errors['orders.foreignProducts'] = await countPipeline(db.collection('orders'), [
      ...orderProducts,
      { $match: { productRef: { $ne: null }, $expr: { $ne: ['$branchId', '$productRef.branchId'] } } },
    ]);
    warnings['orders.missingHistoricalProducts'] = await countPipeline(db.collection('orders'), [
      ...orderProducts,
      { $match: { productRef: null } },
    ]);
  }

  console.log(JSON.stringify({ databaseName: db.databaseName, errors, warnings }, null, 2));
  if (Object.values(errors).some((count) => count > 0)) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
