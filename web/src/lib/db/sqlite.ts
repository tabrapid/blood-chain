import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDatabasePath(): string {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  if (databaseUrl.startsWith("file:")) {
    const rel = databaseUrl.slice("file:".length);
    return path.resolve(process.cwd(), rel);
  }
  return path.resolve(process.cwd(), "dev.db");
}

const dbFilePath = resolveDatabasePath();

type SqlJsStatement = {
  bind: (params: unknown[]) => void;
  step: () => boolean;
  getAsObject: () => Record<string, unknown>;
  free: () => void;
};

type SqlJsDatabase = {
  run: (sql: string, params?: unknown[]) => void;
  export: () => Uint8Array;
  prepare: (sql: string) => SqlJsStatement;
};

type SqlJsModule = {
  Database: new (bytes?: Uint8Array) => SqlJsDatabase;
};

let SQL: SqlJsModule | null = null;
let db: SqlJsDatabase | null = null;
let dbMtimeMs = -1;

function schemaSql() {
  // Minimal schema: faqat hozir ishlatiladigan UI/flowlar uchun.
  // Data types sql.js da dinamik, shuning uchun TEXT/REAL/INTEGER yetarli.
  return `
    PRAGMA foreign_keys = OFF;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      phone TEXT,

      first_name TEXT,
      last_name TEXT,
      blood_group TEXT,
      rh TEXT,
      weight_kg REAL,
      height_cm REAL,
      dob TEXT,

      health_history TEXT,
      health_metrics TEXT,

      total_donated_liters REAL NOT NULL DEFAULT 0,
      badges TEXT,
      points INTEGER NOT NULL DEFAULT 0,
      last_donation_date TEXT,

      name TEXT,
      region TEXT,
      address TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS donor_health_events (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL,
      hemoglobin REAL,
      infection_tests TEXT,
      measured_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS donor_donations (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL,
      center_id TEXT,
      hospital_id TEXT,
      blood_group TEXT,
      rh TEXT,
      component TEXT,
      liters REAL NOT NULL,
      donation_status TEXT NOT NULL DEFAULT 'completed',
      donated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS donor_slots (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL,
      center_id TEXT NOT NULL,
      slot_time TEXT NOT NULL,
      status TEXT NOT NULL,
      eta_demo_minutes INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blood_inventory (
      id TEXT PRIMARY KEY,
      center_id TEXT,
      hospital_id TEXT,

      component TEXT NOT NULL,
      blood_group TEXT NOT NULL,
      rh TEXT NOT NULL,
      quantity REAL NOT NULL,
      expiry_date TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emergency_requests (
      id TEXT PRIMARY KEY,
      hospital_id TEXT,
      center_id TEXT,
      donor_id TEXT,

      blood_group TEXT NOT NULL,
      rh TEXT,
      component TEXT NOT NULL,
      quantity REAL NOT NULL,

      status TEXT NOT NULL,
      donor_approved INTEGER NOT NULL DEFAULT 0,

      delivery_status TEXT NOT NULL,
      delivery_eta_demo_minutes INTEGER,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS donor_settings (
      user_id TEXT PRIMARY KEY,
      language TEXT NOT NULL DEFAULT 'uz',
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      privacy_level TEXT NOT NULL DEFAULT 'standard',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      likes_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_requests (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      test_type TEXT,
      requested_at TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS lab_results (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      donor_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      test_type TEXT,
      details_json TEXT,
      hemoglobin REAL,
      blood_pressure TEXT,
      leukocytes REAL,
      platelets REAL,
      hiv TEXT,
      hepatitis_b TEXT,
      hepatitis_c TEXT,
      syphilis TEXT,
      created_at TEXT NOT NULL
    );
  `;
}

async function initSqlModule() {
  if (SQL) return;
  SQL = (await initSqlJs({
    locateFile: (file: string) => path.join(/*turbopackIgnore: true*/ __dirname, "../../../node_modules/sql.js/dist", file),
  })) as unknown as SqlJsModule;
}

function readDbMtimeMs() {
  if (!fs.existsSync(dbFilePath)) return -1;
  return fs.statSync(dbFilePath).mtimeMs;
}

function openDatabaseFromDisk(moduleRef: SqlJsModule): SqlJsDatabase {
  const exists = fs.existsSync(dbFilePath);
  if (exists) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    return new moduleRef.Database(new Uint8Array(fileBuffer));
  }
  return new moduleRef.Database();
}

async function syncDbFromDisk() {
  await initSqlModule();
  if (!SQL) throw new Error("SQLite engine init qilinmadi");

  const diskMtime = readDbMtimeMs();
  if (!db || diskMtime !== dbMtimeMs) {
    db = openDatabaseFromDisk(SQL);
    db.run(schemaSql());
    try {
      db.run(`ALTER TABLE lab_requests ADD COLUMN test_type TEXT`);
    } catch {}
    try {
      db.run(`ALTER TABLE lab_results ADD COLUMN test_type TEXT`);
    } catch {}
    try {
      db.run(`ALTER TABLE lab_results ADD COLUMN details_json TEXT`);
    } catch {}

    if (diskMtime < 0) {
      await persist();
    } else {
      dbMtimeMs = diskMtime;
    }
  }
}

export async function getDb() {
  await syncDbFromDisk();
  if (!db) throw new Error("SQLite db init qilinmadi");
  return db;
}

export async function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFilePath, buffer);
  dbMtimeMs = readDbMtimeMs();
}

export async function dbRun(sql: string, params: unknown[] = []) {
  const d = await getDb();
  d.run(sql, params);
  await persist();
  return d;
}

export async function dbGet<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const d = await getDb();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? (stmt.getAsObject() as T) : null;
  stmt.free();
  return row;
}

export async function dbAll<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const d = await getDb();
  const stmt = d.prepare(sql);
  stmt.bind(params);

  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

