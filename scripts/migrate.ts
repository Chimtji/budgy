import path from 'path';
import Database from 'better-sqlite3';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'budgy.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'gray',
      icon TEXT NOT NULL DEFAULT 'IconTag',
      description TEXT DEFAULT '',
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Created table: categories');

  db.exec(`
    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      category_key TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT DEFAULT '',
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(category_key, key, user_id)
    )
  `);
  console.log('Created table: segments');

  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pattern TEXT NOT NULL,
      domain TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, pattern)
    )
  `);
  console.log('Created table: companies');

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      raw_description TEXT NOT NULL,
      recipient TEXT NOT NULL DEFAULT '',
      company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      category_key TEXT,
      segment_key TEXT,
      user_id TEXT NOT NULL,
      imported_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Created table: transactions');

  db.exec(`
    CREATE TABLE IF NOT EXISTS categorization_rules (
      id TEXT PRIMARY KEY,
      pattern TEXT NOT NULL,
      category_key TEXT NOT NULL,
      segment_key TEXT NOT NULL,
      match_count INTEGER DEFAULT 1,
      user_id TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, pattern)
    )
  `);
  console.log('Created table: categorization_rules');

  db.exec(`
    CREATE TABLE IF NOT EXISTS grafana_dashboards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Created table: grafana_dashboards');

  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`);
    console.log('Added column: transactions.archived');
  } catch {
    console.log('Column already exists: transactions.archived');
  }

  try {
    db.exec(`ALTER TABLE companies ADD COLUMN category_key TEXT`);
    console.log('Added column: companies.category_key');
  } catch {
    console.log('Column already exists: companies.category_key');
  }

  try {
    db.exec(`ALTER TABLE companies ADD COLUMN segment_key TEXT`);
    console.log('Added column: companies.segment_key');
  } catch {
    console.log('Column already exists: companies.segment_key');
  }

  try {
    db.exec(
      `ALTER TABLE categorization_rules ADD COLUMN company_id TEXT REFERENCES companies(id) ON DELETE SET NULL`
    );
    console.log('Added column: categorization_rules.company_id');
  } catch {
    console.log('Column already exists: categorization_rules.company_id');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_matchers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      matcher_type TEXT NOT NULL,
      matcher_value TEXT NOT NULL,
      cadence TEXT DEFAULT NULL,
      amount_min REAL DEFAULT NULL,
      amount_max REAL DEFAULT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Created table: subscription_matchers');

  // Add cadence column to existing tables if missing
  try {
    db.exec(`ALTER TABLE subscription_matchers ADD COLUMN cadence TEXT DEFAULT NULL`);
    console.log('Added column: subscription_matchers.cadence');
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE subscription_matchers ADD COLUMN amount_min REAL DEFAULT NULL`);
    console.log('Added column: subscription_matchers.amount_min');
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE subscription_matchers ADD COLUMN amount_max REAL DEFAULT NULL`);
    console.log('Added column: subscription_matchers.amount_max');
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE subscription_matchers ADD COLUMN note TEXT DEFAULT NULL`);
    console.log('Added column: subscription_matchers.note');
  } catch {
    // Column already exists
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      category_key TEXT NOT NULL,
      segment_key TEXT NOT NULL DEFAULT '',
      amount_limit REAL NOT NULL,
      effective_from TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, category_key, segment_key, effective_from)
    )
  `);
  console.log('Created table: goals');

  console.log('Migration complete.');
}

try {
  migrate();
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
