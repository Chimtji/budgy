import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
import { app, BrowserWindow, shell } from 'electron';

// Set app name before any getPath() calls so userData is ~/Library/Application Support/Budgy
app.setName('Budgy');

let mainWindow: BrowserWindow | null = null;

const PORT = 3741;
const BASE_URL = `http://localhost:${PORT}`;

function getDbPath(): string {
  return path.join(app.getPath('userData'), 'budgy.db');
}

function ensureDatabase(): void {
  const dbPath = getDbPath();
  const userDataDir = path.dirname(dbPath);

  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // If the target DB doesn't exist yet, seed it from the best available source
  if (!fs.existsSync(dbPath)) {
    // 1. Migrate from old lowercase userData path
    const oldPath = path.join(
      app.getPath('home'),
      'Library',
      'Application Support',
      'budgy',
      'budgy.db'
    );
    // 2. Fall back to project-root dev DB
    const projectDb = path.join(__dirname, '..', 'budgy.db');

    if (fs.existsSync(oldPath)) {
      fs.copyFileSync(oldPath, dbPath);
      console.log('Migrated DB:', oldPath, '→', dbPath);
    } else if (fs.existsSync(projectDb)) {
      fs.copyFileSync(projectDb, dbPath);
      console.log('Copied dev budgy.db to userData:', dbPath);
    }
    // else: brand new install, DB will be created fresh below
  }

  // Always open the DB and run CREATE TABLE IF NOT EXISTS + additive alterations
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, key TEXT NOT NULL UNIQUE, label TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'gray', icon TEXT NOT NULL DEFAULT 'IconTag',
      description TEXT DEFAULT '', user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY, key TEXT NOT NULL, category_key TEXT NOT NULL,
      label TEXT NOT NULL, description TEXT DEFAULT '', user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')), UNIQUE(category_key, key, user_id)
    );
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, pattern TEXT NOT NULL,
      domain TEXT, user_id TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, pattern)
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY, date TEXT NOT NULL, amount REAL NOT NULL,
      description TEXT NOT NULL, raw_description TEXT NOT NULL,
      recipient TEXT NOT NULL DEFAULT '', company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      category_key TEXT, segment_key TEXT, user_id TEXT NOT NULL,
      imported_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS categorization_rules (
      id TEXT PRIMARY KEY, pattern TEXT NOT NULL, category_key TEXT NOT NULL,
      segment_key TEXT NOT NULL, match_count INTEGER DEFAULT 1, user_id TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')), UNIQUE(user_id, pattern)
    );
    CREATE TABLE IF NOT EXISTS grafana_dashboards (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL,
      position INTEGER DEFAULT 0, user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS subscription_matchers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, matcher_type TEXT NOT NULL,
      matcher_value TEXT NOT NULL, user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', category_key TEXT NOT NULL,
      segment_key TEXT NOT NULL DEFAULT '', amount_limit REAL NOT NULL,
      effective_from TEXT NOT NULL, user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, category_key, segment_key, effective_from)
    );
  `);

  const alterations = [
    'ALTER TABLE transactions ADD COLUMN archived INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE companies ADD COLUMN category_key TEXT',
    'ALTER TABLE companies ADD COLUMN segment_key TEXT',
    'ALTER TABLE categorization_rules ADD COLUMN company_id TEXT REFERENCES companies(id) ON DELETE SET NULL',
    'ALTER TABLE subscription_matchers ADD COLUMN cadence TEXT DEFAULT NULL',
    'ALTER TABLE subscription_matchers ADD COLUMN amount_min REAL DEFAULT NULL',
    'ALTER TABLE subscription_matchers ADD COLUMN amount_max REAL DEFAULT NULL',
    'ALTER TABLE subscription_matchers ADD COLUMN note TEXT DEFAULT NULL',
    'ALTER TABLE subscription_matchers ADD COLUMN cancelled_at TEXT DEFAULT NULL',
    "ALTER TABLE goals ADD COLUMN name TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE goals ADD COLUMN segment_key TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE goals ADD COLUMN effective_from TEXT NOT NULL DEFAULT '2024-01-01'",
  ];
  for (const sql of alterations) {
    try {
      db.exec(sql);
    } catch {
      /* column already exists */
    }
  }

  db.close();
  console.log('Database ready at:', dbPath);
}

async function startNextServer(): Promise<void> {
  const appRoot = path.join(__dirname, '..');

  // Set DB_PATH before Next.js loads any server modules so better-sqlite3 uses the right file
  process.env.DB_PATH = getDbPath();

  // Run Next.js inside Electron's own Node process — this ensures better-sqlite3 ABI matches
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const next = require('next');
  const nextApp = next({ dev: false, dir: appRoot });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  await new Promise<void>((resolve, reject) => {
    const server = createServer(handle);
    server.listen(PORT, '127.0.0.1', () => {
      console.log('Next.js server running at', BASE_URL);
      resolve();
    });
    server.on('error', reject);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(BASE_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    ensureDatabase();
    await startNextServer();
    createWindow();
  } catch (err) {
    console.error('Failed to start server:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
