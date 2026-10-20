/** Create one independent branch. Dry-run by default; never changes existing branches. */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const args = process.argv.slice(2);
const valueOf = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const slug = valueOf('slug')?.toLowerCase();
const name = valueOf('name');
const address = valueOf('address');
const lat = Number(valueOf('lat'));
const lng = Number(valueOf('lng'));
const timezone = valueOf('timezone') || 'America/Argentina/Buenos_Aires';
const paymentMethods = (valueOf('payment-methods') || 'cash,debito,credito').split(',');

async function main() {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !name || !address) {
    throw new Error('Indicar --slug, --name y --address válidos');
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error('Indicar --lat y --lng válidos');
  }
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }); }
  catch { throw new Error('Zona horaria inválida'); }
  const validMethods = ['cash', 'debito', 'credito', 'transferencia'];
  if (!paymentMethods.length || new Set(paymentMethods).size !== paymentMethods.length
    || paymentMethods.some((method) => !validMethods.includes(method))) {
    throw new Error('Métodos de pago inválidos o duplicados');
  }
  if (paymentMethods.includes('transferencia') && (!valueOf('transfer-alias') || !valueOf('transfer-holder'))) {
    throw new Error('Transferencia requiere --transfer-alias y --transfer-holder');
  }
  const preview = { slug, name, address, coordinates: { lat, lng }, timezone,
    phone: valueOf('phone') || '', whatsappPhone: valueOf('whatsapp') || '', paymentMethods,
    transferAlias: valueOf('transfer-alias') || '', transferHolder: valueOf('transfer-holder') || '' };
  console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', branch: preview }, null, 2));
  if (!args.includes('--apply')) return;
  if (valueOf('confirm-slug') !== slug) throw new Error(`Indicar --confirm-slug=${slug}`);
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Falta MONGODB_URI o MONGO_URI');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('No se pudo abrir la base de datos');
  const branches = db.collection('branches');
  await branches.createIndex({ slug: 1 }, { unique: true });
  const _id = new mongoose.Types.ObjectId();
  await branches.insertOne({ _id, ...preview, galleryFolder: `TokyoSushis/branches/${_id}`,
    active: true, createdAt: new Date(), updatedAt: new Date() });
  console.log(JSON.stringify({ created: true, id: _id.toString(), slug }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
