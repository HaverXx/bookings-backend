import path from 'path';
import sqlite3 from 'sqlite3';

const dbPath = path.resolve(__dirname, '../data/database.sqlite');
const sqlite = sqlite3.verbose();

function runQuery(db: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function columnExists(db: sqlite3.Database, table: string, column: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info("${table}")`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.some((row: any) => row.name === column));
    });
  });
}

async function ensureColumn(db: sqlite3.Database, table: string, column: string, definition: string) {
  const exists = await columnExists(db, table, column);
  if (!exists) {
    await runQuery(db, `ALTER TABLE "${table}" ADD COLUMN ${column} ${definition};`);
  }
}

function openDatabase(filePath: string): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite.Database(filePath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

async function main() {
  const db = await openDatabase(dbPath);
  try {
    await runQuery(db, 'PRAGMA foreign_keys = ON;');

    await ensureColumn(db, 'user', 'business', 'TEXT');
    await ensureColumn(db, 'payment', 'businessId', 'INTEGER');
    await ensureColumn(db, 'business', 'email', 'TEXT');

    await runQuery(
      db,
      `UPDATE "user"
       SET business = 'admin'
       WHERE lower(name) = 'admin'
          OR lower(substr(email, 1, instr(email, '@') - 1)) = 'admin';`,
    );

    await runQuery(
      db,
      `UPDATE "payment"
       SET businessId = (
         SELECT businessId FROM "appointment"
         WHERE "appointment".id = "payment".appointmentId
       )
       WHERE appointmentId IS NOT NULL;`,
    );

    await runQuery(
      db,
      `UPDATE "payment"
       SET businessId = (
         SELECT businessId FROM "customer"
         WHERE "customer".id = "payment".customerId
       )
       WHERE businessId IS NULL AND customerId IS NOT NULL;`,
    );

    await runQuery(
      db,
      `UPDATE "business"
       SET email = (
         SELECT email FROM "user"
         WHERE lower("user".business) = lower("business".name)
         LIMIT 1
       )
       WHERE email IS NULL;`,
    );

    console.log('Migración de campos de negocio completada.');
  } catch (error) {
    console.error('Error migrando datos:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
