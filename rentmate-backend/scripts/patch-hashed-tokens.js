/**
 * One-off patch to add hashed token columns used by password reset and payments.
 * Usage: from backend folder, run `node scripts/patch-hashed-tokens.js`
 * It reads .env for DB connection (falls back to local defaults).
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const envPath = path.join(__dirname, '..', '.env');

function loadEnv() {
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      env[key] = val;
    });
  }
  return env;
}

const env = loadEnv();
const DB_HOST = env.DB_HOST || 'localhost';
const DB_PORT = Number(env.DB_PORT || 3306);
const DB_USER = env.DB_USER || 'root';
const DB_PASS = env.DB_PASS || '';
const DB_NAME = env.DB_NAME || 'rentmate';

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [DB_NAME, table, column],
  );
  return rows.length > 0;
}

async function ensureColumn(conn, table, column, ddl) {
  const exists = await columnExists(conn, table, column);
  if (exists) {
    console.log(`✓ ${table}.${column} already exists`);
    return;
  }
  console.log(`Adding ${table}.${column}...`);
  await conn.execute(ddl);
  console.log(`✓ Added ${table}.${column}`);
}

async function dropColumnIfExists(conn, table, column) {
  const exists = await columnExists(conn, table, column);
  if (!exists) return;
  console.log(`Dropping old column ${table}.${column}...`);
  await conn.execute(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
  console.log(`✓ Dropped ${table}.${column}`);
}

async function main() {
  console.log(`Connecting to ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}...`);
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  try {
    await ensureColumn(
      conn,
      'password_resets',
      'token_hash',
      'ALTER TABLE `password_resets` ADD COLUMN `token_hash` VARCHAR(128) NOT NULL AFTER `email`',
    );
    await dropColumnIfExists(conn, 'password_resets', 'token');

    await ensureColumn(
      conn,
      'transactions',
      'payment_token_hash',
      'ALTER TABLE `transactions` ADD COLUMN `payment_token_hash` VARCHAR(128) NULL AFTER `paymentUrl`',
    );
    await dropColumnIfExists(conn, 'transactions', 'paymentToken');

    console.log('Patch completed.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Patch failed:', err);
  process.exitCode = 1;
});
