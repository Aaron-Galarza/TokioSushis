/** Create a staff/owner account. Password is read from stdin, never from argv. */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const args = process.argv.slice(2);
const valueOf = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const email = valueOf('email')?.trim().toLowerCase();
const role = valueOf('role');
const slug = valueOf('branch-slug');

async function main() {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email inválido');
  if (!['admin', 'encargado', 'owner'].includes(role)) throw new Error('Rol inválido');
  if (role !== 'owner' && !slug) throw new Error('Admin y Encargado requieren --branch-slug');
  if (role === 'owner' && slug) throw new Error('Owner no debe tener --branch-slug');
  console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', email, role, branchSlug: slug || null }, null, 2));
  if (!args.includes('--apply')) return;
  if (valueOf('confirm-email') !== email) throw new Error(`Indicar --confirm-email=${email}`);
  if (process.stdin.isTTY) throw new Error('Pasar la contraseña por stdin, sin mostrarla en argumentos');
  const password = fs.readFileSync(0, 'utf8').replace(/[\r\n]+$/, '');
  if (password.length < 12) throw new Error('Contraseña demasiado corta (mínimo 12 caracteres)');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Falta MONGODB_URI o MONGO_URI');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('No se pudo abrir la base de datos');
  const branch = slug ? await db.collection('branches').findOne({ slug, active: true }) : null;
  if (slug && !branch) throw new Error('Sucursal inexistente o inactiva');
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await users.insertOne({ email, passwordHash, role, ...(branch ? { branchId: branch._id } : {}),
    active: true, createdAt: new Date(), updatedAt: new Date() });
  console.log(JSON.stringify({ created: true, id: result.insertedId.toString(), email, role, branchSlug: slug || null }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
